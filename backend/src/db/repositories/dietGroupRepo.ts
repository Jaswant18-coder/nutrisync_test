/**
 * DietGroup Repository — replaces the Mongoose DietGroup model.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB, D1Row } from "../../config/d1";
import { DietType } from "./patientRepo";

export interface IPatientGroupMember {
  patientId: string;       // internal DB id
  nsId?: string;           // NS-XXX display ID
  portionMultiplier: number;
}

export interface IDietGroup {
  _id: string;
  id: string;
  groupCode: string;
  name: string;
  description?: string;
  dietType: DietType;
  texture: "regular" | "soft" | "minced" | "liquid";
  calorieRangeMin: number;
  calorieRangeMax: number;
  restrictions: string[];
  forbiddenFoods: string[];
  preferenceType: string;
  members: IPatientGroupMember[];
  baseMealPlanId?: string;
  ward?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function rowToGroup(row: D1Row): IDietGroup {
  return {
    _id: row.id as string,
    id: row.id as string,
    groupCode: row.group_code as string,
    name: row.name as string,
    description: row.description as string | undefined,
    dietType: row.diet_type as DietType,
    texture: row.texture as IDietGroup["texture"],
    calorieRangeMin: row.calorie_range_min as number,
    calorieRangeMax: row.calorie_range_max as number,
    restrictions: JSON.parse((row.restrictions as string) || "[]"),
    forbiddenFoods: JSON.parse((row.forbidden_foods as string) || "[]"),
    preferenceType: row.preference_type as string,
    members: JSON.parse((row.members as string) || "[]"),
    baseMealPlanId: row.base_meal_plan_id as string | undefined,
    ward: row.ward as string | undefined,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const DietGroupRepo = {
  async find(filter: { isActive?: boolean; ward?: string } = {}): Promise<IDietGroup[]> {
    const db = getDB();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter.isActive !== undefined) { clauses.push("is_active = ?"); params.push(filter.isActive ? 1 : 0); }
    if (filter.ward) { clauses.push("ward = ?"); params.push(filter.ward); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await db.query(`SELECT * FROM diet_groups ${where} ORDER BY name ASC`, params);
    return rows.map(rowToGroup);
  },

  async findById(id: string): Promise<IDietGroup | null> {
    const db = getDB();
    const row = await db.queryOne("SELECT * FROM diet_groups WHERE id = ?", [id]);
    return row ? rowToGroup(row) : null;
  },

  async findOne(filter: { groupCode?: string }): Promise<IDietGroup | null> {
    const db = getDB();
    if (filter.groupCode) {
      const row = await db.queryOne("SELECT * FROM diet_groups WHERE group_code = ?", [filter.groupCode]);
      return row ? rowToGroup(row) : null;
    }
    return null;
  },

  async upsert(data: Partial<IDietGroup> & { groupCode: string }): Promise<IDietGroup> {
    const existing = await this.findOne({ groupCode: data.groupCode });
    if (existing) {
      return (await this.update(existing.id, data)) as IDietGroup;
    }
    return this.create(data as IDietGroup);
  },

  async create(data: Omit<IDietGroup, "_id" | "id" | "createdAt" | "updatedAt"> & { isActive?: boolean }): Promise<IDietGroup> {
    const db = getDB();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO diet_groups (id, group_code, name, description, diet_type, texture, calorie_range_min, calorie_range_max, restrictions, forbidden_foods, preference_type, members, base_meal_plan_id, ward, is_active, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.groupCode, data.name, data.description ?? null,
        data.dietType, data.texture ?? "regular",
        data.calorieRangeMin, data.calorieRangeMax,
        JSON.stringify(data.restrictions ?? []),
        JSON.stringify(data.forbiddenFoods ?? []),
        data.preferenceType ?? "non-vegetarian",
        JSON.stringify(data.members ?? []),
        data.baseMealPlanId ?? null,
        data.ward ?? null,
        (data.isActive ?? true) ? 1 : 0,
        now, now,
      ]
    );

    return { ...data, _id: id, id, isActive: data.isActive ?? true, createdAt: now, updatedAt: now };
  },

  async update(id: string, data: Partial<IDietGroup>): Promise<IDietGroup | null> {
    const db = getDB();
    const now = new Date().toISOString();
    const colMap: Record<string, string> = {
      groupCode: "group_code", name: "name", description: "description",
      dietType: "diet_type", texture: "texture",
      calorieRangeMin: "calorie_range_min", calorieRangeMax: "calorie_range_max",
      preferenceType: "preference_type", baseMealPlanId: "base_meal_plan_id",
      ward: "ward", isActive: "is_active",
    };
    const sets: string[] = [];
    const params: unknown[] = [];
    for (const [key, col] of Object.entries(colMap)) {
      if (data[key as keyof IDietGroup] !== undefined) {
        sets.push(`${col} = ?`);
        let val = data[key as keyof IDietGroup];
        if (key === "isActive") val = val ? 1 : 0;
        params.push(val as unknown);
      }
    }
    for (const [key, col] of [["restrictions", "restrictions"], ["forbiddenFoods", "forbidden_foods"], ["members", "members"]] as [string, string][]) {
      if (data[key as keyof IDietGroup] !== undefined) {
        sets.push(`${col} = ?`); params.push(JSON.stringify(data[key as keyof IDietGroup]));
      }
    }
    if (sets.length === 0) return this.findById(id);
    sets.push("updated_at = ?"); params.push(now, id);
    await db.execute(`UPDATE diet_groups SET ${sets.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  },

  async deactivate(id: string): Promise<void> {
    const db = getDB();
    await db.execute("UPDATE diet_groups SET is_active = 0, updated_at = ? WHERE id = ?", [new Date().toISOString(), id]);
  },
};

export default DietGroupRepo;
