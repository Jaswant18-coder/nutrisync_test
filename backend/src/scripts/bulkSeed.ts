/**
 * NutriSync — Bulk Seed Script
 *
 * Imports synthetic data from data/*.json files:
 *   - 100 representative patients (sampled from 10 000)
 *   - 500 ingredients
 *   - Links patient user accounts
 *   - Runs diet grouping engine to cluster patients
 *
 * Run:  npx ts-node-dev src/scripts/bulkSeed.ts
 */

import dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import * as path from "path";
import { getDB } from "../config/d1";
import UserRepo from "../db/repositories/userRepo";
import PatientRepo from "../db/repositories/patientRepo";
import IngredientRepo from "../db/repositories/ingredientRepo";
import { runNutritionEngine } from "../services/nutritionEngine";
import { runDietGroupingEngine } from "../services/dietGroupingEngine";
import {
  diagnosesToDietType,
  dietPrefToFoodPreferences,
  buildDietaryRestrictions,
} from "../data/restrictions";

// ── Config ───────────────────────────────────────────────────────────────────

/** How many patients to import from the 10 000 dataset */
const PATIENT_LIMIT = 50;

/** Max unique ingredients to import */
const INGREDIENT_LIMIT = 50;

/** Ward assignment by index mod */
const WARDS = ["Ward A", "Ward B", "Ward C", "Ward D"];

// ── Load JSON data ───────────────────────────────────────────────────────────

function loadJSON<T>(filename: string): T {
  const filePath = path.resolve(__dirname, `../../../data/${filename}`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

interface RawPatient {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  weight_kg: number;
  height_cm: number;
  diagnoses: string[];
  allergies: string[];
  dietary_preference: string;
  religion: string | null;
  dislikes: string[];
  daily_calorie_target: number;
  regional_cuisine: string;
  bmi: number;
}

interface RawIngredient {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
  potassium_mg: number;
  sugar_g: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapGender(raw: string): "male" | "female" | "other" {
  const g = raw.toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  return "other";
}

function guessVegetarianFlags(category: string, name: string) {
  const n = name.toLowerCase();
  const meatKeywords = ["chicken", "beef", "pork", "lamb", "fish", "shrimp", "crab", "lobster", "meat", "bacon", "sausage"];
  const dairyKeywords = ["milk", "cheese", "butter", "yogurt", "cream", "paneer", "ghee"];
  const isMeat = meatKeywords.some((k) => n.includes(k));
  const isDairy = dairyKeywords.some((k) => n.includes(k));
  const isVegetarian = !isMeat;
  const isVegan = isVegetarian && !isDairy;
  return { isVegetarian, isVegan };
}

function guessGlutenFree(name: string): boolean {
  const glutenKeywords = ["wheat", "bread", "rye", "barley", "pasta", "noodle", "flour"];
  return !glutenKeywords.some((k) => name.toLowerCase().includes(k));
}

function mapIngredientCategory(cat: string): string {
  const map: Record<string, string> = {
    Vegetables: "vegetable",
    Proteins: "protein",
    Grains: "grain",
    Dairy: "dairy",
    Fruits: "fruit",
    Fats: "fat",
    Spices: "spice",
    Legumes: "legume",
    Beverages: "beverage",
  };
  return map[cat] ?? cat.toLowerCase();
}

/**
 * Sample `n` evenly-spaced items from an array to get a representative subset.
 */
function sampleEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(arr[Math.floor(i * step)]);
  }
  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function bulkSeed() {
  const db = getDB();

  console.log("🧹 Clearing existing data…");
  await db.execute("DELETE FROM chat_messages");
  await db.execute("DELETE FROM suggestions");
  await db.execute("DELETE FROM meal_tracking");
  await db.execute("DELETE FROM meal_plans");
  await db.execute("DELETE FROM diet_groups");
  await db.execute("DELETE FROM users");
  await db.execute("DELETE FROM patients");
  await db.execute("DELETE FROM ingredients");

  // ── 1. Create staff users ───────────────────────────────────────────────

  const [, doctor1] = await Promise.all([
    UserRepo.create({ name: "Admin", email: "admin@nutrisync.com", password: "Admin@123", role: "admin" }),
    UserRepo.create({ name: "Dr. Sarah Chen", email: "doctor@nutrisync.com", password: "Doctor@123", role: "doctor" }),
    UserRepo.create({ name: "Chef Rajan", email: "kitchen@nutrisync.com", password: "Kitchen@123", role: "kitchen_staff" }),
  ]);
  console.log("✅ 3 staff users created");

  // ── 2. Import ingredients ───────────────────────────────────────────────

  const rawIngredients = loadJSON<RawIngredient[]>("ingredients.json");
  console.log(`📦 Importing ingredients (limit ${INGREDIENT_LIMIT})…`);

  let ingCount = 0;
  const seenNames = new Set<string>();
  for (const ri of rawIngredients) {
    if (ingCount >= INGREDIENT_LIMIT) break;
    const lowerName = ri.name.toLowerCase();
    if (seenNames.has(lowerName)) continue; // skip duplicates
    seenNames.add(lowerName);

    const { isVegetarian, isVegan } = guessVegetarianFlags(ri.category, ri.name);
    try {
      await IngredientRepo.create({
      name: ri.name,
      category: mapIngredientCategory(ri.category),
      caloriesPer100: Math.round(ri.calories * 100) / 100,
      proteinPer100: Math.round(ri.protein_g * 100) / 100,
      carbsPer100: Math.round(ri.carbs_g * 100) / 100,
      fatPer100: Math.round(ri.fat_g * 100) / 100,
      sodiumPer100: Math.round(ri.sodium_mg * 100) / 100,
      potassiumPer100: Math.round(ri.potassium_mg * 100) / 100,
      fiberPer100: 0, // not in dataset; keep 0
      stockQty: 50,
      isAvailable: true,
      isVegetarian,
      isVegan,
      isGlutenFree: guessGlutenFree(ri.name),
    });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.slice(0, 80) : String(err);
      console.warn(`   ⚠ Skipping ingredient "${ri.name}": ${msg}`);
    }
    ingCount++;
    if (ingCount % 100 === 0) {
      console.log(`   …${ingCount} ingredients`);
      // Brief pause to avoid D1 rate limits
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.log(`✅ ${ingCount} ingredients imported`);

  // ── 3. Import patients ──────────────────────────────────────────────────

  const allRawPatients = loadJSON<RawPatient[]>("patients.json");
  const rawPatients = sampleEvenly(allRawPatients, PATIENT_LIMIT);
  console.log(`🏥 Importing ${rawPatients.length} patients (sampled from ${allRawPatients.length})…`);

  let patCount = 0;
  for (const rp of rawPatients) {
    const gender = mapGender(rp.gender);
    const activityLevel = "sedentary" as const; // dataset doesn't include this

    // Use our nutrition engine for consistent calculations
    const engineResult = runNutritionEngine({
      weight: rp.weight_kg,
      height: rp.height_cm,
      age: rp.age,
      gender,
      activityLevel,
      diagnoses: rp.diagnoses,
      dietaryRestrictions: buildDietaryRestrictions(rp.diagnoses, rp.allergies, rp.religion),
    });

    const dietType = diagnosesToDietType(rp.diagnoses) as import("../db/repositories/patientRepo").DietType;
    const foodPreferences = dietPrefToFoodPreferences(rp.dietary_preference);
    const dietaryRestrictions = buildDietaryRestrictions(rp.diagnoses, rp.allergies, rp.religion);
    const ward = WARDS[patCount % WARDS.length];

    await PatientRepo.create({
      name: rp.name,
      age: rp.age,
      gender,
      height: rp.height_cm,
      weight: rp.weight_kg,
      bmi: engineResult.bmi,
      bmiCategory: engineResult.bmiCategory,
      bmr: engineResult.bmr,
      activityLevel,
      diagnosis: rp.diagnoses,
      allergies: rp.allergies,
      dietaryRestrictions,
      foodPreferences,
      currentDietType: dietType,
      texture: "regular",
      nutritionTargets: {
        calories: engineResult.calories,
        protein: engineResult.protein,
        carbs: engineResult.carbs,
        fat: engineResult.fat,
        sodium: engineResult.sodium,
        potassium: engineResult.potassium,
        fiber: engineResult.fiber,
      },
      roomNumber: `${ward.slice(-1)}${(100 + patCount).toString()}`,
      ward,
      admissionDate: new Date().toISOString(),
      isActive: true,
      doctorId: doctor1.id,
    });

    patCount++;
    if (patCount % 25 === 0) {
      console.log(`   …${patCount} patients`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  console.log(`✅ ${patCount} patients imported`);

  // ── 4. Create patient user accounts (first 10 for easy login) ────────

  const allPatients = await PatientRepo.find({ isActive: true });
  const first10 = allPatients.slice(0, 10);
  console.log(`👤 Creating ${first10.length} patient user accounts…`);

  for (const p of first10) {
    const email = p.name.toLowerCase().replace(/\s+/g, ".") + "@nutrisync.com";
    await UserRepo.create({
      name: p.name,
      email,
      password: "Patient@123",
      role: "patient",
      patientId: p.id,
    });
  }
  console.log(`✅ ${first10.length} patient user accounts created`);

  // ── 5. Run diet grouping engine ─────────────────────────────────────────

  console.log("🔄 Running diet grouping engine…");
  const groups = await runDietGroupingEngine();
  console.log(`✅ ${groups.length} diet groups created`);

  // Print group summary
  console.log("\n📊 Diet Group Summary:");
  console.log("─".repeat(80));
  const sorted = [...groups].sort((a, b) => b.members.length - a.members.length);
  for (const g of sorted) {
    console.log(
      `  ${g.name.padEnd(50)} ${String(g.members.length).padStart(3)} patients  ${g.groupCode}`
    );
  }
  console.log("─".repeat(80));
  console.log(`  Total groups: ${groups.length}   Total patients: ${groups.reduce((s, g) => s + g.members.length, 0)}`);

  // ── Done ────────────────────────────────────────────────────────────────

  console.log("\n🎉 Bulk seed complete!");
  console.log("──────────────────────────────");
  console.log("Admin:   admin@nutrisync.com   / Admin@123");
  console.log("Doctor:  doctor@nutrisync.com  / Doctor@123");
  console.log("Kitchen: kitchen@nutrisync.com / Kitchen@123");
  console.log("Patient accounts (password: Patient@123):");
  for (const p of first10) {
    const email = p.name.toLowerCase().replace(/\s+/g, ".") + "@nutrisync.com";
    console.log(`  ${email}`);
  }

  process.exit(0);
}

bulkSeed().catch((err) => {
  console.error("❌ Bulk seed failed:", err);
  process.exit(1);
});
