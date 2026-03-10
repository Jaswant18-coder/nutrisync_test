/**
 * NutriSync — Smart Diet Grouping Engine v2
 *
 * Groups patients who share the same diagnoses, dietary preference
 * and religion so the kitchen can prepare one base meal per group.
 *
 * Grouping key:  sorted(diagnoses) | dietaryPreference | religion
 *   e.g. "CKD (Kidney Disease)+Diabetes|Vegetarian|Jain"
 *
 * Patients within a group share the same forbidden-food list and
 * macro-nutrient limits.  Individual portion sizes are scaled by
 * each patient's calorie target relative to the group median.
 */

import PatientRepo, { IPatient, DietType } from "../db/repositories/patientRepo";
import DietGroupRepo, { IDietGroup } from "../db/repositories/dietGroupRepo";
import {
  computeRestrictions,
  diagnosesToDietType,
  PatientRestrictionProfile,
} from "../data/restrictions";

// ── Build a canonical group key from a patient's clinical profile ────────────

function buildDiagnosisGroupKey(patient: IPatient): string {
  // Primary axis: sorted diagnosis combination
  const diagKey = [...patient.diagnosis].sort().join("+") || "None";

  // Secondary axis: vegetarian / vegan / non-vegetarian
  const dietPref = patient.foodPreferences.some((p) =>
    p.toLowerCase().includes("vegan")
  )
    ? "Vegan"
    : patient.foodPreferences.some((p) =>
        p.toLowerCase().includes("veg")
      )
    ? "Vegetarian"
    : "Non-Vegetarian";

  // Tertiary axis: religion (from dietary restrictions)
  let religion = "None";
  for (const r of patient.dietaryRestrictions) {
    if (r === "jain") { religion = "Jain"; break; }
    if (r === "halal") { religion = "Halal"; break; }
    if (r === "kosher") { religion = "Kosher"; break; }
  }

  // Quaternary axis: sorted allergies (so dairy-allergic patients are separated)
  const allergyKey = [...patient.allergies].sort().join("+") || "None";

  return `${diagKey}|${dietPref}|${religion}|${allergyKey}`;
}

// ── Human-readable group name ────────────────────────────────────────────────

function buildGroupName(key: string): string {
  const [diagPart, dietPref, religion, allergyPart] = key.split("|");

  let name = "";

  // Diagnosis label
  if (diagPart === "None") {
    name = "General";
  } else {
    const diagnoses = diagPart.split("+");
    const short: Record<string, string> = {
      Diabetes: "Diabetic",
      Hypertension: "Cardiac",
      "CKD (Kidney Disease)": "Renal",
      "Celiac Disease": "Celiac",
      GERD: "GERD",
    };
    name = diagnoses.map((d) => short[d] ?? d).join(" + ");
  }

  name += ` — ${dietPref}`;
  if (religion !== "None") name += ` (${religion})`;
  if (allergyPart && allergyPart !== "None") {
    name += ` [No ${allergyPart.replace(/\+/g, ", ")}]`;
  }

  return name;
}

// ── Portion multiplier ──────────────────────────────────────────────────────

function computePortionMultiplier(
  patientCalories: number,
  groupCalorieRef: number
): number {
  if (groupCalorieRef === 0) return 1.0;
  const ratio = patientCalories / groupCalorieRef;
  return Math.min(Math.max(parseFloat(ratio.toFixed(2)), 0.5), 2.0);
}

// ── Main grouping function ──────────────────────────────────────────────────

export async function runDietGroupingEngine(ward?: string): Promise<IDietGroup[]> {
  const patients = await PatientRepo.find({ ...(ward ? { ward } : {}) });

  // Build a map of groupKey → list of patients
  const groupMap = new Map<
    string,
    { patients: typeof patients; name: string }
  >();

  for (const patient of patients) {
    const key = buildDiagnosisGroupKey(patient as IPatient);
    if (!groupMap.has(key)) {
      groupMap.set(key, { patients: [], name: buildGroupName(key) });
    }
    groupMap.get(key)!.patients.push(patient);
  }

  const savedGroups: IDietGroup[] = [];

  for (const [key, { patients: groupPatients, name }] of groupMap.entries()) {
    // Compute calorie range from nutrition targets
    const calories = groupPatients.map((p) => p.nutritionTargets.calories);
    const calMin = Math.min(...calories);
    const calMax = Math.max(...calories);
    const calRef = Math.round((calMin + calMax) / 2);

    // Build member list with portion multipliers
    const members = groupPatients.map((p) => ({
      patientId: p.id,
      nsId: p.patientId,
      portionMultiplier: computePortionMultiplier(
        p.nutritionTargets.calories,
        calRef
      ),
    }));

    const firstPatient = groupPatients[0] as IPatient;

    // Compute the restriction profile for the first patient (representative)
    const restrictionProfile: PatientRestrictionProfile = {
      diagnoses: firstPatient.diagnosis,
      allergies: firstPatient.allergies,
      dietaryPreference: firstPatient.foodPreferences.some((p) =>
        p.toLowerCase().includes("vegan")
      )
        ? "Vegan"
        : firstPatient.foodPreferences.some((p) =>
            p.toLowerCase().includes("veg")
          )
        ? "Vegetarian"
        : "Non-Vegetarian",
      religion: null,
    };
    // Detect religion from restrictions
    for (const r of firstPatient.dietaryRestrictions) {
      if (r === "jain") { restrictionProfile.religion = "Jain"; break; }
      if (r === "halal") { restrictionProfile.religion = "Halal"; break; }
      if (r === "kosher") { restrictionProfile.religion = "Kosher"; break; }
    }

    const { forbiddenFoods, macroLimits } = computeRestrictions(restrictionProfile);

    // Build a short stable group code from key hash
    const groupCode = `GRP-${hashKey(key)}`;

    // Determine diet type from diagnoses
    const dietType = diagnosesToDietType(firstPatient.diagnosis) as DietType;

    // Upsert by groupCode
    const group = await DietGroupRepo.upsert({
      groupCode,
      name,
      description: `${groupPatients.length} patient(s) | Forbidden: ${forbiddenFoods.slice(0, 5).join(", ")}${forbiddenFoods.length > 5 ? "…" : ""} | Limits: ${formatLimits(macroLimits)}`,
      dietType,
      texture: firstPatient.texture,
      calorieRangeMin: calMin,
      calorieRangeMax: calMax,
      restrictions: firstPatient.dietaryRestrictions,
      forbiddenFoods,
      preferenceType: firstPatient.foodPreferences.some((p) =>
        p.toLowerCase().includes("veg")
      )
        ? "vegetarian"
        : "non-vegetarian",
      members,
      ward,
      isActive: true,
    });

    savedGroups.push(group);
  }

  // Bust cached production plan so the next request sees fresh groups
  invalidateProductionPlanCache();

  return savedGroups;
}

// ── Kitchen production summary (with in-memory TTL cache) ──────────────────

/** ProductionGroup shape — inferred from the map() below */
export type ProductionGroup = {
  groupCode: string;
  groupName: string;
  dietType: string;
  texture: string;
  patientCount: number;
  calorieRange: string;
  restrictions: string[];
  forbiddenFoods: string[];
  members: { patientId: string; portionMultiplier: number }[];
  description: string | undefined;
};

interface PlanCacheEntry {
  data: ProductionGroup[];
  ts: number;
}

// Separate cache per ward key (undefined → all wards)
const _planCache = new Map<string, PlanCacheEntry>();
const PLAN_CACHE_TTL_MS = 30_000; // 30 seconds

/** Wipe the cache — call after runDietGroupingEngine() so stale data is never served */
export function invalidateProductionPlanCache(): void {
  _planCache.clear();
}

export async function getKitchenProductionPlan(ward?: string): Promise<ProductionGroup[]> {
  const cacheKey = ward ?? "__all__";
  const entry = _planCache.get(cacheKey);
  if (entry && Date.now() - entry.ts < PLAN_CACHE_TTL_MS) {
    return entry.data;
  }

  const groups = await DietGroupRepo.find({
    isActive: true,
    ...(ward ? { ward } : {}),
  });
  const data = groups.map((g) => ({
    groupCode: g.groupCode,
    groupName: g.name,
    dietType: g.dietType,
    texture: g.texture,
    patientCount: g.members.length,
    calorieRange: `${g.calorieRangeMin}–${g.calorieRangeMax} kcal`,
    restrictions: g.restrictions,
    forbiddenFoods: g.forbiddenFoods ?? [],
    members: g.members,
    description: g.description,
  }));

  _planCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    hash = ((hash << 5) - hash + c) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 8);
}

function formatLimits(limits: Record<string, number | undefined>): string {
  const parts: string[] = [];
  if (limits.max_carbs_g !== undefined) parts.push(`Carbs≤${limits.max_carbs_g}g`);
  if (limits.max_sugar_g !== undefined) parts.push(`Sugar≤${limits.max_sugar_g}g`);
  if (limits.max_sodium_mg !== undefined) parts.push(`Na≤${limits.max_sodium_mg}mg`);
  if (limits.max_protein_g !== undefined) parts.push(`Protein≤${limits.max_protein_g}g`);
  if (limits.max_potassium_mg !== undefined) parts.push(`K≤${limits.max_potassium_mg}mg`);
  return parts.length ? parts.join(", ") : "none";
}
