import axios from "axios"
import type {
  AuthUser, Patient, MealPlan, MealTracking, Ingredient, DietGroup, WeeklyReport,
  PatientSummary, Suggestion, ChatMessage,
} from "../types"

const BASE = import.meta.env.VITE_API_URL ?? "/api"

const api = axios.create({ baseURL: BASE })

// Read token from ns_token key (set on login) OR from Zustand persist storage
function getToken(): string | null {
  const direct = localStorage.getItem("ns_token")
  if (direct) return direct
  try {
    const zustand = localStorage.getItem("nutrisync-auth")
    if (zustand) return JSON.parse(zustand)?.state?.token ?? null
  } catch { /* ignore parse errors */ }
  return null
}

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes("/auth/")) {
      localStorage.removeItem("ns_token")
      localStorage.removeItem("nutrisync-auth")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password }),
  register: (name: string, email: string, password: string, role?: string) =>
    api.post<{ token: string; user: AuthUser }>("/auth/register", { name, email, password, role }),
}

// ── Patients ──────────────────────────────────────────────────────────────────
export const patientAPI = {
  list: () => api.get<Patient[]>("/patients"),
  get: (id: string) => api.get<Patient>(`/patients/${id}`),
  create: (data: Partial<Patient> & { diagnosis?: string[] }) =>
    api.post<Patient>("/patients", data),
  update: (id: string, data: Partial<Patient>) =>
    api.put<Patient>(`/patients/${id}`, data),
  setDietMode: (id: string, mode: "solid" | "liquid") =>
    api.patch<Patient>(`/patients/${id}/diet-mode`, { mode }),
  discharge: (id: string) => api.patch<Patient>(`/patients/${id}/discharge`, {}),
  readmit: (id: string, data?: { roomNumber?: string; ward?: string; admissionDate?: string }) =>
    api.patch<Patient>(`/patients/${id}/readmit`, data ?? {}),
  deactivate: (id: string) => api.delete(`/patients/${id}`),
}

// ── Meal plans ────────────────────────────────────────────────────────────────
export const mealPlanAPI = {
  list: (patientId?: string) =>
    api.get<MealPlan[]>("/meal-plans", { params: { patientId } }),
  get: (id: string) => api.get<MealPlan>(`/meal-plans/${id}`),
  generate: (patientId: string, language?: string) =>
    api.post<{ plan: MealPlan; source: string }>("/meal-plans/generate", {
      patientId,
      language,
    }),
  today: (id: string) => api.get(`/meal-plans/${id}/today`),
  update: (id: string, data: Partial<MealPlan>) =>
    api.put<MealPlan>(`/meal-plans/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/meal-plans/${id}/status`, { status }),
}

// ── Tracking ──────────────────────────────────────────────────────────────────
export const trackingAPI = {
  list: (params?: { patientId?: string; date?: string }) =>
    api.get<MealTracking[]>("/tracking", { params }),
  record: (data: {
    patientId: string
    mealPlanId: string
    date: string
    mealType: string
    status: string
    portionConsumed?: number
    refusalReason?: string
  }) => api.post<MealTracking>("/tracking", data),
}

// ── Inventory ────────────────────────────────────────────────────────────────
export const inventoryAPI = {
  list: () => api.get<Ingredient[]>("/inventory"),
  lowStock: () => api.get<Ingredient[]>("/inventory/low-stock"),
  create: (data: Partial<Ingredient>) => api.post<Ingredient>("/inventory", data),
  update: (id: string, data: Partial<Ingredient>) =>
    api.put<Ingredient>(`/inventory/${id}`, data),
  updateStock: (id: string, stockQty: number) =>
    api.patch(`/inventory/${id}/stock`, { stockQty }),
  remove: (id: string) => api.delete(`/inventory/${id}`),
}

// ── Diet groups ───────────────────────────────────────────────────────────────
export const dietGroupAPI = {
  list: (ward?: string) =>
    api.get<DietGroup[]>("/diet-groups", { params: { ward } }),
  get: (id: string) => api.get<DietGroup>(`/diet-groups/${id}`),
}

// ── Kitchen ───────────────────────────────────────────────────────────────────
export const kitchenAPI = {
  production: (ward?: string) =>
    api.get("/kitchen/production", { params: { ward } }),
  regroup: (ward?: string) =>
    api.post("/kitchen/regroup", null, { params: { ward } }),
  todayPlans: () => api.get("/kitchen/meal-plans/today"),
  orders: (mealType?: string, ward?: string) =>
    api.get("/kitchen/orders", { params: { mealType, ward } }),
  updateStatus: (groupCode: string, mealType: string, status: string) =>
    api.post("/kitchen/orders/status", { groupCode, mealType, status }),
  completeOrder: (groupCode: string, mealType: string) =>
    api.post("/kitchen/orders/complete", { groupCode, mealType }),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  weekly: (patientId: string, from?: string, to?: string) =>
    api.get<WeeklyReport>(`/reports/weekly/${patientId}`, {
      params: { from, to },
    }),
  wardSummary: (ward?: string) =>
    api.get("/reports/ward-summary", { params: { ward } }),
  summary: (days?: number) =>
    api.get<PatientSummary[]>("/reports/summary", { params: { days } }),
}

// ── Suggestions ───────────────────────────────────────────────────────────────
export const suggestionAPI = {
  list: (params?: { patientId?: string; status?: string }) =>
    api.get<Suggestion[]>("/suggestions", { params }),
  count: () => api.get<{ count: number }>("/suggestions/count"),
  create: (data: { patientId: string; message: string }) =>
    api.post<Suggestion>("/suggestions", data),
  updateStatus: (id: string, status: string, response?: string) =>
    api.patch<Suggestion>(`/suggestions/${id}`, { status, response }),
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const chatAPI = {
  send: (patientId: string, message: string) =>
    api.post<{ reply: string; source: string }>("/chat", { patientId, message }),
  history: (patientId: string) =>
    api.get<ChatMessage[]>(`/chat/history/${patientId}`),
}

// ── Patient self-service (/me) ────────────────────────────────────────────────
export const meAPI = {
  profile: () => api.get<Patient>("/me/profile"),
  mealPlan: () => api.get<MealPlan | null>("/me/meal-plan"),
  nextMeal: () =>
    api.get<{
      nextMeal: MealPlan["days"][0]["meals"][0] | null
      dayPlan: MealPlan["days"][0] | null
      mealPlanId?: string
    }>("/me/next-meal"),
}
