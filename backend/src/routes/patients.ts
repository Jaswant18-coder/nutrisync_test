import { Router, Response } from "express";
import PatientRepo from "../db/repositories/patientRepo";
import MealPlanRepo from "../db/repositories/mealPlanRepo";
import UserRepo from "../db/repositories/userRepo";
import { runNutritionEngine } from "../services/nutritionEngine";
import { generateMealPlan } from "../services/mealPlanGenerator";
import { runDietGroupingEngine } from "../services/dietGroupingEngine";
import { authenticate, AuthRequest } from "../middleware/auth";
/**
 * Auto-generate meal plan and re-run grouping for a patient.
 * Called after patient create or update (when clinical data changes).
 */
async function autoGenerateMealPlan(patientId: string, userId: string): Promise<void> {
  try {
    const patient = await PatientRepo.findById(patientId);
    if (!patient) return;
    // Only inpatients get meal plans
    if (patient.patientType !== "inpatient") return;

    const { days, promptUsed, source } = await generateMealPlan({
      targets: patient.nutritionTargets,
      dietType: patient.currentDietType,
      texture: patient.texture,
      allergies: patient.allergies,
      restrictions: patient.dietaryRestrictions,
      preferences: patient.foodPreferences,
    });

    const weekStart = days[0]?.date ?? new Date();
    const weekEnd = days[days.length - 1]?.date ?? new Date();

    // Deactivate existing active plans
    await MealPlanRepo.updateMany(
      { patientId: patient.id, status: "active" },
      { status: "completed" }
    );

    await MealPlanRepo.create({
      patientId: patient.id,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      days,
      status: "active",
      generatedBy: source === "ai" ? "ai" : "manual",
      aiPromptUsed: promptUsed,
      createdBy: userId,
    });

    // Re-run diet grouping to include new patient
    await runDietGroupingEngine(patient.ward ?? undefined);

    console.log(`✅ Auto-generated meal plan for ${patient.name} (${source})`);
  } catch (err) {
    console.error(`⚠️ Auto meal plan generation failed for patient ${patientId}:`, err);
  }
}
const router = Router();
router.use(authenticate);

// GET /api/patients — list patients (admin & kitchen see all; doctors see own)
router.get("/", async (req: AuthRequest, res: Response) => {
  const role = req.user!.role;
  const filter = (role === "admin" || role === "kitchen_staff") ? {} : { doctorId: req.user!.id };
  const patients = await PatientRepo.find(filter);
  res.json(patients);
});

// GET /api/patients/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  const patient = await PatientRepo.findById(req.params.id);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  res.json(patient);
});

// POST /api/patients — create with nutrition engine
router.post("/", async (req: AuthRequest, res: Response) => {
  const {
    name, email, phone, age, gender, height, weight, activityLevel,
    diagnosis, allergies, dietaryRestrictions, foodPreferences,
    currentDietType, texture, roomNumber, ward, admissionDate, patientType,
  } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const existingUser = await UserRepo.findOne({ email });
  if (existingUser) {
    res.status(400).json({ error: "A user with this email already exists" });
    return;
  }

  // Run nutrition engine
  const engineResult = runNutritionEngine({
    weight, height, age, gender,
    activityLevel: activityLevel ?? "sedentary",
    diagnoses: diagnosis ?? [],
    dietaryRestrictions: dietaryRestrictions ?? [],
  });

  const patient = await PatientRepo.create({
    name, age, gender, height, weight,
    activityLevel: activityLevel ?? "sedentary",
    bmi: engineResult.bmi,
    bmiCategory: engineResult.bmiCategory,
    bmr: engineResult.bmr,
    diagnosis: diagnosis ?? [],
    allergies: allergies ?? [],
    dietaryRestrictions: dietaryRestrictions ?? [],
    foodPreferences: foodPreferences ?? [],
    currentDietType: currentDietType ?? "regular",
    texture: texture ?? "regular",
    nutritionTargets: {
      calories: engineResult.calories,
      protein: engineResult.protein,
      carbs: engineResult.carbs,
      fat: engineResult.fat,
      sodium: engineResult.sodium,
      potassium: engineResult.potassium,
      fiber: engineResult.fiber,
    },
    roomNumber, ward,
    admissionDate: admissionDate ? new Date(admissionDate).toISOString() : new Date().toISOString(),
    patientType: patientType === "outpatient" ? "outpatient" : "inpatient",
    isActive: true,
    doctorId: req.user!.id,
    phone: phone ?? null,
  });

  // Create patient login account (firstname@nutrisync.com / Patient@123)
  try {
    await UserRepo.create({
      name,
      email,
      password: "Patient@123",
      role: "patient",
      patientId: patient._id,
    });
  } catch (err) {
    console.error(`⚠️ Failed to create user account for ${email}:`, err);
  }

  // Auto-generate meal plan and diet grouping (fire-and-forget)
  autoGenerateMealPlan(patient._id, req.user!.id);

  res.status(201).json(patient);
});

// PUT /api/patients/:id — update clinical data & recalculate targets
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const patient = await PatientRepo.findById(req.params.id);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const updates = req.body;

  // Recalculate if weight/height/diagnosis changed
  const needsRecalc =
    updates.weight || updates.height || updates.age ||
    updates.activityLevel || updates.diagnosis || updates.dietaryRestrictions;

  if (needsRecalc) {
    const engineResult = runNutritionEngine({
      weight: updates.weight ?? patient.weight,
      height: updates.height ?? patient.height,
      age: updates.age ?? patient.age,
      gender: updates.gender ?? patient.gender,
      activityLevel: updates.activityLevel ?? patient.activityLevel,
      diagnoses: updates.diagnosis ?? patient.diagnosis,
      dietaryRestrictions: updates.dietaryRestrictions ?? patient.dietaryRestrictions,
    });
    Object.assign(updates, {
      bmi: engineResult.bmi,
      bmiCategory: engineResult.bmiCategory,
      bmr: engineResult.bmr,
      nutritionTargets: {
        calories: engineResult.calories,
        protein: engineResult.protein,
        carbs: engineResult.carbs,
        fat: engineResult.fat,
        sodium: engineResult.sodium,
        potassium: engineResult.potassium,
        fiber: engineResult.fiber,
      },
    });
  }

  const updated = await PatientRepo.update(req.params.id, updates);

  // Auto-regenerate meal plan if clinical data changed
  if (needsRecalc) {
    autoGenerateMealPlan(req.params.id, req.user!.id);
  }

  res.json(updated);
});

// DELETE /api/patients/:id — soft deactivate
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  await PatientRepo.update(req.params.id, { isActive: false });
  res.json({ message: "Patient deactivated" });
});

// PATCH /api/patients/:id/discharge — discharge inpatient → outpatient
router.patch("/:id/discharge", async (req: AuthRequest, res: Response) => {
  const patient = await PatientRepo.findById(req.params.id);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  if (patient.patientType === "outpatient") {
    res.status(400).json({ error: "Patient is already discharged" });
    return;
  }

  const now = new Date().toISOString();

  // Run meal plan completion and patient update in parallel
  const [, updated] = await Promise.all([
    MealPlanRepo.updateMany(
      { patientId: patient.id, status: "active" },
      { status: "completed" }
    ),
    PatientRepo.update(req.params.id, {
      patientType: "outpatient",
      dischargeDate: now,
      roomNumber: undefined,
    }),
  ]);

  // Fire-and-forget: re-run diet grouping in background (don't block response)
  runDietGroupingEngine(patient.ward ?? undefined).catch(() => {});

  // Send discharge webhook to WhatsApp AI agent
  const webhookUrl = process.env.DISCHARGE_WEBHOOK_URL;
  console.log(`[Webhook] URL=${webhookUrl ? "SET" : "MISSING"}, Phone=${patient.phone || "MISSING"}`);
  if (webhookUrl && patient.phone) {
    const activePlans = await MealPlanRepo.find({ patientId: patient.id });
    const lastPlan = activePlans[0];
    const webhookPayload = {
      event: "patient_discharged",
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        bmi: patient.bmi,
        bmiCategory: patient.bmiCategory,
        diagnoses: patient.diagnosis,
        allergies: patient.allergies,
        dietaryRestrictions: patient.dietaryRestrictions,
        foodPreferences: patient.foodPreferences,
        currentDietType: patient.currentDietType,
        texture: patient.texture,
      },
      nutritionTargets: patient.nutritionTargets,
      lastMealPlan: lastPlan?.days ?? [],
      dischargedAt: now,
    };
    console.log(`[Webhook] Firing POST to ${webhookUrl} for patient ${patient.name} (${patient.phone})`);
    try {
      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });
      console.log(`[Webhook] Response: ${resp.status} ${resp.statusText}`);
      if (!resp.ok) {
        const body = await resp.text();
        console.error(`[Webhook] Error body: ${body}`);
      }
    } catch (err: unknown) {
      console.error("[Webhook] Network error:", err);
    }
  } else {
    console.warn(`[Webhook] SKIPPED — webhookUrl=${!!webhookUrl}, phone=${!!patient.phone}`);
  }

  res.json(updated);
});

// GET /api/patients/:id/discharge-summary — full data package for WhatsApp AI agent
router.get("/:id/discharge-summary", async (req: AuthRequest, res: Response) => {
  const patient = await PatientRepo.findById(req.params.id);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const plans = await MealPlanRepo.find({ patientId: patient.id });
  const lastPlan = plans[0];

  res.json({
    patient: {
      id: patient.id,
      patientId: patient.patientId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      bmi: patient.bmi,
      bmiCategory: patient.bmiCategory,
      diagnoses: patient.diagnosis,
      allergies: patient.allergies,
      dietaryRestrictions: patient.dietaryRestrictions,
      foodPreferences: patient.foodPreferences,
      currentDietType: patient.currentDietType,
      texture: patient.texture,
    },
    nutritionTargets: patient.nutritionTargets,
    lastMealPlan: lastPlan ? { days: lastPlan.days, weekStart: lastPlan.weekStartDate, weekEnd: lastPlan.weekEndDate } : null,
    discharged: !!patient.dischargeDate,
    dischargeDate: patient.dischargeDate,
  });
});

// PATCH /api/patients/:id/diet-mode — instantly switch solid ↔ liquid diet & regenerate meal plan
router.patch("/:id/diet-mode", async (req: AuthRequest, res: Response) => {
  const patient = await PatientRepo.findById(req.params.id);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const { mode } = req.body;
  if (mode !== "solid" && mode !== "liquid") {
    res.status(400).json({ error: "mode must be 'solid' or 'liquid'" });
    return;
  }

  // If switching to liquid: force dietType = liquid, texture = liquid
  // If switching to solid: revert dietType from liquid → regular, texture → regular
  const dietType = mode === "liquid"
    ? "liquid"
    : (patient.currentDietType === "liquid" ? "regular" : patient.currentDietType);
  const texture = mode === "liquid" ? "liquid" : "regular";

  const updated = await PatientRepo.update(req.params.id, { currentDietType: dietType, texture });

  // Fire-and-forget: regenerate meal plan + regroup so kitchen sees changes on next refresh
  autoGenerateMealPlan(req.params.id, req.user!.id);

  res.json(updated);
});

// PATCH /api/patients/:id/readmit — re-admit an outpatient
router.patch("/:id/readmit", async (req: AuthRequest, res: Response) => {
  const patient = await PatientRepo.findById(req.params.id);
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }
  if (patient.patientType === "inpatient") {
    res.status(400).json({ error: "Patient is already an inpatient" });
    return;
  }

  const { roomNumber, ward, admissionDate } = req.body;

  const updated = await PatientRepo.update(req.params.id, {
    patientType: "inpatient",
    dischargeDate: undefined,
    roomNumber: roomNumber ?? patient.roomNumber,
    ward: ward ?? patient.ward,
    admissionDate: admissionDate ? new Date(admissionDate).toISOString() : new Date().toISOString(),
  });

  // Auto-generate fresh meal plan for re-admitted patient
  if (updated) autoGenerateMealPlan(updated._id, req.user!.id);

  res.json(updated);
});

export default router;
