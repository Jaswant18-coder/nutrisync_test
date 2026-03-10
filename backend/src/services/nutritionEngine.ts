/**
 * NutriSync — Nutrition Calculation Engine
 *
 * Computes BMI, BMR, daily calorie targets and macro-nutrient
 * distribution for each patient based on their clinical profile.
 */

import { ActivityLevel, Gender, INutritionTargets } from "../db/repositories/patientRepo";

// ── Activity multipliers (Harris-Benedict PAL) ──────────────────────────────
const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// ── BMI categories ───────────────────────────────────────────────────────────
export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Normal";
  if (bmi < 30.0) return "Overweight";
  return "Obese";
}

// ── BMR — Mifflin St Jeor ────────────────────────────────────────────────────
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

// ── Total Daily Energy Expenditure ───────────────────────────────────────────
export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIER[activity]);
}

// ── Diagnosis-based calorie adjustments ──────────────────────────────────────
function applyClinicalAdjustment(
  tdee: number,
  diagnoses: string[],
  bmiCategory: string
): number {
  let adjusted = tdee;
  const dx = diagnoses.map((d) => d.toLowerCase());

  // Obesity — mild deficit
  if (bmiCategory === "Obese") adjusted = Math.round(adjusted * 0.85);
  // Underweight — mild surplus
  if (bmiCategory === "Underweight") adjusted = Math.round(adjusted * 1.15);

  // Critical illness / post-surgery — slight increase
  if (dx.some((d) => d.includes("surgery") || d.includes("trauma")))
    adjusted = Math.round(adjusted * 1.2);

  return Math.max(adjusted, 1200); // never below 1200 kcal
}

// ── Macro distribution ────────────────────────────────────────────────────────
function computeMacros(
  calories: number,
  diagnoses: string[],
  dietaryRestrictions: string[]
): { protein: number; carbs: number; fat: number; fiber: number } {
  const dx = diagnoses.map((d) => d.toLowerCase());
  const rx = dietaryRestrictions.map((r) => r.toLowerCase());

  let proteinPct = 0.2;
  let carbPct = 0.5;
  let fatPct = 0.3;

  // Diabetes — reduce carbs, increase protein slightly
  if (dx.some((d) => d.includes("diabet"))) {
    carbPct = 0.4;
    proteinPct = 0.25;
    fatPct = 0.35;
  }

  // Renal — restrict protein
  if (dx.some((d) => d.includes("renal") || d.includes("kidney"))) {
    proteinPct = 0.1;
    carbPct = 0.55;
    fatPct = 0.35;
  }

  // High-protein prescription
  if (rx.includes("high_protein")) {
    proteinPct = 0.35;
    carbPct = 0.4;
    fatPct = 0.25;
  }

  const proteinCal = calories * proteinPct;
  const carbCal = calories * carbPct;
  const fatCal = calories * fatPct;

  // Determine fiber target
  let fiber = 25; // g/day default
  if (dx.some((d) => d.includes("diabet"))) fiber = 35;

  return {
    protein: Math.round(proteinCal / 4),   // 4 kcal/g
    carbs: Math.round(carbCal / 4),
    fat: Math.round(fatCal / 9),            // 9 kcal/g
    fiber,
  };
}

// ── Electrolyte limits ────────────────────────────────────────────────────────
function computeElectrolytes(
  diagnoses: string[],
  dietaryRestrictions: string[]
): { sodium: number; potassium: number } {
  const dx = diagnoses.map((d) => d.toLowerCase());
  const rx = dietaryRestrictions.map((r) => r.toLowerCase());

  let sodium = 2300;    // mg/day (general limit)
  let potassium = 4700; // mg/day (general)

  if (
    dx.some((d) => d.includes("cardiac") || d.includes("heart")) ||
    rx.includes("low_sodium")
  ) {
    sodium = 1500;
  }

  if (
    dx.some((d) => d.includes("renal") || d.includes("kidney")) ||
    rx.includes("low_potassium")
  ) {
    potassium = 2000;
    sodium = 1500;
  }

  if (dx.some((d) => d.includes("hypertension"))) {
    sodium = 1200;
  }

  return { sodium, potassium };
}

// ── Public API ────────────────────────────────────────────────────────────────
export interface NutritionEngineInput {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  diagnoses: string[];
  dietaryRestrictions: string[];
}

export function runNutritionEngine(
  input: NutritionEngineInput
): INutritionTargets & { bmi: number; bmiCategory: string; bmr: number } {
  const bmi = calculateBMI(input.weight, input.height);
  const bmiCategory = getBMICategory(bmi);
  const bmr = calculateBMR(input.weight, input.height, input.age, input.gender);
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const calories = applyClinicalAdjustment(tdee, input.diagnoses, bmiCategory);
  const macros = computeMacros(calories, input.diagnoses, input.dietaryRestrictions);
  const { sodium, potassium } = computeElectrolytes(
    input.diagnoses,
    input.dietaryRestrictions
  );

  return {
    bmi,
    bmiCategory,
    bmr,
    calories,
    ...macros,
    sodium,
    potassium,
  };
}
