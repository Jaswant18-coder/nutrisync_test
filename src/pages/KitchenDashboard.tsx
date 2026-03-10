import { useEffect, useState } from "react"
import { kitchenAPI, inventoryAPI, mealPlanAPI, suggestionAPI, patientAPI } from "../services/api"
import { useInventoryStore, useAlertStore, useSuggestionStore } from "../store"
import type { Ingredient, MealPlan, Patient } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ChefHat, Users, RefreshCw, AlertTriangle, Package, Utensils,
  MessageSquare, Check, Eye,
} from "lucide-react"
import { motion } from "framer-motion"

interface ProductionGroup {
  groupCode: string
  groupName: string
  dietType: string
  texture: string
  patientCount: number
  calorieRange: string
  restrictions: string[]
  members: { patientId: string; nsId?: string; portionMultiplier: number }[]
  description?: string
}

// ── Group Card ────────────────────────────────────────────────────────────────
function GroupCard({ group }: { group: ProductionGroup }) {
  const [expanded, setExpanded] = useState(false)

  const DIET_COLORS: Record<string, string> = {
    diabetic: "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50",
    renal: "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50",
    cardiac: "border-red-200 bg-gradient-to-br from-red-50 to-rose-50",
    liquid: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50",
    soft: "border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50",
    regular: "border-gray-200 bg-gradient-to-br from-gray-50 to-white",
  }

  return (
    <Card className={cn("border hover:shadow-lg transition-all duration-300 card-hover", DIET_COLORS[group.dietType] ?? "border-gray-200 bg-white")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-gray-900">{group.groupName}</p>
            <p className="text-xs text-gray-500">{group.groupCode}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-sm font-bold text-gray-700">
            <Users size={14} />
            {group.patientCount}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white border border-gray-100 p-2">
            <p className="text-gray-400">Calorie Range</p>
            <p className="text-gray-900 font-medium">{group.calorieRange}</p>
          </div>
          <div className="rounded-lg bg-white border border-gray-100 p-2">
            <p className="text-gray-400">Texture</p>
            <p className="text-gray-900 font-medium capitalize">{group.texture}</p>
          </div>
        </div>

        {group.restrictions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.restrictions.map((r) => (
              <span key={r} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                {r}
              </span>
            ))}
          </div>
        )}

        {group.description && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-100 leading-relaxed">
            {group.description}
          </p>
        )}

        <button
          onClick={() => setExpanded((x) => !x)}
          className="text-xs text-gray-400 hover:text-gray-700 transition"
        >
          {expanded ? "Hide" : "Show"} patients ({group.patientCount})
        </button>

        {expanded && (
          <div className="space-y-1 border-t border-gray-100 pt-2">
            {group.members.map((m, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-3 py-1.5 text-sm">
                <span className="font-mono text-gray-700 text-xs">
                  {m.nsId ?? m.patientId}
                </span>
                <span className="text-xs text-gray-400">x{m.portionMultiplier}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Inventory Table ───────────────────────────────────────────────────────────
function InventoryTable({ items }: { items: Ingredient[] }) {
  const push = useAlertStore((s) => s.push)
  const { setIngredients } = useInventoryStore()

  const updateStock = async (id: string, qty: number) => {
    // Optimistic update — reflect the change instantly without waiting for a round-trip
    setIngredients(items.map((ing) => ing._id === id ? { ...ing, stockQty: qty, isAvailable: qty > 0 } : ing))
    try {
      await inventoryAPI.updateStock(id, qty)
      push({ type: "success", message: "Stock updated" })
    } catch {
      // Revert on failure by re-fetching the real data
      const { data } = await inventoryAPI.list()
      setIngredients(data)
      push({ type: "error", message: "Failed to update stock" })
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            {["Ingredient", "Category", "Cal/100g", "Stock", "Reorder", "Status"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((ing) => (
            <tr key={ing._id} className="hover:bg-gray-50/70 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 capitalize">{ing.name}</td>
              <td className="px-4 py-3 text-gray-500 capitalize">{ing.category}</td>
              <td className="px-4 py-3 text-gray-700">{ing.caloriesPer100}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium", ing.stockQty <= ing.reorderLevel ? "text-red-400" : "text-green-400")}>
                    {ing.stockQty} {ing.stockUnit}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => updateStock(ing._id, ing.stockQty + 10)}
                      className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-400 hover:bg-green-500/30">+10</button>
                    <button onClick={() => updateStock(ing._id, Math.max(0, ing.stockQty - 10))}
                      className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-500/30">-10</button>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500">{ing.reorderLevel} {ing.stockUnit}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  ing.isAvailable
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                )}>
                  {ing.isAvailable ? "In Stock" : "Out of Stock"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Meal Plan Viewer ──────────────────────────────────────────────────────────
function MealPlanList() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>("")
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)

  useEffect(() => {
    patientAPI.list().then(({ data }) => setPatients(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedPatient) { setPlan(null); return } // eslint-disable-line
    mealPlanAPI.list(selectedPatient).then(({ data }) => {
      const active = data.find((p) => p.status === "active")
      setPlan(active ?? data[0] ?? null)
    }).catch(() => {})
  }, [selectedPatient])

  const day = plan?.days[selectedDay]

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <select
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none"
          value={selectedPatient}
          onChange={(e) => { setSelectedPatient(e.target.value); setSelectedDay(0) }}
        >
          <option value="">— Select patient to view meal plan —</option>
          {patients.map((p) => (
            <option key={p._id} value={p._id}>{p.patientId} — {p.currentDietType}</option>
          ))}
        </select>
      </div>

      {plan && (
        <>
          <div className="flex gap-1 overflow-x-auto">
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

          {day && (
            <div className="grid gap-3 sm:grid-cols-2">
              {day.meals.map((meal, i) => (
                <Card key={i} className="border-gray-200 bg-white">
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
                        <span className="font-semibold text-gray-900 text-sm">{meal.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{meal.portionSize}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "Cal", value: meal.nutrition?.calories, color: "text-orange-600" },
                        { label: "Pro", value: `${meal.nutrition?.protein}g`, color: "text-blue-600" },
                        { label: "Carb", value: `${meal.nutrition?.carbs}g`, color: "text-yellow-600" },
                        { label: "Fat", value: `${meal.nutrition?.fat}g`, color: "text-red-500" },
                      ].map((m) => (
                        <div key={m.label} className="text-center rounded-lg bg-gray-50 border border-gray-100 p-1">
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
                        <strong>Recipe:</strong> {meal.preparationInstructions}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!plan && selectedPatient && (
        <div className="text-center text-gray-400 py-8">No meal plan found for this patient.</div>
      )}
    </div>
  )
}

// ── Suggestions Panel ─────────────────────────────────────────────────────────
function SuggestionPanel() {
  const { suggestions, setSuggestions } = useSuggestionStore()
  const push = useAlertStore((s) => s.push)
  const [responding, setResponding] = useState<string | null>(null)
  const [responseText, setResponseText] = useState("")

  useEffect(() => {
    suggestionAPI.list().then(({ data }) => setSuggestions(data)).catch(() => {})
  }, [setSuggestions])

  const handleRespond = async (id: string, status: string) => {
    try {
      await suggestionAPI.updateStatus(id, status, responseText || undefined)
      const { data } = await suggestionAPI.list()
      setSuggestions(data)
      setResponding(null)
      setResponseText("")
      push({ type: "success", message: `Suggestion ${status}` })
    } catch {
      push({ type: "error", message: "Failed to update suggestion" })
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    acknowledged: "bg-yellow-100 text-yellow-700",
    considered: "bg-purple-100 text-purple-700",
    responded: "bg-green-100 text-green-700",
  }

  return (
    <div className="space-y-3">
      {suggestions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No patient suggestions yet.</div>
      ) : (
        suggestions.map((s) => (
          <Card key={s._id} className="border-gray-200 bg-white">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm font-mono">{s.patientId}</p>
                  <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString()}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", STATUS_COLORS[s.status])}>
                  {s.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                {s.message}
              </p>

              {s.response && (
                <p className="text-sm text-violet-700 bg-violet-50 rounded-lg p-3 border border-violet-100">
                  <strong>Response:</strong> {s.response}
                </p>
              )}

              {s.status === "new" && (
                <div className="flex gap-2">
                  {responding === s._id ? (
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none resize-none"
                        rows={2}
                        placeholder="Type your response to the patient…"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRespond(s._id, "responded")}
                          className="bg-violet-600 hover:bg-violet-700 gap-1 text-xs">
                          <Check size={12} /> Send Response
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setResponding(null); setResponseText("") }}
                          className="border-gray-200 text-gray-600 text-xs">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleRespond(s._id, "acknowledged")}
                        className="border-gray-200 text-gray-600 gap-1 text-xs">
                        <Eye size={12} /> Acknowledge
                      </Button>
                      <Button size="sm" onClick={() => setResponding(s._id)}
                        className="bg-violet-600 hover:bg-violet-700 gap-1 text-xs">
                        <MessageSquare size={12} /> Respond
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// ── Main Kitchen Dashboard ────────────────────────────────────────────────────
export default function KitchenDashboard() {
  const { ingredients, lowStock, setIngredients, setLowStock } = useInventoryStore()
  const { newCount, setNewCount } = useSuggestionStore()
  const push = useAlertStore((s) => s.push)
  const [groups, setGroups] = useState<ProductionGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [regrouping, setRegrouping] = useState(false)
  const [tab, setTab] = useState<"production" | "inventory" | "mealplans" | "suggestions">("production")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, invRes, lowRes, countRes] = await Promise.all([
        kitchenAPI.production(),
        inventoryAPI.list(),
        inventoryAPI.lowStock(),
        suggestionAPI.count(),
      ])
      setGroups(prodRes.data)
      setIngredients(invRes.data)
      setLowStock(lowRes.data)
      setNewCount(countRes.data.count)
    } catch {
      push({ type: "error", message: "Failed to load kitchen data" })
    } finally {
      setLoading(false)
    }
  }

  const handleRegroup = async () => {
    setRegrouping(true)
    try {
      const { data } = await kitchenAPI.regroup()
      push({ type: "success", message: `Diet grouping complete: ${data.grouped} groups created` })
      fetchData()
    } catch {
      push({ type: "error", message: "Regrouping failed" })
    } finally {
      setRegrouping(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData() }, [])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
          <p className="text-sm text-gray-500">Production planning, inventory, meal plans & patient suggestions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}
            className="border-gray-200 text-gray-600 gap-1.5 hover:scale-105 active:scale-95 transition-transform">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRegroup} disabled={regrouping}
            className="bg-violet-600 hover:bg-violet-700 gap-1.5 hover:scale-105 active:scale-95 transition-transform">
            <ChefHat size={14} />
            {regrouping ? "Grouping…" : "Re-run Grouping"}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Diet Groups", value: groups.length, icon: Utensils, color: "bg-violet-600" },
          { label: "Ingredients", value: ingredients.length, icon: Package, color: "bg-blue-500" },
          { label: "Low Stock", value: lowStock.length, icon: AlertTriangle, color: lowStock.length > 0 ? "bg-red-500" : "bg-indigo-500" },
          { label: "New Suggestions", value: newCount, icon: MessageSquare, color: newCount > 0 ? "bg-orange-500" : "bg-gray-400" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          >
          <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 group card-hover">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", s.color)}>
                <s.icon size={19} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div className="text-sm text-red-700">
            <strong>Low stock alert:</strong>{" "}
            {lowStock.map((i) => i.name).join(", ")} — please reorder.
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 pb-0 overflow-x-auto">
        {([
          { key: "production", label: "Production Plan", icon: ChefHat },
          { key: "inventory", label: "Inventory", icon: Package },
          { key: "mealplans", label: "Patient Meal Plans", icon: Utensils },
          { key: "suggestions", label: `Suggestions${newCount > 0 ? ` (${newCount})` : ""}`, icon: MessageSquare },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap",
              tab === t.key
                ? "border-violet-500 text-violet-700 bg-violet-50/50"
                : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "production" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-3 flex items-center justify-center gap-3 py-12">
              <svg className="animate-spin size-5 text-violet-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <span className="text-gray-400">Loading production plan…</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="col-span-3 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-12 text-center text-gray-400">
              No diet groups yet. Click "Re-run Grouping" to auto-group patients.
            </div>
          ) : (
            groups.map((g, i) => (
              <motion.div
                key={g.groupCode}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
              >
                <GroupCard group={g} />
              </motion.div>
            ))
          )}
        </div>
      )}

      {tab === "inventory" && <InventoryTable items={ingredients} />}

      {tab === "mealplans" && <MealPlanList />}

      {tab === "suggestions" && <SuggestionPanel />}
    </div>
  )
}
