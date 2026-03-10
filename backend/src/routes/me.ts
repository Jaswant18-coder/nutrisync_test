/**
 * /api/me — Patient self-service endpoints
 *
 * These endpoints are for the logged-in patient to access their own data
 * without needing to know their patient ID (resolved from JWT → user.patientId).
 */

import { Router, Response } from "express";
import PatientRepo from "../db/repositories/patientRepo";
import MealPlanRepo from "../db/repositories/mealPlanRepo";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/me/profile — get the logged-in patient's own record
router.get("/profile", async (req: AuthRequest, res: Response) => {
  const patientId = req.user?.patientId;
  if (!patientId) {
    res.status(403).json({ error: "No patient record linked to this account" });
    return;
  }

  const patient = await PatientRepo.findById(patientId);
  if (!patient) {
    res.status(404).json({ error: "Patient record not found" });
    return;
  }

  res.json(patient);
});

// GET /api/me/meal-plan — get the logged-in patient's active meal plan
router.get("/meal-plan", async (req: AuthRequest, res: Response) => {
  const patientId = req.user?.patientId;
  if (!patientId) {
    res.status(403).json({ error: "No patient record linked to this account" });
    return;
  }

  const plans = await MealPlanRepo.find({ patientId });
  const active = plans.find((p) => p.status === "active");

  if (!active) {
    res.json(null);
    return;
  }

  res.json(active);
});

// GET /api/me/next-meal — get the patient's very next upcoming meal
router.get("/next-meal", async (req: AuthRequest, res: Response) => {
  const patientId = req.user?.patientId;
  if (!patientId) {
    res.status(403).json({ error: "No patient record linked to this account" });
    return;
  }

  const plans = await MealPlanRepo.find({ patientId });
  const active = plans.find((p) => p.status === "active");

  if (!active || !active.days?.length) {
    res.json({ nextMeal: null, dayPlan: null });
    return;
  }

  // Find today's day plan
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  let dayPlan = active.days.find((d) => {
    if (!d.date) return false;
    const dStr = new Date(d.date).toISOString().split("T")[0];
    return dStr === todayStr;
  });

  // Fallback to first day if no matching date
  if (!dayPlan) {
    dayPlan = active.days[0];
  }

  // Determine which meal is next based on current time
  const hour = now.getHours();
  const MEAL_TIMES: Record<string, [number, number]> = {
    breakfast: [6, 10],
    snack: [10, 12],   // morning snack
    lunch: [12, 15],
    dinner: [18, 21],
  };

  let nextMeal = null;
  const mealsInOrder = ["breakfast", "lunch", "snack", "dinner"];

  for (const mealType of mealsInOrder) {
    const [, end] = MEAL_TIMES[mealType] ?? [0, 24];
    if (hour < end) {
      nextMeal = dayPlan.meals.find((m) => m.type === mealType);
      if (nextMeal) break;
    }
  }

  // If past all meals, show the first meal of the next day
  if (!nextMeal) {
    const nextDayPlan = active.days.find((d) => d.day === dayPlan!.day + 1) ?? active.days[0];
    nextMeal = nextDayPlan?.meals[0] ?? dayPlan.meals[0];
  }

  res.json({
    nextMeal,
    dayPlan: {
      day: dayPlan.day,
      date: dayPlan.date,
      meals: dayPlan.meals,
      totalNutrition: dayPlan.totalNutrition,
    },
    mealPlanId: active._id,
  });
});

export default router;
