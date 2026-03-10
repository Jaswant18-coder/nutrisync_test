/**
 * One-time script: Recalculate BMI, BMR, calories, and macros for every patient
 * using the NutritionEngine, then persist the updated values to D1.
 */
import "dotenv/config";
import PatientRepo from "../db/repositories/patientRepo";
import { runNutritionEngine } from "../services/nutritionEngine";

async function main() {
  const patients = await PatientRepo.find({});
  console.log(`Recalculating nutrition for ${patients.length} patients…\n`);

  let updated = 0;
  for (const p of patients) {
    const result = runNutritionEngine({
      weight: p.weight,
      height: p.height,
      age: p.age,
      gender: p.gender,
      activityLevel: p.activityLevel,
      diagnoses: p.diagnosis,
      dietaryRestrictions: p.dietaryRestrictions,
    });

    await PatientRepo.update(p._id, {
      bmi: result.bmi,
      bmiCategory: result.bmiCategory,
      bmr: result.bmr,
      nutritionTargets: {
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        sodium: result.sodium,
        potassium: result.potassium,
        fiber: result.fiber,
      },
    });

    console.log(
      `${p.name.padEnd(22)} | BMI ${String(result.bmi).padStart(5)} (${result.bmiCategory.padEnd(11)}) | BMR ${String(result.bmr).padStart(5)} | Cal ${String(result.calories).padStart(5)} | P ${String(result.protein).padStart(3)}g C ${String(result.carbs).padStart(3)}g F ${String(result.fat).padStart(3)}g | Na ${result.sodium}mg K ${result.potassium}mg`
    );
    updated++;
  }

  console.log(`\n✓ Updated ${updated} patients.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
