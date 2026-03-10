/**
 * Suggestion Repository — patient-to-kitchen suggestions.
 */

import { v4 as uuidv4 } from "uuid";
import { getDB, D1Row } from "../../config/d1";

export interface ISuggestion {
  _id: string;
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  status: "new" | "acknowledged" | "considered" | "responded";
  response?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

function rowToSuggestion(row: D1Row): ISuggestion {
  return {
    _id: row.id as string,
    id: row.id as string,
    patientId: row.patient_id as string,
    patientName: row.patient_name as string,
    message: row.message as string,
    status: row.status as ISuggestion["status"],
    response: row.response as string | undefined,
    respondedBy: row.responded_by as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const SuggestionRepo = {
  async find(filter: { patientId?: string; status?: string } = {}): Promise<ISuggestion[]> {
    const db = getDB();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (filter.patientId) { clauses.push("patient_id = ?"); params.push(filter.patientId); }
    if (filter.status) { clauses.push("status = ?"); params.push(filter.status); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await db.query(`SELECT * FROM suggestions ${where} ORDER BY created_at DESC`, params);
    return rows.map(rowToSuggestion);
  },

  async findById(id: string): Promise<ISuggestion | null> {
    const db = getDB();
    const row = await db.queryOne("SELECT * FROM suggestions WHERE id = ?", [id]);
    return row ? rowToSuggestion(row) : null;
  },

  async create(data: { patientId: string; patientName: string; message: string }): Promise<ISuggestion> {
    const db = getDB();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO suggestions (id, patient_id, patient_name, message, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?)`,
      [id, data.patientId, data.patientName, data.message, "new", now, now]
    );

    return rowToSuggestion({
      id, patient_id: data.patientId, patient_name: data.patientName,
      message: data.message, status: "new",
      response: null, responded_by: null,
      created_at: now, updated_at: now,
    });
  },

  async updateStatus(id: string, status: string, response?: string, respondedBy?: string): Promise<ISuggestion | null> {
    const db = getDB();
    const now = new Date().toISOString();
    await db.execute(
      `UPDATE suggestions SET status = ?, response = ?, responded_by = ?, updated_at = ? WHERE id = ?`,
      [status, response ?? null, respondedBy ?? null, now, id]
    );
    return this.findById(id);
  },

  async countByStatus(status: string): Promise<number> {
    const db = getDB();
    const row = await db.queryOne<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM suggestions WHERE status = ?", [status]
    );
    return (row?.cnt ?? 0) as number;
  },
};

export default SuggestionRepo;
