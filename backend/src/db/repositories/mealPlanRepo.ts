/**
 * MealPlan Repository — replaces the Mongoose MealPlan model.
 * Stores the full 7-day plan as a JSON blob in the `days` column.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB, D1Row } from "../../config/d1";

export interface IMealIngredient {
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface IMealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium: number;
  fiber: number;
}

export interface IMealItem {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients: IMealIngredient[];
  nutrition: IMealNutrition;
  preparationInstructions: string;
  portionSize: string;
  isValidated: boolean;
  validationWarnings: string[];
}

export interface IDayPlan {
  day: number;
  date: Date | string;
  meals: IMealItem[];
  totalNutrition: IMealNutrition;
}

export interface IMealPlan {
  _id: string;
  id: string;
  patientId: string;
  dietGroupId?: string;
  weekStartDate: string;
  weekEndDate: string;
  days: IDayPlan[];
  status: "draft" | "active" | "completed" | "cancelled";
  generatedBy: "ai" | "manual";
  aiPromptUsed?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  patient?: { name: string; patientId: string; nutritionTargets?: unknown };
}

function rowToPlan(row: D1Row): IMealPlan {
  return {
    _id: row.id as string,
    id: row.id as string,
    patientId: row.patient_id as string,
    dietGroupId: row.diet_group_id as string | undefined,
    weekStartDate: row.week_start_date as string,
    weekEndDate: row.week_end_date as string,
    days: JSON.parse((row.days as string) || "[]"),
    status: row.status as IMealPlan["status"],
    generatedBy: row.generated_by as "ai" | "manual",
    aiPromptUsed: row.ai_prompt_used as string | undefined,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const MealPlanRepo = {
  async find(filter: { patientId?: string; status?: string } = {}): Promise<IMealPlan[]> {
    const db = getDB();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter.patientId) { clauses.push("patient_id = ?"); params.push(filter.patientId); }
    if (filter.status) { clauses.push("status = ?"); params.push(filter.status); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await db.query(`SELECT * FROM meal_plans ${where} ORDER BY created_at DESC`, params);
    return rows.map(rowToPlan);
  },

  async findById(id: string): Promise<IMealPlan | null> {
    const db = getDB();
    const row = await db.queryOne("SELECT * FROM meal_plans WHERE id = ?", [id]);
    return row ? rowToPlan(row) : null;
  },

  async create(data: {
    patientId: string;
    dietGroupId?: string;
    weekStartDate: Date | string;
    weekEndDate: Date | string;
    days: IDayPlan[];
    status: string;
    generatedBy: string;
    aiPromptUsed?: string;
    createdBy: string;
  }): Promise<IMealPlan> {
    const db = getDB();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO meal_plans (id, patient_id, diet_group_id, week_start_date, week_end_date, days, status, generated_by, ai_prompt_used, created_by, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.patientId, data.dietGroupId ?? null,
        new Date(data.weekStartDate).toISOString(),
        new Date(data.weekEndDate).toISOString(),
        JSON.stringify(data.days),
        data.status, data.generatedBy, data.aiPromptUsed ?? null,
        data.createdBy, now, now,
      ]
    );

    return rowToPlan({
      id, patient_id: data.patientId, diet_group_id: data.dietGroupId ?? null,
      week_start_date: new Date(data.weekStartDate).toISOString(),
      week_end_date: new Date(data.weekEndDate).toISOString(),
      days: JSON.stringify(data.days),
      status: data.status, generated_by: data.generatedBy,
      ai_prompt_used: data.aiPromptUsed ?? null,
      created_by: data.createdBy, created_at: now, updated_at: now,
    });
  },

  async updateMany(filter: { patientId?: string; status?: string }, updates: { status: string }): Promise<void> {
    const db = getDB();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter.patientId) { clauses.push("patient_id = ?"); params.push(filter.patientId); }
    if (filter.status) { clauses.push("status = ?"); params.push(filter.status); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const now = new Date().toISOString();
    // params currently holds only WHERE clause values; SET values go first
    await db.execute(
      `UPDATE meal_plans SET status = ?, updated_at = ? ${where}`,
      [updates.status, now, ...params]
    );
  },

  async updateStatus(id: string, status: string): Promise<IMealPlan | null> {
    const db = getDB();
    const now = new Date().toISOString();
    await db.execute("UPDATE meal_plans SET status = ?, updated_at = ? WHERE id = ?", [status, now, id]);
    return this.findById(id);
  },
};

export default MealPlanRepo;
