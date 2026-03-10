/**
 * NutriSync — Restriction Validation Engine
 *
 * Validates every meal against patient allergies, dietary restrictions,
 * and clinical limits. Automatically substitutes flagged ingredients.
 */

import { IMealItem, IMealNutrition } from "../db/repositories/mealPlanRepo";
import { INutritionTargets } from "../db/repositories/patientRepo";
import IngredientRepo from "../db/repositories/ingredientRepo";

// ── Substitution table ───────────────────────────────────────────────────────
const SUBSTITUTION_MAP: Record<string, string> = {
  banana: "apple",
  "white rice": "brown rice",
  cream: "low-fat yogurt",
  butter: "olive oil",
  "full-fat milk": "skim milk",
  salt: "herbs",
  sugar: "stevia",
  "potato chips": "baked chickpeas",
  "white bread": "whole wheat bread",
  "red meat": "chicken breast",
  pork: "tofu",
  shrimp: "tilapia",
  nuts: "seeds",
  shellfish: "lean fish",
};

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  substitutions: Array<{ original: string; substitute: string; reason: string }>;
  adjustedMeal?: IMealItem;
}

function normalise(str: string): string {
  return str.trim().toLowerCase();
}

// ── Allergy synonym map — catches derived foods and dish names ───────────────
const ALLERGY_SYNONYMS: Record<string, string[]> = {
  dairy: ["milk", "curd", "yogurt", "yoghurt", "cheese", "butter", "cream", "ghee", "paneer", "lassi", "kheer", "raita", "curd rice", "dahi", "buttermilk"],
  gluten: ["wheat", "bread", "roti", "chapati", "naan", "pasta", "semolina", "maida", "barley", "oats"],
  nuts: ["peanut", "almond", "cashew", "walnut", "pistachio", "pecan", "hazelnut", "groundnut"],
  egg: ["egg", "omelette", "mayonnaise"],
  soy: ["soy", "tofu", "tempeh", "edamame", "miso"],
  shellfish: ["shrimp", "crab", "lobster", "prawn", "scallop"],
  fish: ["salmon", "tuna", "cod", "tilapia", "sardine", "mackerel"],
};

function expandAllergies(allergies: string[]): string[] {
  const expanded = new Set<string>(allergies.map(normalise));
  for (const allergy of allergies) {
    const synonyms = ALLERGY_SYNONYMS[normalise(allergy)];
    if (synonyms) synonyms.forEach((s) => expanded.add(s));
  }
  return Array.from(expanded);
}


export async function validateMeal(
  meal: IMealItem,
  patientAllergies: string[],
  patientRestrictions: string[],
  targets: INutritionTargets
): Promise<ValidationResult> {
  const warnings: string[] = [];
  const substitutions: ValidationResult["substitutions"] = [];
  const allergiesNorm = expandAllergies(patientAllergies);
  const restrictionsNorm = patientRestrictions.map(normalise);

  // Deep-copy meal for potential modification
  const adjustedMeal: IMealItem = JSON.parse(JSON.stringify(meal));

  // Check the meal name itself against allergies (catches "curd rice", "paneer curry" etc.)
  const mealNameNorm = normalise(meal.name);
  const mealNameAllergyHit = allergiesNorm.find((a) => mealNameNorm.includes(a));
  if (mealNameAllergyHit) {
    warnings.push(`⚠️ Allergy: Meal "${meal.name}" contains "${mealNameAllergyHit}" which is an allergen.`);
    adjustedMeal.name = `[ALLERGEN REPLACED] ${meal.name}`;
  }

  for (let i = 0; i < adjustedMeal.ingredients.length; i++) {
    const ing = adjustedMeal.ingredients[i];
    const ingName = normalise(ing.name);

    // 1. Allergy check
    const allergyHit = allergiesNorm.find(
      (a) => ingName.includes(a) || a.includes(ingName)
    );
    if (allergyHit) {
      const sub = SUBSTITUTION_MAP[ingName] || "safe_alternative";
      warnings.push(`⚠️ Allergy: "${ing.name}" triggers "${allergyHit}" allergy.`);
      substitutions.push({
        original: ing.name,
        substitute: sub,
        reason: `Patient is allergic to ${allergyHit}`,
      });
      adjustedMeal.ingredients[i].name = sub;
    }

    // 2. Restriction check (e.g. "no_pork", "no_shellfish")
    const restrictionHit = restrictionsNorm.find(
      (r) =>
        r.replace("no_", "").includes(ingName) ||
        ingName.includes(r.replace("no_", ""))
    );
    if (restrictionHit) {
      const sub = SUBSTITUTION_MAP[ingName] || "plant_protein";
      warnings.push(
        `🚫 Restriction: "${ing.name}" conflicts with restriction "${restrictionHit}".`
      );
      substitutions.push({
        original: ing.name,
        substitute: sub,
        reason: `Dietary restriction: ${restrictionHit}`,
      });
      adjustedMeal.ingredients[i].name = sub;
    }
  }

  // 3. Nutrient limit checks
  const n: IMealNutrition = meal.nutrition;

  if (n.sodium > targets.sodium * 0.35) {
    warnings.push(
      `🧂 Sodium too high for this meal: ${n.sodium}mg (meal limit ~${Math.round(targets.sodium * 0.35)}mg)`
    );
  }

  if (n.potassium > targets.potassium * 0.4) {
    warnings.push(
      `⚡ Potassium too high: ${n.potassium}mg (limit ~${Math.round(targets.potassium * 0.4)}mg)`
    );
  }

  if (n.calories > targets.calories * 0.45) {
    warnings.push(
      `🔥 Calories above 45% daily target for a single meal: ${n.calories} kcal`
    );
  }

  // 4. Flag unavailable ingredients in inventory
  const ingredientNames = adjustedMeal.ingredients.map((i) =>
    normalise(i.name)
  );
  const allItems = await IngredientRepo.find({ isAvailable: false });
  const inventoryItems = allItems.filter((item) =>
    ingredientNames.includes(item.name.trim().toLowerCase())
  );

  inventoryItems.forEach((item) => {
    warnings.push(`📦 Out of stock: "${item.name}" not available in kitchen inventory.`);
  });

  adjustedMeal.isValidated = true;
  adjustedMeal.validationWarnings = warnings;

  return {
    isValid: warnings.length === 0,
    warnings,
    substitutions,
    adjustedMeal,
  };
}

// ── Bulk validation for a full day plan ─────────────────────────────────────
export async function validateDayMeals(
  meals: IMealItem[],
  allergies: string[],
  restrictions: string[],
  targets: INutritionTargets
): Promise<IMealItem[]> {
  const validated: IMealItem[] = [];
  for (const meal of meals) {
    const result = await validateMeal(meal, allergies, restrictions, targets);
    validated.push(result.adjustedMeal ?? meal);
  }
  return validated;
}
