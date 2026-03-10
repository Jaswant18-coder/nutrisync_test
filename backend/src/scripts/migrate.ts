/**
 * NutriSync — D1 Migration Script
 * Applies schema.sql to the Cloudflare D1 database.
 * Run: npm run migrate
 */

import dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import * as path from "path";
import { getDB } from "../config/d1";

async function migrate() {
  const schemaPath = path.resolve(__dirname, "../../db/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  // Split on semicolons, strip comment lines, skip empty statements
  const statements = sql
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0);

  console.log(`🔄 Applying ${statements.length} SQL statements to D1...`);

  const db = getDB();
  for (const stmt of statements) {
    try {
      await db.execute(stmt);
      console.log(`  ✅ ${stmt.slice(0, 60).replace(/\n/g, " ")}...`);
    } catch (err: unknown) {
      // D1 throws if table already exists — warn and continue
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`  ⚠️  ${msg}`);
    }
  }

  console.log("\n🎉 Migration complete!");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
