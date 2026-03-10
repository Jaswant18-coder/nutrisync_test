/**
 * Ingredient Repository — replaces the Mongoose Ingredient model.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB, D1Row } from "../../config/d1";

export interface IIngredient {
  _id: string;
  id: string;
  name: string;
  category: string;
  unit: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  sodiumPer100: number;
  potassiumPer100: number;
  fiberPer100: number;
  stockQty: number;
  stockUnit: string;
  reorderLevel: number;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  commonAllergen: string[];
  allergens?: string[];     // alias used in some routes
  restrictions?: string[];
  createdAt: string;
  updatedAt: string;
}

function rowToIngredient(row: D1Row): IIngredient {
  return {
    _id: row.id as string,
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    unit: row.unit as string,
    caloriesPer100: row.calories_per_100 as number,
    proteinPer100: row.protein_per_100 as number,
    carbsPer100: row.carbs_per_100 as number,
    fatPer100: row.fat_per_100 as number,
    sodiumPer100: row.sodium_per_100 as number,
    potassiumPer100: row.potassium_per_100 as number,
    fiberPer100: row.fiber_per_100 as number,
    stockQty: row.stock_qty as number,
    stockUnit: row.stock_unit as string,
    reorderLevel: row.reorder_level as number,
    isAvailable: Boolean(row.is_available),
    isVegetarian: Boolean(row.is_vegetarian),
    isVegan: Boolean(row.is_vegan),
    isGlutenFree: Boolean(row.is_gluten_free),
    commonAllergen: JSON.parse((row.common_allergen as string) || "[]"),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const IngredientRepo = {
  async find(filter: { isAvailable?: boolean } = {}): Promise<IIngredient[]> {
    const db = getDB();
    const where = filter.isAvailable !== undefined ? "WHERE is_available = ?" : "";
    const params = filter.isAvailable !== undefined ? [filter.isAvailable ? 1 : 0] : [];
    const rows = await db.query(`SELECT * FROM ingredients ${where} ORDER BY name ASC`, params);
    return rows.map(rowToIngredient);
  },

  async findById(id: string): Promise<IIngredient | null> {
    const db = getDB();
    const row = await db.queryOne("SELECT * FROM ingredients WHERE id = ?", [id]);
    return row ? rowToIngredient(row) : null;
  },

  async findOne(filter: { name?: string }): Promise<IIngredient | null> {
    const db = getDB();
    if (filter.name) {
      const row = await db.queryOne("SELECT * FROM ingredients WHERE name = ?", [filter.name.toLowerCase()]);
      return row ? rowToIngredient(row) : null;
    }
    return null;
  },

  /** Fuzzy match: exact first, then LIKE, then word match. Prefers clean names (no trailing numbers). */
  async findByNameFuzzy(name: string): Promise<IIngredient | null> {
    const db = getDB();
    const lower = name.toLowerCase().trim();

    // 1. Exact match
    const row = await db.queryOne("SELECT * FROM ingredients WHERE LOWER(name) = ?", [lower]);
    if (row) return rowToIngredient(row);

    // 2. LIKE match — prefer shortest name (most specific) and filter out junk names with trailing numbers
    const likeRows = await db.query(
      "SELECT * FROM ingredients WHERE LOWER(name) LIKE ? ORDER BY LENGTH(name) ASC",
      [`%${lower}%`]
    );
    const cleanLike = likeRows.filter((r) => !/\d+$/.test((r.name as string).trim()));
    if (cleanLike.length > 0) return rowToIngredient(cleanLike[0]);
    if (likeRows.length > 0) return rowToIngredient(likeRows[0]);

    // 3. Reverse check — see if the inventory item name is contained in the search term
    //    e.g. "white rice" contains "rice", "brown rice" contains "rice"
    const allRows = await db.query("SELECT * FROM ingredients ORDER BY LENGTH(name) DESC");
    for (const r of allRows) {
      const invName = (r.name as string).toLowerCase().trim();
      // Skip junk names with trailing numbers
      if (/\d+$/.test(invName)) continue;
      if (lower.includes(invName) || invName.includes(lower)) {
        return rowToIngredient(r);
      }
    }

    // 4. Word-level match (last resort) — match any significant word, skip junk items
    const words = lower.split(/\s+/).filter((w) => w.length > 2);
    for (const word of words) {
      const wordRows = await db.query(
        "SELECT * FROM ingredients WHERE LOWER(name) LIKE ? ORDER BY LENGTH(name) ASC",
        [`%${word}%`]
      );
      const cleanWord = wordRows.filter((r) => !/\d+$/.test((r.name as string).trim()));
      if (cleanWord.length > 0) return rowToIngredient(cleanWord[0]);
    }

    return null;
  },

  /** Low-stock: stockQty <= reorderLevel */
  async findLowStock(): Promise<IIngredient[]> {
    const db = getDB();
    const rows = await db.query("SELECT * FROM ingredients WHERE stock_qty <= reorder_level ORDER BY name ASC");
    return rows.map(rowToIngredient);
  },

  async create(data: Partial<IIngredient>): Promise<IIngredient> {
    const db = getDB();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO ingredients (
        id, name, category, unit,
        calories_per_100, protein_per_100, carbs_per_100, fat_per_100,
        sodium_per_100, potassium_per_100, fiber_per_100,
        stock_qty, stock_unit, reorder_level, is_available,
        is_vegetarian, is_vegan, is_gluten_free, common_allergen,
        created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        (data.name ?? "").toLowerCase(),
        data.category ?? "other",
        data.unit ?? "g",
        data.caloriesPer100 ?? 0,
        data.proteinPer100 ?? 0,
        data.carbsPer100 ?? 0,
        data.fatPer100 ?? 0,
        data.sodiumPer100 ?? 0,
        data.potassiumPer100 ?? 0,
        data.fiberPer100 ?? 0,
        data.stockQty ?? 0,
        data.stockUnit ?? "kg",
        data.reorderLevel ?? 5,
        data.isAvailable !== false ? 1 : 0,
        data.isVegetarian ? 1 : 0,
        data.isVegan ? 1 : 0,
        data.isGlutenFree ? 1 : 0,
        JSON.stringify(data.commonAllergen ?? data.allergens ?? []),
        now, now,
      ]
    );

    return rowToIngredient({
      id, name: (data.name ?? "").toLowerCase(), category: data.category ?? "other",
      unit: data.unit ?? "g",
      calories_per_100: data.caloriesPer100 ?? 0,
      protein_per_100: data.proteinPer100 ?? 0,
      carbs_per_100: data.carbsPer100 ?? 0,
      fat_per_100: data.fatPer100 ?? 0,
      sodium_per_100: data.sodiumPer100 ?? 0,
      potassium_per_100: data.potassiumPer100 ?? 0,
      fiber_per_100: data.fiberPer100 ?? 0,
      stock_qty: data.stockQty ?? 0,
      stock_unit: data.stockUnit ?? "kg",
      reorder_level: data.reorderLevel ?? 5,
      is_available: data.isAvailable !== false ? 1 : 0,
      is_vegetarian: data.isVegetarian ? 1 : 0,
      is_vegan: data.isVegan ? 1 : 0,
      is_gluten_free: data.isGlutenFree ? 1 : 0,
      common_allergen: JSON.stringify(data.commonAllergen ?? data.allergens ?? []),
      created_at: now, updated_at: now,
    });
  },

  async update(id: string, data: Partial<IIngredient>): Promise<IIngredient | null> {
    const db = getDB();
    const now = new Date().toISOString();
    const cols: Record<string, string> = {
      name: "name", category: "category", unit: "unit",
      caloriesPer100: "calories_per_100", proteinPer100: "protein_per_100",
      carbsPer100: "carbs_per_100", fatPer100: "fat_per_100",
      sodiumPer100: "sodium_per_100", potassiumPer100: "potassium_per_100",
      fiberPer100: "fiber_per_100", stockQty: "stock_qty",
      stockUnit: "stock_unit", reorderLevel: "reorder_level",
      isAvailable: "is_available", isVegetarian: "is_vegetarian",
      isVegan: "is_vegan", isGlutenFree: "is_gluten_free",
    };
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [key, col] of Object.entries(cols)) {
      if (data[key as keyof IIngredient] !== undefined) {
        sets.push(`${col} = ?`);
        let val = data[key as keyof IIngredient];
        if (typeof val === "boolean") val = val ? 1 : 0;
        params.push(val as unknown);
      }
    }
    if (data.commonAllergen !== undefined) {
      sets.push("common_allergen = ?"); params.push(JSON.stringify(data.commonAllergen));
    }
    if (sets.length === 0) return this.findById(id);
    sets.push("updated_at = ?"); params.push(now); params.push(id);
    await db.execute(`UPDATE ingredients SET ${sets.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  },

  async deleteById(id: string): Promise<void> {
    const db = getDB();
    await db.execute("DELETE FROM ingredients WHERE id = ?", [id]);
  },

  async deleteMany(): Promise<void> {
    const db = getDB();
    await db.execute("DELETE FROM ingredients");
  },

  async insertMany(items: Partial<IIngredient>[]): Promise<void> {
    for (const item of items) await this.create(item);
  },
};

export default IngredientRepo;
