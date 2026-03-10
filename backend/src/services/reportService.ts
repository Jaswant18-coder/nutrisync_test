/**
 * NutriSync — Analytics & Reporting Service
 */

import TrackingRepo from "../db/repositories/trackingRepo";
import PatientRepo from "../db/repositories/patientRepo";

export interface WeeklyReport {
  patientId: string;
  patientName: string;
  weekStart: string;
  weekEnd: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  calorieTarget: number;
  complianceRate: number;
  refusalRate: number;
  deficiencies: string[];
  alerts: string[];
  dailyData: DailyData[];
}

export interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  compliance: number;
  eaten: number;
  partial: number;
  refused: number;
}

export async function generateWeeklyReport(
  patientId: string,
  from: Date,
  to: Date
): Promise<WeeklyReport | null> {
  const patient = await PatientRepo.findById(patientId);
  if (!patient) return null;

  const trackingRecords = await TrackingRepo.find({
    patientId,
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
  });

  if (trackingRecords.length === 0) {
    return {
      patientId,
      patientName: patient.name,
      weekStart: from.toISOString().split("T")[0],
      weekEnd: to.toISOString().split("T")[0],
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      calorieTarget: patient.nutritionTargets.calories,
      complianceRate: 0,
      refusalRate: 0,
      deficiencies: ["No tracking data available"],
      alerts: ["No meal tracking records found for the selected period."],
      dailyData: [],
    };
  }

  const totalDays = trackingRecords.length;

  const avgCalories = Math.round(
    trackingRecords.reduce((s, r) => s + r.totalCaloriesConsumed, 0) / totalDays
  );
  const avgProtein = Math.round(
    trackingRecords.reduce((s, r) => s + r.totalProteinConsumed, 0) / totalDays
  );
  const avgCarbs = Math.round(
    trackingRecords.reduce((s, r) => s + r.totalCarbsConsumed, 0) / totalDays
  );
  const avgFat = Math.round(
    trackingRecords.reduce((s, r) => s + r.totalFatConsumed, 0) / totalDays
  );
  const complianceRate = Math.round(
    trackingRecords.reduce((s, r) => s + r.complianceScore, 0) / totalDays
  );

  // Refusal rate
  const allMeals = trackingRecords.flatMap((r) => r.consumption);
  const refusedMeals = allMeals.filter((m) => m.status === "refused").length;
  const refusalRate =
    allMeals.length > 0
      ? parseFloat(((refusedMeals / allMeals.length) * 100).toFixed(1))
      : 0;

  // Deficiency detection
  const deficiencies: string[] = [];
  if (avgProtein < patient.nutritionTargets.protein * 0.8) {
    deficiencies.push(
      `Protein deficit: avg ${avgProtein}g vs target ${patient.nutritionTargets.protein}g`
    );
  }
  if (avgCalories < patient.nutritionTargets.calories * 0.75) {
    deficiencies.push(
      `Calorie deficit: avg ${avgCalories} kcal vs target ${patient.nutritionTargets.calories} kcal`
    );
  }

  // Alerts
  const alerts: string[] = [];
  if (refusalRate > 30) alerts.push(`⚠️ High meal refusal rate: ${refusalRate}%`);
  if (complianceRate < 60) alerts.push(`⚠️ Low nutrition compliance: ${complianceRate}%`);
  if (deficiencies.length > 0) alerts.push(`⚠️ Nutrition deficiencies detected`);

  // Daily data with eaten/partial/refused counts
  const dailyData: DailyData[] = trackingRecords.map((r) => {
    const eaten = r.consumption.filter((m) => m.status === "eaten").length;
    const partial = r.consumption.filter((m) => m.status === "partial").length;
    const refused = r.consumption.filter((m) => m.status === "refused").length;
    return {
      date: r.date.split("T")[0],
      calories: r.totalCaloriesConsumed,
      protein: r.totalProteinConsumed,
      carbs: r.totalCarbsConsumed,
      fat: r.totalFatConsumed,
      compliance: r.complianceScore,
      eaten,
      partial,
      refused,
    };
  });

  return {
    patientId,
    patientName: patient.name,
    weekStart: from.toISOString().split("T")[0],
    weekEnd: to.toISOString().split("T")[0],
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    calorieTarget: patient.nutritionTargets.calories,
    complianceRate,
    refusalRate,
    deficiencies,
    alerts,
    dailyData,
  };
}

// ── Patient Summary Report ───────────────────────────────────────────────────
export interface PatientSummary {
  patientId: string;
  patientName: string;
  ward?: string;
  roomNumber?: string;
  dietType: string;
  daysTracked: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  calorieTarget: number;
  proteinTarget: number;
  complianceRate: number;
  refusalRate: number;
  status: "good" | "warning" | "critical";
  deficiencies: string[];
}

export async function generateSummaryReport(days = 14): Promise<PatientSummary[]> {
  const patients = await PatientRepo.find({ isActive: true });
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const from = new Date(today.getTime() - days * 86_400_000);

  // Fetch all patients' tracking records in parallel
  const allRecords = await Promise.all(
    patients.map((patient) =>
      TrackingRepo.find({
        patientId: patient.id,
        dateFrom: from.toISOString(),
        dateTo: today.toISOString(),
      })
    )
  );

  const results: PatientSummary[] = patients.map((patient, idx) => {
    const records = allRecords[idx];

    if (records.length === 0) {
      return {
        patientId: patient.id,
        patientName: patient.name,
        ward: patient.ward,
        roomNumber: patient.roomNumber,
        dietType: patient.currentDietType,
        daysTracked: 0,
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        calorieTarget: patient.nutritionTargets.calories,
        proteinTarget: patient.nutritionTargets.protein,
        complianceRate: 0,
        refusalRate: 100,
        status: "critical" as const,
        deficiencies: ["No tracking data"],
      };
    }

    const n = records.length;
    const avgCalories = Math.round(records.reduce((s, r) => s + r.totalCaloriesConsumed, 0) / n);
    const avgProtein  = parseFloat((records.reduce((s, r) => s + r.totalProteinConsumed, 0) / n).toFixed(1));
    const avgCarbs    = parseFloat((records.reduce((s, r) => s + r.totalCarbsConsumed,   0) / n).toFixed(1));
    const avgFat      = parseFloat((records.reduce((s, r) => s + r.totalFatConsumed,     0) / n).toFixed(1));
    const complianceRate = Math.round(records.reduce((s, r) => s + r.complianceScore, 0) / n);

    const allMeals = records.flatMap((r) => r.consumption);
    const refusedCount = allMeals.filter((m) => m.status === "refused").length;
    const refusalRate = allMeals.length > 0
      ? parseFloat(((refusedCount / allMeals.length) * 100).toFixed(1))
      : 0;

    const deficiencies: string[] = [];
    if (avgProtein < patient.nutritionTargets.protein * 0.8)
      deficiencies.push(`Protein (${avgProtein}g vs ${patient.nutritionTargets.protein}g target)`);
    if (avgCalories < patient.nutritionTargets.calories * 0.75)
      deficiencies.push(`Calories (${avgCalories} vs ${patient.nutritionTargets.calories} kcal target)`);

    const status: "good" | "warning" | "critical" =
      complianceRate >= 75 && refusalRate < 15
        ? "good"
        : complianceRate >= 50 || refusalRate < 30
          ? "warning"
          : "critical";

    return {
      patientId: patient.id,
      patientName: patient.name,
      ward: patient.ward,
      roomNumber: patient.roomNumber,
      dietType: patient.currentDietType,
      daysTracked: n,
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      calorieTarget: patient.nutritionTargets.calories,
      proteinTarget: patient.nutritionTargets.protein,
      complianceRate,
      refusalRate,
      status,
      deficiencies,
    };
  });

  return results.sort((a, b) => a.complianceRate - b.complianceRate);
}

export async function getWardSummary(ward?: string) {
  const patients = await PatientRepo.find({ isActive: true, ...(ward ? { ward } : {}) });
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const trackingToday = await TrackingRepo.find({
    dateFrom: today.toISOString(),
  });
  // Filter to only patients in this ward
  const patientIds = new Set(patients.map((p) => p.id));
  const relevant = trackingToday.filter((r) => patientIds.has(r.patientId));

  const totalPatients = patients.length;
  const trackingCount = relevant.length;
  const averageCompliance = trackingCount > 0
    ? Math.round(relevant.reduce((s, r) => s + r.complianceScore, 0) / trackingCount)
    : 0;
  const alertCount = relevant.filter((r) => r.hasAlert).length;

  return {
    totalPatients,
    trackedToday: trackingCount,
    avgCompliance: averageCompliance,
    highAlertCount: alertCount,
    activeAlerts: relevant
      .filter((r) => r.hasAlert)
      .map((r) => ({ patientId: r.patientId, message: r.alertMessage })),
  };
}
