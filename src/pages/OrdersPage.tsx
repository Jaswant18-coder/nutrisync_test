import { useEffect, useState } from "react"
import { kitchenAPI, inventoryAPI } from "../services/api"
import { useAlertStore, useInventoryStore } from "../store"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ChefHat, Users, Clock, ChevronDown, ChevronUp,
  CheckCircle2, Flame, RefreshCw, UtensilsCrossed,
} from "lucide-react"
import { motion } from "framer-motion"

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderIngredient {
  name: string
  quantity: number
  unit: string
}

interface OrderMeal {
  name: string
  type: string
  portionSize: string
  ingredients: OrderIngredient[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    sodium: number
    potassium: number
    fiber: number
  }
  preparationInstructions: string
}

interface KitchenOrder {
  queuePosition: number
  groupCode: string
  groupName: string
  dietType: string
  patientCount: number
  calorieRange: string
  restrictions: string[]
  description: string
  meal: OrderMeal
  status: "pending" | "preparing" | "done"
}

// ── Meal-type selector ────────────────────────────────────────────────────────

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: "🌅", time: "7:00 – 9:00 AM" },
  { key: "lunch",     label: "Lunch",     icon: "☀️", time: "12:00 – 2:00 PM" },
  { key: "snack",     label: "Snack",     icon: "🍵", time: "4:00 – 5:00 PM" },
  { key: "dinner",    label: "Dinner",    icon: "🌙", time: "7:00 – 9:00 PM" },
] as const

// ── Diet-type badge colours ──────────────────────────────────────────────────

const DIET_BADGE: Record<string, string> = {
  diabetic: "bg-orange-100 text-orange-700 border-orange-200",
  renal:    "bg-blue-100 text-blue-700 border-blue-200",
  cardiac:  "bg-red-100 text-red-700 border-red-200",
  regular:  "bg-gray-100 text-gray-700 border-gray-200",
  liquid:   "bg-cyan-100 text-cyan-700 border-cyan-200",
  soft:     "bg-purple-100 text-purple-700 border-purple-200",
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  preparing: { label: "Preparing", color: "bg-blue-100 text-blue-700 border-blue-200",    icon: Flame },
  done:      { label: "Done",      color: "bg-green-100 text-green-700 border-green-200",  icon: CheckCircle2 },
}

// ── Order Card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
  isLoading,
}: {
  order: KitchenOrder
  onStatusChange: (code: string, status: KitchenOrder["status"]) => void
  isLoading: boolean
}) {
  const [recipeOpen, setRecipeOpen] = useState(false)
  const st = STATUS_CONFIG[order.status]
  const StIcon = st.icon

  return (
    <Card
      className={cn(
        "border transition-all duration-200",
        order.status === "done"
          ? "border-green-200 bg-green-50/40 opacity-70"
          : order.status === "preparing"
          ? "border-blue-300 bg-blue-50/30 shadow-md ring-2 ring-blue-200/50"
          : "border-gray-200 bg-white shadow-sm"
      )}
    >
      <CardContent className="p-0">
        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          {/* Queue badge */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-xl text-sm font-bold",
                order.queuePosition <= 3
                  ? "bg-linear-to-br from-violet-500 to-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              #{order.queuePosition}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{order.groupName}</p>
              <p className="text-[11px] text-gray-400">{order.groupCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Patient count */}
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700">
              <Users size={13} />
              {order.patientCount}
            </div>
            {/* Diet type */}
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize",
                DIET_BADGE[order.dietType] ?? DIET_BADGE.regular
              )}
            >
              {order.dietType}
            </span>
          </div>
        </div>

        {/* ── Meal info ── */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={15} className="text-violet-600" />
                <span className="font-semibold text-gray-900">{order.meal.name}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{order.meal.portionSize} · {order.calorieRange}</p>
            </div>
            <div className={cn("flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium", st.color)}>
              <StIcon size={12} />
              {st.label}
            </div>
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Cal",  value: order.meal.nutrition.calories,       unit: "",  color: "text-orange-600" },
              { label: "Pro",  value: `${order.meal.nutrition.protein}g`,  unit: "",  color: "text-blue-600" },
              { label: "Carb", value: `${order.meal.nutrition.carbs}g`,    unit: "",  color: "text-yellow-600" },
              { label: "Fat",  value: `${order.meal.nutrition.fat}g`,      unit: "",  color: "text-red-500" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-gray-50 border border-gray-100 p-1.5 text-center">
                <p className="text-[10px] text-gray-400">{m.label}</p>
                <p className={cn("text-xs font-bold", m.color)}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Ingredients pills */}
          <div className="flex flex-wrap gap-1">
            {order.meal.ingredients.map((ing, i) => (
              <span
                key={i}
                className="rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[11px] text-violet-700"
              >
                {ing.name} <span className="text-violet-400">({ing.quantity}{ing.unit})</span>
              </span>
            ))}
          </div>

          {/* Restrictions */}
          {order.restrictions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {order.restrictions.map((r) => (
                <span key={r} className="rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[10px] text-red-500">
                  {r}
                </span>
              ))}
            </div>
          )}

          {/* Recipe dropdown */}
          <button
            onClick={() => setRecipeOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            <span className="flex items-center gap-1.5">
              <ChefHat size={13} className="text-violet-600" />
              Recipe & Preparation
            </span>
            {recipeOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {recipeOpen && (
            <div className="rounded-xl bg-linear-to-br from-violet-50 to-indigo-50 border border-violet-100 p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                {order.meal.preparationInstructions}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-white/70 border border-violet-100/50 p-2 text-center">
                  <p className="text-[10px] text-gray-400">Sodium</p>
                  <p className="text-xs font-bold text-gray-700">{order.meal.nutrition.sodium}mg</p>
                </div>
                <div className="rounded-lg bg-white/70 border border-violet-100/50 p-2 text-center">
                  <p className="text-[10px] text-gray-400">Potassium</p>
                  <p className="text-xs font-bold text-gray-700">{order.meal.nutrition.potassium}mg</p>
                </div>
                <div className="rounded-lg bg-white/70 border border-violet-100/50 p-2 text-center">
                  <p className="text-[10px] text-gray-400">Fiber</p>
                  <p className="text-xs font-bold text-gray-700">{order.meal.nutrition.fiber}g</p>
                </div>
                <div className="rounded-lg bg-white/70 border border-violet-100/50 p-2 text-center">
                  <p className="text-[10px] text-gray-400">Servings</p>
                  <p className="text-xs font-bold text-gray-700">{order.patientCount} plates</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
          {order.status === "pending" && (
            <Button
              size="sm"
              onClick={() => onStatusChange(order.groupCode, "preparing")}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 gap-1.5 text-xs"
            >
              {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <Flame size={12} />}
              Start Preparing
            </Button>
          )}
          {order.status === "preparing" && (
            <Button
              size="sm"
              onClick={() => onStatusChange(order.groupCode, "done")}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 gap-1.5 text-xs"
            >
              {isLoading ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Mark Done
            </Button>
          )}
          {order.status === "done" && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> Completed
            </span>
          )}
          <span className="ml-auto text-[11px] text-gray-400">
            × {order.patientCount} servings
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Orders Page ──────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [mealType, setMealType] = useState(() => {
    const h = new Date().getHours()
    if (h < 10) return "breakfast"
    if (h < 15) return "lunch"
    if (h < 17) return "snack"
    return "dinner"
  })
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const push = useAlertStore((s) => s.push)
  const { setIngredients } = useInventoryStore()

  const fetchOrders = async (mt?: string) => {
    setLoading(true)
    try {
      const { data } = await kitchenAPI.orders(mt ?? mealType)
      setOrders(data)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealType])

  const handleStatusChange = async (code: string, status: KitchenOrder["status"]) => {
    setActionLoading(code)
    try {
      if (status === "done") {
        // Mark done + deduct inventory in one call
        const { data } = await kitchenAPI.completeOrder(code, mealType)
        const matched = data.deductions?.filter((d: { matched: boolean }) => d.matched) ?? []
        if (matched.length > 0) {
          push({ type: "success", message: `✅ Order done — deducted ${matched.length} ingredient(s) from inventory` })
          // Refresh inventory in the background so the Inventory page stays in sync
          inventoryAPI.list().then(({ data: inv }) => setIngredients(inv)).catch(() => {})
        } else {
          push({ type: "success", message: `✅ Order marked as done` })
        }
      } else {
        // Persist status change (e.g. "preparing")
        await kitchenAPI.updateStatus(code, mealType, status)
      }
    } catch {
      push({ type: "error", message: "Failed to update order status — please try again" })
    } finally {
      // Always re-fetch so the list reflects DB truth, even if the API call partially failed
      setActionLoading(null)
      await fetchOrders()
    }
  }

  // Sort: preparing → pending → done, then by queue position
  const sortedOrders = [...orders].sort((a, b) => {
    const rank = { preparing: 0, pending: 1, done: 2 }
    const ra = rank[a.status], rb = rank[b.status]
    if (ra !== rb) return ra - rb
    return a.queuePosition - b.queuePosition
  })

  const pendingCount = orders.filter((o) => o.status === "pending").length
  const preparingCount = orders.filter((o) => o.status === "preparing").length
  const doneCount = orders.filter((o) => o.status === "done").length
  const totalServings = orders.reduce((s, o) => s + o.patientCount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Orders</h1>
          <p className="text-sm text-gray-500">
            Priority queue — groups with the most patients are prepared first
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOrders()}
          disabled={loading}
          className="border-gray-200 text-gray-600 gap-1.5 hover:scale-105 active:scale-95 transition-transform"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Orders", value: orders.length, sub: `${totalServings} servings`, color: "from-violet-500 to-indigo-600" },
          { label: "Pending",      value: pendingCount,   sub: "in queue",               color: "from-amber-400 to-orange-500" },
          { label: "Preparing",    value: preparingCount,  sub: "in progress",            color: "from-blue-500 to-indigo-600" },
          { label: "Completed",    value: doneCount,       sub: "ready to serve",         color: "from-green-500 to-indigo-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          >
          <Card className="border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 card-hover">
            <CardContent className="p-4 relative">
              <div className={cn("absolute inset-y-0 left-0 w-1 bg-linear-to-b", s.color)} />
              <p className="text-xs text-gray-500 ml-2">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 ml-2">{s.value}</p>
              <p className="text-[10px] text-gray-400 ml-2">{s.sub}</p>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      {/* Meal type selector */}
      <div className="flex gap-2 overflow-x-auto">
        {MEAL_TYPES.map((mt) => (
          <button
            key={mt.key}
            onClick={() => setMealType(mt.key)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border",
              mealType === mt.key
                ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            <span>{mt.icon}</span>
            <div className="text-left">
              <p className="leading-tight">{mt.label}</p>
              <p className={cn("text-[10px]", mealType === mt.key ? "text-violet-200" : "text-gray-400")}>
                {mt.time}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Queue */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <svg className="animate-spin size-5 text-violet-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <span className="text-gray-400">Loading orders…</span>
        </div>
      ) : sortedOrders.length === 0 ? (
        <Card className="border-gray-200 bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
            <ChefHat size={40} className="text-gray-300" />
            <p className="font-medium">No orders yet</p>
            <p className="text-xs">Run diet grouping from the Kitchen dashboard first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedOrders.map((order, i) => (
            <motion.div
              key={order.groupCode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.35 }}
            >
            <OrderCard
              order={order}
              onStatusChange={handleStatusChange}
              isLoading={actionLoading === order.groupCode}
            />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
