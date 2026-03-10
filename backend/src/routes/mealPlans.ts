import { Router, Response } from "express";
import MealPlanRepo from "../db/repositories/mealPlanRepo";
import PatientRepo from "../db/repositories/patientRepo";
import { generateMealPlan } from "../services/mealPlanGenerator";
import { authenticate, AuthRequest } from "../middleware/auth";
import { getDB } from "../config/d1";

const router = Router();
router.use(authenticate);

// GET /api/meal-plans?patientId=xxx
router.get("/", async (req: AuthRequest, res: Response) => {
  const patientId = req.query.patientId as string | undefined;
  const plans = await MealPlanRepo.find(patientId ? { patientId } : {});
  res.json(plans);
});

// GET /api/meal-plans/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const plan = await MealPlanRepo.findById(req.params.id);
  if (!plan) { res.status(404).json({ error: "Meal plan not found" }); return; }
  res.json(plan);
});

// POST /api/meal-plans/generate
router.post("/generate", async (req: AuthRequest, res: Response) => {
  const { patientId, language } = req.body;

  const patient = await PatientRepo.findById(patientId);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const { days, promptUsed, source } = await generateMealPlan({
    targets: patient.nutritionTargets,
    dietType: patient.currentDietType,
    allergies: patient.allergies,
    restrictions: patient.dietaryRestrictions,
    preferences: patient.foodPreferences,
    language,
  });

  const weekStart = days[0]?.date ?? new Date();
  const weekEnd = days[days.length - 1]?.date ?? new Date();

  // Deactivate existing active plan
  await MealPlanRepo.updateMany(
    { patientId: patient.id, status: "active" },
    { status: "completed" }
  );

  const plan = await MealPlanRepo.create({
    patientId: patient.id,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    days,
    status: "active",
    generatedBy: source === "ai" ? "ai" : "manual",
    aiPromptUsed: promptUsed,
    createdBy: req.user!.id,
  });

  res.status(201).json({ plan, source });
});

// GET /api/meal-plans/:id/today
router.get("/:id/today", async (req: AuthRequest, res: Response) => {
  const plan = await MealPlanRepo.findById(req.params.id);
  if (!plan) { res.status(404).json({ error: "Not found" }); return; }
  const today = new Date().toDateString();
  const dayPlan = plan.days.find((d) => new Date(d.date).toDateString() === today);
  res.json(dayPlan ?? null);
});

// PUT /api/meal-plans/:id — edit an entire meal plan (days array)
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const plan = await MealPlanRepo.findById(req.params.id);
  if (!plan) { res.status(404).json({ error: "Meal plan not found" }); return; }

  const { days, status } = req.body;
  const db = getDB();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const params: unknown[] = [];

  if (days) {
    updates.push("days = ?");
    params.push(JSON.stringify(days));
  }
  if (status) {
    updates.push("status = ?");
    params.push(status);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "No updates provided" });
    return;
  }

  updates.push("updated_at = ?");
  params.push(now);
  params.push(req.params.id);

  await db.execute(
    `UPDATE meal_plans SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  const updated = await MealPlanRepo.findById(req.params.id);
  res.json(updated);
});

// PATCH /api/meal-plans/:id/status — update just the status
router.patch("/:id/status", async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const updated = await MealPlanRepo.updateStatus(req.params.id, status);
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

export default router;
