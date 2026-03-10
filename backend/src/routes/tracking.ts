import { Router, Response } from "express";
import TrackingRepo from "../db/repositories/trackingRepo";
import MealPlanRepo from "../db/repositories/mealPlanRepo";
import PatientRepo from "../db/repositories/patientRepo";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

// GET /api/tracking?patientId=xxx&date=YYYY-MM-DD
router.get("/", async (req: AuthRequest, res: Response) => {
  const filter: { patientId?: string; dateFrom?: string; dateTo?: string } = {};
  if (req.query.patientId) filter.patientId = req.query.patientId as string;
  if (req.query.date) {
    const d = new Date(req.query.date as string);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    filter.dateFrom = d.toISOString();
    filter.dateTo = next.toISOString();
  }
  const records = await TrackingRepo.find(filter);
  res.json(records);
});

// GET /api/tracking/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const record = await TrackingRepo.findById(req.params.id);
  if (!record) { res.status(404).json({ error: "Tracking record not found" }); return; }
  res.json(record);
});

// POST /api/tracking — record meal consumption
router.post("/", async (req: AuthRequest, res: Response) => {
  const { patientId, mealPlanId, date, mealType, status, portionConsumed, refusalReason } = req.body;

  const patient = await PatientRepo.findById(patientId);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const mealPlan = await MealPlanRepo.findById(mealPlanId);
  const dayPlan = mealPlan?.days.find((d) => new Date(d.date).toDateString() === new Date(date).toDateString());
  const mealItem = dayPlan?.meals.find((m) => m.type === mealType);

  const portion = portionConsumed ?? (status === "eaten" ? 100 : status === "partial" ? 50 : 0);
  const ratio = portion / 100;
  const caloriesConsumed = Math.round((mealItem?.nutrition?.calories ?? 0) * ratio);
  const proteinConsumed  = Math.round((mealItem?.nutrition?.protein  ?? 0) * ratio);
  const carbsConsumed    = Math.round((mealItem?.nutrition?.carbs    ?? 0) * ratio);
  const fatConsumed      = Math.round((mealItem?.nutrition?.fat      ?? 0) * ratio);

  const trackingDate = new Date(date);
  trackingDate.setHours(0, 0, 0, 0);
  const dateStr = trackingDate.toISOString();

  let record = await TrackingRepo.findOne(patientId, dateStr);

  const newEntry = {
    mealType: mealType as "breakfast" | "lunch" | "dinner" | "snack",
    mealName: mealItem?.name ?? mealType,
    status: status as "pending" | "eaten" | "partial" | "refused",
    portionConsumed: portion,
    caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed,
    refusalReason,
    recordedAt: new Date().toISOString(),
  };

  let consumption = record ? record.consumption.filter((c) => c.mealType !== mealType) : [];
  consumption = [...consumption, newEntry];

  const totalCaloriesConsumed = consumption.reduce((s, c) => s + c.caloriesConsumed, 0);
  const totalProteinConsumed  = consumption.reduce((s, c) => s + c.proteinConsumed,  0);
  const totalCarbsConsumed    = consumption.reduce((s, c) => s + c.carbsConsumed,    0);
  const totalFatConsumed      = consumption.reduce((s, c) => s + c.fatConsumed,      0);

  const target = patient.nutritionTargets.calories;
  const complianceScore = Math.min(Math.round((totalCaloriesConsumed / target) * 100), 100);
  const hasRefusal = consumption.some((c) => c.status === "refused");
  const severeDeficit = totalCaloriesConsumed < target * 0.5;
  const hasAlert = hasRefusal || severeDeficit;
  const alertMessage = hasRefusal
    ? "Patient refused a meal"
    : severeDeficit ? `Calorie intake critically low: ${totalCaloriesConsumed} / ${target} kcal`
    : undefined;

  if (record) {
    record = await TrackingRepo.update(record.id, {
      consumption, totalCaloriesConsumed, totalProteinConsumed,
      totalCarbsConsumed, totalFatConsumed, complianceScore, hasAlert, alertMessage,
    });
  } else {
    record = await TrackingRepo.create({
      patientId, mealPlanId, date: dateStr, consumption,
      totalCaloriesConsumed, totalProteinConsumed, totalCarbsConsumed, totalFatConsumed,
      complianceScore, hasAlert, alertMessage,
    });
  }

  res.status(201).json(record);
});

export default router;
