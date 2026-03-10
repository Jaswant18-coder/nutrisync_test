/**
 * Patient Repository — replaces the Mongoose Patient model.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB, D1Row } from "../../config/d1";

export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type DietType =
  | "regular" | "diabetic" | "renal" | "cardiac" | "liquid" | "soft"
  | "vegetarian" | "vegan" | "low_sodium" | "low_potassium" | "high_protein";

export interface INutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium: number;
  fiber: number;
}

export interface IPatient {
  _id: string;
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
  roomNumber?: string;
  ward?: string;
  height: number;
  weight: number;
  bmi: number;
  bmiCategory: string;
  bmr: number;
  activityLevel: ActivityLevel;
  diagnosis: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  foodPreferences: string[];
  currentDietType: DietType;
  texture: "regular" | "soft" | "minced" | "liquid";
  nutritionTargets: INutritionTargets;
  admissionDate: string;
  dischargeDate?: string;
  phone?: string;
  patientType?: "inpatient" | "outpatient";
  isActive: boolean;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
}

function rowToPatient(row: D1Row): IPatient {
  return {
    _id: row.id as string,
    id: row.id as string,
    patientId: row.patient_id as string,
    name: row.name as string,
    age: row.age as number,
    gender: row.gender as Gender,
    roomNumber: row.room_number as string | undefined,
    ward: row.ward as string | undefined,
    height: row.height as number,
    weight: row.weight as number,
    bmi: row.bmi as number,
    bmiCategory: row.bmi_category as string,
    bmr: row.bmr as number,
    activityLevel: row.activity_level as ActivityLevel,
    diagnosis: JSON.parse((row.diagnosis as string) || "[]"),
    allergies: JSON.parse((row.allergies as string) || "[]"),
    dietaryRestrictions: JSON.parse((row.dietary_restrictions as string) || "[]"),
    foodPreferences: JSON.parse((row.food_preferences as string) || "[]"),
    currentDietType: row.current_diet_type as DietType,
    texture: row.texture as IPatient["texture"],
    nutritionTargets: JSON.parse((row.nutrition_targets as string) || "{}"),
    admissionDate: row.admission_date as string,
    dischargeDate: row.discharge_date as string | undefined,
    phone: row.phone as string | undefined,
    patientType: ((row.patient_type as string) ?? "inpatient") as "inpatient" | "outpatient",
    isActive: Boolean(row.is_active),
    doctorId: row.doctor_id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Auto-increment patient ID as NS-0001, NS-0002 …
async function nextPatientId(): Promise<string> {
  const db = getDB();
  const row = await db.queryOne<{ cnt: number }>("SELECT COUNT(*) as cnt FROM patients");
  const num = ((row?.cnt ?? 0) as number) + 1;
  return `NS-${String(num).padStart(4, "0")}`;
}

const PatientRepo = {
  async find(filter: { isActive?: boolean; doctorId?: string; ward?: string } = {}): Promise<IPatient[]> {
    const db = getDB();
    const clauses: string[] = [];
    const params: unknown[] = [];

    if (filter.isActive !== undefined) { clauses.push("is_active = ?"); params.push(filter.isActive ? 1 : 0); }
    if (filter.doctorId) { clauses.push("doctor_id = ?"); params.push(filter.doctorId); }
    if (filter.ward) { clauses.push("ward = ?"); params.push(filter.ward); }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await db.query(`SELECT * FROM patients ${where} ORDER BY created_at DESC`, params);
    return rows.map(rowToPatient);
  },

  async findById(id: string): Promise<IPatient | null> {
    const db = getDB();
    const row = await db.queryOne("SELECT * FROM patients WHERE id = ?", [id]);
    return row ? rowToPatient(row) : null;
  },

  async create(data: Omit<IPatient, "_id" | "id" | "patientId" | "createdAt" | "updatedAt">): Promise<IPatient> {
    const db = getDB();
    const id = uuidv4();
    const patientId = await nextPatientId();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO patients (
        id, patient_id, name, age, gender, room_number, ward,
        height, weight, bmi, bmi_category, bmr, activity_level,
        diagnosis, allergies, dietary_restrictions, food_preferences,
        current_diet_type, texture, nutrition_targets,
        admission_date, discharge_date, phone, patient_type, is_active, doctor_id,
        created_at, updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, patientId, data.name, data.age, data.gender,
        data.roomNumber ?? null, data.ward ?? null,
        data.height, data.weight, data.bmi, data.bmiCategory, data.bmr,
        data.activityLevel,
        JSON.stringify(data.diagnosis),
        JSON.stringify(data.allergies),
        JSON.stringify(data.dietaryRestrictions),
        JSON.stringify(data.foodPreferences),
        data.currentDietType, data.texture,
        JSON.stringify(data.nutritionTargets),
        data.admissionDate,
        data.dischargeDate ?? null,
        data.phone ?? null,
        data.patientType ?? "inpatient",
        data.isActive ? 1 : 0,
        data.doctorId,
        now, now,
      ]
    );

    return { ...data, _id: id, id, patientId, createdAt: now, updatedAt: now };
  },

  async update(id: string, updates: Partial<IPatient>): Promise<IPatient | null> {
    const db = getDB();
    const now = new Date().toISOString();
    const sets: string[] = [];
    const params: unknown[] = [];

    const map: Record<string, string> = {
      name: "name", age: "age", gender: "gender",
      roomNumber: "room_number", ward: "ward",
      height: "height", weight: "weight", bmi: "bmi",
      bmiCategory: "bmi_category", bmr: "bmr",
      activityLevel: "activity_level",
      currentDietType: "current_diet_type",
      texture: "texture", isActive: "is_active",
      admissionDate: "admission_date", dischargeDate: "discharge_date",
      phone: "phone",
      patientType: "patient_type",
      doctorId: "doctor_id",
    };

    for (const [key, col] of Object.entries(map)) {
      if (updates[key as keyof IPatient] !== undefined) {
        sets.push(`${col} = ?`);
        let val = updates[key as keyof IPatient];
        if (key === "isActive") val = val ? 1 : 0;
        params.push(val as unknown);
      }
    }

    // JSON fields
    for (const [key, col] of [
      ["diagnosis", "diagnosis"], ["allergies", "allergies"],
      ["dietaryRestrictions", "dietary_restrictions"],
      ["foodPreferences", "food_preferences"],
      ["nutritionTargets", "nutrition_targets"],
    ] as [string, string][]) {
      if (updates[key as keyof IPatient] !== undefined) {
        sets.push(`${col} = ?`);
        params.push(JSON.stringify(updates[key as keyof IPatient]));
      }
    }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = ?");
    params.push(now);
    params.push(id);

    await db.execute(`UPDATE patients SET ${sets.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  },

  async deleteMany(filter: { isActive?: boolean } = {}): Promise<void> {
    const db = getDB();
    if (filter.isActive !== undefined) {
      await db.execute("DELETE FROM patients WHERE is_active = ?", [filter.isActive ? 1 : 0]);
    } else {
      await db.execute("DELETE FROM patients", []);
    }
  },
};

export default PatientRepo;
