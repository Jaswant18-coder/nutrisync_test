import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthUser, Patient, MealPlan, MealTracking, Ingredient, DietGroup, Suggestion, ChatMessage } from "../types"
import { authAPI } from "../services/api"

// ─── Auth slice ───────────────────────────────────────────────────────────────
interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await authAPI.login(email, password)
        localStorage.setItem("ns_token", data.token)
        set({ token: data.token, user: data.user, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem("ns_token")
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    { name: "nutrisync-auth" }
  )
)

// ─── Patient slice ────────────────────────────────────────────────────────────
interface PatientState {
  patients: Patient[]
  selectedPatient: Patient | null
  isLoading: boolean
  setPatients: (patients: Patient[]) => void
  setSelectedPatient: (patient: Patient | null) => void
  setLoading: (v: boolean) => void
  addPatient: (patient: Patient) => void
  updatePatient: (id: string, updates: Partial<Patient>) => void
}

export const usePatientStore = create<PatientState>((set) => ({
  patients: [],
  selectedPatient: null,
  isLoading: false,

  setPatients: (patients) => set({ patients }),
  setSelectedPatient: (patient) => set({ selectedPatient: patient }),
  setLoading: (v) => set({ isLoading: v }),
  addPatient: (patient) =>
    set((state) => ({ patients: [patient, ...state.patients] })),
  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p._id === id ? { ...p, ...updates } : p
      ),
    })),
}))

// ─── Meal plan slice ──────────────────────────────────────────────────────────
interface MealPlanState {
  mealPlans: MealPlan[]
  activePlan: MealPlan | null
  isGenerating: boolean
  setMealPlans: (plans: MealPlan[]) => void
  setActivePlan: (plan: MealPlan | null) => void
  setGenerating: (v: boolean) => void
}

export const useMealPlanStore = create<MealPlanState>((set) => ({
  mealPlans: [],
  activePlan: null,
  isGenerating: false,

  setMealPlans: (mealPlans) => set({ mealPlans }),
  setActivePlan: (activePlan) => set({ activePlan }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}))

// ─── Tracking slice ───────────────────────────────────────────────────────────
interface TrackingState {
  records: MealTracking[]
  todayRecord: MealTracking | null
  setRecords: (records: MealTracking[]) => void
  setTodayRecord: (record: MealTracking | null) => void
}

export const useTrackingStore = create<TrackingState>((set) => ({
  records: [],
  todayRecord: null,
  setRecords: (records) => set({ records }),
  setTodayRecord: (todayRecord) => set({ todayRecord }),
}))

// ─── Inventory slice ──────────────────────────────────────────────────────────
interface InventoryState {
  ingredients: Ingredient[]
  lowStock: Ingredient[]
  setIngredients: (items: Ingredient[]) => void
  setLowStock: (items: Ingredient[]) => void
}

export const useInventoryStore = create<InventoryState>((set) => ({
  ingredients: [],
  lowStock: [],
  setIngredients: (ingredients) => set({ ingredients }),
  setLowStock: (lowStock) => set({ lowStock }),
}))

// ─── Diet group slice ─────────────────────────────────────────────────────────
interface DietGroupState {
  groups: DietGroup[]
  setGroups: (groups: DietGroup[]) => void
}

export const useDietGroupStore = create<DietGroupState>((set) => ({
  groups: [],
  setGroups: (groups) => set({ groups }),
}))

// ─── Alert store ──────────────────────────────────────────────────────────────
interface Alert {
  id: string
  type: "success" | "error" | "warning" | "info"
  message: string
}

interface AlertState {
  alerts: Alert[]
  push: (alert: Omit<Alert, "id">) => void
  dismiss: (id: string) => void
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  push: (alert) =>
    set((state) => ({
      alerts: [
        ...state.alerts,
        { ...alert, id: Date.now().toString() },
      ].slice(-5),
    })),
  dismiss: (id) =>
    set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
}))

// ─── Suggestion store ─────────────────────────────────────────────────────────
interface SuggestionState {
  suggestions: Suggestion[]
  newCount: number
  setSuggestions: (s: Suggestion[]) => void
  setNewCount: (n: number) => void
  addSuggestion: (s: Suggestion) => void
}

export const useSuggestionStore = create<SuggestionState>((set) => ({
  suggestions: [],
  newCount: 0,
  setSuggestions: (suggestions) => set({ suggestions }),
  setNewCount: (newCount) => set({ newCount }),
  addSuggestion: (s) => set((state) => ({ suggestions: [s, ...state.suggestions] })),
}))

// ─── Chat store ───────────────────────────────────────────────────────────────
interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  setMessages: (msgs: ChatMessage[]) => void
  addMessage: (msg: ChatMessage) => void
  setLoading: (v: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [] }),
}))
