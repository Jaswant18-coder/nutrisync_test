/**
 * MealTracking Repository — replaces the Mongoose MealTracking model.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB, D1Row } from "../../config/d1";

export type MealStatus = "pending" | "eaten" | "partial" | "refused";

export interface IMealConsumption {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealName: string;
  status: MealStatus;
  portionConsumed: number;
  caloriesConsumed: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  refusalReason?: string;
  recordedAt: string;
}

export interface IMealTracking {
  _id: string;
  id: string;
  patientId: string;
  mealPlanId: string;
  date: string;
  consumption: IMealConsumption[];
  totalCaloriesConsumed: number;
  totalProteinConsumed: number;
  totalCarbsConsumed: number;
  totalFatConsumed: number;
  complianceScore: number;
  hasAlert: boolean;
  alertMessage?: string;
  createdAt: string;
  updatedAt: string;
}

function rowToTracking(row: D1Row): IMealTracking {
  return {
    _id: row.id as string,
    id: row.id as string,
    patientId: row.patient_id as string,
    mealPlanId: row.meal_plan_id as string,
    date: row.date as string,
    consumption: JSON.parse((row.consumption as string) || "[]"),
    totalCaloriesConsumed: row.total_calories_consumed as number,
    totalProteinConsumed: row.total_protein_consumed as number,
    totalCarbsConsumed: row.total_carbs_consumed as number,
    totalFatConsumed: row.total_fat_consumed as number,
    complianceScore: row.compliance_score as number,
    hasAlert: Boolean(row.has_alert),
    alertMessage: row.alert_message as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const TrackingRepo = {
  async find(filter: { patientId?: string; dateFrom?: string; dateTo?: string } = {}): Promise<IMealTracking[]> {
    const db = getDB();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter.patientId) { clauses.push("patient_id = ?"); params.push(filter.patientId); }
    if (filter.dateFrom) { clauses.push("date >= ?"); params.push(filter.dateFrom); }
    if (filter.dateTo) { clauses.push("date <= ?"); params.push(filter.dateTo); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await db.query(`SELECT * FROM meal_tracking ${where} ORDER BY date DESC`, params);
    return rows.map(rowToTracking);
  },

  async findById(id: string): Promise<IMealTracking | null> {
    const db = getDB();
    const row = await db.queryOne("SELECT * FROM meal_tracking WHERE id = ?", [id]);
    return row ? rowToTracking(row) : null;
  },

  async findOne(patientId: string, date: string): Promise<IMealTracking | null> {
    const db = getDB();
    // date is ISO date string YYYY-MM-DD
    const datePrefix = date.substring(0, 10);
    const row = await db.queryOne(
      "SELECT * FROM meal_tracking WHERE patient_id = ? AND date LIKE ?",
      [patientId, `${datePrefix}%`]
    );
    return row ? rowToTracking(row) : null;
  },

  async create(data: Omit<IMealTracking, "_id" | "id" | "createdAt" | "updatedAt">): Promise<IMealTracking> {
    const db = getDB();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO meal_tracking (
        id, patient_id, meal_plan_id, date, consumption,
        total_calories_consumed, total_protein_consumed, total_carbs_consumed, total_fat_consumed,
        compliance_score, has_alert, alert_message, created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.patientId, data.mealPlanId, data.date,
        JSON.stringify(data.consumption),
        data.totalCaloriesConsumed, data.totalProteinConsumed,
        data.totalCarbsConsumed, data.totalFatConsumed,
        data.complianceScore, data.hasAlert ? 1 : 0,
        data.alertMessage ?? null, now, now,
      ]
    );

    return { ...data, _id: id, id, createdAt: now, updatedAt: now };
  },

  async update(id: string, data: Partial<IMealTracking>): Promise<IMealTracking | null> {
    const db = getDB();
    const now = new Date().toISOString();
    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.consumption !== undefined) {
      sets.push("consumption = ?"); params.push(JSON.stringify(data.consumption));
    }
    const numMap: Record<string, string> = {
      totalCaloriesConsumed: "total_calories_consumed",
      totalProteinConsumed: "total_protein_consumed",
      totalCarbsConsumed: "total_carbs_consumed",
      totalFatConsumed: "total_fat_consumed",
      complianceScore: "compliance_score",
    };
    for (const [key, col] of Object.entries(numMap)) {
      if (data[key as keyof IMealTracking] !== undefined) {
        sets.push(`${col} = ?`); params.push(data[key as keyof IMealTracking]);
      }
    }
    if (data.hasAlert !== undefined) { sets.push("has_alert = ?"); params.push(data.hasAlert ? 1 : 0); }
    if (data.alertMessage !== undefined) { sets.push("alert_message = ?"); params.push(data.alertMessage); }

    if (sets.length === 0) return this.findById(id);
    sets.push("updated_at = ?"); params.push(now, id);
    await db.execute(`UPDATE meal_tracking SET ${sets.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  },
};

export default TrackingRepo;
