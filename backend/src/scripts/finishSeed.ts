/**
 * Finish seeding: create patient user accounts + run diet grouping engine.
 * Run after bulkSeed if it timed out.
 */
import dotenv from "dotenv";
dotenv.config();

import UserRepo from "../db/repositories/userRepo";
import PatientRepo from "../db/repositories/patientRepo";
import { runDietGroupingEngine } from "../services/dietGroupingEngine";

async function finish() {
  // Check if patient users already exist
  const allPatients = await PatientRepo.find({ isActive: true });
  console.log(`Found ${allPatients.length} patients in DB`);

  // Create patient user accounts for first 10
  const first10 = allPatients.slice(0, 10);
  console.log(`👤 Creating ${first10.length} patient user accounts…`);

  for (const p of first10) {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("UNIQUE")) {
        console.log(`   ⧫ ${email} (already exists)`);
      } else {
        console.log(`   ✗ ${email}: ${msg.slice(0, 60)}`);
      }
    }
  }

  // Run diet grouping engine
  console.log("\n🔄 Running diet grouping engine…");
  const groups = await runDietGroupingEngine();
  console.log(`✅ ${groups.length} diet groups created\n`);

  // Print summary
  console.log("📊 Diet Group Summary:");
  console.log("─".repeat(80));
  const sorted = [...groups].sort((a, b) => b.members.length - a.members.length);
  for (const g of sorted) {
    console.log(
      `  ${g.name.padEnd(50)} ${String(g.members.length).padStart(3)} patients  ${g.groupCode}`
    );
  }
  console.log("─".repeat(80));
  console.log(`  Total groups: ${groups.length}   Total patients: ${groups.reduce((s, g) => s + g.members.length, 0)}`);

  // Print login info
  console.log("\n🔐 Patient logins (password: Patient@123):");
  for (const p of first10) {
    const email = p.name.toLowerCase().replace(/\s+/g, ".") + "@nutrisync.com";
    console.log(`  ${email}`);
  }

  process.exit(0);
}

finish().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
