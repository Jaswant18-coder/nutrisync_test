/**
 * NutriSync â€” Database Seed Script v2
 * Generates 50 patients with 10-14 days of meal tracking data each.
 * Run: npm run seed
 */

import dotenv from "dotenv";
dotenv.config();

import { getDB } from "../config/d1";
import UserRepo from "../db/repositories/userRepo";
import PatientRepo from "../db/repositories/patientRepo";
import IngredientRepo from "../db/repositories/ingredientRepo";
import TrackingRepo from "../db/repositories/trackingRepo";
import type { IMealConsumption, MealStatus } from "../db/repositories/trackingRepo";
import type { DietType, ActivityLevel } from "../db/repositories/patientRepo";
import { runNutritionEngine } from "../services/nutritionEngine";

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function r1(n: number) { return Math.round(n * 10) / 10; }
function clamp0(v: number) { return Math.max(0, v); }

// â”€â”€ meal templates: [type, name, kcal, protein, carbs, fat] â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type MT = ["breakfast"|"lunch"|"dinner"|"snack", string, number, number, number, number];
const MEAL_TEMPLATES: Record<string, MT[]> = {
  diabetic: [
    ["breakfast", "Oats Vegetable Upma",                    350, 14, 50,  9],
    ["lunch",     "Brown Rice + Dal + Sabzi + Chapati",     520, 22, 76, 11],
    ["dinner",    "Jowar Roti + Methi Sabzi + Moong Dal",   440, 19, 62, 10],
    ["snack",     "Roasted Chana + Buttermilk",             150,  8, 20,  3],
  ],
  renal: [
    ["breakfast", "Plain Rice Porridge (Low Potassium)",    320,  5, 65,  3],
    ["lunch",     "White Rice + Boiled Cauliflower + Ghee", 450,  9, 88,  7],
    ["dinner",    "Phulka + Light Arhar Dal",               380, 13, 62,  6],
    ["snack",     "Arrowroot Biscuit + Apple Juice",        110,  1, 26,  1],
  ],
  cardiac: [
    ["breakfast", "Oat Porridge + Mixed Berries",           380, 13, 58, 10],
    ["lunch",     "Grilled Fish + Brown Rice + Salad",      560, 35, 58, 12],
    ["dinner",    "Millet Roti + Palak Dal + Low-fat Curd", 450, 22, 62, 11],
    ["snack",     "Walnuts + Almonds",                      180,  6,  8, 16],
  ],
  liquid: [
    ["breakfast", "Rice Kanji with Coconut Milk",           260,  5, 48,  5],
    ["lunch",     "Blended Moong Dal Soup (Strained)",      230, 10, 35,  5],
    ["dinner",    "Blended Vegetable Broth with Cream",     200,  6, 28,  6],
    ["snack",     "Fresh Fruit Juice + Glucose Water",      110,  1, 27,  0],
  ],
  soft: [
    ["breakfast", "Soft Idli + Thin Sambar",                350, 11, 65,  4],
    ["lunch",     "Soft-Cooked Rice + Moong Dal + Mashed Sabzi", 480, 17, 82, 7],
    ["dinner",    "Soft Khichdi + Low-fat Curd",            430, 16, 70,  8],
    ["snack",     "Banana Puree + Warm Milk",               180,  5, 32,  4],
  ],
  high_protein: [
    ["breakfast", "Egg White Omelette + Multigrain Toast",  420, 32, 38, 10],
    ["lunch",     "Grilled Chicken + Quinoa + Salad",       650, 50, 55, 14],
    ["dinner",    "Paneer Bhurji + Brown Rice + Dal",       560, 35, 62, 16],
    ["snack",     "Whey Protein Smoothie + Banana",         310, 35, 32,  5],
  ],
  vegetarian: [
    ["breakfast", "Idli + Sambar + Coconut Chutney",        360, 13, 65,  6],
    ["lunch",     "Rajma Chawal + Raita + Salad",           540, 22, 85, 10],
    ["dinner",    "Chapati + Paneer Matar + Dal",           490, 25, 62, 14],
    ["snack",     "Moong Sprouts Chaat",                    140,  9, 22,  3],
  ],
  regular: [
    ["breakfast", "Poha + Chai",                            380, 10, 62,  7],
    ["lunch",     "Rice + Chicken Curry + Dal + Sabzi",     580, 32, 72, 14],
    ["dinner",    "Roti + Dal Makhani + Mixed Sabzi",       510, 22, 68, 12],
    ["snack",     "Mixed Fruit Bowl + Curd",                170,  6, 28,  3],
  ],
};
function getMealsForDiet(d: string): MT[] {
  return MEAL_TEMPLATES[d] ?? MEAL_TEMPLATES.regular;
}

// â”€â”€ tracking record builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildDayTracking(
  patientId: string, date: Date,
  calorieTarget: number, dietType: string,
  compliance: number,  // 0.5-0.95   (patient-level profile)
  daySeed: number,     // 0-1 deterministic variation
) {
  const templates = getMealsForDiet(dietType);
  const consumption: IMealConsumption[] = [];
  let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;

  templates.forEach(([mealType, mealName, baseCal, baseProt, baseCarbs, baseFat], idx) => {
    const roll = ((daySeed + idx * 0.23) % 1);
    let status: MealStatus;
    let portion: number;

    if (roll < compliance * 0.85) {
      status = "eaten";   portion = 90 + Math.floor((daySeed * 10 + idx * 3) % 10);
    } else if (roll < compliance * 0.85 + 0.14) {
      status = "partial"; portion = 40 + Math.floor((daySeed * 30 + idx * 7) % 30);
    } else {
      status = "refused"; portion = 0;
    }

    const f = portion / 100;
    const cal  = clamp0(Math.round(baseCal  * f));
    const prot = clamp0(r1(baseProt  * f));
    const carb = clamp0(r1(baseCarbs * f));
    const fat  = clamp0(r1(baseFat   * f));

    consumption.push({
      mealType, mealName, status, portionConsumed: portion,
      caloriesConsumed: cal, proteinConsumed: prot,
      carbsConsumed: carb, fatConsumed: fat,
      recordedAt: new Date(date.getTime() + (8 + idx * 4) * 3_600_000).toISOString(),
    });

    totalCal += cal; totalProt += prot; totalCarbs += carb; totalFat += fat;
  });

  const complianceScore = Math.min(100, Math.round((totalCal / calorieTarget) * 100));
  const hasAlert = complianceScore < 55;

  return {
    patientId,
    mealPlanId: "",
    date: date.toISOString(),
    consumption,
    totalCaloriesConsumed: totalCal,
    totalProteinConsumed:  r1(totalProt),
    totalCarbsConsumed:    r1(totalCarbs),
    totalFatConsumed:      r1(totalFat),
    complianceScore,
    hasAlert,
    alertMessage: hasAlert ? `Low compliance: ${complianceScore}%` : undefined,
  };
}

// â”€â”€ 50-patient data table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface PTemplate {
  name: string; age: number; gender: "male"|"female";
  height: number; weight: number; activity: ActivityLevel;
  ward: string; room: string;
  compliance: number; days: number;
  dietType: DietType; texture: "regular"|"soft"|"liquid";
  diagnoses: string[]; restrictions: string[];
  allergies: string[]; prefs: string[];
}

const PATIENTS: PTemplate[] = [
  // â”€â”€ Diabetic (12) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Arjun Kumar",      age:52, gender:"male",   height:170, weight:85, activity:"sedentary", ward:"Ward A", room:"A101", compliance:0.82, days:13, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Hypertension"],              restrictions:["low_sugar","low_sodium"],                     allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Ravi Sharma",      age:67, gender:"male",   height:168, weight:78, activity:"sedentary", ward:"Ward A", room:"A102", compliance:0.72, days:14, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Neuropathy"],                 restrictions:["low_sugar"],                                  allergies:[],          prefs:["vegetarian","north Indian"] },
  { name:"Suresh Reddy",     age:58, gender:"male",   height:172, weight:90, activity:"sedentary", ward:"Ward A", room:"A103", compliance:0.88, days:12, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Obesity"],                   restrictions:["low_sugar","low_fat"],                        allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Mohan Patel",      age:71, gender:"male",   height:166, weight:72, activity:"sedentary", ward:"Ward A", room:"A104", compliance:0.65, days:11, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Hypertension"],              restrictions:["low_sugar","low_sodium"],                     allergies:["nuts"],    prefs:["vegetarian"] },
  { name:"Prakash Singh",    age:48, gender:"male",   height:175, weight:88, activity:"light",     ward:"Ward A", room:"A105", compliance:0.90, days:14, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes"],                             restrictions:["low_sugar"],                                  allergies:[],          prefs:["non-vegetarian","north Indian"] },
  { name:"Rajesh Iyer",      age:63, gender:"male",   height:169, weight:76, activity:"sedentary", ward:"Ward A", room:"A106", compliance:0.78, days:10, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Hypertension"],              restrictions:["low_sugar","low_sodium"],                     allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Priya Nair",       age:55, gender:"female", height:160, weight:68, activity:"sedentary", ward:"Ward A", room:"A107", compliance:0.85, days:12, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","PCOS"],                      restrictions:["low_sugar"],                                  allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Meena Pillai",     age:62, gender:"female", height:158, weight:72, activity:"sedentary", ward:"Ward A", room:"A108", compliance:0.70, days:13, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Hypertension"],              restrictions:["low_sugar","low_sodium"],                     allergies:["shellfish"],prefs:["vegetarian"] },
  { name:"Anita Sharma",     age:45, gender:"female", height:162, weight:65, activity:"light",     ward:"Ward A", room:"A109", compliance:0.92, days:14, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes"],                             restrictions:["low_sugar"],                                  allergies:[],          prefs:["vegetarian","north Indian"] },
  { name:"Kavita Reddy",     age:69, gender:"female", height:157, weight:70, activity:"sedentary", ward:"Ward A", room:"A110", compliance:0.60, days:11, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Neuropathy"],                 restrictions:["low_sugar"],                                  allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Rekha Patel",      age:50, gender:"female", height:160, weight:75, activity:"light",     ward:"Ward A", room:"A111", compliance:0.80, days:12, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Hypertension"],              restrictions:["low_sugar","low_sodium"],                     allergies:[],          prefs:["vegetarian"] },
  { name:"Sunita Singh",     age:58, gender:"female", height:159, weight:69, activity:"sedentary", ward:"Ward A", room:"A112", compliance:0.75, days:10, dietType:"diabetic",     texture:"regular", diagnoses:["Type 2 Diabetes","Obesity"],                   restrictions:["low_sugar","low_fat"],                        allergies:[],          prefs:["vegetarian","north Indian"] },

  // â”€â”€ Renal (8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Vikram Rao",       age:48, gender:"male",   height:172, weight:62, activity:"sedentary", ward:"Ward A", room:"A113", compliance:0.78, days:12, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease Stage 3"],              restrictions:["low_potassium","low_protein","low_sodium"],   allergies:[],          prefs:["vegetarian"] },
  { name:"Anil Mehta",       age:63, gender:"male",   height:169, weight:58, activity:"sedentary", ward:"Ward A", room:"A114", compliance:0.65, days:14, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease Stage 4"],              restrictions:["low_potassium","low_protein","low_sodium"],   allergies:[],          prefs:["vegetarian"] },
  { name:"Sanjay Nair",      age:52, gender:"male",   height:170, weight:64, activity:"sedentary", ward:"Ward A", room:"A115", compliance:0.80, days:11, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease","Hypertension"],       restrictions:["low_potassium","low_sodium"],                 allergies:[],          prefs:["non-vegetarian"] },
  { name:"Deepak Joshi",     age:71, gender:"male",   height:167, weight:60, activity:"sedentary", ward:"Ward A", room:"A116", compliance:0.55, days:13, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease Stage 4","Diabetes"],   restrictions:["low_potassium","low_protein","low_sugar","low_sodium"], allergies:[], prefs:["vegetarian"] },
  { name:"Shobha Iyer",      age:42, gender:"female", height:158, weight:52, activity:"sedentary", ward:"Ward A", room:"A117", compliance:0.82, days:12, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease Stage 3"],              restrictions:["low_potassium","low_protein","low_sodium"],   allergies:["shellfish"],prefs:["vegetarian"] },
  { name:"Geetha Rao",       age:56, gender:"female", height:155, weight:55, activity:"sedentary", ward:"Ward A", room:"A118", compliance:0.70, days:10, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease"],                      restrictions:["low_potassium","low_sodium"],                 allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Poonam Mehta",     age:65, gender:"female", height:157, weight:58, activity:"sedentary", ward:"Ward A", room:"A119", compliance:0.60, days:14, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease Stage 4","Anemia"],     restrictions:["low_potassium","low_protein","low_sodium"],   allergies:[],          prefs:["vegetarian"] },
  { name:"Radha Joshi",      age:49, gender:"female", height:160, weight:53, activity:"sedentary", ward:"Ward A", room:"A120", compliance:0.75, days:11, dietType:"renal",        texture:"soft",    diagnoses:["Chronic Kidney Disease"],                      restrictions:["low_potassium","low_protein","low_sodium"],   allergies:[],          prefs:["vegetarian","south Indian"] },

  // â”€â”€ Cardiac (8) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Ramesh Gupta",     age:58, gender:"male",   height:171, weight:82, activity:"sedentary", ward:"Ward A", room:"A121", compliance:0.83, days:12, dietType:"cardiac",      texture:"regular", diagnoses:["Congestive Heart Failure","Hypertension"],     restrictions:["low_sodium"],                                 allergies:[],          prefs:["non-vegetarian","north Indian"] },
  { name:"Vinod Pandey",     age:72, gender:"male",   height:167, weight:75, activity:"sedentary", ward:"Ward A", room:"A122", compliance:0.68, days:13, dietType:"cardiac",      texture:"regular", diagnoses:["Coronary Artery Disease","Hypertension"],      restrictions:["low_sodium","low_fat"],                       allergies:[],          prefs:["vegetarian","north Indian"] },
  { name:"Ashok Verma",      age:55, gender:"male",   height:173, weight:80, activity:"sedentary", ward:"Ward A", room:"A123", compliance:0.88, days:14, dietType:"cardiac",      texture:"regular", diagnoses:["Congestive Heart Failure"],                    restrictions:["low_sodium"],                                 allergies:[],          prefs:["non-vegetarian"] },
  { name:"Manoj Das",        age:68, gender:"male",   height:170, weight:78, activity:"sedentary", ward:"Ward A", room:"A124", compliance:0.72, days:10, dietType:"cardiac",      texture:"regular", diagnoses:["Hypertensive Heart Disease"],                  restrictions:["low_sodium","low_fat"],                       allergies:["nuts"],    prefs:["non-vegetarian"] },
  { name:"Savita Kumar",     age:64, gender:"female", height:160, weight:68, activity:"sedentary", ward:"Ward A", room:"A125", compliance:0.85, days:11, dietType:"cardiac",      texture:"regular", diagnoses:["Congestive Heart Failure","Hypertension"],     restrictions:["low_sodium"],                                 allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Lata Gupta",       age:70, gender:"female", height:157, weight:72, activity:"sedentary", ward:"Ward B", room:"B201", compliance:0.62, days:12, dietType:"cardiac",      texture:"regular", diagnoses:["Coronary Artery Disease"],                     restrictions:["low_sodium","low_fat"],                       allergies:[],          prefs:["vegetarian"] },
  { name:"Usha Pandey",      age:53, gender:"female", height:159, weight:65, activity:"sedentary", ward:"Ward B", room:"B202", compliance:0.90, days:14, dietType:"cardiac",      texture:"regular", diagnoses:["Hypertension","Dyslipidemia"],                  restrictions:["low_sodium","low_fat"],                       allergies:[],          prefs:["vegetarian","north Indian"] },
  { name:"Mala Verma",       age:75, gender:"female", height:155, weight:60, activity:"sedentary", ward:"Ward B", room:"B203", compliance:0.58, days:13, dietType:"cardiac",      texture:"regular", diagnoses:["Congestive Heart Failure","Atrial Fibrillation"],restrictions:["low_sodium"],                                allergies:[],          prefs:["vegetarian"] },

  // â”€â”€ Liquid / Post-op (5) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Pradeep Shah",     age:32, gender:"male",   height:175, weight:70, activity:"sedentary", ward:"Ward B", room:"B204", compliance:0.75, days:10, dietType:"liquid",       texture:"liquid",  diagnoses:["Post-operative â€” Bowel Surgery"],              restrictions:[],                                             allergies:[],          prefs:["vegetarian"] },
  { name:"Gopal Mishra",     age:45, gender:"male",   height:171, weight:65, activity:"sedentary", ward:"Ward B", room:"B205", compliance:0.65, days:11, dietType:"liquid",       texture:"liquid",  diagnoses:["Post-operative â€” Esophageal Surgery"],         restrictions:[],                                             allergies:[],          prefs:["non-vegetarian"] },
  { name:"Kamla Das",        age:28, gender:"female", height:158, weight:56, activity:"sedentary", ward:"Ward B", room:"B206", compliance:0.80, days:10, dietType:"liquid",       texture:"liquid",  diagnoses:["Post-operative â€” Abdominal Surgery"],          restrictions:[],                                             allergies:["dairy"],   prefs:["vegetarian","dairy-free"] },
  { name:"Nirmala Shah",     age:38, gender:"female", height:160, weight:58, activity:"sedentary", ward:"Ward B", room:"B207", compliance:0.72, days:12, dietType:"liquid",       texture:"liquid",  diagnoses:["Acute Pancreatitis"],                           restrictions:[],                                             allergies:[],          prefs:["vegetarian"] },
  { name:"Archana Mishra",   age:42, gender:"female", height:157, weight:62, activity:"sedentary", ward:"Ward B", room:"B208", compliance:0.85, days:11, dietType:"liquid",       texture:"liquid",  diagnoses:["Post-operative â€” GI Surgery"],                 restrictions:[],                                             allergies:[],          prefs:["vegetarian","south Indian"] },

  // â”€â”€ Soft diet (4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Naresh Tiwari",    age:52, gender:"male",   height:169, weight:60, activity:"sedentary", ward:"Ward B", room:"B209", compliance:0.78, days:12, dietType:"soft",         texture:"soft",    diagnoses:["Oral Cancer","Dysphagia"],                     restrictions:[],                                             allergies:[],          prefs:["non-vegetarian"] },
  { name:"Dinesh Shetty",    age:64, gender:"male",   height:167, weight:56, activity:"sedentary", ward:"Ward B", room:"B210", compliance:0.60, days:13, dietType:"soft",         texture:"soft",    diagnoses:["Dysphagia","Stroke"],                           restrictions:[],                                             allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Sudha Tiwari",     age:47, gender:"female", height:158, weight:52, activity:"sedentary", ward:"Ward B", room:"B211", compliance:0.82, days:11, dietType:"soft",         texture:"soft",    diagnoses:["Oral Surgery Recovery"],                        restrictions:[],                                             allergies:[],          prefs:["vegetarian"] },
  { name:"Indira Shetty",    age:60, gender:"female", height:155, weight:55, activity:"sedentary", ward:"Ward B", room:"B212", compliance:0.70, days:14, dietType:"soft",         texture:"soft",    diagnoses:["Dysphagia","Parkinson's Disease"],              restrictions:[],                                             allergies:[],          prefs:["vegetarian","south Indian"] },

  // â”€â”€ High Protein (5) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Hemant Krishnan",  age:38, gender:"male",   height:176, weight:65, activity:"light",     ward:"Ward B", room:"B213", compliance:0.88, days:12, dietType:"high_protein", texture:"regular", diagnoses:["Malnutrition","Protein-Energy Deficiency"],    restrictions:[],                                             allergies:[],          prefs:["non-vegetarian"] },
  { name:"Kamlesh Garg",     age:52, gender:"male",   height:173, weight:60, activity:"sedentary", ward:"Ward B", room:"B214", compliance:0.75, days:13, dietType:"high_protein", texture:"regular", diagnoses:["Cancer Cachexia","Lung Cancer"],                restrictions:[],                                             allergies:[],          prefs:["non-vegetarian"] },
  { name:"Ajay Malhotra",    age:44, gender:"male",   height:175, weight:58, activity:"sedentary", ward:"Ward B", room:"B215", compliance:0.68, days:11, dietType:"high_protein", texture:"regular", diagnoses:["Severe Malnutrition"],                          restrictions:[],                                             allergies:[],          prefs:["non-vegetarian","north Indian"] },
  { name:"Revathi Krishnan", age:35, gender:"female", height:161, weight:48, activity:"sedentary", ward:"Ward B", room:"B216", compliance:0.82, days:14, dietType:"high_protein", texture:"regular", diagnoses:["Malnutrition","Post-chemotherapy Recovery"],  restrictions:[],                                             allergies:[],          prefs:["non-vegetarian","south Indian"] },
  { name:"Kalpana Garg",     age:48, gender:"female", height:159, weight:50, activity:"sedentary", ward:"Ward B", room:"B217", compliance:0.72, days:10, dietType:"high_protein", texture:"regular", diagnoses:["Cancer Cachexia","Breast Cancer"],             restrictions:[],                                             allergies:[],          prefs:["vegetarian"] },

  // â”€â”€ Vegetarian / GI (4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Vijay Chandra",    age:32, gender:"male",   height:172, weight:65, activity:"moderate",  ward:"Ward B", room:"B218", compliance:0.90, days:12, dietType:"vegetarian",   texture:"regular", diagnoses:["Celiac Disease"],                               restrictions:[],                                             allergies:["gluten"],  prefs:["vegetarian","gluten-free"] },
  { name:"Rohit Bose",       age:45, gender:"male",   height:174, weight:72, activity:"light",     ward:"Ward B", room:"B219", compliance:0.85, days:11, dietType:"vegetarian",   texture:"regular", diagnoses:["Inflammatory Bowel Disease"],                   restrictions:[],                                             allergies:["gluten"],  prefs:["vegetarian"] },
  { name:"Ambika Chandra",   age:38, gender:"female", height:161, weight:58, activity:"light",     ward:"Ward B", room:"B220", compliance:0.88, days:13, dietType:"vegetarian",   texture:"regular", diagnoses:["Celiac Disease","Anemia"],                      restrictions:[],                                             allergies:["gluten"],  prefs:["vegetarian","gluten-free"] },
  { name:"Bhavna Bose",      age:52, gender:"female", height:158, weight:62, activity:"sedentary", ward:"Ward B", room:"B221", compliance:0.78, days:10, dietType:"vegetarian",   texture:"regular", diagnoses:["Ulcerative Colitis"],                           restrictions:[],                                             allergies:[],          prefs:["vegetarian"] },

  // â”€â”€ Regular (4) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { name:"Vivek Dubey",      age:28, gender:"male",   height:178, weight:75, activity:"light",     ward:"Ward B", room:"B222", compliance:0.92, days:10, dietType:"regular",      texture:"regular", diagnoses:["Viral Fever","General Medical"],                restrictions:[],                                             allergies:[],          prefs:["non-vegetarian","north Indian"] },
  { name:"Santosh Pillai",   age:42, gender:"male",   height:170, weight:80, activity:"sedentary", ward:"Ward B", room:"B223", compliance:0.88, days:11, dietType:"regular",      texture:"regular", diagnoses:["Acute Gastroenteritis"],                        restrictions:[],                                             allergies:[],          prefs:["vegetarian","south Indian"] },
  { name:"Divya Dubey",      age:35, gender:"female", height:163, weight:62, activity:"moderate",  ward:"Ward B", room:"B224", compliance:0.85, days:12, dietType:"regular",      texture:"regular", diagnoses:["Typhoid Fever"],                                restrictions:[],                                             allergies:[],          prefs:["vegetarian","north Indian"] },
  { name:"Smita Pillai",     age:55, gender:"female", height:157, weight:68, activity:"sedentary", ward:"Ward B", room:"B225", compliance:0.80, days:10, dietType:"regular",      texture:"regular", diagnoses:["Anemia","General Debility"],                    restrictions:[],                                             allergies:[],          prefs:["vegetarian","south Indian"] },
];

// â”€â”€ ingredients array â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ingredients = [
  { name: "oats", category: "grain", caloriesPer100: 389, proteinPer100: 17, carbsPer100: 66, fatPer100: 7, sodiumPer100: 2, potassiumPer100: 429, fiberPer100: 11, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 50, isAvailable: true },
  { name: "brown rice", category: "grain", caloriesPer100: 370, proteinPer100: 8, carbsPer100: 78, fatPer100: 3, sodiumPer100: 5, potassiumPer100: 223, fiberPer100: 4, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 80, isAvailable: true },
  { name: "white rice", category: "grain", caloriesPer100: 365, proteinPer100: 7, carbsPer100: 80, fatPer100: 1, sodiumPer100: 1, potassiumPer100: 115, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 100, isAvailable: true },
  { name: "chicken breast", category: "protein", caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 4, sodiumPer100: 74, potassiumPer100: 256, fiberPer100: 0, isVegetarian: false, isVegan: false, isGlutenFree: true, stockQty: 30, isAvailable: true },
  { name: "lentils", category: "legume", caloriesPer100: 353, proteinPer100: 25, carbsPer100: 60, fatPer100: 2, sodiumPer100: 6, potassiumPer100: 677, fiberPer100: 16, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 40, isAvailable: true },
  { name: "spinach", category: "vegetable", caloriesPer100: 23, proteinPer100: 3, carbsPer100: 4, fatPer100: 0, sodiumPer100: 79, potassiumPer100: 558, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20, isAvailable: true },
  { name: "carrot", category: "vegetable", caloriesPer100: 41, proteinPer100: 1, carbsPer100: 10, fatPer100: 0, sodiumPer100: 69, potassiumPer100: 320, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 25, isAvailable: true },
  { name: "apple", category: "fruit", caloriesPer100: 52, proteinPer100: 0, carbsPer100: 14, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 107, fiberPer100: 2, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 60, isAvailable: true },
  { name: "banana", category: "fruit", caloriesPer100: 89, proteinPer100: 1, carbsPer100: 23, fatPer100: 0, sodiumPer100: 1, potassiumPer100: 358, fiberPer100: 3, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 40, isAvailable: true },
  { name: "milk", category: "dairy", caloriesPer100: 61, proteinPer100: 3, carbsPer100: 5, fatPer100: 3, sodiumPer100: 44, potassiumPer100: 150, fiberPer100: 0, isVegetarian: true, isVegan: false, isGlutenFree: true, stockQty: 100, isAvailable: true, commonAllergen: ["dairy"] },
  { name: "egg", category: "protein", caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1, fatPer100: 11, sodiumPer100: 124, potassiumPer100: 126, fiberPer100: 0, isVegetarian: true, isVegan: false, isGlutenFree: true, stockQty: 200, isAvailable: true, commonAllergen: ["egg"] },
  { name: "whole wheat bread", category: "grain", caloriesPer100: 247, proteinPer100: 9, carbsPer100: 46, fatPer100: 4, sodiumPer100: 400, potassiumPer100: 200, fiberPer100: 6, isVegetarian: true, isVegan: true, isGlutenFree: false, stockQty: 30, isAvailable: true },
  { name: "tofu", category: "protein", caloriesPer100: 76, proteinPer100: 8, carbsPer100: 2, fatPer100: 5, sodiumPer100: 7, potassiumPer100: 121, fiberPer100: 0, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 15, isAvailable: true },
  { name: "olive oil", category: "fat", caloriesPer100: 884, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, sodiumPer100: 2, potassiumPer100: 1, fiberPer100: 0, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 10, isAvailable: true },
  { name: "cucumber", category: "vegetable", caloriesPer100: 15, proteinPer100: 1, carbsPer100: 4, fatPer100: 0, sodiumPer100: 2, potassiumPer100: 147, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 20, isAvailable: true },
  { name: "tomato", category: "vegetable", caloriesPer100: 18, proteinPer100: 1, carbsPer100: 4, fatPer100: 0, sodiumPer100: 5, potassiumPer100: 237, fiberPer100: 1, isVegetarian: true, isVegan: true, isGlutenFree: true, stockQty: 25, isAvailable: true },
  { name: "low-fat yogurt", category: "dairy", caloriesPer100: 56, proteinPer100: 5, carbsPer100: 7, fatPer100: 1, sodiumPer100: 46, potassiumPer100: 234, fiberPer100: 0, isVegetarian: true, isVegan: false, isGlutenFree: true, stockQty: 20, isAvailable: true, commonAllergen: ["dairy"] },
  { name: "fish fillet", category: "protein", caloriesPer100: 105, proteinPer100: 22, carbsPer100: 0, fatPer100: 2, sodiumPer100: 61, potassiumPer100: 480, fiberPer100: 0, isVegetarian: false, isVegan: false, isGlutenFree: true, stockQty: 20, isAvailable: true },
];

// â”€â”€ main seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function seed() {
  const db = getDB();

  // Clear tables in FK-safe order (parallelize independent ones)
  await db.execute("DELETE FROM chat_messages");
  await db.execute("DELETE FROM suggestions");
  await db.execute("DELETE FROM meal_tracking");
  await db.execute("DELETE FROM meal_plans");
  await db.execute("DELETE FROM diet_groups");
  await db.execute("DELETE FROM users");
  await db.execute("DELETE FROM patients");
  await db.execute("DELETE FROM ingredients");
  console.log("🗑️  Tables cleared");

  // â”€â”€ users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [, doctor1] = await Promise.all([
    UserRepo.create({ name: "Admin", email: "admin@nutrisync.com", password: "Admin@123", role: "admin" }),
    UserRepo.create({ name: "Dr. Sarah Chen", email: "doctor@nutrisync.com", password: "Doctor@123", role: "doctor" }),
    UserRepo.create({ name: "Chef Rajan", email: "kitchen@nutrisync.com", password: "Kitchen@123", role: "kitchen_staff" }),
  ]);
  console.log("âœ… Users created");

  // â”€â”€ ingredients â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await IngredientRepo.insertMany(ingredients);
  console.log(`âœ… ${ingredients.length} ingredients created`);

  // â”€â”€ 50 patients + tracking records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let totalTracking = 0;

  for (let i = 0; i < PATIENTS.length; i++) {
    const pt = PATIENTS[i];
    const eng = runNutritionEngine({
      weight: pt.weight, height: pt.height, age: pt.age,
      gender: pt.gender, activityLevel: pt.activity,
      diagnoses: pt.diagnoses, dietaryRestrictions: pt.restrictions,
    });

    const patient = await PatientRepo.create({
      name: pt.name, age: pt.age, gender: pt.gender,
      height: pt.height, weight: pt.weight,
      activityLevel: pt.activity,
      diagnosis: pt.diagnoses,
      allergies: pt.allergies,
      dietaryRestrictions: pt.restrictions,
      foodPreferences: pt.prefs,
      currentDietType: pt.dietType,
      texture: pt.texture,
      bmi: eng.bmi, bmiCategory: eng.bmiCategory, bmr: eng.bmr,
      nutritionTargets: {
        calories: eng.calories, protein: eng.protein,
        carbs: eng.carbs, fat: eng.fat,
        sodium: eng.sodium, potassium: eng.potassium, fiber: eng.fiber,
      },
      roomNumber: pt.room,
      ward: pt.ward,
      admissionDate: new Date(today.getTime() - (pt.days + 3) * 86_400_000).toISOString(),
      isActive: true,
      doctorId: doctor1.id,
    });

    // Insert all tracking records for this patient in parallel
    const trackingPromises = Array.from({ length: pt.days }, (_, d) => {
      const date = new Date(today.getTime() - (pt.days - d) * 86_400_000);
      const daySeed = Math.abs(Math.sin(i * 31.7 + d * 17.3)) % 1;
      return TrackingRepo.create(
        buildDayTracking(patient._id, date, eng.calories, pt.dietType, pt.compliance, daySeed)
      );
    });
    await Promise.all(trackingPromises);
    totalTracking += pt.days;

    process.stdout.write(`\r  âœ“ ${i + 1}/50 patients seeded ...`);
  }
  console.log(`\nâœ… 50 patients created with ${totalTracking} tracking records`);

  // â”€â”€ patient login accounts (first 5 for demo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const allPatients = await PatientRepo.find({ isActive: true });
  const DEMO_LOGINS = [
    { name: "Arjun Kumar",  email: "arjun@nutrisync.com",   password: "Patient@123" },
    { name: "Priya Nair",   email: "priya@nutrisync.com",   password: "Patient@123" },
    { name: "Vikram Rao",   email: "vikram@nutrisync.com",  password: "Patient@123" },
    { name: "Ramesh Gupta", email: "ramesh@nutrisync.com",  password: "Patient@123" },
    { name: "Vivek Dubey",  email: "vivek@nutrisync.com",   password: "Patient@123" },
  ];
  for (const dl of DEMO_LOGINS) {
    const patient = allPatients.find((p) => p.name === dl.name);
    if (patient) await UserRepo.create({ ...dl, role: "patient", patientId: patient._id });
  }
  console.log("âœ… 5 patient demo accounts created");

  console.log("\nðŸŽ‰ Seed complete!");
  console.log("â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€");
  console.log("Admin:   admin@nutrisync.com   / Admin@123");
  console.log("Doctor:  doctor@nutrisync.com  / Doctor@123");
  console.log("Kitchen: kitchen@nutrisync.com / Kitchen@123");
  console.log("Patient: arjun@nutrisync.com   / Patient@123");
  console.log("         priya@nutrisync.com   / Patient@123");
  console.log("         vikram@nutrisync.com  / Patient@123");
  console.log("         ramesh@nutrisync.com  / Patient@123");
  console.log("         vivek@nutrisync.com   / Patient@123");
  console.log(`\nTotal: 50 patients, ${totalTracking} tracking records (~12d avg Ã— 4 meals each)`);

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
