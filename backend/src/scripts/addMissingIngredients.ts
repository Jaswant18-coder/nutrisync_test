/**
 * Add remaining missing ingredients to complete the Indian meal dataset coverage.
 * Run: npx ts-node --transpile-only src/scripts/addMissingIngredients.ts
 */
import dotenv from "dotenv";
dotenv.config();

import { getDB } from "../config/d1";
import IngredientRepo from "../db/repositories/ingredientRepo";

const items = [
  { name: "brown rice", category: "grain", caloriesPer100: 370, proteinPer100: 8, carbsPer100: 78, fatPer100: 3, sodiumPer100: 5, potassiumPer100: 223, fiberPer100: 4, stockQty: 80 },
  { name: "white rice", category: "grain", caloriesPer100: 365, proteinPer100: 7, carbsPer100: 80, fatPer100: 1, sodiumPer100: 1, potassiumPer100: 115, fiberPer100: 1, stockQty: 80 },
  { name: "tomato", category: "vegetable", caloriesPer100: 18, proteinPer100: 1, carbsPer100: 4, fatPer100: 0, sodiumPer100: 5, potassiumPer100: 237, fiberPer100: 1, stockQty: 30 },
  { name: "cucumber", category: "vegetable", caloriesPer100: 15, proteinPer100: 1, carbsPer100: 4, fatPer100: 0, sodiumPer100: 2, potassiumPer100: 147, fiberPer100: 1, stockQty: 25 },
  { name: "corn", category: "grain", caloriesPer100: 86, proteinPer100: 3, carbsPer100: 19, fatPer100: 1, sodiumPer100: 15, potassiumPer100: 270, fiberPer100: 2, stockQty: 20 },
  { name: "egg whites", category: "protein", caloriesPer100: 52, proteinPer100: 11, carbsPer100: 1, fatPer100: 0, sodiumPer100: 166, potassiumPer100: 163, fiberPer100: 0, stockQty: 30 },
  { name: "herbal tea", category: "beverage", caloriesPer100: 1, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 15, fiberPer100: 0, stockQty: 10 },
  { name: "herbs", category: "herb", caloriesPer100: 30, proteinPer100: 2, carbsPer100: 4, fatPer100: 1, sodiumPer100: 20, potassiumPer100: 300, fiberPer100: 3, stockQty: 5 },
  { name: "low-fat milk", category: "dairy", caloriesPer100: 42, proteinPer100: 3, carbsPer100: 5, fatPer100: 1, sodiumPer100: 44, potassiumPer100: 150, fiberPer100: 0, stockQty: 60 },
  { name: "low-fat yogurt", category: "dairy", caloriesPer100: 56, proteinPer100: 5, carbsPer100: 7, fatPer100: 1, sodiumPer100: 46, potassiumPer100: 234, fiberPer100: 0, stockQty: 30 },
  { name: "mixed berries", category: "fruit", caloriesPer100: 57, proteinPer100: 1, carbsPer100: 14, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 150, fiberPer100: 3, stockQty: 10 },
  { name: "mixed fruit jam", category: "condiment", caloriesPer100: 250, proteinPer100: 0, carbsPer100: 65, fatPer100: 0, sodiumPer100: 10, potassiumPer100: 60, fiberPer100: 1, stockQty: 10 },
  { name: "mixed vegetables", category: "vegetable", caloriesPer100: 65, proteinPer100: 3, carbsPer100: 13, fatPer100: 0, sodiumPer100: 43, potassiumPer100: 270, fiberPer100: 4, stockQty: 30 },
  { name: "multi-grain crackers", category: "snack", caloriesPer100: 428, proteinPer100: 11, carbsPer100: 67, fatPer100: 14, sodiumPer100: 460, potassiumPer100: 170, fiberPer100: 5, stockQty: 10 },
  { name: "refined flour", category: "grain", caloriesPer100: 364, proteinPer100: 10, carbsPer100: 76, fatPer100: 1, sodiumPer100: 2, potassiumPer100: 107, fiberPer100: 3, stockQty: 20 },
  { name: "rice cake", category: "grain", caloriesPer100: 387, proteinPer100: 8, carbsPer100: 81, fatPer100: 3, sodiumPer100: 11, potassiumPer100: 100, fiberPer100: 2, stockQty: 10 },
  { name: "rice crackers", category: "snack", caloriesPer100: 403, proteinPer100: 7, carbsPer100: 80, fatPer100: 7, sodiumPer100: 480, potassiumPer100: 45, fiberPer100: 1, stockQty: 10 },
  { name: "rice noodles", category: "grain", caloriesPer100: 364, proteinPer100: 3, carbsPer100: 84, fatPer100: 1, sodiumPer100: 182, potassiumPer100: 4, fiberPer100: 2, stockQty: 15 },
  { name: "roasted chickpeas", category: "snack", caloriesPer100: 369, proteinPer100: 14, carbsPer100: 58, fatPer100: 8, sodiumPer100: 15, potassiumPer100: 718, fiberPer100: 13, stockQty: 15 },
  { name: "sattu (roasted gram flour)", category: "grain", caloriesPer100: 413, proteinPer100: 20, carbsPer100: 65, fatPer100: 7, sodiumPer100: 20, potassiumPer100: 800, fiberPer100: 10, stockQty: 10 },
  { name: "unsalted crackers", category: "snack", caloriesPer100: 421, proteinPer100: 10, carbsPer100: 72, fatPer100: 11, sodiumPer100: 10, potassiumPer100: 130, fiberPer100: 3, stockQty: 10 },
  { name: "white bread", category: "grain", caloriesPer100: 265, proteinPer100: 9, carbsPer100: 49, fatPer100: 3, sodiumPer100: 491, potassiumPer100: 100, fiberPer100: 3, stockQty: 20 },
  { name: "whole spices", category: "spice", caloriesPer100: 300, proteinPer100: 10, carbsPer100: 50, fatPer100: 10, sodiumPer100: 30, potassiumPer100: 500, fiberPer100: 20, stockQty: 5 },
  { name: "whole wheat bread", category: "grain", caloriesPer100: 247, proteinPer100: 9, carbsPer100: 46, fatPer100: 4, sodiumPer100: 400, potassiumPer100: 200, fiberPer100: 6, stockQty: 20 },
];

async function addMissing() {
  const db = getDB();
  let added = 0;
  for (const ing of items) {
    const exists = await db.queryOne("SELECT id FROM ingredients WHERE LOWER(name) = ?", [ing.name.toLowerCase()]);
    if (!exists) {
      await IngredientRepo.create({
        name: ing.name,
        category: ing.category,
        unit: "kg",
        caloriesPer100: ing.caloriesPer100,
        proteinPer100: ing.proteinPer100,
        carbsPer100: ing.carbsPer100,
        fatPer100: ing.fatPer100,
        sodiumPer100: ing.sodiumPer100,
        potassiumPer100: ing.potassiumPer100,
        fiberPer100: ing.fiberPer100,
        stockQty: ing.stockQty,
        stockUnit: "kg",
        reorderLevel: 5,
        isAvailable: true,
        isVegetarian: true,
        isVegan: !["dairy", "protein"].includes(ing.category),
        isGlutenFree: true,
        commonAllergen: [],
      } as Record<string, unknown>);
      console.log(`  + ${ing.name} (${ing.stockQty} kg)`);
      added++;
    }
  }
  console.log(`\n✅ Added ${added} missing ingredients`);
  const cnt = await db.query("SELECT COUNT(*) as cnt FROM ingredients");
  console.log(`📦 Total ingredients: ${(cnt[0] as { cnt: number }).cnt}`);
  process.exit(0);
}

addMissing().catch((e) => { console.error(e); process.exit(1); });
