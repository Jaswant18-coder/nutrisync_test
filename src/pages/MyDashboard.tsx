/**
 * MyDashboard — Patient self-service page
 *
 * Automatically loads the logged-in patient's profile, active meal plan,
 * and next meal with full recipe, ingredients, and nutrition breakdown.
 * Also includes a chatbot panel and suggestion submission.
 */

import { useEffect, useState, useCallback } from "react"
import { meAPI, chatAPI, suggestionAPI, trackingAPI } from "../services/api"
import { useAlertStore } from "../store"
import type { Patient, MealPlan, MealItem, DayPlan, ChatMessage, MealTracking } from "../types"
import {
  UtensilsCrossed, Clock, ChefHat, Apple, Flame,
  Send, MessageCircle, Lightbulb, User, Bot,
  Loader2, AlertCircle, Heart, Droplets, Wheat, Beef,
  CheckCircle2, XCircle, Minus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────
interface NextMealResponse {
  nextMeal: MealItem | null
  dayPlan: DayPlan | null
  mealPlanId?: string
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MyDashboard() {
  const push = useAlertStore((s) => s.push)

  const [profile, setProfile] = useState<Patient | null>(null)
  const [, setMealPlan] = useState<MealPlan | null>(null)
  const [nextMeal, setNextMeal] = useState<NextMealResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tracking state
  const [mealStatusLoading, setMealStatusLoading] = useState<string | null>(null)
  // Local optimistic map: mealType → status (updated instantly on click, no network wait)
  const [mealStatuses, setMealStatuses] = useState<Record<string, "eaten" | "partial" | "refused">>({})

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  // Suggestion state
  const [suggestion, setSuggestion] = useState("")
  const [suggestionSending, setSuggestionSending] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profileRes, planRes, nextRes] = await Promise.all([
        meAPI.profile(),
        meAPI.mealPlan(),
        meAPI.nextMeal(),
      ])
      setProfile(profileRes.data)
      setMealPlan(planRes.data)
      setNextMeal(nextRes.data)
      // Fetch today's tracking record to know what's already been consumed
      const today = new Date().toISOString().split("T")[0]
      const { data: tr } = await trackingAPI.list({ patientId: profileRes.data._id, date: today })
      const tracking = (tr as MealTracking[])[0] ?? null
      // Initialise local status map from any previously recorded meals
      if (tracking) {
        const map: Record<string, "eaten" | "partial" | "refused"> = {}
        for (const c of tracking.consumption) {
          if (c.status !== "pending") map[c.mealType] = c.status as "eaten" | "partial" | "refused"
        }
        setMealStatuses(map)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load your data"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleMealStatus = async (meal: MealItem, status: "eaten" | "partial" | "refused") => {
    if (!profile || !nextMeal?.mealPlanId) return
    setMealStatusLoading(meal.type)
    // Optimistic update — badge / macro bar update instantly without waiting for network
    setMealStatuses(prev => ({ ...prev, [meal.type]: status }))
    try {
      const today = new Date().toISOString().split("T")[0]
      await trackingAPI.record({
        patientId: profile._id,
        mealPlanId: nextMeal.mealPlanId,
        date: today,
        mealType: meal.type,
        status,
        portionConsumed: status === "eaten" ? 100 : status === "partial" ? 60 : 0,
      })
      const label = status === "eaten" ? "fully eaten ✅" : status === "partial" ? "partially eaten ⚠️" : "skipped ❌"
      push({ type: "success", message: `${meal.type} marked as ${label}` })
    } catch {
      // Revert optimistic update on failure
      setMealStatuses(prev => { const n = { ...prev }; delete n[meal.type]; return n })
      push({ type: "error", message: "Failed to record meal status" })
    } finally {
      setMealStatusLoading(null)
    }
  }

  useEffect(() => { loadData() }, [loadData])

  // Load chat history when opening
  useEffect(() => {
    if (chatOpen && profile) {
      chatAPI.history(profile._id).then((r) => setMessages(r.data)).catch(() => {})
    }
  }, [chatOpen, profile])

  const sendChat = async () => {
    if (!chatInput.trim() || !profile) return
    setChatLoading(true)
    const text = chatInput
    setChatInput("")
    setMessages((prev) => [...prev, { id: Date.now().toString(), patientId: profile._id, role: "user", content: text, createdAt: new Date().toISOString() }])
    try {
      const { data } = await chatAPI.send(profile._id, text)
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), patientId: profile._id, role: "assistant", content: data.reply, createdAt: new Date().toISOString() }])
    } catch {
      push({ type: "error", message: "Chat failed. Please try again." })
    } finally {
      setChatLoading(false)
    }
  }

  const sendSuggestion = async () => {
    if (!suggestion.trim() || !profile) return
    setSuggestionSending(true)
    try {
      await suggestionAPI.create({ patientId: profile._id, message: suggestion })
      push({ type: "success", message: "Suggestion submitted! Your care team will review it." })
      setSuggestion("")
    } catch {
      push({ type: "error", message: "Failed to submit suggestion." })
    } finally {
      setSuggestionSending(false)
    }
  }

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span className="ml-3 text-gray-500">Loading your dashboard…</span>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-lg font-semibold text-gray-700">Unable to load dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">{error ?? "No patient profile linked to your account."}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 transition">
          Retry
        </button>
      </div>
    )
  }

  const meal = nextMeal?.nextMeal
  const dayPlan = nextMeal?.dayPlan
  const targets = profile.nutritionTargets

  // Compute consumed macros locally from mealStatuses × per-meal nutrition.
  // This updates immediately on click — no network round-trip needed.
  const consumed = (() => {
    const meals = dayPlan?.meals ?? []
    let calories = 0, protein = 0, carbs = 0, fat = 0
    for (const m of meals) {
      const s = mealStatuses[m.type]
      const ratio = s === "eaten" ? 1 : s === "partial" ? 0.6 : 0
      calories += (m.nutrition?.calories ?? 0) * ratio
      protein  += (m.nutrition?.protein  ?? 0) * ratio
      carbs    += (m.nutrition?.carbs    ?? 0) * ratio
      fat      += (m.nutrition?.fat      ?? 0) * ratio
    }
    return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) }
  })()
  const hasTracking = Object.keys(mealStatuses).length > 0

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Room {profile.roomNumber} · {profile.ward} · {profile.currentDietType} diet
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with AI
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Next Meal + Today's Plan ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Meal Card */}
          {meal ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="bg-linear-to-r from-violet-500 to-indigo-500 px-6 py-4">
                <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  Next Meal — <span className="capitalize font-medium text-white">{meal.type}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{meal.name}</h2>
                <p className="text-white/70 text-sm mt-0.5">{meal.portionSize}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Nutrition chips */}
                <div className="grid grid-cols-4 gap-3">
                  <NutritionChip icon={Flame} label="Calories" value={meal.nutrition.calories} unit="kcal" color="orange" />
                  <NutritionChip icon={Beef} label="Protein" value={meal.nutrition.protein} unit="g" color="red" />
                  <NutritionChip icon={Wheat} label="Carbs" value={meal.nutrition.carbs} unit="g" color="amber" />
                  <NutritionChip icon={Droplets} label="Fat" value={meal.nutrition.fat} unit="g" color="blue" />
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Apple className="w-4 h-4 text-green-500" />
                    Ingredients
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {meal.ingredients.map((ing, i) => (
                      <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                        {ing.name} — {ing.quantity}{ing.unit}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recipe */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-purple-500" />
                    Preparation
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
                    {meal.preparationInstructions}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-8 text-center"
            >
              <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-600">No meal plan assigned yet</h2>
              <p className="text-sm text-gray-400 mt-1">Your doctor will generate a meal plan for you soon.</p>
            </motion.div>
          )}

          {/* Today's full plan */}
          {dayPlan && dayPlan.meals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-violet-500" />
                Today's Meals — Day {dayPlan.day}
              </h3>
              <div className="space-y-3">
                {dayPlan.meals.map((m, idx) => {
                  const mealStatus = mealStatuses[m.type] // from local optimistic state — instant
                  const STATUS_CFG = {
                    eaten:   { label: "Eaten",   Icon: CheckCircle2, cls: "text-green-600 bg-green-50 border-green-200" },
                    partial: { label: "Partial",  Icon: Minus,        cls: "text-yellow-600 bg-yellow-50 border-yellow-200" },
                    refused: { label: "Skipped",  Icon: XCircle,      cls: "text-red-600 bg-red-50 border-red-200" },
                  } as const
                  const sCfg = mealStatus ? STATUS_CFG[mealStatus] : null
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition ${
                        m.name === meal?.name ? "border-violet-200 bg-violet-50" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          m.type === "breakfast" ? "bg-amber-400" :
                          m.type === "lunch" ? "bg-orange-400" :
                          m.type === "dinner" ? "bg-indigo-400" : "bg-green-400"
                        }`}>
                          {m.type[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${m.name === meal?.name ? "text-violet-700" : "text-gray-700"}`}>
                            {m.name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">{m.type} · {m.portionSize}</p>
                        </div>
                        <div className="text-right mr-1 shrink-0">
                          <p className="text-sm font-semibold text-gray-700">{m.nutrition.calories}</p>
                          <p className="text-xs text-gray-400">kcal</p>
                        </div>
                        {/* Consumption status / action buttons */}
                        {sCfg ? (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${sCfg.cls}`}>
                            <sCfg.Icon size={12} />
                            {sCfg.label}
                          </div>
                        ) : (
                          <div className="flex gap-1 shrink-0">
                            {([
                              ["eaten",   "✅", "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",  "Fully eaten"],
                              ["partial", "⚠️", "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200", "Partially eaten"],
                              ["refused", "❌", "bg-red-50 text-red-700 hover:bg-red-100 border-red-200",        "Not eaten / skipped"],
                            ] as const).map(([s, emoji, cls, title]) => (
                              <button
                                key={s}
                                onClick={() => handleMealStatus(m, s)}
                                disabled={mealStatusLoading === m.type}
                                title={title}
                                className={`px-2 py-1 rounded-lg border text-xs font-medium transition ${cls} disabled:opacity-50`}
                              >
                                {mealStatusLoading === m.type
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Suggestion box */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Submit a Food Suggestion
            </h3>
            <div className="flex gap-2">
              <input
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="e.g. I'd prefer more South Indian dishes…"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                onKeyDown={(e) => e.key === "Enter" && sendSuggestion()}
              />
              <button
                onClick={sendSuggestion}
                disabled={suggestionSending || !suggestion.trim()}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition"
              >
                {suggestionSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: Profile + Nutrition targets + Chat ── */}
        <div className="space-y-6">
          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                <User className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-400">
                  {profile.age}y · {profile.gender} · BMI {profile.bmi?.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <InfoRow label="Diagnosis" value={profile.diagnosis.join(", ")} />
              <InfoRow label="Diet Type" value={profile.currentDietType} />
              <InfoRow label="Texture" value={profile.texture} />
              {profile.allergies.length > 0 && (
                <InfoRow label="Allergies" value={profile.allergies.join(", ")} />
              )}
            </div>
          </motion.div>

          {/* Nutrition targets */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              {hasTracking ? "Today's Intake vs Target" : "Daily Nutrition Targets"}
            </h3>
            {hasTracking && (
              <p className="text-xs text-violet-600 mb-3">Based on meals you recorded today</p>
            )}
            {!hasTracking && (
              <p className="text-xs text-gray-400 mb-3">Mark meals above to track your actual intake</p>
            )}
            <div className="space-y-2">
              <NutritionBar label="Calories" current={consumed.calories} target={targets.calories} unit="kcal" color="bg-orange-400" />
              <NutritionBar label="Protein"  current={consumed.protein}  target={targets.protein}  unit="g"    color="bg-red-400" />
              <NutritionBar label="Carbs"    current={consumed.carbs}    target={targets.carbs}    unit="g"    color="bg-amber-400" />
              <NutritionBar label="Fat"      current={consumed.fat}      target={targets.fat}      unit="g"    color="bg-blue-400" />
              <NutritionBar label="Fiber"    current={0}                 target={targets.fiber}    unit="g"    color="bg-green-400" />
            </div>
          </motion.div>

          {/* Chat panel */}
          <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: 400 }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-semibold text-gray-700">AI Diet Assistant</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-8">Ask me about your diet, meals, or nutrition!</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-violet-500 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 p-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="p-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 transition">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function NutritionChip({ icon: Icon, label, value, unit, color }: {
  icon: typeof Flame; label: string; value: number; unit: string; color: string
}) {
  const colorMap: Record<string, string> = {
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  }
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] ?? colorMap.orange}`}>
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-70">{unit} {label}</p>
    </div>
  )
}

function NutritionBar({ label, current, target, unit, color }: {
  label: string; current: number; target: number; unit: string; color: string
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{current}/{target} {unit}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 capitalize text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}
