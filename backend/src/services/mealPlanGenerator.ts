/**
 * NutriSync — AI Meal Plan Generator
 *
 * Uses Gemini AI to generate a structured 7-day meal plan,
 * then validates and stores each day's meals.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { INutritionTargets } from "../db/repositories/patientRepo";
import { IDayPlan, IMealItem, IMealNutrition } from "../db/repositories/mealPlanRepo";
import { validateDayMeals } from "./restrictionValidator";
import IngredientRepo from "../db/repositories/ingredientRepo";
import { buildIndianMealPlan } from "../data/indianMealDataset";

// ── Prompt builder ────────────────────────────────────────────────────────────
export function buildMealPlanPrompt(params: {
  calorieTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium: number;
  fiber: number;
  dietType: string;
  texture?: string;
  allergies: string[];
  restrictions: string[];
  preferences: string[];
  availableIngredients: string[];
  language?: string;
}): string {
  const lang = params.language ?? "English";
  const isLiquidDiet = params.dietType === "liquid" || params.texture === "liquid";

  return `You are a certified clinical dietitian creating a 7-day hospital meal plan.

PATIENT NUTRITION TARGETS (daily):
- Calories: ${params.calorieTarget} kcal
- Protein: ${params.protein}g
- Carbohydrates: ${params.carbs}g
- Fat: ${params.fat}g
- Sodium: ${params.sodium}mg (limit)
- Potassium: ${params.potassium}mg (limit)
- Fiber: ${params.fiber}g (minimum)

DIET TYPE: ${params.dietType}
TEXTURE: ${params.texture ?? "regular"}
${isLiquidDiet ? `
⚠️ LIQUID DIET — CRITICAL REQUIREMENT:
This patient is on a STRICT LIQUID DIET. Every single meal and snack MUST be:
- In completely liquid or smooth blended form (soups, broths, gruels, porridges, juices, smoothies, shakes)
- NO solid food items of any kind — no rice grains, no bread, no roti, no idli, no dosa, no whole vegetables
- NO foods that require chewing
- Examples of ALLOWED items: kanji, dal soup (strained), vegetable broth, tomato rasam, moong dal water, ragi porridge (thin), sabudana gruel, buttermilk, fresh fruit juice (strained), coconut water, blended and strained soups
- FORBIDDEN in liquid diet: idli, dosa, rice (as solid), roti, bread, upma, poha, any whole grain, any solid protein, salads, whole fruits
` : ""}
ALLERGIES (CRITICAL — ZERO TOLERANCE): ${params.allergies.length ? params.allergies.join(", ") : "none"}
${params.allergies.length ? `
EXPANDED ALLERGY EXCLUSIONS (include all derivatives and synonyms):
${params.allergies.map((a) => {
  const synonyms: Record<string, string> = {
    dairy: "milk, curd, yogurt, cheese, butter, cream, ghee, paneer, lassi, kheer, raita, curd rice",
    gluten: "wheat, bread, roti, chapati, naan, pasta, semolina, maida, barley, oats",
    nuts: "peanuts, almonds, cashews, walnuts, pistachios, pecans, hazelnuts",
    egg: "eggs, omelette, egg white, egg yolk, mayonnaise",
    soy: "soy sauce, tofu, tempeh, edamame, miso",
    shellfish: "shrimp, crab, lobster, prawn, scallop",
    fish: "salmon, tuna, cod, tilapia, sardine, mackerel",
  };
  return `- ${a}: EXCLUDE ${synonyms[a.toLowerCase()] ?? a} and ALL dishes containing them`;
}).join("\n")}
` : ""}
DIETARY RESTRICTIONS: ${params.restrictions.length ? params.restrictions.join(", ") : "none"}
FOOD PREFERENCES: ${params.preferences.length ? params.preferences.join(", ") : "standard"}

AVAILABLE INGREDIENTS (use ONLY these):
${params.availableIngredients.join(", ")}

Generate a 7-day meal plan. Respond ONLY with valid JSON in this exact structure:
{
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "type": "breakfast",
          "name": "Meal name",
          "ingredients": [
            { "name": "ingredient name", "quantity": 100, "unit": "g" }
          ],
          "nutrition": {
            "calories": 320,
            "protein": 12,
            "carbs": 48,
            "fat": 8,
            "sodium": 200,
            "potassium": 350,
            "fiber": 5
          },
          "portionSize": "1 bowl (350g)",
          "preparationInstructions": "Step-by-step preparation..."
        }
      ]
    }
  ]
}

Rules:
1. Each day must have: breakfast, lunch, dinner, and 1 snack.
2. Stay within the daily limits for sodium and potassium.
3. Distribute calories approximately: breakfast 25%, lunch 35%, dinner 30%, snacks 10%.
4. Use ONLY ingredients from the provided list.
5. Avoid ALL listed allergies completely.
6. All meals must respect the diet type restrictions.
7. Respond in ${lang}.
8. Return ONLY the JSON, no explanation text.`;
}

// ── Fallback offline plan — uses Indian dietary dataset ───────────────────────
function buildFallbackPlan(
  targets: INutritionTargets,
  dietType: string,
  texture?: string,
): IDayPlan[] {
  // If texture is liquid, always use the liquid diet pool regardless of dietType
  const effectiveDietType = (texture === "liquid" || dietType === "liquid") ? "liquid" : dietType;
  const indianDays = buildIndianMealPlan(targets, effectiveDietType);

  return indianDays.map((d) => ({
    day: d.day,
    date: d.date,
    meals: d.meals.map((m) => ({
      ...m,
      isValidated: false,
      validationWarnings: [],
    })) as IMealItem[],
    totalNutrition: d.totalNutrition as IMealNutrition,
  }));
}

// ── Sum day nutrition ────────────────────────────────────────────────────────
function sumDayNutrition(meals: IMealItem[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.nutrition?.calories ?? 0),
      protein: acc.protein + (m.nutrition?.protein ?? 0),
      carbs: acc.carbs + (m.nutrition?.carbs ?? 0),
      fat: acc.fat + (m.nutrition?.fat ?? 0),
      sodium: acc.sodium + (m.nutrition?.sodium ?? 0),
      potassium: acc.potassium + (m.nutrition?.potassium ?? 0),
      fiber: acc.fiber + (m.nutrition?.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0, fiber: 0 }
  );
}

// ── Main generator ───────────────────────────────────────────────────────────
export async function generateMealPlan(params: {
  targets: INutritionTargets;
  dietType: string;
  texture?: string;
  allergies: string[];
  restrictions: string[];
  preferences: string[];
  language?: string;
}): Promise<{ days: IDayPlan[]; promptUsed: string; source: "ai" | "fallback" }> {
  // Get available ingredients from inventory
  const inventory = await IngredientRepo.find({ isAvailable: true });
  const availableIngredients = inventory.map((i) => i.name);

  const prompt = buildMealPlanPrompt({
    calorieTarget: params.targets.calories,
    protein: params.targets.protein,
    carbs: params.targets.carbs,
    fat: params.targets.fat,
    sodium: params.targets.sodium,
    potassium: params.targets.potassium,
    fiber: params.targets.fiber,
    dietType: params.dietType,
    texture: params.texture,
    allergies: params.allergies,
    restrictions: params.restrictions,
    preferences: params.preferences,
    availableIngredients:
      availableIngredients.length > 0
        ? availableIngredients
        : ["oats", "brown rice", "vegetables", "lentils", "chicken breast", "apple", "milk", "bread"],
    language: params.language,
  });

  // Try Gemini AI
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      interface RawIngredient { name?: string; quantity?: number; unit?: string }
      interface RawMeal { name?: string; type?: string; ingredients?: RawIngredient[]; nutrition?: Partial<IMealNutrition>; portionSize?: string; preparationInstructions?: string }
      interface RawDay { meals?: RawMeal[] }
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as { days: RawDay[] };

      const weekStart = new Date();
      const days: IDayPlan[] = await Promise.all(
        (parsed.days ?? []).slice(0, 7).map(async (d: RawDay, idx: number) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + idx);
          const meals: IMealItem[] = (d.meals ?? []).map((m: RawMeal) => ({
            name: m.name ?? "",
            type: (m.type ?? "breakfast") as IMealItem["type"],
            ingredients: (m.ingredients ?? []).map((ing: RawIngredient) => ({
              name: ing.name ?? "",
              quantity: ing.quantity ?? 0,
              unit: ing.unit ?? "g",
              ingredientId: undefined,
            })),
            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0, fiber: 0, ...m.nutrition },
            portionSize: m.portionSize ?? "",
            preparationInstructions: m.preparationInstructions ?? "",
            isValidated: false,
            validationWarnings: [],
          }));
          const validated = await validateDayMeals(meals, params.allergies, params.restrictions, params.targets);
          return { day: idx + 1, date, meals: validated, totalNutrition: sumDayNutrition(validated) };
        })
      );

      return { days, promptUsed: prompt, source: "ai" };
    } catch (err) {
      console.warn("⚠️ Gemini call failed, using fallback plan:", err);
    }
  }

  // Fallback — deterministic plan
  const days = buildFallbackPlan(params.targets, params.dietType, params.texture);
  return { days, promptUsed: prompt, source: "fallback" };
}
