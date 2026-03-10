// ─── Shared enums ────────────────────────────────────────────────────────────
export type Gender = "male" | "female" | "other"
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active"
export type DietType =
  | "regular" | "diabetic" | "renal" | "cardiac" | "liquid" | "soft"
  | "vegetarian" | "vegan" | "low_sodium" | "low_potassium" | "high_protein"
export type TextureType = "regular" | "soft" | "minced" | "liquid"
export type MealStatus = "pending" | "eaten" | "partial" | "refused"
export type UserRole = "admin" | "doctor" | "patient" | "kitchen_staff"

// ─── Nutrition ───────────────────────────────────────────────────────────────
export interface NutritionTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
  sodium: number
  potassium: number
  fiber: number
}

// ─── Patient ─────────────────────────────────────────────────────────────────
export interface Patient {
  _id: string
  patientId: string
  name: string
  age: number
  gender: Gender
  height: number
  weight: number
  bmi: number
  bmiCategory: string
  bmr: number
  activityLevel: ActivityLevel
  diagnosis: string[]
  allergies: string[]
  dietaryRestrictions: string[]
  foodPreferences: string[]
  currentDietType: DietType
  texture: TextureType
  nutritionTargets: NutritionTargets
  roomNumber?: string
  ward?: string
  phone?: string
  admissionDate: string
  dischargeDate?: string
  patientType: "inpatient" | "outpatient"
  isActive: boolean
  doctorId: string
  createdAt: string
  updatedAt: string
}

// ─── Meal plan ───────────────────────────────────────────────────────────────
export interface MealIngredient {
  name: string
  quantity: number
  unit: string
}

export interface MealNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  sodium: number
  potassium: number
  fiber: number
}

export interface MealItem {
  name: string
  type: "breakfast" | "lunch" | "dinner" | "snack"
  ingredients: MealIngredient[]
  nutrition: MealNutrition
  preparationInstructions: string
  portionSize: string
  isValidated: boolean
  validationWarnings: string[]
}

export interface DayPlan {
  day: number
  date: string
  meals: MealItem[]
  totalNutrition: MealNutrition
}

export interface MealPlan {
  _id: string
  patientId: string | Patient
  dietGroupId?: string
  weekStartDate: string
  weekEndDate: string
  days: DayPlan[]
  status: "draft" | "active" | "completed" | "cancelled"
  generatedBy: "ai" | "manual"
  createdAt: string
  updatedAt: string
}

// ─── Tracking ─────────────────────────────────────────────────────────────────
export interface MealConsumption {
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  mealName: string
  status: MealStatus
  portionConsumed: number
  caloriesConsumed: number
  proteinConsumed: number
  carbsConsumed: number
  fatConsumed: number
  refusalReason?: string
  recordedAt: string
}

export interface MealTracking {
  _id: string
  patientId: string | Patient
  mealPlanId: string
  date: string
  consumption: MealConsumption[]
  totalCaloriesConsumed: number
  totalProteinConsumed: number
  totalCarbsConsumed: number
  totalFatConsumed: number
  complianceScore: number
  hasAlert: boolean
  alertMessage?: string
}

// ─── Ingredient ───────────────────────────────────────────────────────────────
export interface Ingredient {
  _id: string
  name: string
  category: string
  unit: string
  caloriesPer100: number
  proteinPer100: number
  carbsPer100: number
  fatPer100: number
  sodiumPer100: number
  potassiumPer100: number
  fiberPer100: number
  stockQty: number
  stockUnit: string
  reorderLevel: number
  isAvailable: boolean
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  commonAllergen: string[]
}

// ─── Diet group ───────────────────────────────────────────────────────────────
export interface GroupMember {
  patientId: string | Patient
  portionMultiplier: number
}

export interface DietGroup {
  _id: string
  groupCode: string
  name: string
  description: string
  dietType: DietType
  texture: TextureType
  calorieRangeMin: number
  calorieRangeMax: number
  restrictions: string[]
  preferenceType: string
  members: GroupMember[]
  ward?: string
  isActive: boolean
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface DailyBreakdown {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  complianceScore: number
  mealStatuses: Record<string, string>
}

export interface WeeklyReport {
  patientId: string
  patientName: string
  period: { from: string; to: string }
  averageDailyCalories: number
  calorieTarget: number
  complianceRate: number
  mealRefusalRate: number
  nutritionDeficiencies: string[]
  alerts: string[]
  dailyBreakdown: DailyBreakdown[]
}

// ─── Patient Summary ─────────────────────────────────────────────────────────
export interface PatientSummary {
  patientId: string
  patientName: string
  ward?: string
  roomNumber?: string
  dietType: string
  daysTracked: number
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  calorieTarget: number
  proteinTarget: number
  complianceRate: number
  refusalRate: number
  status: "good" | "warning" | "critical"
  deficiencies: string[]
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  patientId?: string | null
}

// ─── Suggestion ──────────────────────────────────────────────────────────────
export interface Suggestion {
  _id: string
  patientId: string
  patientName: string
  message: string
  status: "new" | "acknowledged" | "considered" | "responded"
  response?: string
  respondedBy?: string
  createdAt: string
  updatedAt: string
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string
  patientId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}
