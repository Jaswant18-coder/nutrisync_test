/**
 * NutriSync — Restriction Rules Engine
 *
 * Loads restriction rules from the data/restrictions.json file and provides
 * helper functions to compute forbidden foods and nutrient limits for any
 * combination of diagnoses, allergies, dietary preference, and religion.
 */

import * as fs from "fs";
import * as path from "path";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RestrictionRule {
  forbidden: string[];
  max_carbs_g?: number;
  max_sugar_g?: number;
  max_sodium_mg?: number;
  max_protein_g?: number;
  max_potassium_mg?: number;
}

export interface RestrictionRules {
  medical: Record<string, RestrictionRule>;
  allergies: Record<string, RestrictionRule>;
  dietary_preferences: Record<string, RestrictionRule>;
  religion: Record<string, RestrictionRule>;
}

export interface PatientRestrictionProfile {
  diagnoses: string[];
  allergies: string[];
  dietaryPreference: string; // "Vegetarian" | "Vegan" | "Non-Vegetarian"
  religion: string | null;
  dislikes?: string[];
}

export interface ComputedRestrictions {
  forbiddenFoods: string[];
  macroLimits: {
    max_carbs_g?: number;
    max_sugar_g?: number;
    max_sodium_mg?: number;
    max_protein_g?: number;
    max_potassium_mg?: number;
  };
  /** Canonical diet group key derived from the restrictions */
  restrictionKey: string;
}

// ── Load rules ───────────────────────────────────────────────────────────────

let _rules: RestrictionRules | null = null;

export function getRestrictionRules(): RestrictionRules {
  if (!_rules) {
    const filePath = path.resolve(__dirname, "../../../data/restrictions.json");
    _rules = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RestrictionRules;
  }
  return _rules;
}

/** Force re-read of restrictions.json on next access */
export function clearRestrictionCache(): void {
  _rules = null;
}

// ── Core computation ─────────────────────────────────────────────────────────

/** Case-insensitive lookup in a Record<string, T> */
function ciLookup<T>(map: Record<string, T>, key: string): T | undefined {
  // Try exact match first (fast path)
  if (map[key]) return map[key];
  // Fallback: case-insensitive search
  const lower = key.toLowerCase();
  for (const k of Object.keys(map)) {
    if (k.toLowerCase() === lower) return map[k];
  }
  return undefined;
}

/**
 * Given a patient's clinical profile, compute:
 *  - All forbidden foods (union of all applicable rules + dislikes)
 *  - Macro-nutrient limits (strictest across conditions)
 *  - A canonical restriction key for grouping
 */
export function computeRestrictions(profile: PatientRestrictionProfile): ComputedRestrictions {
  const rules = getRestrictionRules();
  const forbidden = new Set<string>();
  const limits: ComputedRestrictions["macroLimits"] = {};

  // 1. Medical conditions
  for (const dx of profile.diagnoses) {
    const rule = ciLookup(rules.medical, dx);
    if (rule) {
      rule.forbidden.forEach((f) => forbidden.add(f.toLowerCase()));
      if (rule.max_carbs_g !== undefined)
        limits.max_carbs_g = Math.min(limits.max_carbs_g ?? Infinity, rule.max_carbs_g);
      if (rule.max_sugar_g !== undefined)
        limits.max_sugar_g = Math.min(limits.max_sugar_g ?? Infinity, rule.max_sugar_g);
      if (rule.max_sodium_mg !== undefined)
        limits.max_sodium_mg = Math.min(limits.max_sodium_mg ?? Infinity, rule.max_sodium_mg);
      if (rule.max_protein_g !== undefined)
        limits.max_protein_g = Math.min(limits.max_protein_g ?? Infinity, rule.max_protein_g);
      if (rule.max_potassium_mg !== undefined)
        limits.max_potassium_mg = Math.min(limits.max_potassium_mg ?? Infinity, rule.max_potassium_mg);
    }
  }

  // 2. Allergies
  for (const allergy of profile.allergies) {
    const rule = ciLookup(rules.allergies, allergy);
    if (rule) {
      rule.forbidden.forEach((f) => forbidden.add(f.toLowerCase()));
    }
  }

  // 3. Dietary preference
  const prefRule = ciLookup(rules.dietary_preferences, profile.dietaryPreference);
  if (prefRule) {
    prefRule.forbidden.forEach((f) => forbidden.add(f.toLowerCase()));
  }

  // 4. Religion
  if (profile.religion) {
    const relRule = ciLookup(rules.religion, profile.religion);
    if (relRule) {
      relRule.forbidden.forEach((f) => forbidden.add(f.toLowerCase()));
    }
  }

  // 5. Personal dislikes
  if (profile.dislikes) {
    profile.dislikes.forEach((d) => forbidden.add(d.toLowerCase()));
  }

  // Build restriction key: sorted diagnoses + diet pref + religion
  // Patients sharing the same key can get the same base meal
  const diagKey = [...profile.diagnoses].sort().join("+") || "None";
  const dietKey = profile.dietaryPreference;
  const relKey = profile.religion || "None";
  const restrictionKey = `${diagKey}|${dietKey}|${relKey}`;

  return {
    forbiddenFoods: Array.from(forbidden).sort(),
    macroLimits: limits,
    restrictionKey,
  };
}

/**
 * Map diagnosis names from the dataset to internal diet types.
 */
export function diagnosesToDietType(diagnoses: string[]): string {
  const dx = diagnoses.map((d) => d.toLowerCase());

  // Priority order: renal > celiac > gerd > diabetic > cardiac > regular
  if (dx.some((d) => d.includes("ckd") || d.includes("kidney"))) return "renal";
  if (dx.some((d) => d.includes("celiac"))) return "celiac";
  if (dx.some((d) => d.includes("gerd") || d.includes("reflux"))) return "gerd";
  if (dx.some((d) => d.includes("diabetes") || d.includes("diabetic"))) return "diabetic";
  if (dx.some((d) => d.includes("hypertension") || d.includes("cardiac") || d.includes("heart")))
    return "cardiac";

  return "regular";
}

/**
 * Map dietary_preference string from dataset to foodPreferences array.
 */
export function dietPrefToFoodPreferences(pref: string): string[] {
  switch (pref) {
    case "Vegetarian":
      return ["vegetarian"];
    case "Vegan":
      return ["vegan", "vegetarian"];
    case "Non-Vegetarian":
      return ["non-vegetarian"];
    default:
      return [];
  }
}

/**
 * Convert dietary_preference + diagnoses into dietary restrictions array.
 */
export function buildDietaryRestrictions(
  diagnoses: string[],
  allergies: string[],
  religion: string | null
): string[] {
  const restrictions: string[] = [];
  const dx = diagnoses.map((d) => d.toLowerCase());

  if (dx.some((d) => d.includes("diabetes"))) restrictions.push("low_sugar");
  if (dx.some((d) => d.includes("hypertension"))) restrictions.push("low_sodium");
  if (dx.some((d) => d.includes("ckd") || d.includes("kidney"))) {
    restrictions.push("low_potassium", "low_sodium", "low_protein");
  }
  if (dx.some((d) => d.includes("celiac"))) restrictions.push("gluten_free");
  if (dx.some((d) => d.includes("gerd"))) restrictions.push("low_acid");

  // Allergy-based
  for (const a of allergies) {
    restrictions.push(`no_${a.toLowerCase()}`);
  }

  // Religion-based
  if (religion === "Jain") restrictions.push("jain");
  if (religion === "Halal") restrictions.push("halal");
  if (religion === "Kosher") restrictions.push("kosher");

  return [...new Set(restrictions)];
}
