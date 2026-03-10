import dotenv from "dotenv";
dotenv.config();
import { getDB } from "../config/d1";

async function migrate() {
  const db = getDB();
  await db.execute(`ALTER TABLE diet_groups ADD COLUMN forbidden_foods TEXT DEFAULT '[]'`);
  console.log("✅ Added forbidden_foods column to diet_groups");
  process.exit(0);
}
migrate().catch((e) => { console.error(e.message); process.exit(1); });
