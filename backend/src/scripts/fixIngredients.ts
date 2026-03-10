/**
 * Fix Ingredients — Remove junk synthetic items and add missing Indian ingredients.
 * Run: npx ts-node --transpile-only src/scripts/fixIngredients.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { getDB } from "../config/d1";
import IngredientRepo from "../db/repositories/ingredientRepo";

// Indian ingredients needed by the meal dataset that may not exist in inventory
const INDIAN_INGREDIENTS = [
  { name: "rice", category: "grain", caloriesPer100: 365, proteinPer100: 7, carbsPer100: 80, fatPer100: 1, sodiumPer100: 1, potassiumPer100: 115, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 100 },
  { name: "basmati rice", category: "grain", caloriesPer100: 350, proteinPer100: 7, carbsPer100: 77, fatPer100: 1, sodiumPer100: 1, potassiumPer100: 115, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 80 },
  { name: "ghee", category: "fat", caloriesPer100: 900, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, sodiumPer100: 0, potassiumPer100: 0, fiberPer100: 0, isVegetarian: true, isVegan: false, isGlutenFree: true, stockQty: 30 },
  { name: "lentils", category: "legume", caloriesPer100: 353, proteinPer100: 25, carbsPer100: 60, fatPer100: 2, sodiumPer100: 6, potassiumPer100: 677, fiberPer100: 16, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 60 },
  { name: "toor dal", category: "legume", caloriesPer100: 343, proteinPer100: 22, carbsPer100: 63, fatPer100: 1, sodiumPer100: 5, potassiumPer100: 660, fiberPer100: 15, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 50 },
  { name: "moong dal", category: "legume", caloriesPer100: 347, proteinPer100: 24, carbsPer100: 60, fatPer100: 1, sodiumPer100: 6, potassiumPer100: 650, fiberPer100: 16, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 50 },
  { name: "urad dal", category: "legume", caloriesPer100: 341, proteinPer100: 25, carbsPer100: 59, fatPer100: 1, sodiumPer100: 7, potassiumPer100: 680, fiberPer100: 18, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 50 },
  { name: "masoor dal", category: "legume", caloriesPer100: 352, proteinPer100: 24, carbsPer100: 63, fatPer100: 1, sodiumPer100: 6, potassiumPer100: 670, fiberPer100: 11, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 50 },
  { name: "paneer", category: "dairy", caloriesPer100: 265, proteinPer100: 18, carbsPer100: 1, fatPer100: 21, sodiumPer100: 18, potassiumPer100: 100, fiberPer100: 0, isVegetarian: true, isVegan: false, isGlutenFree: true, stockQty: 30 },
  { name: "cumin", category: "spice", caloriesPer100: 375, proteinPer100: 18, carbsPer100: 44, fatPer100: 22, sodiumPer100: 168, potassiumPer100: 1788, fiberPer100: 11, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "coriander", category: "spice", caloriesPer100: 23, proteinPer100: 2, carbsPer100: 4, fatPer100: 1, sodiumPer100: 46, potassiumPer100: 521, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "ginger", category: "spice", caloriesPer100: 80, proteinPer100: 2, carbsPer100: 18, fatPer100: 1, sodiumPer100: 13, potassiumPer100: 415, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "garlic", category: "spice", caloriesPer100: 149, proteinPer100: 6, carbsPer100: 33, fatPer100: 1, sodiumPer100: 17, potassiumPer100: 401, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "onion", category: "vegetable", caloriesPer100: 40, proteinPer100: 1, carbsPer100: 9, fatPer100: 0, sodiumPer100: 4, potassiumPer100: 146, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 40 },
  { name: "potato", category: "vegetable", caloriesPer100: 77, proteinPer100: 2, carbsPer100: 17, fatPer100: 0, sodiumPer100: 6, potassiumPer100: 421, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 50 },
  { name: "sweet potato", category: "vegetable", caloriesPer100: 86, proteinPer100: 2, carbsPer100: 20, fatPer100: 0, sodiumPer100: 55, potassiumPer100: 337, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 30 },
  { name: "green peas", category: "vegetable", caloriesPer100: 81, proteinPer100: 5, carbsPer100: 14, fatPer100: 0, sodiumPer100: 5, potassiumPer100: 244, fiberPer100: 5, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 25 },
  { name: "green beans", category: "vegetable", caloriesPer100: 31, proteinPer100: 2, carbsPer100: 7, fatPer100: 0, sodiumPer100: 6, potassiumPer100: 209, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 25 },
  { name: "cabbage", category: "vegetable", caloriesPer100: 25, proteinPer100: 1, carbsPer100: 6, fatPer100: 0, sodiumPer100: 18, potassiumPer100: 170, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 25 },
  { name: "bottle gourd", category: "vegetable", caloriesPer100: 15, proteinPer100: 1, carbsPer100: 3, fatPer100: 0, sodiumPer100: 2, potassiumPer100: 150, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "ridge gourd", category: "vegetable", caloriesPer100: 18, proteinPer100: 1, carbsPer100: 3, fatPer100: 0, sodiumPer100: 3, potassiumPer100: 139, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "snake gourd", category: "vegetable", caloriesPer100: 17, proteinPer100: 1, carbsPer100: 3, fatPer100: 0, sodiumPer100: 2, potassiumPer100: 130, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "apple gourd", category: "vegetable", caloriesPer100: 14, proteinPer100: 1, carbsPer100: 2, fatPer100: 0, sodiumPer100: 2, potassiumPer100: 140, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "semolina", category: "grain", caloriesPer100: 360, proteinPer100: 13, carbsPer100: 73, fatPer100: 1, sodiumPer100: 1, potassiumPer100: 186, fiberPer100: 4, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 30 },
  { name: "whole wheat flour", category: "grain", caloriesPer100: 340, proteinPer100: 13, carbsPer100: 72, fatPer100: 2, sodiumPer100: 2, potassiumPer100: 363, fiberPer100: 11, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 50 },
  { name: "gram flour", category: "grain", caloriesPer100: 387, proteinPer100: 22, carbsPer100: 58, fatPer100: 7, sodiumPer100: 64, potassiumPer100: 846, fiberPer100: 10, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 25 },
  { name: "ragi flour", category: "grain", caloriesPer100: 336, proteinPer100: 7, carbsPer100: 72, fatPer100: 1, sodiumPer100: 11, potassiumPer100: 408, fiberPer100: 11, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "jowar flour", category: "grain", caloriesPer100: 329, proteinPer100: 11, carbsPer100: 73, fatPer100: 3, sodiumPer100: 6, potassiumPer100: 350, fiberPer100: 7, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "bajra flour", category: "grain", caloriesPer100: 361, proteinPer100: 12, carbsPer100: 67, fatPer100: 5, sodiumPer100: 5, potassiumPer100: 307, fiberPer100: 9, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "rice flour", category: "grain", caloriesPer100: 366, proteinPer100: 6, carbsPer100: 80, fatPer100: 1, sodiumPer100: 0, potassiumPer100: 76, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "flattened rice", category: "grain", caloriesPer100: 346, proteinPer100: 7, carbsPer100: 77, fatPer100: 1, sodiumPer100: 3, potassiumPer100: 113, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "puffed rice", category: "grain", caloriesPer100: 328, proteinPer100: 6, carbsPer100: 73, fatPer100: 1, sodiumPer100: 3, potassiumPer100: 100, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "broken wheat", category: "grain", caloriesPer100: 342, proteinPer100: 12, carbsPer100: 72, fatPer100: 2, sodiumPer100: 2, potassiumPer100: 290, fiberPer100: 13, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 20 },
  { name: "sago", category: "grain", caloriesPer100: 332, proteinPer100: 0, carbsPer100: 83, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 11, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "coconut", category: "fruit", caloriesPer100: 354, proteinPer100: 3, carbsPer100: 15, fatPer100: 33, sodiumPer100: 20, potassiumPer100: 356, fiberPer100: 9, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "coconut milk", category: "dairy", caloriesPer100: 197, proteinPer100: 2, carbsPer100: 3, fatPer100: 21, sodiumPer100: 13, potassiumPer100: 220, fiberPer100: 0, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "coconut water", category: "beverage", caloriesPer100: 19, proteinPer100: 0, carbsPer100: 4, fatPer100: 0, sodiumPer100: 105, potassiumPer100: 250, fiberPer100: 0, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "jaggery", category: "sweetener", caloriesPer100: 383, proteinPer100: 0, carbsPer100: 98, fatPer100: 0, sodiumPer100: 30, potassiumPer100: 490, fiberPer100: 0, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "dates", category: "fruit", caloriesPer100: 277, proteinPer100: 2, carbsPer100: 75, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 696, fiberPer100: 7, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "makhana", category: "snack", caloriesPer100: 347, proteinPer100: 10, carbsPer100: 65, fatPer100: 1, sodiumPer100: 0, potassiumPer100: 350, fiberPer100: 7, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "papaya", category: "fruit", caloriesPer100: 43, proteinPer100: 0, carbsPer100: 11, fatPer100: 0, sodiumPer100: 8, potassiumPer100: 182, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "pomegranate", category: "fruit", caloriesPer100: 83, proteinPer100: 2, carbsPer100: 19, fatPer100: 1, sodiumPer100: 3, potassiumPer100: 236, fiberPer100: 4, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "muskmelon", category: "fruit", caloriesPer100: 34, proteinPer100: 1, carbsPer100: 8, fatPer100: 0, sodiumPer100: 16, potassiumPer100: 267, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "avocado", category: "fruit", caloriesPer100: 160, proteinPer100: 2, carbsPer100: 9, fatPer100: 15, sodiumPer100: 7, potassiumPer100: 485, fiberPer100: 7, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "lemon", category: "fruit", caloriesPer100: 29, proteinPer100: 1, carbsPer100: 9, fatPer100: 0, sodiumPer100: 2, potassiumPer100: 138, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "mint", category: "herb", caloriesPer100: 44, proteinPer100: 3, carbsPer100: 8, fatPer100: 1, sodiumPer100: 31, potassiumPer100: 569, fiberPer100: 7, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 5 },
  { name: "curry leaves", category: "herb", caloriesPer100: 108, proteinPer100: 6, carbsPer100: 19, fatPer100: 1, sodiumPer100: 0, potassiumPer100: 120, fiberPer100: 6, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 5 },
  { name: "fenugreek leaves", category: "herb", caloriesPer100: 49, proteinPer100: 4, carbsPer100: 6, fatPer100: 1, sodiumPer100: 67, potassiumPer100: 770, fiberPer100: 4, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 5 },
  { name: "tamarind", category: "spice", caloriesPer100: 239, proteinPer100: 3, carbsPer100: 63, fatPer100: 1, sodiumPer100: 28, potassiumPer100: 628, fiberPer100: 5, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 5 },
  { name: "flaxseed", category: "seed", caloriesPer100: 534, proteinPer100: 18, carbsPer100: 29, fatPer100: 42, sodiumPer100: 30, potassiumPer100: 813, fiberPer100: 27, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 5 },
  { name: "chickpeas", category: "legume", caloriesPer100: 364, proteinPer100: 19, carbsPer100: 61, fatPer100: 6, sodiumPer100: 24, potassiumPer100: 875, fiberPer100: 17, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 40 },
  { name: "kidney beans", category: "legume", caloriesPer100: 333, proteinPer100: 24, carbsPer100: 60, fatPer100: 1, sodiumPer100: 24, potassiumPer100: 1406, fiberPer100: 25, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 30 },
  { name: "green gram", category: "legume", caloriesPer100: 347, proteinPer100: 24, carbsPer100: 63, fatPer100: 1, sodiumPer100: 15, potassiumPer100: 1246, fiberPer100: 16, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 30 },
  { name: "moong sprouts", category: "legume", caloriesPer100: 30, proteinPer100: 3, carbsPer100: 6, fatPer100: 0, sodiumPer100: 6, potassiumPer100: 149, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "roasted chickpeas", category: "snack", caloriesPer100: 369, proteinPer100: 14, carbsPer100: 58, fatPer100: 8, sodiumPer100: 15, potassiumPer100: 718, fiberPer100: 13, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "egg whites", category: "protein", caloriesPer100: 52, proteinPer100: 11, carbsPer100: 1, fatPer100: 0, sodiumPer100: 166, potassiumPer100: 163, fiberPer100: 0, isVegetarian: true, isVegan: false, isGlutenFree: true, stockQty: 30 },
  { name: "low-fat milk", category: "dairy", caloriesPer100: 42, proteinPer100: 3, carbsPer100: 5, fatPer100: 1, sodiumPer100: 44, potassiumPer100: 150, fiberPer100: 0, isVegetarian: true, isVegan: false, isGlutenFree: true, stockQty: 60 },
  { name: "herbal tea", category: "beverage", caloriesPer100: 1, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 15, fiberPer100: 0, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "mixed vegetables", category: "vegetable", caloriesPer100: 65, proteinPer100: 3, carbsPer100: 13, fatPer100: 0, sodiumPer100: 43, potassiumPer100: 270, fiberPer100: 4, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 30 },
  { name: "corn", category: "grain", caloriesPer100: 86, proteinPer100: 3, carbsPer100: 19, fatPer100: 1, sodiumPer100: 15, potassiumPer100: 270, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20 },
  { name: "mixed berries", category: "fruit", caloriesPer100: 57, proteinPer100: 1, carbsPer100: 14, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 150, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "herbs", category: "herb", caloriesPer100: 30, proteinPer100: 2, carbsPer100: 4, fatPer100: 1, sodiumPer100: 20, potassiumPer100: 300, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 5 },
  { name: "whole spices", category: "spice", caloriesPer100: 300, proteinPer100: 10, carbsPer100: 50, fatPer100: 10, sodiumPer100: 30, potassiumPer100: 500, fiberPer100: 20, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 5 },
  { name: "sattu (roasted gram flour)", category: "grain", caloriesPer100: 413, proteinPer100: 20, carbsPer100: 65, fatPer100: 7, sodiumPer100: 20, potassiumPer100: 800, fiberPer100: 10, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "refined flour", category: "grain", caloriesPer100: 364, proteinPer100: 10, carbsPer100: 76, fatPer100: 1, sodiumPer100: 2, potassiumPer100: 107, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 20 },
  { name: "white bread", category: "grain", caloriesPer100: 265, proteinPer100: 9, carbsPer100: 49, fatPer100: 3, sodiumPer100: 491, potassiumPer100: 100, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 20 },
  { name: "rice noodles", category: "grain", caloriesPer100: 364, proteinPer100: 3, carbsPer100: 84, fatPer100: 1, sodiumPer100: 182, potassiumPer100: 4, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15 },
  { name: "rice cake", category: "grain", caloriesPer100: 387, proteinPer100: 8, carbsPer100: 81, fatPer100: 3, sodiumPer100: 11, potassiumPer100: 100, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "rice crackers", category: "snack", caloriesPer100: 403, proteinPer100: 7, carbsPer100: 80, fatPer100: 7, sodiumPer100: 480, potassiumPer100: 45, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
  { name: "unsalted crackers", category: "snack", caloriesPer100: 421, proteinPer100: 10, carbsPer100: 72, fatPer100: 11, sodiumPer100: 10, potassiumPer100: 130, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 10 },
  { name: "multi-grain crackers", category: "snack", caloriesPer100: 428, proteinPer100: 11, carbsPer100: 67, fatPer100: 14, sodiumPer100: 460, potassiumPer100: 170, fiberPer100: 5, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 10 },
  { name: "mixed fruit jam", category: "condiment", caloriesPer100: 250, proteinPer100: 0, carbsPer100: 65, fatPer100: 0, sodiumPer100: 10, potassiumPer100: 60, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10 },
];

async function fixIngredients() {
  const db = getDB();

  // 1. Remove junk items (names ending with numbers, e.g. "fresh rice 44")
  const junkRows = await db.query(
    "SELECT id, name FROM ingredients"
  );
  let removedCount = 0;
  for (const row of junkRows) {
    const name = (row.name as string).trim();
    if (/\s+\d+$/.test(name)) {
      await db.execute("DELETE FROM ingredients WHERE id = ?", [row.id]);
      console.log(`  🗑️  Removed: "${name}"`);
      removedCount++;
    }
  }
  console.log(`✅ Removed ${removedCount} junk ingredients`);

  // 2. Add missing Indian ingredients
  let addedCount = 0;
  for (const ing of INDIAN_INGREDIENTS) {
    const existing = await db.queryOne(
      "SELECT id FROM ingredients WHERE LOWER(name) = ?",
      [ing.name.toLowerCase()]
    );
    if (!existing) {
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
        isVegetarian: ing.isVegetarian,
        isVegan: ing.isVegan,
        isGlutenFree: ing.isGlutenFree,
        commonAllergen: [],
      } as Record<string, unknown>);
      console.log(`  ➕ Added: "${ing.name}" (${ing.stockQty} kg)`);
      addedCount++;
    } else {
      console.log(`  ⏭️  Exists: "${ing.name}"`);
    }
  }
  console.log(`✅ Added ${addedCount} new Indian ingredients`);

  // 3. Fix "fresh rice 44" stock if it was incorrectly deducted
  // (it should have been removed in step 1, but fix stock of "rice" just in case)
  const riceRow = await db.queryOne("SELECT id, stock_qty FROM ingredients WHERE LOWER(name) = 'rice'");
  if (riceRow) {
    console.log(`\n📊 "rice" stock: ${riceRow.stock_qty} kg`);
  }

  // Final count
  const finalCount = await db.query("SELECT COUNT(*) as cnt FROM ingredients");
  console.log(`\n📦 Total ingredients in inventory: ${(finalCount[0] as { cnt: number }).cnt}`);

  process.exit(0);
}

fixIngredients().catch((err) => {
  console.error(err);
  process.exit(1);
});
