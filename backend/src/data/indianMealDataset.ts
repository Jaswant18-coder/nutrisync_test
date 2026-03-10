/**
 * NutriSync — Indian Dietary Meal Dataset
 *
 * Culturally-aligned Indian meals organized by:
 *  - Diet type (diabetic, renal, cardiac, regular, liquid, soft, vegetarian)
 *  - Meal type (breakfast, lunch, dinner, snack)
 *  - Day variation (7-day rotation at minimum)
 *
 * Each meal includes full nutrition data, ingredients with quantities,
 * preparation instructions, and portion sizes — all based on
 * typical South/North Indian hospital dietary standards.
 */

import type { IMealItem } from "../db/repositories/mealPlanRepo";

export type MealTemplate = Omit<IMealItem, "isValidated" | "validationWarnings">;

interface DayTemplate {
  breakfast: MealTemplate[];
  lunch: MealTemplate[];
  dinner: MealTemplate[];
  snack: MealTemplate[];
}

// ── REGULAR DIET ──────────────────────────────────────────────────────────────
const regularBreakfasts: MealTemplate[] = [
  {
    name: "Idli Sambar",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 100, unit: "g" },
      { name: "urad dal", quantity: 30, unit: "g" },
      { name: "lentils", quantity: 50, unit: "g" },
      { name: "carrot", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 320, protein: 12, carbs: 55, fat: 5, sodium: 180, potassium: 300, fiber: 6 },
    portionSize: "3 idlis + 1 bowl sambar",
    preparationInstructions: "Soak rice and urad dal overnight. Grind to smooth batter, ferment 8hrs. Steam in idli moulds 12 min. For sambar: cook toor dal, temper with mustard, curry leaves, add mixed vegetables, tamarind water, sambar powder. Simmer 10 min.",
  },
  {
    name: "Poha with Peanuts",
    type: "breakfast",
    ingredients: [
      { name: "flattened rice", quantity: 80, unit: "g" },
      { name: "peanuts", quantity: 15, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
      { name: "curry leaves", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 290, protein: 8, carbs: 48, fat: 8, sodium: 150, potassium: 220, fiber: 4 },
    portionSize: "1 plate (200g)",
    preparationInstructions: "Wash and soak poha 5 min. Temper with oil, mustard seeds, peanuts, turmeric. Add chopped onion, green chilli, curry leaves. Mix in poha, squeeze lime. Garnish with coriander.",
  },
  {
    name: "Upma with Coconut Chutney",
    type: "breakfast",
    ingredients: [
      { name: "semolina", quantity: 80, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
      { name: "green beans", quantity: 20, unit: "g" },
      { name: "coconut", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 310, protein: 9, carbs: 50, fat: 8, sodium: 160, potassium: 200, fiber: 4 },
    portionSize: "1 bowl + 2 tbsp chutney",
    preparationInstructions: "Dry roast rava until fragrant. Temper with oil, mustard, urad dal, chana dal, curry leaves, ginger. Add chopped veg, water (1:2 ratio). Stir in rava, cook 5 min. For chutney: grind coconut, green chilli, salt with water.",
  },
  {
    name: "Dosa with Potato Masala",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 80, unit: "g" },
      { name: "urad dal", quantity: 20, unit: "g" },
      { name: "potato", quantity: 100, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 340, protein: 10, carbs: 58, fat: 7, sodium: 170, potassium: 380, fiber: 5 },
    portionSize: "2 dosas + potato filling",
    preparationInstructions: "Use fermented dosa batter (rice + urad dal). Spread thin on hot tawa, drizzle oil. Cook until golden. For masala: boil potatoes, temper with mustard, turmeric, onion, curry leaves. Mash and fill dosas.",
  },
  {
    name: "Ragi Porridge with Jaggery",
    type: "breakfast",
    ingredients: [
      { name: "ragi flour", quantity: 50, unit: "g" },
      { name: "milk", quantity: 150, unit: "ml" },
      { name: "jaggery", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 10, carbs: 50, fat: 5, sodium: 80, potassium: 350, fiber: 7 },
    portionSize: "1 bowl (250ml)",
    preparationInstructions: "Mix ragi flour in cold water to make slurry. Boil milk, add slurry while stirring continuously. Cook on low heat 8 min. Add dissolved jaggery. Serve warm.",
  },
  {
    name: "Pesarattu (Moong Dal Dosa)",
    type: "breakfast",
    ingredients: [
      { name: "green gram", quantity: 80, unit: "g" },
      { name: "rice", quantity: 20, unit: "g" },
      { name: "ginger", quantity: 5, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 300, protein: 14, carbs: 45, fat: 6, sodium: 120, potassium: 350, fiber: 8 },
    portionSize: "2 pesarattus",
    preparationInstructions: "Soak green gram and rice 4hrs. Grind with ginger, green chilli. Spread on hot tawa, top with chopped onion. Cook both sides till crisp. Serve with ginger chutney.",
  },
  {
    name: "Paratha with Curd",
    type: "breakfast",
    ingredients: [
      { name: "whole wheat flour", quantity: 80, unit: "g" },
      { name: "potato", quantity: 60, unit: "g" },
      { name: "low-fat yogurt", quantity: 100, unit: "g" },
    ],
    nutrition: { calories: 350, protein: 11, carbs: 52, fat: 10, sodium: 190, potassium: 320, fiber: 5 },
    portionSize: "2 parathas + 1 cup curd",
    preparationInstructions: "Knead whole wheat dough. Mash boiled potato with cumin, coriander, green chilli. Stuff into dough balls, roll flat. Cook on tawa with minimal ghee. Serve with fresh curd.",
  },
];

const regularLunches: MealTemplate[] = [
  {
    name: "Dal Tadka with Jeera Rice",
    type: "lunch",
    ingredients: [
      { name: "toor dal", quantity: 60, unit: "g" },
      { name: "brown rice", quantity: 100, unit: "g" },
      { name: "tomato", quantity: 40, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 450, protein: 18, carbs: 72, fat: 10, sodium: 250, potassium: 500, fiber: 10 },
    portionSize: "1 bowl dal + 1 cup rice",
    preparationInstructions: "Pressure cook toor dal with turmeric, salt. Temper with ghee, cumin, garlic, dried red chilli, curry leaves, tomato, hing. Pour over dal. Cook jeera rice: sauté cumin in ghee, add washed rice, cook with 1:2 water ratio.",
  },
  {
    name: "Rajma Chawal",
    type: "lunch",
    ingredients: [
      { name: "kidney beans", quantity: 60, unit: "g" },
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "onion", quantity: 40, unit: "g" },
      { name: "tomato", quantity: 50, unit: "g" },
    ],
    nutrition: { calories: 470, protein: 16, carbs: 78, fat: 8, sodium: 280, potassium: 520, fiber: 12 },
    portionSize: "1 bowl rajma + 1 cup rice",
    preparationInstructions: "Soak rajma overnight. Pressure cook until soft. Sauté onion, ginger-garlic paste, add tomato purée, rajma masala. Add cooked rajma, simmer 20 min. Serve with steamed basmati rice.",
  },
  {
    name: "Curd Rice with Pickle",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "low-fat yogurt", quantity: 150, unit: "g" },
      { name: "cucumber", quantity: 30, unit: "g" },
      { name: "curry leaves", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 380, protein: 12, carbs: 65, fat: 8, sodium: 200, potassium: 350, fiber: 3 },
    portionSize: "1 plate curd rice",
    preparationInstructions: "Cook rice soft. Cool slightly, mix with beaten curd and milk. Temper with mustard, urad dal, curry leaves, green chilli. Add grated cucumber, pomegranate. Serve cool with pickle.",
  },
  {
    name: "Sambar Rice with Papad",
    type: "lunch",
    ingredients: [
      { name: "toor dal", quantity: 50, unit: "g" },
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "mixed vegetables", quantity: 80, unit: "g" },
      { name: "tamarind", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 440, protein: 15, carbs: 74, fat: 7, sodium: 260, potassium: 480, fiber: 9 },
    portionSize: "1 plate sambar rice + 1 papad",
    preparationInstructions: "Cook dal. Sauté veggies (drumstick, brinjal, carrot, beans). Add sambar powder, tamarind water, cooked dal, simmer. Mix with hot rice. Roast papad on open flame. Serve together.",
  },
  {
    name: "Roti with Palak Paneer",
    type: "lunch",
    ingredients: [
      { name: "whole wheat flour", quantity: 80, unit: "g" },
      { name: "spinach", quantity: 100, unit: "g" },
      { name: "paneer", quantity: 60, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 460, protein: 22, carbs: 50, fat: 18, sodium: 220, potassium: 550, fiber: 8 },
    portionSize: "2 rotis + 1 bowl palak paneer",
    preparationInstructions: "Blanch spinach, purée smooth. Sauté onion, ginger-garlic, add spinach purée, cream, cubed paneer. Season with garam masala. Roll and cook rotis on tawa. Serve with raita.",
  },
  {
    name: "Vegetable Biryani",
    type: "lunch",
    ingredients: [
      { name: "basmati rice", quantity: 100, unit: "g" },
      { name: "mixed vegetables", quantity: 80, unit: "g" },
      { name: "onion", quantity: 40, unit: "g" },
      { name: "low-fat yogurt", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 430, protein: 12, carbs: 70, fat: 12, sodium: 240, potassium: 380, fiber: 6 },
    portionSize: "1 plate biryani + raita",
    preparationInstructions: "Marinate veggies in yogurt, biryani masala. Parboil basmati rice with whole spices. Layer rice and veggie mix in heavy pot. Add saffron milk, fried onions. Seal with dough, cook dum 25 min. Serve with cucumber raita.",
  },
  {
    name: "Chapati with Chana Masala",
    type: "lunch",
    ingredients: [
      { name: "whole wheat flour", quantity: 80, unit: "g" },
      { name: "chickpeas", quantity: 70, unit: "g" },
      { name: "onion", quantity: 40, unit: "g" },
      { name: "tomato", quantity: 50, unit: "g" },
    ],
    nutrition: { calories: 450, protein: 17, carbs: 68, fat: 10, sodium: 230, potassium: 460, fiber: 11 },
    portionSize: "2 chapatis + 1 bowl chana",
    preparationInstructions: "Soak chickpeas overnight, pressure cook. Sauté onion, ginger-garlic. Add tomato purée, chana masala, cooked chickpeas. Simmer 15min. Roll chapatis thin, cook on tawa. Garnish with onion rings, lemon.",
  },
];

const regularDinners: MealTemplate[] = [
  {
    name: "Moong Dal Khichdi with Ghee",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "moong dal", quantity: 40, unit: "g" },
      { name: "ghee", quantity: 8, unit: "g" },
      { name: "cumin", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 380, protein: 14, carbs: 62, fat: 9, sodium: 180, potassium: 350, fiber: 6 },
    portionSize: "1 large bowl",
    preparationInstructions: "Wash rice and dal together. Temper ghee with cumin, add rice-dal, turmeric, water (1:3). Pressure cook 3 whistles. Mash slightly. Top with ghee, serve with pickle and papad.",
  },
  {
    name: "Roti with Lauki (Bottle Gourd) Sabzi",
    type: "dinner",
    ingredients: [
      { name: "whole wheat flour", quantity: 70, unit: "g" },
      { name: "bottle gourd", quantity: 150, unit: "g" },
      { name: "tomato", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 340, protein: 11, carbs: 58, fat: 7, sodium: 200, potassium: 320, fiber: 6 },
    portionSize: "2 rotis + 1 bowl sabzi",
    preparationInstructions: "Peel and dice lauki. Temper with cumin, add lauki, tomato, turmeric, salt. Cover and cook until soft. Roll and cook rotis on hot tawa.",
  },
  {
    name: "Vegetable Daliya (Broken Wheat Porridge)",
    type: "dinner",
    ingredients: [
      { name: "broken wheat", quantity: 60, unit: "g" },
      { name: "mixed vegetables", quantity: 80, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 320, protein: 10, carbs: 55, fat: 6, sodium: 170, potassium: 300, fiber: 8 },
    portionSize: "1 bowl (250g)",
    preparationInstructions: "Dry roast daliya slightly. Sauté onion, add diced veggies (carrot, peas, beans). Add daliya, water (1:3), turmeric, salt. Pressure cook 2 whistles. Fluff and serve.",
  },
  {
    name: "Chapati with Mixed Veg Curry",
    type: "dinner",
    ingredients: [
      { name: "whole wheat flour", quantity: 70, unit: "g" },
      { name: "mixed vegetables", quantity: 120, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
      { name: "tomato", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 370, protein: 12, carbs: 56, fat: 10, sodium: 220, potassium: 400, fiber: 7 },
    portionSize: "2 chapatis + 1 bowl curry",
    preparationInstructions: "Cut veggies into cubes. Sauté onion, ginger, add tomato purée, garam masala. Add veggies with water, cook covered 15 min. Make chapatis fresh on tawa.",
  },
  {
    name: "Masoor Dal with Rice",
    type: "dinner",
    ingredients: [
      { name: "masoor dal", quantity: 50, unit: "g" },
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "garlic", quantity: 5, unit: "g" },
      { name: "tomato", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 360, protein: 15, carbs: 60, fat: 6, sodium: 190, potassium: 420, fiber: 8 },
    portionSize: "1 bowl dal + 1 cup rice",
    preparationInstructions: "Cook masoor dal (no soaking needed) with turmeric. Temper with garlic, cumin, dried chilli, tomato. Pour over dal. Serve with steamed rice.",
  },
  {
    name: "Idli with Tomato Chutney",
    type: "dinner",
    ingredients: [
      { name: "rice", quantity: 80, unit: "g" },
      { name: "urad dal", quantity: 20, unit: "g" },
      { name: "tomato", quantity: 50, unit: "g" },
    ],
    nutrition: { calories: 290, protein: 9, carbs: 52, fat: 4, sodium: 160, potassium: 250, fiber: 4 },
    portionSize: "4 idlis + chutney",
    preparationInstructions: "Use fermented idli batter. Steam in idli plates 12 minutes. For tomato chutney: roast tomato, red chilli, garlic in oil. Grind with salt and tamarind.",
  },
  {
    name: "Bajra Roti with Garlic Dal",
    type: "dinner",
    ingredients: [
      { name: "bajra flour", quantity: 60, unit: "g" },
      { name: "toor dal", quantity: 40, unit: "g" },
      { name: "garlic", quantity: 5, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 350, protein: 13, carbs: 54, fat: 9, sodium: 170, potassium: 380, fiber: 7 },
    portionSize: "2 bajra rotis + 1 bowl dal",
    preparationInstructions: "Knead bajra flour with hot water. Pat into thick rotis, cook on tawa with ghee. Pressure cook dal, temper with garlic, jeera, hing, ghee. Serve hot.",
  },
];

const regularSnacks: MealTemplate[] = [
  {
    name: "Banana with Chaat Masala",
    type: "snack",
    ingredients: [{ name: "banana", quantity: 120, unit: "g" }],
    nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0, sodium: 5, potassium: 400, fiber: 3 },
    portionSize: "1 medium banana",
    preparationInstructions: "Peel banana, slice into rounds, sprinkle chaat masala and lemon juice.",
  },
  {
    name: "Roasted Chana",
    type: "snack",
    ingredients: [{ name: "roasted chickpeas", quantity: 40, unit: "g" }],
    nutrition: { calories: 140, protein: 7, carbs: 22, fat: 3, sodium: 15, potassium: 250, fiber: 5 },
    portionSize: "1 small bowl",
    preparationInstructions: "Serve roasted chana in a bowl. Optionally add chopped onion, tomato, lemon juice, chaat masala.",
  },
  {
    name: "Fruit Chaat",
    type: "snack",
    ingredients: [
      { name: "apple", quantity: 60, unit: "g" },
      { name: "banana", quantity: 50, unit: "g" },
      { name: "pomegranate", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 120, protein: 1, carbs: 30, fat: 0, sodium: 5, potassium: 280, fiber: 4 },
    portionSize: "1 bowl (150g)",
    preparationInstructions: "Dice apple, banana, guava. Add pomegranate seeds. Sprinkle chaat masala, black salt, lemon juice. Toss gently.",
  },
  {
    name: "Masala Buttermilk",
    type: "snack",
    ingredients: [{ name: "low-fat yogurt", quantity: 100, unit: "g" }],
    nutrition: { calories: 60, protein: 4, carbs: 6, fat: 2, sodium: 80, potassium: 180, fiber: 0 },
    portionSize: "1 glass (200ml)",
    preparationInstructions: "Blend yogurt with water (1:1), roasted cumin powder, salt, chopped coriander, curry leaves. Chill and serve.",
  },
  {
    name: "Sprouts Salad",
    type: "snack",
    ingredients: [
      { name: "moong sprouts", quantity: 60, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "tomato", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 100, protein: 7, carbs: 14, fat: 1, sodium: 20, potassium: 250, fiber: 4 },
    portionSize: "1 bowl (120g)",
    preparationInstructions: "Steam sprouts lightly. Mix with diced onion, tomato, coriander. Add lemon juice, chaat masala, salt. Serve fresh.",
  },
  {
    name: "Coconut Water",
    type: "snack",
    ingredients: [{ name: "coconut water", quantity: 250, unit: "ml" }],
    nutrition: { calories: 45, protein: 0, carbs: 10, fat: 0, sodium: 60, potassium: 250, fiber: 0 },
    portionSize: "1 glass (250ml)",
    preparationInstructions: "Serve fresh tender coconut water chilled.",
  },
  {
    name: "Puffed Rice Bhel",
    type: "snack",
    ingredients: [
      { name: "puffed rice", quantity: 30, unit: "g" },
      { name: "onion", quantity: 15, unit: "g" },
      { name: "tomato", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 115, protein: 3, carbs: 22, fat: 1, sodium: 40, potassium: 120, fiber: 2 },
    portionSize: "1 bowl",
    preparationInstructions: "Mix puffed rice with finely chopped onion, tomato, coriander, sev. Add tamarind and green chutney, chaat masala. Toss and serve immediately.",
  },
];

// ── DIABETIC DIET ─────────────────────────────────────────────────────────────
const diabeticBreakfasts: MealTemplate[] = [
  {
    name: "Ragi Dosa with Mint Chutney",
    type: "breakfast",
    ingredients: [
      { name: "ragi flour", quantity: 50, unit: "g" },
      { name: "rice flour", quantity: 20, unit: "g" },
      { name: "mint", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 250, protein: 8, carbs: 40, fat: 5, sodium: 120, potassium: 300, fiber: 7 },
    portionSize: "2 dosas + chutney",
    preparationInstructions: "Mix ragi and rice flour with water, salt, cumin. Ferment 4hrs. Spread thin on tawa, cook crisp. Grind mint with coconut, green chilli for chutney. Low glycemic index meal.",
  },
  {
    name: "Moong Dal Chilla with Curd",
    type: "breakfast",
    ingredients: [
      { name: "moong dal", quantity: 60, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "low-fat yogurt", quantity: 80, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 16, carbs: 35, fat: 5, sodium: 130, potassium: 380, fiber: 6 },
    portionSize: "2 chillas + curd",
    preparationInstructions: "Soak moong dal 4hrs, grind to batter. Add grated ginger, chopped onion, green chilli, coriander. Spread on tawa, cook both sides. Serve with low-fat curd.",
  },
  {
    name: "Oats Upma",
    type: "breakfast",
    ingredients: [
      { name: "oats", quantity: 50, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "green beans", quantity: 20, unit: "g" },
      { name: "carrot", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 240, protein: 9, carbs: 38, fat: 6, sodium: 140, potassium: 250, fiber: 6 },
    portionSize: "1 bowl",
    preparationInstructions: "Dry roast oats. Temper with mustard, curry leaves, urad dal. Add chopped veggies, cook 3 min. Add oats and water, cook 5 min. Low GI breakfast.",
  },
  {
    name: "Methi (Fenugreek) Thepla",
    type: "breakfast",
    ingredients: [
      { name: "whole wheat flour", quantity: 60, unit: "g" },
      { name: "fenugreek leaves", quantity: 30, unit: "g" },
      { name: "low-fat yogurt", quantity: 80, unit: "g" },
    ],
    nutrition: { calories: 270, protein: 10, carbs: 42, fat: 7, sodium: 150, potassium: 280, fiber: 6 },
    portionSize: "2 theplas + curd",
    preparationInstructions: "Knead whole wheat flour with chopped methi leaves, turmeric, chilli, curd, salt. Roll thin, cook on tawa with minimal oil. Methi helps control blood sugar.",
  },
  {
    name: "Vegetable Omelette (Egg White)",
    type: "breakfast",
    ingredients: [
      { name: "egg whites", quantity: 120, unit: "g" },
      { name: "spinach", quantity: 30, unit: "g" },
      { name: "tomato", quantity: 20, unit: "g" },
      { name: "whole wheat bread", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 230, protein: 18, carbs: 25, fat: 4, sodium: 200, potassium: 320, fiber: 4 },
    portionSize: "1 omelette + 1 toast",
    preparationInstructions: "Whisk egg whites with chopped spinach, tomato, onion, pepper. Cook in non-stick pan with spray oil. Serve with 1 whole wheat toast. High protein, low carb.",
  },
  {
    name: "Sattu Drink with Crackers",
    type: "breakfast",
    ingredients: [
      { name: "sattu (roasted gram flour)", quantity: 40, unit: "g" },
      { name: "lemon", quantity: 10, unit: "g" },
      { name: "multi-grain crackers", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 220, protein: 12, carbs: 32, fat: 5, sodium: 100, potassium: 260, fiber: 5 },
    portionSize: "1 glass + 4 crackers",
    preparationInstructions: "Mix sattu in cold water with lemon juice, roasted cumin, black salt. High fiber, slow-releasing carbs suitable for diabetics. Pair with multi-grain crackers.",
  },
  {
    name: "Besan (Gram Flour) Chilla",
    type: "breakfast",
    ingredients: [
      { name: "gram flour", quantity: 50, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "tomato", quantity: 20, unit: "g" },
      { name: "low-fat yogurt", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 240, protein: 13, carbs: 30, fat: 7, sodium: 140, potassium: 290, fiber: 5 },
    portionSize: "2 chillas + curd",
    preparationInstructions: "Mix besan with water, chopped onion, tomato, coriander, turmeric. Spread thin on tawa, cook both sides crisp. Low GI, high protein. Serve with low-fat curd.",
  },
];

// ── RENAL (CKD) DIET — low potassium, low sodium, low protein ─────────────
const renalBreakfasts: MealTemplate[] = [
  {
    name: "White Rice Idli with Coconut Chutney",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 100, unit: "g" },
      { name: "urad dal", quantity: 30, unit: "g" },
      { name: "coconut", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 8, carbs: 50, fat: 6, sodium: 120, potassium: 180, fiber: 3 },
    portionSize: "3 idlis + coconut chutney",
    preparationInstructions: "Fermented rice-urad batter steamed in moulds. For chutney: grind fresh coconut with green chilli, ginger, salt. Low potassium, kidney-safe meal.",
  },
  {
    name: "Poha (No Peanuts)",
    type: "breakfast",
    ingredients: [
      { name: "flattened rice", quantity: 80, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
      { name: "curry leaves", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 5, carbs: 50, fat: 4, sodium: 100, potassium: 150, fiber: 2 },
    portionSize: "1 plate (200g)",
    preparationInstructions: "Wash poha, soak 5 min. Temper with oil, mustard seeds, turmeric, curry leaves. Add onion, mix in poha. No peanuts (high potassium). Squeeze lime. Renal-safe.",
  },
  {
    name: "Semolina Upma (Light)",
    type: "breakfast",
    ingredients: [
      { name: "semolina", quantity: 70, unit: "g" },
      { name: "onion", quantity: 25, unit: "g" },
      { name: "green beans", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 270, protein: 7, carbs: 48, fat: 5, sodium: 110, potassium: 140, fiber: 3 },
    portionSize: "1 bowl",
    preparationInstructions: "Dry roast rava. Temper with oil, mustard, curry leaves. Add chopped onion, beans (leached), water 1:2. Stir in rava, cook 5 min. Low potassium version.",
  },
  {
    name: "Rice Dosa (Plain)",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 80, unit: "g" },
      { name: "urad dal", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 250, protein: 6, carbs: 48, fat: 4, sodium: 100, potassium: 130, fiber: 2 },
    portionSize: "2 plain dosas",
    preparationInstructions: "Fermented rice-urad batter spread thin on tawa, cook until golden. Serve with coconut chutney (no tomato). Kidney-friendly, low K+.",
  },
  {
    name: "Sooji Sheera (Sweet Semolina)",
    type: "breakfast",
    ingredients: [
      { name: "semolina", quantity: 60, unit: "g" },
      { name: "ghee", quantity: 8, unit: "g" },
      { name: "sugar", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 290, protein: 5, carbs: 50, fat: 8, sodium: 80, potassium: 100, fiber: 1 },
    portionSize: "1 bowl",
    preparationInstructions: "Roast rava in ghee until golden. Add water, sugar, cardamom. Cook until thick. Low potassium, renal-friendly breakfast.",
  },
  {
    name: "Appam with Stew (Coconut)",
    type: "breakfast",
    ingredients: [
      { name: "rice flour", quantity: 70, unit: "g" },
      { name: "coconut milk", quantity: 50, unit: "ml" },
      { name: "green beans", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 6, carbs: 46, fat: 8, sodium: 100, potassium: 160, fiber: 2 },
    portionSize: "2 appams + stew",
    preparationInstructions: "Fermented rice batter cooked in appam pan. Stew: simmer leached veggies in thin coconut milk with peppercorns, curry leaves. No tomato. CKD-safe.",
  },
  {
    name: "Bread Upma",
    type: "breakfast",
    ingredients: [
      { name: "white bread", quantity: 60, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "green peas", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 240, protein: 7, carbs: 42, fat: 5, sodium: 130, potassium: 120, fiber: 2 },
    portionSize: "1 plate",
    preparationInstructions: "Cube bread. Temper with mustard, curry leaves, onion. Add leached peas, turmeric. Toss bread cubes. Low potassium version.",
  },
];

const renalLunches: MealTemplate[] = [
  {
    name: "Plain Rice with Lauki Dal",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "moong dal", quantity: 40, unit: "g" },
      { name: "bottle gourd", quantity: 80, unit: "g" },
    ],
    nutrition: { calories: 400, protein: 12, carbs: 72, fat: 5, sodium: 150, potassium: 280, fiber: 5 },
    portionSize: "1 cup rice + 1 bowl dal",
    preparationInstructions: "Boil moong dal with leached bottle gourd, turmeric. Temper with cumin, ghee. Serve with steamed white rice. Low protein, low K+ renal meal.",
  },
  {
    name: "Rice with Cabbage Sabzi",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "cabbage", quantity: 100, unit: "g" },
      { name: "onion", quantity: 25, unit: "g" },
    ],
    nutrition: { calories: 380, protein: 8, carbs: 70, fat: 6, sodium: 140, potassium: 250, fiber: 4 },
    portionSize: "1 plate rice + sabzi",
    preparationInstructions: "Shred cabbage, soak in water 30 min (leaching). Sauté with onion, turmeric, cumin. Serve with plain rice. CKD-safe low potassium.",
  },
  {
    name: "Chapati with Tinda Curry",
    type: "lunch",
    ingredients: [
      { name: "refined flour", quantity: 60, unit: "g" },
      { name: "apple gourd", quantity: 100, unit: "g" },
      { name: "onion", quantity: 25, unit: "g" },
    ],
    nutrition: { calories: 360, protein: 9, carbs: 60, fat: 8, sodium: 160, potassium: 220, fiber: 4 },
    portionSize: "2 chapatis + curry",
    preparationInstructions: "Use refined flour (lower phosphorus). Cook tinda with onion, cumin, turmeric. Low potassium gourd-based curry for renal patients.",
  },
  {
    name: "Lemon Rice with Cucumber Raita",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "lemon", quantity: 10, unit: "g" },
      { name: "cucumber", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 370, protein: 7, carbs: 68, fat: 6, sodium: 130, potassium: 200, fiber: 2 },
    portionSize: "1 plate lemon rice + raita",
    preparationInstructions: "Cook rice, temper with mustard, peanuts, curry leaves, turmeric. Add lemon juice. Raita: grated cucumber in small portion of diluted curd. Low K+ meal.",
  },
  {
    name: "Rice with Ridge Gourd Curry",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "ridge gourd", quantity: 100, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 350, protein: 8, carbs: 64, fat: 5, sodium: 140, potassium: 230, fiber: 4 },
    portionSize: "1 plate",
    preparationInstructions: "Peel and chop ridge gourd. Sauté in oil with onion, turmeric, cumin. Add water, simmer. Serve with plain rice. Gourd-based meals are renal-friendly.",
  },
  {
    name: "Pulao with Boiled Egg White",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "green peas", quantity: 20, unit: "g" },
      { name: "egg whites", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 380, protein: 12, carbs: 66, fat: 6, sodium: 150, potassium: 210, fiber: 3 },
    portionSize: "1 plate pulao + egg white",
    preparationInstructions: "Cook rice with whole spices, leached peas. Hard boil eggs, use whites only (lower phosphorus). Season pulao with minimal salt.",
  },
  {
    name: "Curd Rice (Low-fat)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "low-fat yogurt", quantity: 60, unit: "g" },
      { name: "cucumber", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 350, protein: 9, carbs: 64, fat: 5, sodium: 120, potassium: 220, fiber: 2 },
    portionSize: "1 plate",
    preparationInstructions: "Cook rice soft. Cool, mix with diluted low-fat curd (portion-controlled). Add cucumber, temper with mustard. Limit curd for phosphorus control.",
  },
];

const renalDinners: MealTemplate[] = [
  {
    name: "Rice Khichdi (Light)",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "moong dal", quantity: 25, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 320, protein: 8, carbs: 58, fat: 7, sodium: 120, potassium: 200, fiber: 3 },
    portionSize: "1 bowl",
    preparationInstructions: "Minimal dal (low protein). Cook rice and moong dal with turmeric, cumin. Top with ghee. Renal-friendly low protein dinner.",
  },
  {
    name: "Chapati with Lauki Sabzi",
    type: "dinner",
    ingredients: [
      { name: "refined flour", quantity: 60, unit: "g" },
      { name: "bottle gourd", quantity: 120, unit: "g" },
    ],
    nutrition: { calories: 300, protein: 7, carbs: 52, fat: 6, sodium: 140, potassium: 190, fiber: 3 },
    portionSize: "2 chapatis + sabzi",
    preparationInstructions: "Refined flour chapatis (lower phosphorus/potassium). Bottle gourd cooked with cumin, turmeric, minimal spice. CKD evening meal.",
  },
  {
    name: "Vegetable Daliya (Leached)",
    type: "dinner",
    ingredients: [
      { name: "broken wheat", quantity: 50, unit: "g" },
      { name: "cabbage", quantity: 40, unit: "g" },
      { name: "green beans", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 7, carbs: 50, fat: 4, sodium: 130, potassium: 180, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Soak and leach veggies to remove potassium. Cook daliya with leached veggies, turmeric. Low K+ dinner for renal patients.",
  },
  {
    name: "Plain Dosa with Mint Chutney",
    type: "dinner",
    ingredients: [
      { name: "rice", quantity: 70, unit: "g" },
      { name: "urad dal", quantity: 15, unit: "g" },
      { name: "mint", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 6, carbs: 48, fat: 4, sodium: 110, potassium: 150, fiber: 2 },
    portionSize: "2 dosas + chutney",
    preparationInstructions: "Plain rice dosa. Mint chutney ground with coconut and green chilli. No tomato chutney (high K+). Kidney-safe.",
  },
  {
    name: "Rice with Snake Gourd Curry",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "snake gourd", quantity: 100, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 300, protein: 7, carbs: 56, fat: 4, sodium: 120, potassium: 180, fiber: 3 },
    portionSize: "1 plate",
    preparationInstructions: "Slice snake gourd, cook with onion, turmeric, cumin. Serve with plain rice. Gourd family vegetables are low in potassium, ideal for CKD.",
  },
  {
    name: "Appam with Coconut Milk",
    type: "dinner",
    ingredients: [
      { name: "rice flour", quantity: 60, unit: "g" },
      { name: "coconut milk", quantity: 50, unit: "ml" },
    ],
    nutrition: { calories: 270, protein: 4, carbs: 44, fat: 8, sodium: 80, potassium: 140, fiber: 1 },
    portionSize: "2 appams + coconut milk",
    preparationInstructions: "Fermented rice batter in appam pan. Warm thin coconut milk with sugar, cardamom. Low protein, low K+ dinner.",
  },
  {
    name: "Bread with Cucumber Sandwich",
    type: "dinner",
    ingredients: [
      { name: "white bread", quantity: 60, unit: "g" },
      { name: "cucumber", quantity: 50, unit: "g" },
      { name: "mint", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 240, protein: 6, carbs: 42, fat: 4, sodium: 140, potassium: 130, fiber: 2 },
    portionSize: "2 sandwiches",
    preparationInstructions: "White bread with sliced cucumber and mint. Light, low-potassium dinner for renal patients.",
  },
];

const renalSnacks: MealTemplate[] = [
  {
    name: "Apple Slices",
    type: "snack",
    ingredients: [{ name: "apple", quantity: 120, unit: "g" }],
    nutrition: { calories: 60, protein: 0, carbs: 15, fat: 0, sodium: 0, potassium: 130, fiber: 3 },
    portionSize: "1 medium apple",
    preparationInstructions: "Slice apple, serve fresh. Apples are low in potassium — safe for CKD patients.",
  },
  {
    name: "Rice Crackers",
    type: "snack",
    ingredients: [{ name: "rice crackers", quantity: 30, unit: "g" }],
    nutrition: { calories: 110, protein: 2, carbs: 24, fat: 1, sodium: 80, potassium: 30, fiber: 0 },
    portionSize: "6 crackers",
    preparationInstructions: "Serve plain rice crackers. Very low potassium snack for renal diet.",
  },
  {
    name: "White Bread Toast with Jam",
    type: "snack",
    ingredients: [
      { name: "white bread", quantity: 40, unit: "g" },
      { name: "mixed fruit jam", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 130, protein: 3, carbs: 26, fat: 1, sodium: 100, potassium: 50, fiber: 1 },
    portionSize: "1 toast with jam",
    preparationInstructions: "Toast white bread, spread with jam. Low potassium, low phosphorus snack.",
  },
  {
    name: "Cucumber Sticks with Lemon",
    type: "snack",
    ingredients: [
      { name: "cucumber", quantity: 100, unit: "g" },
      { name: "lemon", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 20, protein: 1, carbs: 4, fat: 0, sodium: 5, potassium: 80, fiber: 1 },
    portionSize: "1 bowl sticks",
    preparationInstructions: "Cut cucumber into sticks, squeeze lemon, sprinkle black pepper. Low K+ refreshing snack.",
  },
  {
    name: "Puffed Rice (Plain)",
    type: "snack",
    ingredients: [{ name: "puffed rice", quantity: 25, unit: "g" }],
    nutrition: { calories: 90, protein: 2, carbs: 20, fat: 0, sodium: 10, potassium: 40, fiber: 1 },
    portionSize: "1 bowl",
    preparationInstructions: "Serve plain puffed rice or lightly seasoned with salt and turmeric. CKD-safe.",
  },
  {
    name: "Boiled Tapioca Pearls",
    type: "snack",
    ingredients: [
      { name: "sago", quantity: 30, unit: "g" },
      { name: "sugar", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 100, protein: 0, carbs: 25, fat: 0, sodium: 5, potassium: 20, fiber: 0 },
    portionSize: "1 small bowl",
    preparationInstructions: "Soak sago, boil until translucent. Add minimal sugar. Very low potassium & low protein snack.",
  },
  {
    name: "Lemon Water with Mint",
    type: "snack",
    ingredients: [
      { name: "lemon", quantity: 10, unit: "g" },
      { name: "mint", quantity: 3, unit: "g" },
    ],
    nutrition: { calories: 10, protein: 0, carbs: 3, fat: 0, sodium: 5, potassium: 30, fiber: 0 },
    portionSize: "1 glass",
    preparationInstructions: "Squeeze lemon in water, add crushed mint. No sugar or minimal jaggery. CKD hydration-friendly.",
  },
];

// ── CARDIAC (Hypertension) DIET — low sodium, no canned/pickled ───────────
const cardiacBreakfasts: MealTemplate[] = [
  {
    name: "Oats Porridge with Berries",
    type: "breakfast",
    ingredients: [
      { name: "oats", quantity: 50, unit: "g" },
      { name: "low-fat milk", quantity: 100, unit: "ml" },
      { name: "mixed berries", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 9, carbs: 42, fat: 6, sodium: 50, potassium: 250, fiber: 6 },
    portionSize: "1 bowl",
    preparationInstructions: "Cook oats in low-fat milk. Top with fresh berries. No added salt. Heart-healthy low-sodium breakfast.",
  },
  {
    name: "Moong Sprout Chilla",
    type: "breakfast",
    ingredients: [
      { name: "moong sprouts", quantity: 60, unit: "g" },
      { name: "onion", quantity: 15, unit: "g" },
      { name: "coriander", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 220, protein: 12, carbs: 30, fat: 4, sodium: 40, potassium: 300, fiber: 5 },
    portionSize: "2 chillas",
    preparationInstructions: "Grind sprouts into batter, add chopped onion, coriander. Cook thin on non-stick pan with minimal oil. No salt added. Cardiac-safe.",
  },
  {
    name: "Idli (No Salt) with Coconut Chutney",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 80, unit: "g" },
      { name: "urad dal", quantity: 25, unit: "g" },
      { name: "coconut", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 270, protein: 8, carbs: 48, fat: 5, sodium: 30, potassium: 200, fiber: 3 },
    portionSize: "3 idlis + chutney",
    preparationInstructions: "Prepare idli batter with minimal or no salt. Steam. Coconut chutney with ginger, no salt. Ultra-low sodium cardiac meal.",
  },
  {
    name: "Vegetable Poha (No Salt)",
    type: "breakfast",
    ingredients: [
      { name: "flattened rice", quantity: 80, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "green peas", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 250, protein: 6, carbs: 46, fat: 4, sodium: 40, potassium: 200, fiber: 3 },
    portionSize: "1 plate",
    preparationInstructions: "Wash poha. Temper with mustard, turmeric. No salt — use lemon juice for flavour. Add peas, onion. Heart-healthy.",
  },
  {
    name: "Ragi Porridge (Unsalted)",
    type: "breakfast",
    ingredients: [
      { name: "ragi flour", quantity: 50, unit: "g" },
      { name: "low-fat milk", quantity: 100, unit: "ml" },
    ],
    nutrition: { calories: 240, protein: 8, carbs: 44, fat: 4, sodium: 30, potassium: 300, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Mix ragi flour in cold water, stir into boiling low-fat milk. Cook 8 min, add cardamom. No salt, no sugar. Rich in calcium, cardiac-friendly.",
  },
  {
    name: "Whole Wheat Toast with Avocado",
    type: "breakfast",
    ingredients: [
      { name: "whole wheat bread", quantity: 50, unit: "g" },
      { name: "avocado", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 230, protein: 6, carbs: 30, fat: 10, sodium: 40, potassium: 280, fiber: 5 },
    portionSize: "2 toasts",
    preparationInstructions: "Toast whole wheat bread. Mash avocado with lemon, pepper — no salt. Rich in healthy fats, low sodium.",
  },
  {
    name: "Upma with Flaxseed",
    type: "breakfast",
    ingredients: [
      { name: "semolina", quantity: 60, unit: "g" },
      { name: "flaxseed", quantity: 5, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 8, carbs: 42, fat: 6, sodium: 40, potassium: 180, fiber: 4 },
    portionSize: "1 bowl",
    preparationInstructions: "Roast rava. Make upma with minimal salt. Stir in ground flaxseed. Omega-3 heart health + low sodium.",
  },
];

const cardiacLunches: MealTemplate[] = [
  {
    name: "Brown Rice with Dal (No Salt)",
    type: "lunch",
    ingredients: [
      { name: "brown rice", quantity: 80, unit: "g" },
      { name: "moong dal", quantity: 40, unit: "g" },
      { name: "bottle gourd", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 400, protein: 14, carbs: 68, fat: 6, sodium: 60, potassium: 380, fiber: 8 },
    portionSize: "1 cup rice + 1 bowl dal",
    preparationInstructions: "Cook brown rice. Pressure cook moong dal with lauki. Temper with cumin, turmeric — no salt. Use lemon for taste. Cardiac-safe.",
  },
  {
    name: "Roti with Palak Sabzi (Unsalted)",
    type: "lunch",
    ingredients: [
      { name: "whole wheat flour", quantity: 70, unit: "g" },
      { name: "spinach", quantity: 100, unit: "g" },
      { name: "garlic", quantity: 3, unit: "g" },
    ],
    nutrition: { calories: 380, protein: 14, carbs: 56, fat: 8, sodium: 70, potassium: 500, fiber: 8 },
    portionSize: "2 rotis + palak",
    preparationInstructions: "Make rotis without salt. Sauté garlic in minimal oil, add washed spinach. Cook covered. Season with pepper and lemon only.",
  },
  {
    name: "Vegetable Pulao (Low Sodium)",
    type: "lunch",
    ingredients: [
      { name: "basmati rice", quantity: 80, unit: "g" },
      { name: "mixed vegetables", quantity: 80, unit: "g" },
      { name: "whole spices", quantity: 3, unit: "g" },
    ],
    nutrition: { calories: 370, protein: 8, carbs: 64, fat: 8, sodium: 50, potassium: 300, fiber: 4 },
    portionSize: "1 plate",
    preparationInstructions: "Cook rice with whole spices (bay leaf, cardamom, cinnamon) and fresh vegetables. No salt — spices provide flavour. Cardiac-friendly.",
  },
  {
    name: "Chapati with Turai Curry",
    type: "lunch",
    ingredients: [
      { name: "whole wheat flour", quantity: 70, unit: "g" },
      { name: "ridge gourd", quantity: 100, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 350, protein: 10, carbs: 54, fat: 8, sodium: 60, potassium: 320, fiber: 6 },
    portionSize: "2 chapatis + curry",
    preparationInstructions: "Make chapatis (no salt in dough). Sauté ridge gourd with cumin, turmeric, pepper — no added salt. Low sodium cardiac meal.",
  },
  {
    name: "Khichdi with Lemon (No Salt)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 60, unit: "g" },
      { name: "moong dal", quantity: 30, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 340, protein: 10, carbs: 58, fat: 7, sodium: 40, potassium: 280, fiber: 4 },
    portionSize: "1 bowl",
    preparationInstructions: "Simple khichdi with cumin, turmeric, minimal ghee. No salt. Squeeze lemon before serving. Comfort food, heart-safe.",
  },
  {
    name: "Roti with Mixed Veg (Herbs)",
    type: "lunch",
    ingredients: [
      { name: "whole wheat flour", quantity: 70, unit: "g" },
      { name: "mixed vegetables", quantity: 100, unit: "g" },
      { name: "herbs", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 370, protein: 11, carbs: 56, fat: 9, sodium: 55, potassium: 350, fiber: 7 },
    portionSize: "2 rotis + mixed veg",
    preparationInstructions: "Herb-flavoured rotis (no salt). Mixed vegetable curry with cumin, coriander, mint — salt-free. Use herbs and lemon for taste.",
  },
  {
    name: "Bajra Roti with Garlic Chutney",
    type: "lunch",
    ingredients: [
      { name: "bajra flour", quantity: 60, unit: "g" },
      { name: "garlic", quantity: 5, unit: "g" },
      { name: "low-fat yogurt", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 320, protein: 9, carbs: 50, fat: 8, sodium: 50, potassium: 300, fiber: 5 },
    portionSize: "2 rotis + chutney",
    preparationInstructions: "Bajra roti with no salt. Garlic chutney: roast garlic, grind with coconut, chilli, lemon. Anti-hypertensive garlic + salt-free.",
  },
];

const cardiacDinners: MealTemplate[] = [
  {
    name: "Khichdi with Ghee (Unsalted)",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 70, unit: "g" },
      { name: "moong dal", quantity: 30, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 330, protein: 10, carbs: 56, fat: 7, sodium: 30, potassium: 260, fiber: 4 },
    portionSize: "1 bowl",
    preparationInstructions: "Simple moong dal khichdi with turmeric, cumin — no salt. Top with ghee. Heart-healthy comfort dinner.",
  },
  {
    name: "Roti with Lauki Sabzi (No Salt)",
    type: "dinner",
    ingredients: [
      { name: "whole wheat flour", quantity: 60, unit: "g" },
      { name: "bottle gourd", quantity: 120, unit: "g" },
    ],
    nutrition: { calories: 300, protein: 9, carbs: 50, fat: 6, sodium: 40, potassium: 280, fiber: 5 },
    portionSize: "2 rotis + sabzi",
    preparationInstructions: "Salt-free rotis. Cook bottle gourd with cumin, pepper, coriander. Lemon for taste. Low sodium dinner.",
  },
  {
    name: "Vegetable Soup with Bread",
    type: "dinner",
    ingredients: [
      { name: "mixed vegetables", quantity: 100, unit: "g" },
      { name: "whole wheat bread", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 250, protein: 7, carbs: 40, fat: 5, sodium: 50, potassium: 300, fiber: 6 },
    portionSize: "1 bowl soup + 1 slice bread",
    preparationInstructions: "Boil mixed veggies, blend partially. Season with herbs, pepper, garlic — no salt. Serve with unsalted toast.",
  },
  {
    name: "Daliya with Vegetables (Unsalted)",
    type: "dinner",
    ingredients: [
      { name: "broken wheat", quantity: 50, unit: "g" },
      { name: "mixed vegetables", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 8, carbs: 48, fat: 5, sodium: 35, potassium: 250, fiber: 6 },
    portionSize: "1 bowl",
    preparationInstructions: "Cook daliya with vegetables, turmeric, cumin. No salt. Use lemon and herbs. Fibre-rich cardiac dinner.",
  },
  {
    name: "Plain Dosa with Coconut Chutney",
    type: "dinner",
    ingredients: [
      { name: "rice", quantity: 70, unit: "g" },
      { name: "urad dal", quantity: 15, unit: "g" },
      { name: "coconut", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 6, carbs: 46, fat: 6, sodium: 30, potassium: 180, fiber: 2 },
    portionSize: "2 dosas + chutney",
    preparationInstructions: "Batter with minimal salt. Cook on non-stick pan (minimal oil). Coconut chutney without salt — use ginger, green chilli for taste.",
  },
  {
    name: "Sprout Salad with Lemon",
    type: "dinner",
    ingredients: [
      { name: "moong sprouts", quantity: 80, unit: "g" },
      { name: "cucumber", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 120, protein: 8, carbs: 18, fat: 1, sodium: 15, potassium: 280, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Steam sprouts. Mix with cucumber, coriander, lemon, pepper. No salt. Light cardiac dinner.",
  },
  {
    name: "Oats with Steamed Vegetables",
    type: "dinner",
    ingredients: [
      { name: "oats", quantity: 40, unit: "g" },
      { name: "mixed vegetables", quantity: 80, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 9, carbs: 42, fat: 5, sodium: 40, potassium: 300, fiber: 7 },
    portionSize: "1 bowl",
    preparationInstructions: "Cook oats in water with steamed veggies. Season with herbs, pepper, lemon. No salt. High fibre heart-healthy dinner.",
  },
];

const cardiacSnacks: MealTemplate[] = [
  {
    name: "Fresh Fruit Bowl (No Banana)",
    type: "snack",
    ingredients: [
      { name: "apple", quantity: 60, unit: "g" },
      { name: "papaya", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 80, protein: 1, carbs: 20, fat: 0, sodium: 5, potassium: 200, fiber: 3 },
    portionSize: "1 bowl",
    preparationInstructions: "Dice apple and papaya. Serve fresh. No salt, no chaat masala. Heart-friendly snack.",
  },
  {
    name: "Unsalted Roasted Chana",
    type: "snack",
    ingredients: [{ name: "roasted chickpeas", quantity: 30, unit: "g" }],
    nutrition: { calories: 100, protein: 6, carbs: 16, fat: 2, sodium: 5, potassium: 180, fiber: 4 },
    portionSize: "1 small bowl",
    preparationInstructions: "Plain roasted chana without salt. Rich in protein and fibre, very low sodium.",
  },
  {
    name: "Coconut Water",
    type: "snack",
    ingredients: [{ name: "coconut water", quantity: 200, unit: "ml" }],
    nutrition: { calories: 40, protein: 0, carbs: 9, fat: 0, sodium: 50, potassium: 200, fiber: 0 },
    portionSize: "1 glass",
    preparationInstructions: "Fresh coconut water. Natural electrolytes, no added sodium. Hydrating cardiac snack.",
  },
  {
    name: "Flaxseed Ladoo (Sugar-free)",
    type: "snack",
    ingredients: [
      { name: "flaxseed", quantity: 15, unit: "g" },
      { name: "dates", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 80, protein: 3, carbs: 8, fat: 5, sodium: 0, potassium: 120, fiber: 3 },
    portionSize: "2 small ladoos",
    preparationInstructions: "Roast ground flaxseed, mix with date paste, cardamom. Shape into small balls. Omega-3 rich, no salt, cardiac-friendly.",
  },
  {
    name: "Cucumber Mint Raita (No Salt)",
    type: "snack",
    ingredients: [
      { name: "low-fat yogurt", quantity: 60, unit: "g" },
      { name: "cucumber", quantity: 40, unit: "g" },
      { name: "mint", quantity: 3, unit: "g" },
    ],
    nutrition: { calories: 50, protein: 3, carbs: 6, fat: 1, sodium: 30, potassium: 150, fiber: 0 },
    portionSize: "1 small bowl",
    preparationInstructions: "Low-fat curd with grated cucumber, chopped mint. No salt — season with roasted cumin powder.",
  },
  {
    name: "Steamed Corn on Cob (No Salt)",
    type: "snack",
    ingredients: [{ name: "corn", quantity: 80, unit: "g" }],
    nutrition: { calories: 70, protein: 3, carbs: 15, fat: 1, sodium: 5, potassium: 180, fiber: 2 },
    portionSize: "1/2 cob",
    preparationInstructions: "Steam corn, serve with lemon and pepper — no salt. Heart-healthy low-sodium snack.",
  },
  {
    name: "Herbal Tea with Crackers",
    type: "snack",
    ingredients: [
      { name: "herbal tea", quantity: 200, unit: "ml" },
      { name: "unsalted crackers", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 80, protein: 1, carbs: 16, fat: 1, sodium: 10, potassium: 40, fiber: 1 },
    portionSize: "1 cup + 4 crackers",
    preparationInstructions: "Brew herbal tea (hibiscus or chamomile). Serve with unsalted multi-grain crackers. No caffeine, no sodium.",
  },
];

// ── CELIAC DIET — strictly gluten-free ─────────────────────────────────────
const celiacBreakfasts: MealTemplate[] = [
  {
    name: "Rice Idli with Sambar",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 100, unit: "g" },
      { name: "urad dal", quantity: 30, unit: "g" },
      { name: "lentils", quantity: 50, unit: "g" },
    ],
    nutrition: { calories: 310, protein: 12, carbs: 54, fat: 5, sodium: 180, potassium: 300, fiber: 6 },
    portionSize: "3 idlis + sambar",
    preparationInstructions: "Naturally gluten-free rice-urad idlis. Sambar with toor dal and vegetables. All GF ingredients.",
  },
  {
    name: "Poha with Peanuts (GF)",
    type: "breakfast",
    ingredients: [
      { name: "flattened rice", quantity: 80, unit: "g" },
      { name: "peanuts", quantity: 15, unit: "g" },
      { name: "onion", quantity: 25, unit: "g" },
    ],
    nutrition: { calories: 290, protein: 8, carbs: 48, fat: 8, sodium: 140, potassium: 220, fiber: 3 },
    portionSize: "1 plate",
    preparationInstructions: "Poha is naturally gluten-free. Wash, soak, temper with peanuts, turmeric, onion. Squeeze lime. Safe for celiac.",
  },
  {
    name: "Rice Dosa with Potato Masala",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 80, unit: "g" },
      { name: "urad dal", quantity: 20, unit: "g" },
      { name: "potato", quantity: 80, unit: "g" },
    ],
    nutrition: { calories: 330, protein: 9, carbs: 58, fat: 6, sodium: 160, potassium: 350, fiber: 4 },
    portionSize: "2 dosas + masala",
    preparationInstructions: "Rice-urad batter dosa (GF). Potato masala with turmeric, mustard, onion. 100% gluten-free breakfast.",
  },
  {
    name: "Ragi Porridge with Jaggery",
    type: "breakfast",
    ingredients: [
      { name: "ragi flour", quantity: 50, unit: "g" },
      { name: "milk", quantity: 150, unit: "ml" },
      { name: "jaggery", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 10, carbs: 50, fat: 5, sodium: 80, potassium: 350, fiber: 7 },
    portionSize: "1 bowl",
    preparationInstructions: "Ragi (finger millet) is naturally GF. Mix with cold water, stir into boiling milk, add jaggery. Calcium-rich celiac-safe.",
  },
  {
    name: "Pesarattu (Moong Dosa)",
    type: "breakfast",
    ingredients: [
      { name: "green gram", quantity: 80, unit: "g" },
      { name: "rice", quantity: 20, unit: "g" },
      { name: "ginger", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 290, protein: 14, carbs: 42, fat: 5, sodium: 120, potassium: 340, fiber: 8 },
    portionSize: "2 pesarattus",
    preparationInstructions: "Green gram + rice batter (both GF). Spread on tawa. High protein, gluten-free South Indian breakfast.",
  },
  {
    name: "Rice Flour Uttapam",
    type: "breakfast",
    ingredients: [
      { name: "rice flour", quantity: 70, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "tomato", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 5, carbs: 48, fat: 5, sodium: 140, potassium: 180, fiber: 2 },
    portionSize: "2 uttapams",
    preparationInstructions: "Rice flour batter spread thick on tawa. Top with onion, tomato rings. Cook both sides. Completely gluten-free.",
  },
  {
    name: "Sabudana Khichdi",
    type: "breakfast",
    ingredients: [
      { name: "sago", quantity: 60, unit: "g" },
      { name: "peanuts", quantity: 15, unit: "g" },
      { name: "potato", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 300, protein: 5, carbs: 55, fat: 8, sodium: 100, potassium: 220, fiber: 2 },
    portionSize: "1 plate",
    preparationInstructions: "Soak sago overnight. Cook with cubed potato, crushed peanuts, cumin, green chilli. All GF. Traditional fasting dish, safe for celiac.",
  },
];

const celiacLunches: MealTemplate[] = [
  {
    name: "Rice with Dal Tadka (GF)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "toor dal", quantity: 50, unit: "g" },
      { name: "tomato", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 430, protein: 16, carbs: 72, fat: 7, sodium: 200, potassium: 450, fiber: 8 },
    portionSize: "1 cup rice + dal",
    preparationInstructions: "Rice and dal are naturally GF. Cook dal, temper with cumin, garlic, chilli. No wheat-based thickeners. Celiac-safe.",
  },
  {
    name: "Rice with Rajma (GF)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "kidney beans", quantity: 60, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 450, protein: 15, carbs: 76, fat: 7, sodium: 200, potassium: 480, fiber: 10 },
    portionSize: "1 plate",
    preparationInstructions: "Rajma curry (GF spices only — verify masalas are wheat-free). Serve with steamed rice. High fibre gluten-free lunch.",
  },
  {
    name: "Rice with Palak Paneer (GF)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "spinach", quantity: 80, unit: "g" },
      { name: "paneer", quantity: 50, unit: "g" },
    ],
    nutrition: { calories: 440, protein: 18, carbs: 54, fat: 16, sodium: 200, potassium: 500, fiber: 6 },
    portionSize: "rice + palak paneer",
    preparationInstructions: "Blanch spinach, purée. Cook with paneer cubes, GF spices. Serve with rice instead of wheat roti. Celiac-safe.",
  },
  {
    name: "Vegetable Biryani (Rice-based, GF)",
    type: "lunch",
    ingredients: [
      { name: "basmati rice", quantity: 100, unit: "g" },
      { name: "mixed vegetables", quantity: 80, unit: "g" },
      { name: "low-fat yogurt", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 420, protein: 10, carbs: 68, fat: 11, sodium: 220, potassium: 350, fiber: 5 },
    portionSize: "1 plate biryani",
    preparationInstructions: "Biryani with rice (GF). Use whole spices, GF masala blend. Layer rice and veggies. Dum cook. No wheat naan/roti.",
  },
  {
    name: "Rice with Chana Masala (GF)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "chickpeas", quantity: 60, unit: "g" },
      { name: "onion", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 420, protein: 15, carbs: 70, fat: 8, sodium: 210, potassium: 420, fiber: 9 },
    portionSize: "1 plate",
    preparationInstructions: "Chana masala with GF spices. Serve with plain rice. High protein, high fibre, completely gluten-free.",
  },
  {
    name: "Curd Rice with Tempering (GF)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "low-fat yogurt", quantity: 120, unit: "g" },
      { name: "cucumber", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 370, protein: 11, carbs: 64, fat: 7, sodium: 180, potassium: 330, fiber: 2 },
    portionSize: "1 plate",
    preparationInstructions: "Rice + curd are naturally GF. Temper with mustard, curry leaves. Add cucumber. Gentle, celiac-friendly lunch.",
  },
  {
    name: "Sambar Rice (GF)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "toor dal", quantity: 40, unit: "g" },
      { name: "mixed vegetables", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 410, protein: 13, carbs: 70, fat: 6, sodium: 230, potassium: 440, fiber: 7 },
    portionSize: "1 plate",
    preparationInstructions: "Sambar with GF ingredients. Use sambar powder verified gluten-free. Mix with rice. All naturally GF south Indian meal.",
  },
];

const celiacDinners: MealTemplate[] = [
  {
    name: "Rice Khichdi with Ghee",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "moong dal", quantity: 40, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 360, protein: 12, carbs: 60, fat: 8, sodium: 160, potassium: 320, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Moong dal + rice khichdi (naturally GF). Turmeric, cumin tempering with ghee. Gentle gluten-free dinner.",
  },
  {
    name: "Rice with Lauki Sabzi (GF)",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "bottle gourd", quantity: 120, unit: "g" },
    ],
    nutrition: { calories: 310, protein: 7, carbs: 58, fat: 5, sodium: 160, potassium: 280, fiber: 4 },
    portionSize: "rice + sabzi",
    preparationInstructions: "Steamed rice with bottle gourd cooked in cumin, turmeric. No wheat roti. Celiac-safe dinner.",
  },
  {
    name: "Jowar Roti with Mixed Veg",
    type: "dinner",
    ingredients: [
      { name: "jowar flour", quantity: 60, unit: "g" },
      { name: "mixed vegetables", quantity: 100, unit: "g" },
    ],
    nutrition: { calories: 320, protein: 10, carbs: 52, fat: 7, sodium: 180, potassium: 350, fiber: 6 },
    portionSize: "2 rotis + curry",
    preparationInstructions: "Jowar (sorghum) is gluten-free. Make rotis with hot water. Mixed veg curry with GF spices. Iron-rich celiac dinner.",
  },
  {
    name: "Masoor Dal with Rice (GF)",
    type: "dinner",
    ingredients: [
      { name: "masoor dal", quantity: 45, unit: "g" },
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "garlic", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 350, protein: 14, carbs: 58, fat: 5, sodium: 170, potassium: 380, fiber: 7 },
    portionSize: "1 bowl dal + rice",
    preparationInstructions: "Cook masoor dal with garlic tempering. Serve with rice. Naturally GF. Protein-rich celiac dinner.",
  },
  {
    name: "Rice Noodle Soup",
    type: "dinner",
    ingredients: [
      { name: "rice noodles", quantity: 60, unit: "g" },
      { name: "mixed vegetables", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 6, carbs: 48, fat: 4, sodium: 180, potassium: 200, fiber: 3 },
    portionSize: "1 bowl",
    preparationInstructions: "Rice noodles (GF) in vegetable broth with ginger, garlic. No soy sauce (has wheat). Use lemon for taste.",
  },
  {
    name: "Bajra Roti (GF) with Dal",
    type: "dinner",
    ingredients: [
      { name: "bajra flour", quantity: 60, unit: "g" },
      { name: "toor dal", quantity: 35, unit: "g" },
    ],
    nutrition: { calories: 330, protein: 12, carbs: 52, fat: 7, sodium: 150, potassium: 340, fiber: 6 },
    portionSize: "2 rotis + dal",
    preparationInstructions: "Bajra (pearl millet) is naturally GF. Make rotis with hot water and ghee. Serve with plain toor dal.",
  },
  {
    name: "Sabudana Thalipeeth",
    type: "dinner",
    ingredients: [
      { name: "sago", quantity: 50, unit: "g" },
      { name: "potato", quantity: 40, unit: "g" },
      { name: "peanuts", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 5, carbs: 50, fat: 7, sodium: 120, potassium: 200, fiber: 2 },
    portionSize: "2 thalipeeths",
    preparationInstructions: "Soaked sago mixed with mashed potato, crushed peanuts, cumin. Flatten and cook on tawa. 100% GF. Serve with curd.",
  },
];

const celiacSnacks: MealTemplate[] = [
  {
    name: "Fruit Bowl",
    type: "snack",
    ingredients: [
      { name: "apple", quantity: 60, unit: "g" },
      { name: "banana", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 100, protein: 1, carbs: 26, fat: 0, sodium: 2, potassium: 280, fiber: 3 },
    portionSize: "1 bowl",
    preparationInstructions: "Fresh fruit — naturally gluten-free. Dice and serve.",
  },
  {
    name: "Roasted Makhana (Fox Nuts)",
    type: "snack",
    ingredients: [{ name: "makhana", quantity: 25, unit: "g" }],
    nutrition: { calories: 90, protein: 3, carbs: 18, fat: 1, sodium: 10, potassium: 80, fiber: 2 },
    portionSize: "1 bowl",
    preparationInstructions: "Dry roast makhana with a pinch of turmeric and pepper. GF, low calorie snack.",
  },
  {
    name: "Puffed Rice Bhel (GF)",
    type: "snack",
    ingredients: [
      { name: "puffed rice", quantity: 30, unit: "g" },
      { name: "onion", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 105, protein: 2, carbs: 22, fat: 1, sodium: 30, potassium: 100, fiber: 1 },
    portionSize: "1 bowl",
    preparationInstructions: "Puffed rice with onion, coriander, lemon. No sev (may contain wheat). GF snack.",
  },
  {
    name: "Coconut Water",
    type: "snack",
    ingredients: [{ name: "coconut water", quantity: 250, unit: "ml" }],
    nutrition: { calories: 45, protein: 0, carbs: 10, fat: 0, sodium: 60, potassium: 250, fiber: 0 },
    portionSize: "1 glass",
    preparationInstructions: "Fresh coconut water — naturally GF and hydrating.",
  },
  {
    name: "Sprouts Salad (GF)",
    type: "snack",
    ingredients: [
      { name: "moong sprouts", quantity: 50, unit: "g" },
      { name: "cucumber", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 80, protein: 6, carbs: 12, fat: 0, sodium: 10, potassium: 200, fiber: 3 },
    portionSize: "1 bowl",
    preparationInstructions: "Steamed sprouts with cucumber, lemon, pepper. Gluten-free protein snack.",
  },
  {
    name: "Rice Crackers with Hummus",
    type: "snack",
    ingredients: [
      { name: "rice crackers", quantity: 25, unit: "g" },
      { name: "chickpeas", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 110, protein: 4, carbs: 20, fat: 2, sodium: 60, potassium: 120, fiber: 2 },
    portionSize: "4 crackers + hummus",
    preparationInstructions: "GF rice crackers with homemade chickpea hummus (tahini, lemon, cumin). No wheat pita.",
  },
  {
    name: "Banana with Cinnamon",
    type: "snack",
    ingredients: [{ name: "banana", quantity: 100, unit: "g" }],
    nutrition: { calories: 90, protein: 1, carbs: 23, fat: 0, sodium: 2, potassium: 360, fiber: 3 },
    portionSize: "1 banana",
    preparationInstructions: "Peel banana, sprinkle cinnamon. Quick, naturally GF snack. Energy boost.",
  },
];

// ── GERD DIET — no spicy, no citrus, no tomato, no caffeine ───────────────
const gerdBreakfasts: MealTemplate[] = [
  {
    name: "Plain Idli with Coconut Chutney",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 100, unit: "g" },
      { name: "urad dal", quantity: 30, unit: "g" },
      { name: "coconut", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 290, protein: 9, carbs: 50, fat: 6, sodium: 150, potassium: 200, fiber: 3 },
    portionSize: "3 idlis + chutney",
    preparationInstructions: "Steamed idlis — bland, easy to digest. Coconut chutney with ginger, no chilli. No sambar (has tomato/tamarind). GERD-safe.",
  },
  {
    name: "Oatmeal with Banana",
    type: "breakfast",
    ingredients: [
      { name: "oats", quantity: 50, unit: "g" },
      { name: "low-fat milk", quantity: 120, unit: "ml" },
      { name: "banana", quantity: 60, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 10, carbs: 48, fat: 5, sodium: 60, potassium: 350, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Cook oats in low-fat milk. Top with sliced banana. No citrus, no sugar. Soothing GERD breakfast.",
  },
  {
    name: "Rice Flakes Upma (Mild)",
    type: "breakfast",
    ingredients: [
      { name: "flattened rice", quantity: 80, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "curry leaves", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 250, protein: 5, carbs: 48, fat: 4, sodium: 100, potassium: 160, fiber: 2 },
    portionSize: "1 plate",
    preparationInstructions: "Wash poha. Cook with minimal spice — only turmeric, cumin. No chilli, no tomato. Mild GERD-friendly version.",
  },
  {
    name: "Semolina Upma (No Spice)",
    type: "breakfast",
    ingredients: [
      { name: "semolina", quantity: 70, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "green beans", quantity: 15, unit: "g" },
    ],
    nutrition: { calories: 270, protein: 7, carbs: 48, fat: 5, sodium: 120, potassium: 150, fiber: 3 },
    portionSize: "1 bowl",
    preparationInstructions: "Roast rava. Make upma with cumin only — no chilli, no pepper. Add beans, cook till soft. Mild and stomach-friendly.",
  },
  {
    name: "Banana Pancakes (Rice Flour)",
    type: "breakfast",
    ingredients: [
      { name: "rice flour", quantity: 50, unit: "g" },
      { name: "banana", quantity: 80, unit: "g" },
      { name: "low-fat milk", quantity: 50, unit: "ml" },
    ],
    nutrition: { calories: 260, protein: 5, carbs: 52, fat: 3, sodium: 60, potassium: 280, fiber: 3 },
    portionSize: "3 pancakes",
    preparationInstructions: "Mash banana, mix with rice flour, milk. Cook on non-stick pan. No spice, no acid. Soothing GERD breakfast.",
  },
  {
    name: "Sweet Daliya Porridge",
    type: "breakfast",
    ingredients: [
      { name: "broken wheat", quantity: 50, unit: "g" },
      { name: "low-fat milk", quantity: 100, unit: "ml" },
      { name: "jaggery", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 8, carbs: 52, fat: 4, sodium: 60, potassium: 200, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Cook daliya in milk with cardamom, jaggery. No citrus, no spice. High fibre, gentle on stomach. GERD-friendly.",
  },
  {
    name: "Rice Dosa (Plain, No Chutney)",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 80, unit: "g" },
      { name: "urad dal", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 240, protein: 6, carbs: 46, fat: 4, sodium: 100, potassium: 130, fiber: 2 },
    portionSize: "2 plain dosas",
    preparationInstructions: "Plain rice dosa with minimal oil. No spicy chutney, no sambar. Can serve with mild coconut chutney (no chilli).",
  },
];

const gerdLunches: MealTemplate[] = [
  {
    name: "Rice with Moong Dal (Mild)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "moong dal", quantity: 50, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 420, protein: 15, carbs: 70, fat: 8, sodium: 150, potassium: 350, fiber: 6 },
    portionSize: "1 cup rice + dal",
    preparationInstructions: "Cook moong dal (easiest to digest). Temper with cumin, ghee only — no chilli, no tomato, no tamarind. GERD-safe lunch.",
  },
  {
    name: "Curd Rice (Cooling)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 100, unit: "g" },
      { name: "low-fat yogurt", quantity: 120, unit: "g" },
      { name: "cucumber", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 370, protein: 11, carbs: 64, fat: 7, sodium: 150, potassium: 300, fiber: 2 },
    portionSize: "1 plate",
    preparationInstructions: "Cook rice soft. Cool, mix with curd. Add cucumber. No pickle, no spice. Cooling, soothing for acid reflux.",
  },
  {
    name: "Chapati with Lauki Sabzi (Bland)",
    type: "lunch",
    ingredients: [
      { name: "whole wheat flour", quantity: 70, unit: "g" },
      { name: "bottle gourd", quantity: 120, unit: "g" },
      { name: "cumin", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 340, protein: 10, carbs: 56, fat: 7, sodium: 150, potassium: 280, fiber: 5 },
    portionSize: "2 chapatis + sabzi",
    preparationInstructions: "Soft chapatis. Bottle gourd cooked gently with cumin and turmeric only. No chilli, no tomato, no garlic (may trigger reflux).",
  },
  {
    name: "Khichdi (Comfort, No Spice)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "moong dal", quantity: 40, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 380, protein: 12, carbs: 62, fat: 8, sodium: 140, potassium: 300, fiber: 5 },
    portionSize: "1 large bowl",
    preparationInstructions: "Soft khichdi with cumin and turmeric. No chilli, no pepper, no garlic. Top with ghee. Most soothing GERD meal.",
  },
  {
    name: "Rice with Palak (No Onion/Garlic)",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "spinach", quantity: 80, unit: "g" },
      { name: "paneer", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 400, protein: 16, carbs: 52, fat: 14, sodium: 180, potassium: 420, fiber: 5 },
    portionSize: "rice + palak",
    preparationInstructions: "Blanch spinach, purée. Cook with cumin, paneer — no onion, no garlic, no chilli. Serve with rice. Nutrient-dense GERD meal.",
  },
  {
    name: "Vegetable Pulao (Mild Spice)",
    type: "lunch",
    ingredients: [
      { name: "basmati rice", quantity: 80, unit: "g" },
      { name: "mixed vegetables", quantity: 60, unit: "g" },
      { name: "whole spices", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 360, protein: 8, carbs: 62, fat: 8, sodium: 140, potassium: 260, fiber: 4 },
    portionSize: "1 plate",
    preparationInstructions: "Rice with mild whole spices (bay leaf, cardamom). Soft vegetables. No chilli, no tomato. GERD-friendly pulao.",
  },
  {
    name: "Rice with Turai (Ridge Gourd) Curry",
    type: "lunch",
    ingredients: [
      { name: "white rice", quantity: 80, unit: "g" },
      { name: "ridge gourd", quantity: 100, unit: "g" },
      { name: "cumin", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 330, protein: 8, carbs: 58, fat: 6, sodium: 140, potassium: 250, fiber: 4 },
    portionSize: "1 plate",
    preparationInstructions: "Ridge gourd cooked with cumin and turmeric only. No spicy seasonings. Serve with plain rice. Easy to digest, GERD-safe.",
  },
];

const gerdDinners: MealTemplate[] = [
  {
    name: "Khichdi (Ultra Bland)",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 70, unit: "g" },
      { name: "moong dal", quantity: 30, unit: "g" },
      { name: "ghee", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 330, protein: 10, carbs: 54, fat: 7, sodium: 120, potassium: 260, fiber: 4 },
    portionSize: "1 bowl",
    preparationInstructions: "Simple khichdi with only turmeric and cumin. No chilli, no garlic. GERD patients should eat dinner 2-3 hours before bed.",
  },
  {
    name: "Soft Chapati with Lauki (Mild)",
    type: "dinner",
    ingredients: [
      { name: "whole wheat flour", quantity: 60, unit: "g" },
      { name: "bottle gourd", quantity: 100, unit: "g" },
    ],
    nutrition: { calories: 290, protein: 8, carbs: 48, fat: 6, sodium: 130, potassium: 240, fiber: 4 },
    portionSize: "2 chapatis + sabzi",
    preparationInstructions: "Soft chapatis. Bottle gourd cooked very simply with cumin and turmeric. No spice, no acid. Early dinner for GERD.",
  },
  {
    name: "Rice with Moong Dal Soup",
    type: "dinner",
    ingredients: [
      { name: "white rice", quantity: 70, unit: "g" },
      { name: "moong dal", quantity: 30, unit: "g" },
    ],
    nutrition: { calories: 300, protein: 10, carbs: 52, fat: 4, sodium: 110, potassium: 260, fiber: 4 },
    portionSize: "1 plate",
    preparationInstructions: "Thin moong dal soup (more water, well-cooked) with steamed rice. Easiest digestible dinner for GERD.",
  },
  {
    name: "Oats Upma (No Spice)",
    type: "dinner",
    ingredients: [
      { name: "oats", quantity: 40, unit: "g" },
      { name: "green beans", quantity: 20, unit: "g" },
      { name: "carrot", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 240, protein: 7, carbs: 38, fat: 5, sodium: 80, potassium: 200, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Cook oats with chopped beans, carrot. Only cumin for tempering — no chilli, no pepper. GERD evening meal.",
  },
  {
    name: "Soft Idli (Plain)",
    type: "dinner",
    ingredients: [
      { name: "rice", quantity: 80, unit: "g" },
      { name: "urad dal", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 250, protein: 7, carbs: 46, fat: 3, sodium: 100, potassium: 160, fiber: 2 },
    portionSize: "4 idlis",
    preparationInstructions: "Soft steamed idlis. No sambar, no chutney. Can serve with a drizzle of ghee. Gentlest GERD dinner option.",
  },
  {
    name: "Daliya Porridge (Savoury, Mild)",
    type: "dinner",
    ingredients: [
      { name: "broken wheat", quantity: 50, unit: "g" },
      { name: "bottle gourd", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 260, protein: 7, carbs: 46, fat: 4, sodium: 100, potassium: 200, fiber: 5 },
    portionSize: "1 bowl",
    preparationInstructions: "Cook daliya with diced lauki. Only turmeric and cumin. No onion, no garlic (reflux triggers). Fibre-rich GERD dinner.",
  },
  {
    name: "Appam with Vegetable Stew (No Spice)",
    type: "dinner",
    ingredients: [
      { name: "rice flour", quantity: 60, unit: "g" },
      { name: "coconut milk", quantity: 50, unit: "ml" },
      { name: "green beans", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 280, protein: 5, carbs: 44, fat: 8, sodium: 90, potassium: 180, fiber: 2 },
    portionSize: "2 appams + stew",
    preparationInstructions: "Rice appam with mild coconut stew. No chilli, no pepper. Gentle, south Indian GERD-friendly dinner.",
  },
];

const gerdSnacks: MealTemplate[] = [
  {
    name: "Banana",
    type: "snack",
    ingredients: [{ name: "banana", quantity: 100, unit: "g" }],
    nutrition: { calories: 90, protein: 1, carbs: 23, fat: 0, sodium: 2, potassium: 360, fiber: 3 },
    portionSize: "1 banana",
    preparationInstructions: "Banana is alkaline, excellent for GERD. Serve fresh. Soothes stomach lining.",
  },
  {
    name: "Boiled Sweet Potato",
    type: "snack",
    ingredients: [{ name: "sweet potato", quantity: 80, unit: "g" }],
    nutrition: { calories: 70, protein: 1, carbs: 16, fat: 0, sodium: 20, potassium: 250, fiber: 2 },
    portionSize: "1 small",
    preparationInstructions: "Boil sweet potato until soft. Serve plain without chaat masala. Gentle starchy snack for GERD.",
  },
  {
    name: "Plain Yogurt",
    type: "snack",
    ingredients: [{ name: "low-fat yogurt", quantity: 100, unit: "g" }],
    nutrition: { calories: 60, protein: 4, carbs: 6, fat: 2, sodium: 50, potassium: 150, fiber: 0 },
    portionSize: "1 cup",
    preparationInstructions: "Plain low-fat curd. Probiotics may help digestion. No sugar, no fruit (avoid citrus).",
  },
  {
    name: "Melon Cubes",
    type: "snack",
    ingredients: [{ name: "muskmelon", quantity: 120, unit: "g" }],
    nutrition: { calories: 40, protein: 1, carbs: 9, fat: 0, sodium: 15, potassium: 180, fiber: 1 },
    portionSize: "1 bowl cubes",
    preparationInstructions: "Cubed muskmelon. Alkaline fruit, low acid. Excellent GERD snack. No citrus fruits.",
  },
  {
    name: "Roasted Makhana (Plain)",
    type: "snack",
    ingredients: [{ name: "makhana", quantity: 25, unit: "g" }],
    nutrition: { calories: 85, protein: 3, carbs: 18, fat: 1, sodium: 5, potassium: 70, fiber: 2 },
    portionSize: "1 bowl",
    preparationInstructions: "Dry roast makhana in a drop of ghee. No spice, no pepper. Light, crunchy GERD-friendly snack.",
  },
  {
    name: "Coconut Water (Room Temp)",
    type: "snack",
    ingredients: [{ name: "coconut water", quantity: 200, unit: "ml" }],
    nutrition: { calories: 35, protein: 0, carbs: 8, fat: 0, sodium: 50, potassium: 200, fiber: 0 },
    portionSize: "1 glass",
    preparationInstructions: "Room temperature coconut water. Not chilled (cold drinks may worsen reflux). Natural electrolytes.",
  },
  {
    name: "Rice Cake with Cucumber",
    type: "snack",
    ingredients: [
      { name: "rice cake", quantity: 25, unit: "g" },
      { name: "cucumber", quantity: 40, unit: "g" },
    ],
    nutrition: { calories: 50, protein: 1, carbs: 11, fat: 0, sodium: 20, potassium: 80, fiber: 1 },
    portionSize: "2 rice cakes",
    preparationInstructions: "Plain rice cakes topped with cucumber slices. No spice, no tomato, no citrus. Mild GERD snack.",
  },
];

// ── LIQUID DIET ───────────────────────────────────────────────────────────────
const liquidBreakfasts: MealTemplate[] = [
  {
    name: "Rice Kanji (Rice Gruel)",
    type: "breakfast",
    ingredients: [
      { name: "rice", quantity: 50, unit: "g" },
      { name: "water", quantity: 400, unit: "ml" },
      { name: "salt", quantity: 1, unit: "g" },
    ],
    nutrition: { calories: 180, protein: 3, carbs: 38, fat: 1, sodium: 120, potassium: 60, fiber: 1 },
    portionSize: "1 large bowl (400 ml)",
    preparationInstructions: "Cook rice in 8x water until completely soft and mushy. Blend until smooth, strain through fine mesh. Add salt. Serve warm. Consistency should be pourable liquid.",
  },
  {
    name: "Moong Dal Soup (Strained)",
    type: "breakfast",
    ingredients: [
      { name: "moong dal", quantity: 40, unit: "g" },
      { name: "turmeric", quantity: 1, unit: "g" },
      { name: "salt", quantity: 1, unit: "g" },
      { name: "water", quantity: 500, unit: "ml" },
    ],
    nutrition: { calories: 140, protein: 9, carbs: 25, fat: 1, sodium: 110, potassium: 300, fiber: 2 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Pressure cook moong dal with turmeric in 3x water (3 whistles). Blend and strain through fine sieve discarding solids. Season with salt. Serve as clear liquid.",
  },
  {
    name: "Ragi Porridge (Thin)",
    type: "breakfast",
    ingredients: [
      { name: "ragi flour", quantity: 30, unit: "g" },
      { name: "water", quantity: 300, unit: "ml" },
      { name: "jaggery", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 155, protein: 4, carbs: 32, fat: 1, sodium: 20, potassium: 140, fiber: 2 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Mix ragi flour in cold water. Bring to boil stirring constantly to avoid lumps. Cook 5 min on medium. Dissolve jaggery and strain. Consistency should be thin and pourable.",
  },
  {
    name: "Coconut Water with Glucose",
    type: "breakfast",
    ingredients: [
      { name: "coconut water", quantity: 250, unit: "ml" },
      { name: "glucose powder", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 100, protein: 1, carbs: 24, fat: 0, sodium: 50, potassium: 250, fiber: 0 },
    portionSize: "1 glass (250 ml)",
    preparationInstructions: "Mix glucose powder into fresh coconut water. Serve chilled or at room temperature.",
  },
  {
    name: "Sabudana (Sago) Kanji",
    type: "breakfast",
    ingredients: [
      { name: "sabudana", quantity: 40, unit: "g" },
      { name: "water", quantity: 350, unit: "ml" },
      { name: "salt", quantity: 1, unit: "g" },
    ],
    nutrition: { calories: 160, protein: 1, carbs: 38, fat: 0, sodium: 100, potassium: 30, fiber: 0 },
    portionSize: "1 bowl (300 ml)",
    preparationInstructions: "Soak sabudana 2 hrs. Cook in water with gentle stirring until completely transparent and dissolved. Season lightly. Serve as thin porridge.",
  },
]

const liquidLunches: MealTemplate[] = [
  {
    name: "Clear Vegetable Broth",
    type: "lunch",
    ingredients: [
      { name: "carrot", quantity: 30, unit: "g" },
      { name: "tomato", quantity: 30, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
      { name: "water", quantity: 400, unit: "ml" },
      { name: "salt", quantity: 1, unit: "g" },
    ],
    nutrition: { calories: 60, protein: 2, carbs: 12, fat: 1, sodium: 130, potassium: 280, fiber: 0 },
    portionSize: "1 bowl (350 ml)",
    preparationInstructions: "Boil all vegetables in water 30 min. Strain discarding all solids. Season with salt. Serve as clear broth only — no solid pieces.",
  },
  {
    name: "Tomato Rasam (Thin)",
    type: "lunch",
    ingredients: [
      { name: "tomato", quantity: 80, unit: "g" },
      { name: "toor dal water", quantity: 50, unit: "ml" },
      { name: "tamarind", quantity: 5, unit: "g" },
      { name: "cumin", quantity: 2, unit: "g" },
    ],
    nutrition: { calories: 70, protein: 3, carbs: 14, fat: 1, sodium: 120, potassium: 310, fiber: 0 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Blend boiled tomatoes, strain. Add strained dal water and tamarind extract. Temper with cumin, pepper. Boil 3 min. Strain through fine sieve before serving.",
  },
  {
    name: "Blended Dal Soup (Strained)",
    type: "lunch",
    ingredients: [
      { name: "toor dal", quantity: 40, unit: "g" },
      { name: "tomato", quantity: 30, unit: "g" },
      { name: "turmeric", quantity: 1, unit: "g" },
      { name: "salt", quantity: 1, unit: "g" },
    ],
    nutrition: { calories: 145, protein: 9, carbs: 24, fat: 1, sodium: 115, potassium: 320, fiber: 0 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Pressure cook dal and tomato with turmeric. Blend smooth, pass through fine strainer. Season with salt. Consistency must be drinkable liquid.",
  },
  {
    name: "Rice Water with Electrolytes",
    type: "lunch",
    ingredients: [
      { name: "rice", quantity: 30, unit: "g" },
      { name: "water", quantity: 400, unit: "ml" },
      { name: "salt", quantity: 1, unit: "g" },
    ],
    nutrition: { calories: 110, protein: 2, carbs: 24, fat: 0, sodium: 100, potassium: 50, fiber: 0 },
    portionSize: "1 glass (350 ml)",
    preparationInstructions: "Cook rice in water. Drain and collect the starchy water. Season with a pinch of salt. This provides easy-to-digest carbs.",
  },
  {
    name: "Spinach and Carrot Soup (Blended & Strained)",
    type: "lunch",
    ingredients: [
      { name: "spinach", quantity: 50, unit: "g" },
      { name: "carrot", quantity: 40, unit: "g" },
      { name: "water", quantity: 300, unit: "ml" },
    ],
    nutrition: { calories: 55, protein: 3, carbs: 10, fat: 1, sodium: 90, potassium: 400, fiber: 0 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Steam spinach and carrot. Blend with water until completely smooth. Strain through fine sieve until liquid is clear of fibre. Serve warm.",
  },
]

const liquidDinners: MealTemplate[] = [
  {
    name: "Blended Rice Dal Gruel",
    type: "dinner",
    ingredients: [
      { name: "rice", quantity: 40, unit: "g" },
      { name: "moong dal", quantity: 30, unit: "g" },
      { name: "turmeric", quantity: 1, unit: "g" },
      { name: "salt", quantity: 1, unit: "g" },
    ],
    nutrition: { calories: 200, protein: 8, carbs: 38, fat: 1, sodium: 115, potassium: 200, fiber: 2 },
    portionSize: "1 bowl (350 ml)",
    preparationInstructions: "Pressure cook rice and moong dal together with turmeric (5 whistles). Blend until completely smooth. Add water to achieve pourable consistency. Strain if needed. Season lightly.",
  },
  {
    name: "Carrot Tomato Soup (Blended)",
    type: "dinner",
    ingredients: [
      { name: "carrot", quantity: 60, unit: "g" },
      { name: "tomato", quantity: 50, unit: "g" },
      { name: "onion", quantity: 20, unit: "g" },
    ],
    nutrition: { calories: 65, protein: 2, carbs: 14, fat: 1, sodium: 80, potassium: 350, fiber: 0 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Cook carrots, tomatoes and onion together until very soft. Blend thoroughly until silky smooth. Strain through fine mesh. Season with minimal salt.",
  },
  {
    name: "Thin Sabudana Kheer",
    type: "dinner",
    ingredients: [
      { name: "sabudana", quantity: 30, unit: "g" },
      { name: "milk", quantity: 200, unit: "ml" },
      { name: "sugar", quantity: 10, unit: "g" },
    ],
    nutrition: { calories: 210, protein: 6, carbs: 38, fat: 4, sodium: 80, potassium: 240, fiber: 0 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Cook sabudana in milk until completely dissolved and transparent. Add sugar. Stir well and serve as thin liquid kheer. No solid sabudana pearls should remain.",
  },
  {
    name: "Clear Chicken Broth (Low Sodium)",
    type: "dinner",
    ingredients: [
      { name: "chicken", quantity: 50, unit: "g" },
      { name: "water", quantity: 400, unit: "ml" },
      { name: "ginger", quantity: 5, unit: "g" },
    ],
    nutrition: { calories: 90, protein: 9, carbs: 1, fat: 4, sodium: 110, potassium: 200, fiber: 0 },
    portionSize: "1 cup (250 ml)",
    preparationInstructions: "Simmer chicken with ginger in water 45 min. Strain broth to remove all solids. Serve clear liquid only — chicken pieces are discarded.",
  },
]

const liquidSnacks: MealTemplate[] = [
  {
    name: "Buttermilk (Thin Chaas)",
    type: "snack",
    ingredients: [
      { name: "yogurt", quantity: 50, unit: "g" },
      { name: "water", quantity: 200, unit: "ml" },
      { name: "cumin powder", quantity: 1, unit: "g" },
    ],
    nutrition: { calories: 45, protein: 2, carbs: 5, fat: 1, sodium: 50, potassium: 130, fiber: 0 },
    portionSize: "1 glass (250 ml)",
    preparationInstructions: "Whisk yogurt with water until fully liquid with no lumps. Add roasted cumin powder and a pinch of salt. Strain if needed. Serve well-diluted.",
  },
  {
    name: "Fresh Fruit Juice (Strained)",
    type: "snack",
    ingredients: [
      { name: "orange", quantity: 150, unit: "g" },
      { name: "water", quantity: 50, unit: "ml" },
    ],
    nutrition: { calories: 60, protein: 1, carbs: 14, fat: 0, sodium: 10, potassium: 230, fiber: 0 },
    portionSize: "1 glass (200 ml)",
    preparationInstructions: "Extract juice from orange. Strain through fine mesh to remove all pulp and seeds. Add water to dilute if too concentrated. No whole fruit pieces.",
  },
  {
    name: "Glucose Water",
    type: "snack",
    ingredients: [
      { name: "glucose powder", quantity: 20, unit: "g" },
      { name: "water", quantity: 200, unit: "ml" },
    ],
    nutrition: { calories: 80, protein: 0, carbs: 20, fat: 0, sodium: 10, potassium: 10, fiber: 0 },
    portionSize: "1 glass (200 ml)",
    preparationInstructions: "Dissolve glucose powder completely in water. Serve as quick energy drink.",
  },
  {
    name: "Coconut Water",
    type: "snack",
    ingredients: [
      { name: "coconut water", quantity: 250, unit: "ml" },
    ],
    nutrition: { calories: 45, protein: 2, carbs: 9, fat: 0, sodium: 25, potassium: 250, fiber: 0 },
    portionSize: "1 glass (250 ml)",
    preparationInstructions: "Serve fresh tender coconut water at room temperature or chilled. Natural electrolyte replacement.",
  },
]

// ── Dataset accessor ──────────────────────────────────────────────────────────
export interface MealDataset {
  [dietType: string]: DayTemplate;
}

/**
 * Returns a full 7-day set of meals for the given diet type,
 * selecting from the pool with day-based rotation.
 */
export function getIndianMeals(dietType: string, day: number): MealTemplate[] {
  const idx = (day - 1) % 7;

  let breakfasts: MealTemplate[];
  let lunches:    MealTemplate[];
  let dinners:    MealTemplate[];
  let snacks:     MealTemplate[];

  switch (dietType) {
    case "diabetic":
      breakfasts = diabeticBreakfasts;
      lunches    = regularLunches;   // diabetic lunches/dinners OK with regular pool
      dinners    = regularDinners;
      snacks     = regularSnacks;
      break;
    case "renal":
      breakfasts = renalBreakfasts;
      lunches    = renalLunches;
      dinners    = renalDinners;
      snacks     = renalSnacks;
      break;
    case "cardiac":
      breakfasts = cardiacBreakfasts;
      lunches    = cardiacLunches;
      dinners    = cardiacDinners;
      snacks     = cardiacSnacks;
      break;
    case "celiac":
      breakfasts = celiacBreakfasts;
      lunches    = celiacLunches;
      dinners    = celiacDinners;
      snacks     = celiacSnacks;
      break;
    case "gerd":
      breakfasts = gerdBreakfasts;
      lunches    = gerdLunches;
      dinners    = gerdDinners;
      snacks     = gerdSnacks;
      break;
    case "liquid":
    case "soft":
      breakfasts = liquidBreakfasts;
      lunches    = liquidLunches;
      dinners    = liquidDinners;
      snacks     = liquidSnacks;
      break;
    default: // "regular" or unknown
      breakfasts = regularBreakfasts;
      lunches    = regularLunches;
      dinners    = regularDinners;
      snacks     = regularSnacks;
  }

  return [
    breakfasts[idx % breakfasts.length],
    lunches[idx % lunches.length],
    dinners[idx % dinners.length],
    snacks[idx % snacks.length],
  ].map((m) => ({
    ...m,
    isValidated: false,
    validationWarnings: [],
  })) as unknown as MealTemplate[];
}

/**
 * Build a complete 7-day Indian meal plan for a patient.
 * Scales nutrition to match patient targets.
 */
export function buildIndianMealPlan(
  targets: { calories: number; protein: number; carbs: number; fat: number; sodium: number; potassium: number; fiber: number },
  dietType: string
): { day: number; date: Date; meals: MealTemplate[]; totalNutrition: typeof targets }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const meals = getIndianMeals(dietType, dayNum);

    // Scale nutrition proportionally to patient targets
    const rawTotal = meals.reduce(
      (a, m) => ({
        calories: a.calories + m.nutrition.calories,
        protein: a.protein + m.nutrition.protein,
        carbs: a.carbs + m.nutrition.carbs,
        fat: a.fat + m.nutrition.fat,
        sodium: a.sodium + m.nutrition.sodium,
        potassium: a.potassium + m.nutrition.potassium,
        fiber: a.fiber + m.nutrition.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, potassium: 0, fiber: 0 }
    );

    const scale = (field: keyof typeof targets) =>
      rawTotal[field] > 0 ? targets[field] / rawTotal[field] : 1;

    const scaled = meals.map((m) => ({
      ...m,
      nutrition: {
        calories: Math.round(m.nutrition.calories * scale("calories")),
        protein: Math.round(m.nutrition.protein * scale("protein")),
        carbs: Math.round(m.nutrition.carbs * scale("carbs")),
        fat: Math.round(m.nutrition.fat * scale("fat")),
        sodium: Math.round(m.nutrition.sodium * scale("sodium")),
        potassium: Math.round(m.nutrition.potassium * scale("potassium")),
        fiber: Math.round(m.nutrition.fiber * scale("fiber")),
      },
    }));

    return {
      day: dayNum,
      date: new Date(Date.now() + i * 86_400_000),
      meals: scaled,
      totalNutrition: {
        calories: scaled.reduce((a, m) => a + m.nutrition.calories, 0),
        protein: scaled.reduce((a, m) => a + m.nutrition.protein, 0),
        carbs: scaled.reduce((a, m) => a + m.nutrition.carbs, 0),
        fat: scaled.reduce((a, m) => a + m.nutrition.fat, 0),
        sodium: scaled.reduce((a, m) => a + m.nutrition.sodium, 0),
        potassium: scaled.reduce((a, m) => a + m.nutrition.potassium, 0),
        fiber: scaled.reduce((a, m) => a + m.nutrition.fiber, 0),
      },
    };
  });
}

export default {
  getIndianMeals,
  buildIndianMealPlan,
  regularBreakfasts,
  regularLunches,
  regularDinners,
  regularSnacks,
  diabeticBreakfasts,
};
