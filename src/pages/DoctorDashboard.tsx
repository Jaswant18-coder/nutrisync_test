import { useCallback, useEffect, useState } from "react"
import { patientAPI, mealPlanAPI } from "../services/api"
import { usePatientStore, useMealPlanStore, useAlertStore } from "../store"
import type { Patient, MealPlan, DayPlan, MealItem, DietType, ActivityLevel, Gender, TextureType } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Users, Plus, Wand2, RefreshCw, AlertTriangle,
  Activity, Flame, Droplets, ChevronDown, ChevronUp,
  Edit3, Save, X, Eye, GlassWater, Utensils, LogOut, RotateCcw,
} from "lucide-react"
import { motion } from "framer-motion"

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, index = 0 }: {
  label: string; value: string | number; icon: React.ElementType; color: string; index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
    >
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 group card-hover">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={cn(
            "flex size-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            color
          )}>
            <Icon size={19} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── Diet type badge ───────────────────────────────────────────────────────────
const DIET_COLORS: Record<string, string> = {
  diabetic: "bg-orange-100 text-orange-700 border border-orange-200",
  renal: "bg-blue-100 text-blue-700 border border-blue-200",
  cardiac: "bg-red-100 text-red-700 border border-red-200",
  liquid: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  soft: "bg-purple-100 text-purple-700 border border-purple-200",
  regular: "bg-gray-100 text-gray-600 border border-gray-200",
  vegetarian: "bg-green-100 text-green-700 border border-green-200",
}

function DietBadge({ diet }: { diet: string }) {
  return (
    <span className={cn(
      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
      DIET_COLORS[diet] ?? "bg-violet-100 text-violet-700"
    )}>
      {diet}
    </span>
  )
}

// ── BMI bar ───────────────────────────────────────────────────────────────────
function BMIBar({ bmi }: { bmi: number }) {
  const pct = Math.min(Math.max(((bmi - 10) / 30) * 100, 0), 100)
  const color = bmi < 18.5 ? "bg-blue-400" : bmi < 25 ? "bg-green-400" : bmi < 30 ? "bg-yellow-400" : "bg-red-400"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-gray-200">
        <div className={cn("h-1.5 rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{bmi}</span>
    </div>
  )
}

// ── Diet Plan Editor Modal ────────────────────────────────────────────────────
function DietPlanEditor({ plan, onClose, onSaved }: {
  plan: MealPlan
  onClose: () => void
  onSaved: (updated: MealPlan) => void
}) {
  const push = useAlertStore((s) => s.push)
  const [days, setDays] = useState<DayPlan[]>(plan.days)
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)

  const updateMeal = (dayIdx: number, mealIdx: number, updates: Partial<MealItem>) => {
    setDays(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as DayPlan[]
      copy[dayIdx].meals[mealIdx] = { ...copy[dayIdx].meals[mealIdx], ...updates }
      return copy
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await mealPlanAPI.update(plan._id, { days } as Partial<MealPlan>)
      push({ type: "success", message: "Diet plan updated successfully!" })
      onSaved(data)
      onClose()
    } catch {
      push({ type: "error", message: "Failed to save diet plan" })
    } finally {
      setSaving(false)
    }
  }

  const day = days[selectedDay]
  if (!day) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <Card className="w-full max-w-4xl border-gray-200 bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <div>
            <CardTitle className="text-gray-900">Edit Diet Plan</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              {plan.generatedBy === "ai" ? "AI Generated" : "Template"} · {plan.status}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 gap-1.5">
              <Save size={14} />
              {saving ? "Saving…" : "Save Changes"}
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              <X size={20} />
            </button>
          </div>
        </CardHeader>

        {/* Day tabs */}
        <div className="flex gap-1 px-6 pb-3 border-b border-gray-200 shrink-0 overflow-x-auto">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap",
                selectedDay === i
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Day {d.day}
            </button>
          ))}
        </div>

        {/* Meals editor */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {day.meals.map((meal, mealIdx) => (
            <Card key={mealIdx} className="border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    meal.type === "breakfast" ? "bg-amber-100 text-amber-700" :
                    meal.type === "lunch" ? "bg-blue-100 text-blue-700" :
                    meal.type === "dinner" ? "bg-violet-100 text-violet-700" :
                    "bg-green-100 text-green-700"
                  )}>
                    {meal.type}
                  </span>
                  <Input
                    value={meal.name}
                    onChange={(e) => updateMeal(selectedDay, mealIdx, { name: e.target.value })}
                    className="border-gray-200 bg-gray-50 text-sm font-medium h-8 flex-1"
                    placeholder="Meal name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs">Portion Size</Label>
                    <Input
                      value={meal.portionSize}
                      onChange={(e) => updateMeal(selectedDay, mealIdx, { portionSize: e.target.value })}
                      className="border-gray-200 bg-gray-50 text-sm h-7"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-gray-500 text-[10px] capitalize">{key}</Label>
                        <Input
                          type="number"
                          value={meal.nutrition?.[key] ?? 0}
                          onChange={(e) => updateMeal(selectedDay, mealIdx, {
                            nutrition: { ...meal.nutrition, [key]: Number(e.target.value) }
                          })}
                          className="border-gray-200 bg-gray-50 text-xs h-7 px-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">Preparation Instructions</Label>
                  <textarea
                    value={meal.preparationInstructions}
                    onChange={(e) => updateMeal(selectedDay, mealIdx, { preparationInstructions: e.target.value })}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 focus:outline-none resize-none"
                    rows={2}
                  />
                </div>

                {/* Ingredients */}
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">Ingredients</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {meal.ingredients?.map((ing, ingIdx) => (
                      <span key={ingIdx} className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs text-gray-700">
                        {ing.name} ({ing.quantity}{ing.unit})
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Meal Plan Viewer Modal ────────────────────────────────────────────────────
function MealPlanViewer({ plan, onClose, onEdit }: {
  plan: MealPlan
  onClose: () => void
  onEdit: () => void
}) {
  const [selectedDay, setSelectedDay] = useState(0)
  const day = plan.days[selectedDay]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <Card className="w-full max-w-3xl border-gray-200 bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between shrink-0">
          <div>
            <CardTitle className="text-gray-900">Meal Plan</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              {plan.generatedBy === "ai" ? "AI Generated" : "Template"} · Status: {plan.status}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit} className="border-gray-200 text-gray-600 gap-1.5">
              <Edit3 size={14} />
              Edit Plan
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </CardHeader>

        <div className="flex gap-1 px-6 pb-3 border-b border-gray-200 shrink-0 overflow-x-auto">
          {plan.days.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap",
                selectedDay === i
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Day {d.day}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {day?.meals.map((meal, i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize mr-2",
                      meal.type === "breakfast" ? "bg-amber-100 text-amber-700" :
                      meal.type === "lunch" ? "bg-blue-100 text-blue-700" :
                      meal.type === "dinner" ? "bg-violet-100 text-violet-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {meal.type}
                    </span>
                    <span className="font-semibold text-gray-900">{meal.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{meal.portionSize}</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Cal", value: meal.nutrition?.calories, color: "text-orange-600" },
                    { label: "Protein", value: `${meal.nutrition?.protein}g`, color: "text-blue-600" },
                    { label: "Carbs", value: `${meal.nutrition?.carbs}g`, color: "text-yellow-600" },
                    { label: "Fat", value: `${meal.nutrition?.fat}g`, color: "text-red-500" },
                  ].map((m) => (
                    <div key={m.label} className="text-center rounded-lg bg-gray-50 border border-gray-100 p-1.5">
                      <p className="text-[10px] text-gray-400">{m.label}</p>
                      <p className={cn("text-xs font-bold", m.color)}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {meal.ingredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {meal.ingredients.map((ing, j) => (
                      <span key={j} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {ing.name} ({ing.quantity}{ing.unit})
                      </span>
                    ))}
                  </div>
                )}

                {meal.preparationInstructions && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-100">
                    {meal.preparationInstructions}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Patient form ──────────────────────────────────────────────────────────────
const DIET_TYPES: DietType[] = ["regular","diabetic","renal","cardiac","liquid","soft","vegetarian","vegan","low_sodium","low_potassium","high_protein"]
const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary","light","moderate","active","very_active"]
const TEXTURES: TextureType[] = ["regular","soft","minced","liquid"]

function PatientForm({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Patient) => void }) {
  const push = useAlertStore((s) => s.push)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "", email: "", phone: "", age: 45, gender: "male" as Gender,
    height: 165, weight: 70, activityLevel: "sedentary" as ActivityLevel,
    diagnosis: "", allergies: "", dietaryRestrictions: "", foodPreferences: "",
    currentDietType: "regular" as DietType, texture: "regular" as TextureType,
    roomNumber: "", ward: "",
  })

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await patientAPI.create({
        ...form,
        diagnosis: form.diagnosis.split(",").map((s) => s.trim()).filter(Boolean),
        allergies: form.allergies.split(",").map((s) => s.trim()).filter(Boolean),
        dietaryRestrictions: form.dietaryRestrictions.split(",").map((s) => s.trim()).filter(Boolean),
        foodPreferences: form.foodPreferences.split(",").map((s) => s.trim()).filter(Boolean),
      })
      onCreated(data)
      push({ type: "success", message: `Patient "${data.name}" registered! Meal plan auto-generating…` })
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      push({ type: "error", message: msg ?? "Failed to create patient" })
    } finally {
      setLoading(false)
    }
  }

  const field = (label: string, key: string, type = "text", inputProps: Record<string, unknown> = {}) => (
    <div className="space-y-1">
      <Label className="text-gray-600 text-xs">{label}</Label>
      <Input
        type={type}
        value={form[key as keyof typeof form] as string | number}
        onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
        className="border-gray-200 bg-gray-50 text-gray-900 text-sm h-8"
        {...inputProps}
      />
    </div>
  )

  const select = (label: string, key: string, options: string[]) => (
    <div className="space-y-1">
      <Label className="text-gray-600 text-xs">{label}</Label>
      <select
        value={form[key as keyof typeof form] as string}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:outline-none"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <Card className="w-full max-w-2xl border-gray-200 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-900">Register New Patient</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Meal plan and diet grouping will be auto-generated</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            {field("Full Name", "name", "text", { required: true })}
            {field("Email", "email", "email", { required: true, placeholder: "firstname@nutrisync.com" })}
            {field("Phone (WhatsApp)", "phone", "tel", { placeholder: "+91XXXXXXXXXX" })}
            {field("Age", "age", "number", { min: 1, max: 120 })}
            {select("Gender", "gender", ["male", "female", "other"])}
            {select("Activity Level", "activityLevel", ACTIVITY_LEVELS)}
            {field("Height (cm)", "height", "number", { min: 50, max: 250 })}
            {field("Weight (kg)", "weight", "number", { min: 5, max: 300 })}
            {select("Diet Type", "currentDietType", DIET_TYPES)}
            {select("Texture", "texture", TEXTURES)}
            {field("Room Number", "roomNumber")}
            {field("Ward", "ward")}

            <div className="col-span-2 space-y-1">
              <Label className="text-gray-600 text-xs">Diagnosis (comma-separated)</Label>
              <Input value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)}
                className="border-gray-200 bg-gray-50 text-gray-900 text-sm h-8"
                placeholder="Type 2 Diabetes, Hypertension" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-gray-600 text-xs">Allergies (comma-separated)</Label>
              <Input value={form.allergies} onChange={(e) => set("allergies", e.target.value)}
                className="border-gray-200 bg-gray-50 text-gray-900 text-sm h-8"
                placeholder="nuts, shellfish, dairy" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-gray-600 text-xs">Dietary Restrictions (comma-separated)</Label>
              <Input value={form.dietaryRestrictions} onChange={(e) => set("dietaryRestrictions", e.target.value)}
                className="border-gray-200 bg-gray-50 text-gray-900 text-sm h-8"
                placeholder="low_sodium, low_sugar" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-gray-600 text-xs">Food Preferences (comma-separated)</Label>
              <Input value={form.foodPreferences} onChange={(e) => set("foodPreferences", e.target.value)}
                className="border-gray-200 bg-gray-50 text-gray-900 text-sm h-8"
                placeholder="vegetarian, south Indian" />
            </div>

            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-200 text-gray-600">Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700">
                {loading ? "Saving…" : "Register Patient"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Patient row ───────────────────────────────────────────────────────────────
function PatientRow({ patient, onViewPlan, onRegenerate, onPatientUpdated }: {
  patient: Patient
  onViewPlan: (p: Patient) => void
  onRegenerate: (p: Patient) => void
  onPatientUpdated: (p: Patient) => void
}) {
  const push = useAlertStore((s) => s.push)
  const [expanded, setExpanded] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [discharging, setDischarging] = useState(false)
  const t = patient.nutritionTargets

  const isLiquid = patient.currentDietType === "liquid" || patient.texture === "liquid"
  const isOutpatient = patient.patientType === "outpatient"

  const handleDischarge = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (discharging) return
    if (!confirm(`Discharge ${patient.name}? This will mark them as outpatient and send their diet plan via WhatsApp.`)) return
    setDischarging(true)
    try {
      const { data } = await patientAPI.discharge(patient._id)
      onPatientUpdated(data)
      push({ type: "success", message: `${patient.name} discharged. Diet plan sent to WhatsApp.` })
    } catch {
      push({ type: "error", message: "Failed to discharge patient" })
    } finally {
      setDischarging(false)
    }
  }

  const handleReadmit = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (discharging) return
    setDischarging(true)
    try {
      const { data } = await patientAPI.readmit(patient._id)
      onPatientUpdated(data)
      push({ type: "success", message: `${patient.name} re-admitted.` })
    } catch {
      push({ type: "error", message: "Failed to readmit patient" })
    } finally {
      setDischarging(false)
    }
  }

  const handleSetDietMode = async (mode: "solid" | "liquid", e: React.MouseEvent) => {
    e.stopPropagation()
    if (switching) return
    if ((mode === "liquid") === isLiquid) return // already in that mode
    setSwitching(true)
    try {
      const { data } = await patientAPI.setDietMode(patient._id, mode)
      onPatientUpdated(data)
      push({ type: "success", message: `Switched to ${mode} diet. Meal plan regenerating for kitchen…` })
    } catch {
      push({ type: "error", message: "Failed to update diet mode" })
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 card-hover">
      <div
        className="flex cursor-pointer items-center gap-4 p-4 hover:bg-gray-50/70 transition-colors"
        onClick={() => setExpanded((x) => !x)}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700 text-sm font-bold">
          {patient.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{patient.name}</p>
            <DietBadge diet={patient.currentDietType} />
            {isOutpatient && (
              <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500">Discharged</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {patient.patientId} · {patient.age}y · {patient.gender} · {patient.roomNumber ?? "—"} · {patient.ward ?? "—"}
          </p>
        </div>
        <div className="hidden w-40 sm:block">
          <BMIBar bmi={patient.bmi} />
          <p className="text-xs text-gray-500 mt-1 capitalize">{patient.bmiCategory}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-violet-600">{t.calories} kcal</p>
          <p className="text-[11px] text-gray-400">daily target</p>
        </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Macro targets */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Protein", value: `${t.protein}g`, color: "text-blue-600" },
              { label: "Carbs", value: `${t.carbs}g`, color: "text-yellow-600" },
              { label: "Fat", value: `${t.fat}g`, color: "text-orange-600" },
              { label: "Fiber", value: `${t.fiber}g`, color: "text-green-600" },
              { label: "Sodium", value: `${t.sodium}mg`, color: "text-red-600" },
              { label: "Potassium", value: `${t.potassium}mg`, color: "text-cyan-600" },
              { label: "BMR", value: `${patient.bmr} kcal`, color: "text-gray-500" },
              { label: "Texture", value: patient.texture, color: "text-gray-500" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className={cn("text-sm font-bold", m.color)}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {patient.diagnosis.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {patient.diagnosis.map((d) => (
                <span key={d} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">{d}</span>
              ))}
              {patient.allergies.map((a) => (
                <span key={a} className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  <AlertTriangle size={10} />{a}
                </span>
              ))}
            </div>
          )}

          {/* Diet Mode Toggle */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Diet Mode</span>
            <div className="flex overflow-hidden rounded-lg border border-gray-200 text-sm">
              <button
                onClick={(e) => handleSetDietMode("solid", e)}
                disabled={switching}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 font-medium transition",
                  !isLiquid
                    ? "bg-violet-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed"
                )}
              >
                <Utensils size={13} />
                Solid
              </button>
              <button
                onClick={(e) => handleSetDietMode("liquid", e)}
                disabled={switching}
                className={cn(
                  "flex items-center gap-1.5 border-l border-gray-200 px-3 py-1.5 font-medium transition",
                  isLiquid
                    ? "bg-violet-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed"
                )}
              >
                <GlassWater size={13} />
                Liquid
              </button>
            </div>
            {switching && (
              <span className="animate-pulse text-xs text-violet-600">Updating patient &amp; regenerating meal plan…</span>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {isOutpatient ? (
              <Button
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-1.5"
                onClick={handleReadmit}
                disabled={discharging}
              >
                <RotateCcw size={14} />
                {discharging ? "Processing…" : "Re-admit"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                onClick={handleDischarge}
                disabled={discharging}
              >
                <LogOut size={14} />
                {discharging ? "Processing…" : "Discharge"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-gray-200 text-gray-600 gap-1.5"
              onClick={() => onViewPlan(patient)}
            >
              <Eye size={14} />
              View / Edit Plan
            </Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 gap-1.5"
              onClick={() => onRegenerate(patient)}
            >
              <Wand2 size={14} />
              Regenerate Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { patients, setPatients, addPatient, isLoading, setLoading } = usePatientStore()
  const { setActivePlan, isGenerating, setGenerating } = useMealPlanStore()
  const push = useAlertStore((s) => s.push)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [viewingPlan, setViewingPlan] = useState<MealPlan | null>(null)
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null)

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("ns_token")
      const res = await fetch("/api/patients", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.status === 401) {
        localStorage.removeItem("ns_token")
        localStorage.removeItem("nutrisync-auth")
        window.location.href = "/login"
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Patient[] = await res.json()
      setPatients(data)
    } catch {
      push({ type: "error", message: "Failed to load patients" })
    } finally {
      setLoading(false)
    }
  }, [push, setLoading, setPatients])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  const handleViewPlan = async (patient: Patient) => {
    try {
      const { data: plans } = await mealPlanAPI.list(patient._id)
      const active = plans.find((p) => p.status === "active")
      if (active) {
        setViewingPlan(active)
      } else {
        push({ type: "info", message: "No active meal plan found. Plan may still be generating…" })
      }
    } catch {
      push({ type: "error", message: "Failed to load meal plan" })
    }
  }

  const handleRegenerate = async (patient: Patient) => {
    setGenerating(true)
    push({ type: "info", message: `Regenerating meal plan for ${patient.name}…` })
    try {
      const { data } = await mealPlanAPI.generate(patient._id)
      setActivePlan(data.plan)
      push({ type: "success", message: `7-day meal plan regenerated via ${data.source === "ai" ? "AI" : "template"}!` })
    } catch {
      push({ type: "error", message: "Meal plan generation failed." })
    } finally {
      setGenerating(false)
    }
  }

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.patientId.toLowerCase().includes(search.toLowerCase()) ||
      (p.ward?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  const activeCount = patients.filter((p) => p.isActive).length
  const diabeticCount = patients.filter((p) => p.currentDietType === "diabetic").length
  const renalCount = patients.filter((p) => p.currentDietType === "renal").length

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-sm text-gray-500">Patient EMR & Nutrition Management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchPatients()} disabled={isLoading}
            className="border-gray-200 text-gray-600 gap-1.5">
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 gap-1.5 hover:scale-105 active:scale-95 transition-transform">
            <Plus size={14} />
            New Patient
          </Button>
        </div>
      </motion.div>

      {/* Auto-generation notice */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="flex items-center gap-3 rounded-xl border border-violet-200 bg-linear-to-r from-violet-50 to-indigo-50 p-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100">
          <Wand2 size={15} className="text-violet-600" />
        </div>
        <p className="text-sm text-violet-700">
          <strong>Auto-pilot:</strong> Registering or updating a patient automatically generates a 7-day meal plan and diet grouping.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Patients" value={activeCount} icon={Users} color="bg-violet-600" index={0} />
        <StatCard label="Diabetic Diet" value={diabeticCount} icon={Activity} color="bg-orange-500" index={1} />
        <StatCard label="Renal Diet" value={renalCount} icon={Droplets} color="bg-blue-500" index={2} />
        <StatCard label="Generating" value={isGenerating ? "…" : "—"} icon={Flame} color="bg-indigo-600" index={3} />
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="relative max-w-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <Input
          placeholder="Search patients by name, ID or ward…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900 placeholder:text-gray-400 pl-9 shadow-sm focus:shadow-lg focus:ring-2 focus:ring-violet-200 transition-all duration-300"
        />
      </motion.div>

      {/* Patient list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <svg className="animate-spin size-5 text-violet-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span className="text-gray-400">Loading patients…</span>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-12 text-center text-gray-400"
          >
            No patients found. Register your first patient to get started.
          </motion.div>
        ) : (
          filtered.map((p, i) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.04, duration: 0.35 }}
            >
              <PatientRow
                patient={p}
                onViewPlan={handleViewPlan}
                onRegenerate={handleRegenerate}
                onPatientUpdated={(updated) =>
                  setPatients(patients.map((existing) =>
                    existing._id === updated._id ? updated : existing
                  ))
                }
              />
            </motion.div>
          ))
        )}
      </div>

      {showForm && (
        <PatientForm
          onClose={() => setShowForm(false)}
          onCreated={addPatient}
        />
      )}

      {viewingPlan && !editingPlan && (
        <MealPlanViewer
          plan={viewingPlan}
          onClose={() => setViewingPlan(null)}
          onEdit={() => {
            setEditingPlan(viewingPlan)
            setViewingPlan(null)
          }}
        />
      )}

      {editingPlan && (
        <DietPlanEditor
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSaved={(updated) => {
            setEditingPlan(null)
            setViewingPlan(updated)
          }}
        />
      )}
    </div>
  )
}
