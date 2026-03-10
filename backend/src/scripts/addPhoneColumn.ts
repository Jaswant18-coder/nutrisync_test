/**
 * NutriSync — Migration: Add `phone` column to patients table
 * and backfill with Indian phone numbers for all 50 seeded patients.
 *
 * Run: npx ts-node --transpile-only src/scripts/addPhoneColumn.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { getDB } from "../config/d1";

async function main() {
  const db = getDB();

  // 1. Add the phone column (IF NOT EXISTS isn't supported for ALTER TABLE in SQLite,
  //    so we catch the "duplicate column" error gracefully)
  try {
    await db.execute("ALTER TABLE patients ADD COLUMN phone TEXT", []);
    console.log("✅ Added `phone` column to patients table.");
  } catch (err: unknown) {
    const msg = (err as Error).message ?? "";
    if (msg.includes("duplicate column")) {
      console.log("ℹ️  `phone` column already exists — skipping ALTER.");
    } else {
      throw err;
    }
  }

  // 2. Fetch all patients without a phone number
  const patients = await db.query(
    "SELECT id, name FROM patients WHERE phone IS NULL OR phone = ''",
    []
  );

  if (patients.length === 0) {
    console.log("ℹ️  All patients already have phone numbers.");
    return;
  }

  console.log(`📱 Backfilling phone numbers for ${patients.length} patients…`);

  // Generate realistic Indian mobile numbers (+91 9XXXXXXXXX)
  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    // Generate a deterministic but realistic phone number
    const suffix = String(9000000001 + i);
    const phone = `+91${suffix}`;

    await db.execute("UPDATE patients SET phone = ? WHERE id = ?", [phone, p.id]);
  }

  console.log(`✅ Backfilled phone numbers for ${patients.length} patients.`);

  // 3. Verify
  const check = await db.query(
    "SELECT name, phone FROM patients WHERE phone IS NOT NULL LIMIT 5",
    []
  );
  console.log("\n📋 Sample:");
  for (const row of check) {
    console.log(`   ${row.name}: ${row.phone}`);
  }
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
