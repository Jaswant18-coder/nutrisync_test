import dotenv from "dotenv";
dotenv.config();

import { runDietGroupingEngine } from "../services/dietGroupingEngine";

async function main() {
  console.log("🔄 Re-running diet grouping engine…");
  const groups = await runDietGroupingEngine();
  console.log(`✅ ${groups.length} diet groups`);

  const sorted = [...groups].sort((a, b) => b.members.length - a.members.length);
  console.log("\n📊 Top 15 Diet Groups:");
  console.log("─".repeat(80));
  for (const g of sorted.slice(0, 15)) {
    console.log(
      `  ${g.name.padEnd(50)} ${String(g.members.length).padStart(4)} patients`
    );
  }
  console.log("─".repeat(80));
  const total = groups.reduce((s, g) => s + g.members.length, 0);
  console.log(`  Total groups: ${groups.length}   Total patients: ${total}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
