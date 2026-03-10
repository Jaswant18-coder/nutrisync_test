import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { runDietGroupingEngine, getKitchenProductionPlan } from "../services/dietGroupingEngine";
import MealPlanRepo from "../db/repositories/mealPlanRepo";
import IngredientRepo from "../db/repositories/ingredientRepo";
import { authenticate } from "../middleware/auth";
import { getIndianMeals, MealTemplate } from "../data/indianMealDataset";
import { getDB } from "../config/d1";

const router = Router();

/** Extract a meaningful message from any thrown value */
const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;
router.use(authenticate);

// ── Allergy / forbidden-food helpers ────────────────────────────────────────

/** Plant-based alternatives that should never be flagged as dairy */
const PLANT_BASED_SAFE = ["coconut milk", "almond milk", "soy milk", "oat milk", "rice milk"];

/** Returns true when a single ingredient contains a forbidden food term */
function ingredientIsForbidden(ingredientName: string, forbiddenFoods: string[]): boolean {
  const ingLower = ingredientName.toLowerCase().trim();

  // Never flag plant-based alternatives even if "milk" is in the forbidden list
  if (PLANT_BASED_SAFE.some((p) => ingLower.includes(p))) return false;

  for (const f of forbiddenFoods) {
    if (ingLower.includes(f.toLowerCase())) return true;
  }
  return false;
}

/** Returns true when NONE of the meal's ingredients match a forbidden food */
function isMealSafe(meal: MealTemplate, forbiddenFoods: string[]): boolean {
  if (!forbiddenFoods.length) return true;
  return !meal.ingredients.some((ing) => ingredientIsForbidden(ing.name, forbiddenFoods));
}

/**
 * Pick a safe meal of the given type for the group.
 * 1. Try the default day's meal first.
 * 2. If unsafe, rotate through all 7 days' pools for that meal type.
 * 3. If nothing is safe, return the original (with a warning logged).
 */
function findSafeMeal(
  dietType: string,
  mealType: string,
  dayOfWeek: number,
  forbiddenFoods: string[],
  groupCode: string
): MealTemplate {
  const defaultMeals = getIndianMeals(dietType, dayOfWeek);
  const defaultMeal = defaultMeals.find((m) => m.type === mealType) || defaultMeals[0];

  if (!forbiddenFoods.length || isMealSafe(defaultMeal, forbiddenFoods)) {
    return defaultMeal;
  }

  // Try other days' pools for a safe alternative
  for (let d = 1; d <= 7; d++) {
    if (d === dayOfWeek) continue;
    const altMeals = getIndianMeals(dietType, d);
    const altMeal = altMeals.find((m) => m.type === mealType);
    if (altMeal && isMealSafe(altMeal, forbiddenFoods)) {
      return altMeal;
    }
  }

  // No completely safe alternative found — log warning, return original
  console.warn(
    `⚠️  No safe ${mealType} found for ${groupCode} — forbidden: ${forbiddenFoods.join(", ")}`
  );
  return defaultMeal;
}

/** Today's date as YYYY-MM-DD (used as the status key) */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/kitchen/production?ward=xxx
router.get("/production", async (req, res) => {
  const ward = req.query.ward as string | undefined;
  const plan = await getKitchenProductionPlan(ward);
  res.json(plan);
});

// POST /api/kitchen/regroup?ward=xxx
router.post("/regroup", async (req, res) => {
  const ward = req.query.ward as string | undefined;
  const groups = await runDietGroupingEngine(ward);
  res.json({ grouped: groups.length, groups });
});

// GET /api/kitchen/meal-plans/today
router.get("/meal-plans/today", async (_req, res) => {
  const plans = await MealPlanRepo.find({ status: "active" });
  const today = new Date().toDateString();
  const todayPlans = plans.map((plan) => {
    const dayPlan = plan.days.find((d) => new Date(d.date).toDateString() === today);
    return { plan, todayMeals: dayPlan?.meals ?? [] };
  });
  res.json(todayPlans);
});

// GET /api/kitchen/orders?mealType=breakfast|lunch|dinner|snack
router.get("/orders", async (req, res) => {
  try {
    const mealType = (req.query.mealType as string) || "lunch";
    const ward = req.query.ward as string | undefined;

    const db = getDB();
    const today = todayStr();

    // Fetch production plan & today's statuses IN PARALLEL (one fewer round-trip)
    const [groups, statusRows] = await Promise.all([
      getKitchenProductionPlan(ward),
      db.query<{ group_code: string; status: string }>(
        "SELECT group_code, status FROM kitchen_order_status WHERE meal_type = ? AND date = ?",
        [mealType, today]
      ),
    ]);

    // Sort by patient count descending — highest priority first
    const sorted = [...groups].sort((a, b) => b.patientCount - a.patientCount);

    // Determine which day to use (1-based, rotating through week)
    const dayOfWeek = new Date().getDay() || 7; // Sunday=7

    const statusLookup: Record<string, string> = {};
    for (const row of statusRows) {
      statusLookup[row.group_code] = row.status;
    }

    // Map each group to an order with the meal + recipe
    const orders = sorted.map((group, idx) => {
      const meal = findSafeMeal(
        group.dietType,
        mealType,
        dayOfWeek,
        group.forbiddenFoods ?? [],
        group.groupCode
      );

      return {
        queuePosition: idx + 1,
        groupCode: group.groupCode,
        groupName: group.groupName,
        dietType: group.dietType,
        patientCount: group.patientCount,
        calorieRange: group.calorieRange,
        restrictions: group.restrictions,
        description: group.description,
        meal: {
          name: meal.name,
          type: meal.type,
          portionSize: meal.portionSize,
          ingredients: meal.ingredients,
          nutrition: meal.nutrition,
          preparationInstructions: meal.preparationInstructions,
        },
        status: (statusLookup[group.groupCode] ?? "pending") as "pending" | "preparing" | "done",
      };
    });

    res.json(orders);
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e, "Failed to build order queue") });
  }
});

// POST /api/kitchen/orders/status — persist a single order's status
router.post("/orders/status", async (req, res) => {
  try {
    const { groupCode, mealType, status } = req.body as {
      groupCode: string;
      mealType: string;
      status: "pending" | "preparing" | "done";
    };
    if (!groupCode || !mealType || !status) {
      return res.status(400).json({ error: "groupCode, mealType, and status are required" });
    }

    const db = getDB();
    const today = todayStr();
    const now = new Date().toISOString();

    // Single UPSERT (the table has UNIQUE(group_code, meal_type, date))
    await db.execute(
      `INSERT INTO kitchen_order_status (id, group_code, meal_type, date, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(group_code, meal_type, date) DO UPDATE SET
         status = excluded.status,
         updated_at = excluded.updated_at`,
      [uuidv4(), groupCode, mealType, today, status, now]
    );

    res.json({ success: true, groupCode, mealType, status });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e, "Failed to update order status") });
  }
});

// POST /api/kitchen/orders/complete — mark a group-meal done & deduct inventory
router.post("/orders/complete", async (req, res) => {
  try {
    const { groupCode, mealType } = req.body as { groupCode: string; mealType: string };
    if (!groupCode || !mealType) {
      return res.status(400).json({ error: "groupCode and mealType are required" });
    }

    const db = getDB();
    const today = todayStr();
    const now = new Date().toISOString();
    const dayOfWeek = new Date().getDay() || 7;

    // Step 1: find group in (possibly cached) production plan — return 404 early if unknown
    const groups = await getKitchenProductionPlan();
    const group = groups.find((g) => g.groupCode === groupCode);
    if (!group) {
      return res.status(404).json({ error: "Group not found in production plan" });
    }

    const meal = findSafeMeal(
      group.dietType,
      mealType,
      dayOfWeek,
      group.forbiddenFoods ?? [],
      group.groupCode
    );

    // Step 2: persist "done" status — UPSERT so this always wins regardless of current status
    await db.execute(
      `INSERT INTO kitchen_order_status (id, group_code, meal_type, date, status, updated_at)
       VALUES (?, ?, ?, ?, 'done', ?)
       ON CONFLICT(group_code, meal_type, date) DO UPDATE SET
         status = 'done',
         updated_at = excluded.updated_at`,
      [uuidv4(), groupCode, mealType, today, now]
    );

    // Step 3: deduct inventory — best-effort, individual failures don't abort the response
    const patientCount = group.patientCount;
    const settled = await Promise.allSettled(
      meal.ingredients.map(async (ing) => {
        const dbIngredient = await IngredientRepo.findByNameFuzzy(ing.name);
        if (!dbIngredient) return { ingredient: ing.name, deducted: 0, remaining: 0, matched: false };
        const deductionKg = (ing.quantity * patientCount) / 1000;
        const newStock = Math.max(0, Number((dbIngredient.stockQty - deductionKg).toFixed(3)));
        await IngredientRepo.update(dbIngredient.id, {
          stockQty: newStock,
          isAvailable: newStock > 0,
        });
        return { ingredient: ing.name, deducted: deductionKg, remaining: newStock, matched: true };
      })
    );

    const deductions = settled.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { ingredient: "?", deducted: 0, remaining: 0, matched: false, error: (r.reason as Error)?.message }
    );

    res.json({ success: true, groupCode, mealType, mealName: meal.name, patientCount, deductions });
  } catch (e: unknown) {
    res.status(500).json({ error: errMsg(e, "Failed to complete order") });
  }
});

export default router;
