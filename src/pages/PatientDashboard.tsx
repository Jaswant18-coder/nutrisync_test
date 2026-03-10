import { useEffect, useMemo, useRef, useState } from "react"
import { patientAPI, mealPlanAPI, trackingAPI, chatAPI, suggestionAPI } from "../services/api"
import { usePatientStore, useMealPlanStore, useAlertStore, useChatStore, useSuggestionStore } from "../store"
import { useAuthStore } from "../store"
import type { Patient, MealPlan, MealItem, DayPlan } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  CheckCircle2, XCircle, Clock, Minus, Flame, Beef, Wheat, Droplets,
  Send, Bot, User, Lightbulb, LogOut, UserCheck, AlertTriangle,
} from "lucide-react"
import { motion } from "framer-motion"

type MealStatusAction = "eaten" | "partial" | "refused"

const STATUS_CONFIG = {
  eaten:   { label: "Eaten",   icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/10" },
  partial: { label: "Partial", icon: Minus,        color: "text-yellow-400", bg: "bg-yellow-500/10" },
  refused: { label: "Refused", icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10" },
  pending: { label: "Pending", icon: Clock, color: "text-gray-400", bg: "bg-gray-100" },
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(Math.round((value / (max || 1)) * 100), 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className={cn("font-medium", color)}>{value} / {max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-200">
        <div className={cn("h-1.5 rounded-full transition-all", color.replace("text-", "bg-"))}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MealCard({
  meal, mealPlanId, patient, date, existingStatus, onUpdate,
}: {
  meal: MealItem
  mealPlanId: string
  patient: Patient
  date: string
  existingStatus?: string
  onUpdate: () => void
}) {
  const push = useAlertStore((s) => s.push)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>(existingStatus ?? "pending")
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]

  const record = async (action: MealStatusAction) => {
    setLoading(true)
    try {
      await trackingAPI.record({
        patientId: patient._id,
        mealPlanId,
        date,
        mealType: meal.type,
        status: action,
        portionConsumed: action === "eaten" ? 100 : action === "partial" ? 60 : 0,
      })
      setStatus(action)
      push({ type: "success", message: `${meal.type} marked as ${action}` })
      onUpdate()
    } catch {
      push({ type: "error", message: "Failed to record meal status" })
    } finally {
      setLoading(false)
    }
  }

  const TYPE_COLORS: Record<string, string> = {
    breakfast: "bg-amber-500/20 text-amber-300",
    lunch: "bg-blue-500/20 text-blue-300",
    dinner: "bg-violet-100 text-violet-700",
    snack: "bg-green-500/20 text-green-300",
  }

  return (
    <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 card-hover">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize mb-1.5 inline-block",
              TYPE_COLORS[meal.type] ?? "bg-gray-100 text-gray-600")}>
              {meal.type}
            </span>
            <p className="font-semibold text-gray-900">{meal.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{meal.portionSize}</p>
          </div>
          <div className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium", cfg.bg, cfg.color)}>
            <cfg.icon size={12} />
            {cfg.label}
          </div>
        </div>

        {/* Nutrition mini-summary */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Cal", value: meal.nutrition?.calories, color: "text-orange-500" },
            { label: "Pro", value: `${meal.nutrition?.protein}g`, color: "text-blue-500" },
            { label: "Carb", value: `${meal.nutrition?.carbs}g`, color: "text-yellow-600" },
            { label: "Fat", value: `${meal.nutrition?.fat}g`, color: "text-red-500" },
          ].map((m) => (
            <div key={m.label} className="text-center rounded-lg bg-gray-50 border border-gray-100 p-1.5">
              <p className="text-xs text-gray-400">{m.label}</p>
              <p className={cn("text-xs font-bold", m.color)}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {meal.validationWarnings?.length > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2">
            {meal.validationWarnings.map((w, i) => (
              <p key={i} className="text-xs text-amber-700">{w}</p>
            ))}
          </div>
        )}

        {/* Actions */}
        {status === "pending" && (
          <div className="flex gap-2">
            {(["eaten", "partial", "refused"] as MealStatusAction[]).map((a) => {
              const c = STATUS_CONFIG[a]
              return (
                <button
                  key={a}
                  onClick={() => record(a)}
                  disabled={loading}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition",
                    c.bg, c.color, "hover:opacity-80 border border-gray-200"
                  )}
                >
                  <c.icon size={11} />
                  {c.label}
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── AI Dietary Chatbot ─────────────────────────────────────────────────────
function ChatPanel({ patient }: { patient: Patient }) {
  const { messages, isLoading, setMessages, addMessage, setLoading } = useChatStore()
  const [input, setInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatAPI.history(patient._id).then(({ data }) => setMessages(data)).catch(() => {})
    return () => setMessages([])
  }, [patient._id, setMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput("")
    addMessage({ id: `tmp-${Date.now()}`, patientId: patient._id, role: "user", content: text, createdAt: new Date().toISOString() })
    setLoading(true)
    try {
      const { data } = await chatAPI.send(patient._id, text)
      addMessage({ id: `ai-${Date.now()}`, patientId: patient._id, role: "assistant", content: data.reply, createdAt: new Date().toISOString() })
    } catch {
      addMessage({ id: `err-${Date.now()}`, patientId: patient._id, role: "assistant", content: "Sorry, I couldn't process your question. Please try again.", createdAt: new Date().toISOString() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-100">
            <Bot size={14} className="text-violet-600" />
          </div>
          AI Dietary Assistant
        </CardTitle>
        <p className="text-xs text-gray-400">Ask if you can eat specific foods — the AI checks your conditions and suggests alternatives</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-xs py-8">
              Ask something like &quot;Can I eat chocolate cake?&quot; or &quot;Is white rice okay for me?&quot;
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              {m.role === "assistant" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 mt-0.5">
                  <Bot size={12} />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"
              )}>
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 mt-0.5">
                  <User size={12} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <Bot size={12} />
              </div>
              <div className="rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm text-gray-400 animate-pulse">
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            placeholder="Ask about your diet…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button size="sm" onClick={send} disabled={isLoading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-700 gap-1">
            <Send size={14} /> Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Suggestion Box ─────────────────────────────────────────────────────────
function SuggestionBox({ patient }: { patient: Patient }) {
  const { suggestions, addSuggestion } = useSuggestionStore()
  const push = useAlertStore((s) => s.push)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    suggestionAPI.list().then(({ data }) => {
      // Filter for this patient's own suggestions
      const own = data.filter((s) => s.patientId === patient._id || s.patientName === patient.name)
      useSuggestionStore.getState().setSuggestions(own)
    }).catch(() => {})
  }, [patient._id, patient.name])

  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const { data } = await suggestionAPI.create({ patientId: patient._id, message: text.trim() })
      addSuggestion(data)
      setText("")
      push({ type: "success", message: "Suggestion sent to kitchen!" })
    } catch {
      push({ type: "error", message: "Failed to send suggestion" })
    } finally {
      setSending(false)
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    acknowledged: "bg-yellow-100 text-yellow-700",
    considered: "bg-purple-100 text-purple-700",
    responded: "bg-green-100 text-green-700",
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-900 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100">
            <Lightbulb size={14} className="text-amber-600" />
          </div>
          Suggestions to Kitchen
        </CardTitle>
        <p className="text-xs text-gray-400">Send food preferences or requests to the kitchen staff</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <textarea
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none"
            rows={2}
            placeholder="E.g. I'd prefer less spicy food, or could I get more fruit at breakfast…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button size="sm" onClick={submit} disabled={sending || !text.trim()}
            className="bg-amber-500 hover:bg-amber-600 gap-1 self-end">
            <Send size={14} /> Send
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-gray-500">Your suggestions</p>
            {suggestions.map((s) => (
              <div key={s._id} className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">{s.message}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize shrink-0 ml-2", STATUS_COLORS[s.status])}>
                    {s.status}
                  </span>
                </div>
                {s.response && (
                  <p className="text-xs text-violet-700 bg-violet-50 rounded-lg p-2 border border-violet-100">
                    <strong>Kitchen reply:</strong> {s.response}
                  </p>
                )}
                <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function PatientDashboard() {
  const { patients, setPatients } = usePatientStore()
  const { setMealPlans } = useMealPlanStore()
  const push = useAlertStore((s) => s.push)
  const currentUser = useAuthStore((s) => s.user)
  const canDischarge = currentUser?.role === "admin" || currentUser?.role === "doctor"

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [trackingRefresh, setTrackingRefresh] = useState(0)
  const [dischargeLoading, setDischargeLoading] = useState(false)
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false)
  const [patientTypeFilter, setPatientTypeFilter] = useState<"all" | "inpatient" | "outpatient">("all")

  useEffect(() => {
    patientAPI.list().then(({ data }) => setPatients(data)).catch(() => {})
  }, [setPatients])

  const handleDischarge = async () => {
    if (!selectedPatient) return
    setDischargeLoading(true)
    try {
      const { data: updated } = await patientAPI.discharge(selectedPatient._id)
      // Update local list
      setPatients(patients.map((p) => p._id === updated._id ? updated : p))
      setSelectedPatient(updated)
      setActivePlan(null)
      setShowDischargeConfirm(false)
      push({ type: "success", message: `${updated.name} has been discharged successfully.` })
    } catch {
      push({ type: "error", message: "Failed to discharge patient. Please try again." })
    } finally {
      setDischargeLoading(false)
    }
  }

  const handleReadmit = async () => {
    if (!selectedPatient) return
    setDischargeLoading(true)
    try {
      const { data: updated } = await patientAPI.readmit(selectedPatient._id)
      setPatients(patients.map((p) => p._id === updated._id ? updated : p))
      setSelectedPatient(updated)
      push({ type: "success", message: `${updated.name} has been re-admitted. A new meal plan will be generated.` })
    } catch {
      push({ type: "error", message: "Failed to re-admit patient. Please try again." })
    } finally {
      setDischargeLoading(false)
    }
  }

  useEffect(() => {
    mealPlanAPI.list(selectedPatient?._id).then(({ data }) => {
      setMealPlans(data)
      const active = data.find((p) => p.status === "active")
      setActivePlan(active ?? null)
    }).catch(() => {})
  }, [selectedPatient, setMealPlans])

  const todayPlan = useMemo<DayPlan | null>(() => {
    if (!activePlan) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const day = activePlan.days.find((d) => {
      const dp = new Date(d.date)
      dp.setHours(0, 0, 0, 0)
      return dp.getTime() === today.getTime()
    })
    return day ?? activePlan.days[0] ?? null
    // trackingRefresh triggers recheck after a meal is recorded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan, trackingRefresh])

  const totalConsumed = todayPlan?.meals.reduce((s, m) => s + (m.nutrition?.calories ?? 0), 0) ?? 0
  const target = selectedPatient?.nutritionTargets.calories ?? 0
  const isOutpatient = selectedPatient?.patientType === "outpatient"
  const filteredPatients = patientTypeFilter === "all" ? patients : patients.filter((p) => p.patientType === patientTypeFilter)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-sm text-gray-500">Daily meal tracking & nutrition progress</p>
      </motion.div>

      {/* Patient selector */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Label className="text-gray-600 text-xs shrink-0">Filter</Label>
            <div className="flex gap-1">
              {(["all", "inpatient", "outpatient"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPatientTypeFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition capitalize",
                    patientTypeFilter === f
                      ? f === "inpatient" ? "bg-violet-500 text-white border-violet-500"
                        : f === "outpatient" ? "bg-gray-500 text-white border-gray-500"
                        : "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-gray-600 text-xs">Select Patient</Label>
            <select
              className="mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none"
              value={selectedPatient?._id ?? ""}
              onChange={(e) => {
                const p = patients.find((x) => x._id === e.target.value) ?? null
                setSelectedPatient(p)
                setShowDischargeConfirm(false)
              }}
            >
              <option value="">— Choose a patient —</option>
              {filteredPatients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.patientId}) — {p.patientType === "outpatient" ? "🟠 Outpatient" : "🟢 Inpatient"} — {p.currentDietType}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {selectedPatient && (
        <>
          {/* Inpatient / Outpatient banner */}
          <div className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
            isOutpatient
              ? "bg-gray-50 border-gray-200 text-gray-600"
              : "bg-violet-50 border-violet-200 text-violet-800"
          )}>
            <div className="flex items-center gap-2">
              {isOutpatient
                ? <LogOut size={16} className="text-gray-500" />
                : <UserCheck size={16} className="text-violet-600" />}
              <div>
                <span className={cn(
                  "font-semibold text-sm",
                  isOutpatient ? "text-gray-700" : "text-violet-700"
                )}>
                  {isOutpatient ? "Outpatient (Discharged)" : "Inpatient"}
                </span>
                {isOutpatient && selectedPatient.dischargeDate && (
                  <span className="ml-2 text-xs text-gray-400">
                    Discharged {new Date(selectedPatient.dischargeDate).toLocaleDateString()}
                  </span>
                )}
                {!isOutpatient && selectedPatient.roomNumber && (
                  <span className="ml-2 text-xs text-violet-500">
                    Room {selectedPatient.roomNumber} · {selectedPatient.ward}
                  </span>
                )}
              </div>
            </div>
            {canDischarge && !showDischargeConfirm && (
              <button
                onClick={() => isOutpatient ? handleReadmit() : setShowDischargeConfirm(true)}
                disabled={dischargeLoading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50",
                  isOutpatient
                    ? "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100"
                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                )}
              >
                {isOutpatient ? <UserCheck size={13} /> : <LogOut size={13} />}
                {dischargeLoading ? "Processing…" : isOutpatient ? "Re-admit" : "Discharge"}
              </button>
            )}
            {canDischarge && showDischargeConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={13} /> Confirm discharge?
                </span>
                <button
                  onClick={handleDischarge}
                  disabled={dischargeLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition"
                >
                  {dischargeLoading ? "Processing…" : "Yes, Discharge"}
                </button>
                <button
                  onClick={() => setShowDischargeConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {/* Patient summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Calorie Target", value: `${target} kcal`, icon: Flame, color: "bg-orange-500" },
              { label: "Protein", value: `${selectedPatient.nutritionTargets.protein}g`, icon: Beef, color: "bg-blue-500" },
              { label: "Carbs", value: `${selectedPatient.nutritionTargets.carbs}g`, icon: Wheat, color: "bg-yellow-500" },
              { label: "BMI", value: `${selectedPatient.bmi} (${selectedPatient.bmiCategory})`, icon: Droplets, color: "bg-violet-600" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              >
              <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 group card-hover">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", s.color)}>
                    <s.icon size={17} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                    <p className="font-bold text-gray-900 text-sm">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>

          {/* Macro progress */}
          {todayPlan && (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-sm">Today's Nutrition Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <MacroBar label="Calories" value={totalConsumed} max={target} color="text-orange-500" />
                <MacroBar label="Protein (g)" value={todayPlan.totalNutrition.protein} max={selectedPatient.nutritionTargets.protein} color="text-blue-500" />
                <MacroBar label="Carbs (g)" value={todayPlan.totalNutrition.carbs} max={selectedPatient.nutritionTargets.carbs} color="text-yellow-600" />
                <MacroBar label="Fat (g)" value={todayPlan.totalNutrition.fat} max={selectedPatient.nutritionTargets.fat} color="text-red-500" />
              </CardContent>
            </Card>
          )}

          {/* Today's meals — inpatients only */}
          {isOutpatient ? (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6 text-center space-y-2">
                <LogOut className="mx-auto text-amber-400" size={28} />
                <p className="text-sm font-medium text-amber-700">Patient has been discharged</p>
                <p className="text-xs text-amber-500">
                  Meal plans are no longer active. Historical records and analytics are preserved below.
                </p>
              </CardContent>
            </Card>
          ) : !activePlan ? (
            <Card className="border-gray-200 bg-white p-10 text-center text-gray-400">
              No active meal plan. Ask your doctor to generate one.
            </Card>
          ) : todayPlan ? (
            <div>
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                Today's Meals — Day {todayPlan.day}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {todayPlan.meals.map((meal, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
                  >
                  <MealCard
                    key={i}
                    meal={meal}
                    mealPlanId={activePlan._id}
                    patient={selectedPatient}
                    date={new Date().toISOString().split("T")[0]}
                    onUpdate={() => setTrackingRefresh((x) => x + 1)}
                  />
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-10">No meal scheduled for today.</div>
          )}

          {/* AI Chatbot & Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="grid gap-4 lg:grid-cols-2"
          >
            <ChatPanel patient={selectedPatient} />
            <SuggestionBox patient={selectedPatient} />
          </motion.div>
        </>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("text-sm font-medium text-gray-700", className)}>{children}</label>
}
