/**
 * Re-run regrouping and verify allergy filtering works.
 */
import "dotenv/config";
import "../config/d1";                    // init D1
import { runDietGroupingEngine } from "../services/dietGroupingEngine";
import { getIndianMeals } from "../data/indianMealDataset";

async function main() {
  console.log("=== Re-running diet grouping engine ===");
  const groups = await runDietGroupingEngine();
  console.log(`✅ Created ${groups.length} groups\n`);

  // Show allergy groups
  const allergyGroups = groups.filter((g) => g.forbiddenFoods.length > 0);
  console.log(`Groups with forbidden foods: ${allergyGroups.length}`);
  for (const g of allergyGroups) {
    console.log(`  ${g.groupCode} | ${g.name}`);
    console.log(`    Forbidden: [${g.forbiddenFoods.join(", ")}]`);
    console.log(`    Members: ${g.members.length}`);
  }

  // Test meal filtering for dairy-allergic groups
  console.log("\n=== Checking meal safety for dairy-allergic groups ===");
  const dairyGroups = allergyGroups.filter((g) =>
    g.forbiddenFoods.some((f) => f === "yogurt" || f === "curd" || f === "paneer" || f === "ghee")
  );

  const PLANT_SAFE = ["coconut milk", "almond milk", "soy milk", "oat milk", "rice milk"];

  for (const g of dairyGroups) {
    console.log(`\nGroup: ${g.name} (${g.dietType})`);
    for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
      // Check all 7 days
      for (let d = 1; d <= 7; d++) {
        const meals = getIndianMeals(g.dietType, d);
        const meal = meals.find((m) => m.type === mealType);
        if (!meal) continue;

        const unsafe = meal.ingredients.filter((ing) => {
          const ingLower = ing.name.toLowerCase();
          if (PLANT_SAFE.some((p) => ingLower.includes(p))) return false;
          return g.forbiddenFoods.some((f) => ingLower.includes(f.toLowerCase()));
        });

        if (unsafe.length > 0) {
          console.log(`  ⚠️  Day ${d} ${mealType}: "${meal.name}" has forbidden: ${unsafe.map((i) => i.name).join(", ")}`);
        }
      }
    }

    // Show what the kitchen would serve today
    const today = new Date().getDay() || 7;
    console.log(`  Today (day ${today}) — safe meals the kitchen would pick:`);
    for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
      const defaultMeals = getIndianMeals(g.dietType, today);
      const defaultMeal = defaultMeals.find((m) => m.type === mealType)!;
      const defaultSafe = !defaultMeal.ingredients.some((ing) => {
        const ingLower = ing.name.toLowerCase();
        if (PLANT_SAFE.some((p) => ingLower.includes(p))) return false;
        return g.forbiddenFoods.some((f) => ingLower.includes(f.toLowerCase()));
      });

      if (defaultSafe) {
        console.log(`    ✅ ${mealType}: ${defaultMeal.name}`);
      } else {
        // Find alternative
        let found = false;
        for (let d = 1; d <= 7; d++) {
          if (d === today) continue;
          const altMeals = getIndianMeals(g.dietType, d);
          const alt = altMeals.find((m) => m.type === mealType);
          if (alt) {
            const altSafe = !alt.ingredients.some((ing) => {
              const ingLower = ing.name.toLowerCase();
              if (PLANT_SAFE.some((p) => ingLower.includes(p))) return false;
              return g.forbiddenFoods.some((f) => ingLower.includes(f.toLowerCase()));
            });
            if (altSafe) {
              console.log(`    🔄 ${mealType}: ${defaultMeal.name} → ${alt.name} (swapped from day ${d})`);
              found = true;
              break;
            }
          }
        }
        if (!found) {
          console.log(`    ❌ ${mealType}: ${defaultMeal.name} (NO safe alternative found!)`);
        }
      }
    }
  }

  console.log("\n✅ Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
