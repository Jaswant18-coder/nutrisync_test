/**
 * User Repository — replaces the Mongoose User model.
 * Uses Cloudflare D1 via the HTTP REST API.
 */

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { getDB, D1Row } from "../../config/d1";

export type UserRole = "admin" | "doctor" | "patient" | "kitchen_staff";

export interface IUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  patientId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Map a raw D1 row → IUser shape
function rowToUser(row: D1Row): IUser {
  return {
    _id: row.id as string,
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password as string,
    role: row.role as UserRole,
    patientId: (row.patient_id as string) ?? null,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const UserRepo = {
  async findOne(filter: { email?: string; id?: string }): Promise<IUser | null> {
    const db = getDB();
    if (filter.email) {
      const row = await db.queryOne("SELECT * FROM users WHERE email = ?", [filter.email.toLowerCase()]);
      return row ? rowToUser(row) : null;
    }
    if (filter.id) {
      const row = await db.queryOne("SELECT * FROM users WHERE id = ?", [filter.id]);
      return row ? rowToUser(row) : null;
    }
    return null;
  },

  async findById(id: string): Promise<IUser | null> {
    const db = getDB();
    const row = await db.queryOne("SELECT * FROM users WHERE id = ?", [id]);
    return row ? rowToUser(row) : null;
  },

  async create(data: { name: string; email: string; password: string; role?: UserRole; patientId?: string }): Promise<IUser> {
    const db = getDB();
    const id = uuidv4();
    const now = new Date().toISOString();
    const hashed = await bcrypt.hash(data.password, 12);
    const role = data.role ?? "doctor";
    const patientId = data.patientId ?? null;

    await db.execute(
      "INSERT INTO users (id, name, email, password, role, patient_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
      [id, data.name, data.email.toLowerCase(), hashed, role, patientId, now, now]
    );

    return { _id: id, id, name: data.name, email: data.email.toLowerCase(), password: hashed, role, patientId, isActive: true, createdAt: now, updatedAt: now };
  },

  async comparePassword(user: IUser, candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, user.password);
  },
};

export default UserRepo;
