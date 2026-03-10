import dotenv from "dotenv";
dotenv.config();

import { getDB } from "../config/d1";

async function main() {
  const db = getDB();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kitchen_order_status (
      id         TEXT PRIMARY KEY,
      group_code TEXT NOT NULL,
      meal_type  TEXT NOT NULL,
      date       TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending',
      updated_at TEXT NOT NULL,
      UNIQUE(group_code, meal_type, date)
    )
  `);
  console.log("✅ kitchen_order_status table created");
  process.exit(0);
}

main().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
