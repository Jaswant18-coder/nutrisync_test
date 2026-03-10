/**
 * NutriSync — Add 100 Indian patients with varied conditions
 *
 * Run:  Push-Location d:\NutriSync\backend; npx ts-node --transpile-only src/scripts/addIndianPatients.ts; Pop-Location
 */

import dotenv from "dotenv";
dotenv.config();

import PatientRepo from "../db/repositories/patientRepo";
import UserRepo from "../db/repositories/userRepo";
import { runNutritionEngine } from "../services/nutritionEngine";
import { runDietGroupingEngine } from "../services/dietGroupingEngine";
import {
  diagnosesToDietType,
  dietPrefToFoodPreferences,
  buildDietaryRestrictions,
} from "../data/restrictions";
import type { DietType } from "../db/repositories/patientRepo";

// ── Indian names pool ────────────────────────────────────────────────────────

const MALE_FIRST = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
  "Krishna", "Ishaan", "Shaurya", "Atharv", "Dhruv", "Kabir", "Ritvik",
  "Anirudh", "Arnav", "Rudra", "Lakshya", "Yash", "Anand", "Harish",
  "Karthik", "Manoj", "Naveen", "Prakash", "Rahul", "Sanjay", "Suresh",
  "Vikram", "Ganesh", "Mohan", "Nikhil", "Rajesh", "Tarun", "Deepak",
  "Gopal", "Hemant", "Jatin", "Kunal", "Manish", "Om", "Pavan", "Rohit",
  "Sachin", "Tushar", "Uday", "Varun", "Yogesh", "Amit",
];

const FEMALE_FIRST = [
  "Aadhya", "Ananya", "Diya", "Myra", "Isha", "Saanvi", "Aanya", "Pari",
  "Anika", "Kiara", "Riya", "Priya", "Sneha", "Kavya", "Lakshmi",
  "Meera", "Nisha", "Pooja", "Radha", "Sita", "Tanvi", "Uma",
  "Vidya", "Anjali", "Bhavna", "Chitra", "Divya", "Geeta", "Hema",
  "Indira", "Jaya", "Kamala", "Leela", "Mallika", "Neha", "Padma",
  "Rekha", "Savita", "Tara", "Usha", "Varsha", "Yamuna", "Zara",
  "Deepa", "Gauri", "Ila", "Kriti", "Mansi", "Nandini", "Pallavi",
];

const LAST_NAMES = [
  "Kumar", "Sharma", "Patel", "Singh", "Nair", "Rao", "Reddy", "Gupta",
  "Pillai", "Menon", "Iyer", "Iyengar", "Desai", "Joshi", "Kulkarni",
  "Mishra", "Pandey", "Verma", "Chopra", "Malhotra", "Kapoor", "Mehta",
  "Shah", "Bhat", "Shetty", "Hegde", "Kaur", "Das", "Mukherjee", "Banerjee",
  "Chatterjee", "Sen", "Bose", "Roy", "Dutta", "Ghosh", "Saxena", "Agarwal",
  "Thakur", "Yadav", "Chauhan", "Rathore", "Patil", "Naik", "Pawar",
  "Nayak", "Swamy", "Gowda", "Srinivasan", "Subramaniam",
];

// ── Condition pools ──────────────────────────────────────────────────────────

const DIAGNOSES_COMBOS: string[][] = [
  ["Diabetes"],
  ["Hypertension"],
  ["CKD (Kidney Disease)"],
  ["Celiac Disease"],
  ["GERD"],
  ["Diabetes", "Hypertension"],
  ["CKD (Kidney Disease)", "Hypertension"],
  ["Diabetes", "GERD"],
  ["Celiac Disease", "GERD"],
  ["CKD (Kidney Disease)", "Diabetes"],
  ["Celiac Disease", "Diabetes"],
  ["GERD", "Hypertension"],
  ["CKD (Kidney Disease)", "GERD"],
  ["Celiac Disease", "Hypertension"],
  [],                         // no diagnosis – general diet
  [],                         // no diagnosis – general diet
  ["Diabetes"],               // extra weight for common conditions
  ["Hypertension"],
  ["CKD (Kidney Disease)"],
  ["GERD"],
];

const ALLERGY_POOL = ["Peanut", "Dairy", "Shellfish", "Egg", "Soy"];

const DIET_PREFS = ["Vegetarian", "Vegetarian", "Vegetarian", "Vegan", "Non-Vegetarian"];
// heavier weight on Vegetarian for Indian patients

const RELIGIONS: (string | null)[] = [
  null, null, null, "Jain", "Halal", "Kosher",
  null, null, "Jain", "Halal",
];

const WARDS = ["Ward A", "Ward B", "Ward C", "Ward D"];

const DISLIKES_POOL = [
  "Bitter Gourd", "Brinjal", "Okra", "Capsicum", "Mushroom",
  "Raw Onion", "Cottage Cheese", "Fish", "Mutton", "Liver",
  "Beetroot", "Turnip", "Radish", "Jackfruit", "Papaya",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function randFloat(lo: number, hi: number): number {
  return Math.round((lo + Math.random() * (hi - lo)) * 10) / 10;
}

// ── Build 100 patient records ────────────────────────────────────────────────

interface IndianPatient {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  diagnoses: string[];
  allergies: string[];
  dietaryPreference: string;
  religion: string | null;
  dislikes: string[];
}

function generatePatients(count: number): IndianPatient[] {
  const patients: IndianPatient[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const isMale = Math.random() < 0.5;
    const gender: "male" | "female" = isMale ? "male" : "female";
    const firstPool = isMale ? MALE_FIRST : FEMALE_FIRST;

    let name: string;
    do {
      name = `${pick(firstPool)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const age = randInt(22, 80);
    const height = isMale ? randInt(155, 185) : randInt(148, 172);
    const weight = randFloat(45, 110);

    const diagnoses = pick(DIAGNOSES_COMBOS);
    const allergies = Math.random() < 0.4 ? pickN(ALLERGY_POOL, 1, 2) : [];
    const dietaryPreference = pick(DIET_PREFS);
    const religion = pick(RELIGIONS);
    const dislikes = Math.random() < 0.3 ? pickN(DISLIKES_POOL, 1, 3) : [];

    patients.push({
      name, age, gender, height, weight,
      diagnoses, allergies, dietaryPreference, religion, dislikes,
    });
  }

  return patients;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const records = generatePatients(100);
  console.log(`🏥 Adding ${records.length} Indian patients to existing DB…`);

  // Find an existing doctor to assign patients to
  const existingPatients = await PatientRepo.find({});
  const doctorId = existingPatients[0]?.doctorId;
  if (!doctorId) {
    console.error("❌ No existing patients/doctor found. Run bulkSeed first.");
    process.exit(1);
  }
  console.log(`   Using doctorId: ${doctorId}`);

  let count = 0;
  for (const rp of records) {
    const dietaryRestrictions = buildDietaryRestrictions(rp.diagnoses, rp.allergies, rp.religion);
    const engineResult = runNutritionEngine({
      weight: rp.weight,
      height: rp.height,
      age: rp.age,
      gender: rp.gender,
      activityLevel: "sedentary",
      diagnoses: rp.diagnoses,
      dietaryRestrictions,
    });

    const dietType = diagnosesToDietType(rp.diagnoses) as DietType;
    const foodPreferences = dietPrefToFoodPreferences(rp.dietaryPreference);
    const ward = WARDS[count % WARDS.length];

    await PatientRepo.create({
      name: rp.name,
      age: rp.age,
      gender: rp.gender,
      height: rp.height,
      weight: rp.weight,
      bmi: engineResult.bmi,
      bmiCategory: engineResult.bmiCategory,
      bmr: engineResult.bmr,
      activityLevel: "sedentary",
      diagnosis: rp.diagnoses,
      allergies: rp.allergies,
      dietaryRestrictions,
      foodPreferences,
      currentDietType: dietType,
      texture: "regular",
      nutritionTargets: {
        calories: engineResult.calories,
        protein: engineResult.protein,
        carbs: engineResult.carbs,
        fat: engineResult.fat,
        sodium: engineResult.sodium,
        potassium: engineResult.potassium,
        fiber: engineResult.fiber,
      },
      roomNumber: `${ward.slice(-1)}${(200 + count).toString()}`,
      ward,
      admissionDate: new Date().toISOString(),
      isActive: true,
      doctorId,
    });

    count++;
    if (count % 10 === 0) {
      console.log(`   …${count} patients added`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  console.log(`✅ ${count} Indian patients added (total in DB: ${existingPatients.length + count})`);

  // Create a few patient user accounts for new patients
  const allPatients = await PatientRepo.find({ isActive: true });
  const newPatients = allPatients.slice(0, 5); // first 5 new ones by creation order (desc)
  console.log(`\n👤 Creating 5 patient login accounts…`);
  for (const p of newPatients) {
    const email = p.name.toLowerCase().replace(/\s+/g, ".") + "@nutrisync.com";
    try {
      await UserRepo.create({
        name: p.name,
        email,
        password: "Patient@123",
        role: "patient",
        patientId: p.id,
      });
      console.log(`   ✓ ${email}`);
    } catch {
      // already exists — skip
    }
  }

  // Re-run diet grouping engine
  console.log("\n🔄 Re-running diet grouping engine…");
  const groups = await runDietGroupingEngine();
  console.log(`✅ ${groups.length} diet groups (updated)\n`);

  // Summary
  const sorted = [...groups].sort((a, b) => b.members.length - a.members.length);
  console.log("📊 Top 15 Diet Groups:");
  console.log("─".repeat(80));
  for (const g of sorted.slice(0, 15)) {
    console.log(
      `  ${g.name.padEnd(50)} ${String(g.members.length).padStart(4)} patients  ${g.groupCode}`
    );
  }
  console.log("─".repeat(80));
  console.log(`  Total groups: ${groups.length}   Total patients: ${groups.reduce((s, g) => s + g.members.length, 0)}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
