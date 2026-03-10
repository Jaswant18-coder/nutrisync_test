import { useEffect, useState } from "react"
import { reportAPI, patientAPI } from "../services/api"
// wardSummary endpoint no longer used on this page
import { useAlertStore } from "../store"
import type { Patient, PatientSummary } from "../types"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  TrendingUp, TrendingDown, Minus, Flame, Beef, Wheat, Droplets,
  Users, AlertTriangle, CheckCircle2, BarChart3, TableProperties,
  ArrowUpDown, ChevronUp, ChevronDown,
} from "lucide-react"
import { motion } from "framer-motion"

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  protein:    { solid: "#6366f1", light: "#ede9fe", text: "text-indigo-600" },
  carbs:      { solid: "#f59e0b", light: "#fef3c7", text: "text-amber-600"  },
  fat:        { solid: "#f43f5e", light: "#ffe4e6", text: "text-rose-500"   },
  calories:   { solid: "#7c3aed", light: "#ede9fe", text: "text-violet-600"   },
  compliance: { solid: "#10b981", light: "#d1fae5", text: "text-emerald-600"},
  eaten:      "#22c55e",
  partial:    "#f59e0b",
  refused:    "#f43f5e",
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
interface TooltipEntry { name?: string; color?: string; value?: number | string }
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 backdrop-blur-sm shadow-xl p-3 min-w-35">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      {payload.map((p: { name?: string; color?: string; value?: number | string }) => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-xs mb-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </span>
          <span className="font-bold text-gray-900">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, suffix = "", icon: Icon, gradient, trend, trendLabel,
}: {
  label: string; value: string | number; suffix?: string
  icon: React.ElementType; gradient: string; trend?: number; trendLabel?: string
}) {
  const trendColor = (trend ?? 0) >= 75 ? "text-emerald-500" : (trend ?? 0) >= 50 ? "text-amber-500" : "text-rose-500"
  const TrendIcon = (trend ?? 0) >= 75 ? TrendingUp : (trend ?? 0) < 50 ? TrendingDown : Minus
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-5 text-white shadow-md", gradient)}>
      <div className="absolute -right-4 -top-4 size-20 rounded-full bg-white/10" />
      <div className="absolute -right-2 -bottom-6 size-28 rounded-full bg-white/10" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">{label}</p>
          <div className="flex size-8 items-center justify-center rounded-xl bg-white/20">
            <Icon size={15} className="text-white" />
          </div>
        </div>
        <p className="text-3xl font-extrabold tracking-tight">{value}<span className="text-lg font-semibold ml-0.5 opacity-80">{suffix}</span></p>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2 text-[11px] font-medium", trendColor === "text-emerald-500" ? "text-white/90" : "text-white/70")}>
            <TrendIcon size={11} />
            {trendLabel}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Macro pill ────────────────────────────────────────────────────────────────
function MacroPill({
  label, value, unit, icon: Icon, bg, text, bar, barColor,
}: {
  label: string; value: number; unit: string; icon: React.ElementType
  bg: string; text: string; bar: number; barColor: string
}) {
  return (
    <div className={cn("rounded-2xl border p-4 space-y-3", bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("flex size-7 items-center justify-center rounded-lg", barColor, "bg-opacity-20")}>
            <Icon size={13} className={text} />
          </div>
          <span className={cn("text-xs font-semibold uppercase tracking-wide", text)}>{label}</span>
        </div>
        <span className={cn("text-xl font-extrabold", text)}>{value.toFixed(1)}<span className="text-sm font-medium ml-0.5 opacity-70">{unit}</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(bar, 100)}%`, background: barColor.replace("bg-", "") }}
        />
      </div>
    </div>
  )
}

interface PatientReport {
  patientId: string
  weekStart: string
  weekEnd: string
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  complianceRate: number
  refusalRate: number
  deficiencies: string[]
  dailyData: Array<{
    date: string
    calories: number
    protein: number
    carbs: number
    fat: number
    compliance: number
    eaten: number
    partial: number
    refused: number
  }>
}

// ── Axis / grid defaults ──────────────────────────────────────────────────────
const AXIS_TICK = { fill: "#9ca3af", fontSize: 11, fontFamily: "inherit" }
const AXIS_LINE = { stroke: "#f3f4f6" }
const GRID = { strokeDasharray: "4 4", stroke: "#f3f4f6", vertical: false }
const LEGEND_STYLE = { color: "#6b7280", fontSize: 12, fontFamily: "inherit" }

export default function Analytics() {
  const push = useAlertStore((s) => s.push)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [report, setReport] = useState<PatientReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"patient" | "summary">("patient")

  // Summary tab state
  const [summary, setSummary] = useState<PatientSummary[]>([])
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryDays, setSummaryDays] = useState(14)
  const [sortBy, setSortBy] = useState<keyof PatientSummary>("complianceRate")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    patientAPI.list().then(({ data }) => {
      setPatients(data)
      if (data.length > 0) setSelectedId(data[0]._id)
    }).catch(() => push({ type: "error", message: "Failed to load patients" }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch summary whenever tab or days changes
  useEffect(() => {
    if (tab !== "summary") return
    let cancelled = false
    const load = async () => {
      setSummaryLoading(true)
      try {
        const { data } = await reportAPI.summary(summaryDays)
        if (!cancelled) setSummary(data)
      } catch {
        if (!cancelled) push({ type: "error", message: "Failed to load summary report" })
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, summaryDays])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await reportAPI.weekly(selectedId)
        if (!cancelled) setReport(data as unknown as PatientReport)
      } catch {
        if (!cancelled) push({ type: "error", message: "Failed to load report" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const totalMeals = report
    ? report.dailyData.reduce((s, d) => s + d.eaten + d.partial + d.refused, 0)
    : 0
  const mealBreakdown = report
    ? [
        { name: "Eaten",   value: report.dailyData.reduce((s, d) => s + d.eaten,   0), color: C.eaten   },
        { name: "Partial", value: report.dailyData.reduce((s, d) => s + d.partial, 0), color: C.partial },
        { name: "Refused", value: report.dailyData.reduce((s, d) => s + d.refused, 0), color: C.refused },
      ]
    : []

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
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-sm text-gray-500">Compliance trends, macro tracking, and ward overview</p>
        </div>
      </motion.div>

      {/* Tabs — pill style */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {(["patient", "summary"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t === "patient"
              ? <><BarChart3 size={14} />Patient Report</>
              : <><TableProperties size={14} />All Patients</>}
          </button>
        ))}
      </div>

      {/* ── Patient tab ── */}
      {tab === "patient" && (
        <div className="space-y-6">
          {/* Patient selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-500">Patient</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
            >
              {patients.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Skeleton loader */}
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-100" />
              ))}
            </div>
          )}

          {report && !loading && (
            <>
              {/* Deficiency alert */}
              {report.deficiencies.length > 0 && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 p-4">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <strong className="font-semibold">Nutritional deficiencies detected: </strong>
                    {report.deficiencies.join(", ")}
                  </div>
                </div>
              )}

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
                <KpiCard
                  label="Compliance" value={report.complianceRate.toFixed(1)} suffix="%"
                  icon={CheckCircle2} gradient="bg-linear-to-br from-violet-500 to-indigo-600"
                  trend={report.complianceRate} trendLabel="weekly avg"
                />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}>
                <KpiCard
                  label="Acceptance" value={(100 - report.refusalRate).toFixed(1)} suffix="%"
                  icon={TrendingUp} gradient="bg-linear-to-br from-indigo-500 to-purple-600"
                  trend={100 - report.refusalRate} trendLabel="of meals accepted"
                />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.4 }}>
                <KpiCard
                  label="Avg Calories" value={report.avgCalories.toFixed(0)} suffix=" kcal"
                  icon={Flame} gradient="bg-linear-to-br from-indigo-500 to-violet-600"
                />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.4 }}>
                <KpiCard
                  label="Avg Protein" value={report.avgProtein.toFixed(1)} suffix="g"
                  icon={Beef} gradient="bg-linear-to-br from-violet-500 to-indigo-600"
                />
                </motion.div>
              </div>

              {/* Macro averages */}
              <div className="grid grid-cols-3 gap-3">
                <MacroPill
                  label="Protein" value={report.avgProtein} unit="g" icon={Beef}
                  bg="border-indigo-100 bg-indigo-50" text="text-indigo-600"
                  bar={(report.avgProtein / 150) * 100} barColor="#6366f1"
                />
                <MacroPill
                  label="Carbs" value={report.avgCarbs} unit="g" icon={Wheat}
                  bg="border-amber-100 bg-amber-50" text="text-amber-600"
                  bar={(report.avgCarbs / 300) * 100} barColor="#f59e0b"
                />
                <MacroPill
                  label="Fat" value={report.avgFat} unit="g" icon={Droplets}
                  bg="border-rose-100 bg-rose-50" text="text-rose-500"
                  bar={(report.avgFat / 100) * 100} barColor="#f43f5e"
                />
              </div>

              {/* SVG gradient defs — referenced by chart fills */}
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="gradProtein" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.protein.solid} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.protein.solid} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradCarbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.carbs.solid} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.carbs.solid} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.fat.solid} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.fat.solid} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradCal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.calories.solid} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.calories.solid} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.compliance.solid} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={C.compliance.solid} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
              </svg>

              {/* Macronutrient area chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Daily Macronutrients</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Protein · Carbs · Fat consumed per day (g)</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500">
                    {[["#6366f1","Protein"],["#f59e0b","Carbs"],["#f43f5e","Fat"]].map(([c,l]) => (
                      <span key={l} className="flex items-center gap-1">
                        <span className="size-2 rounded-full" style={{ background: c }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={report.dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid {...GRID} />
                      <XAxis dataKey="date" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                      <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="protein" stroke={C.protein.solid} strokeWidth={2.5}
                        fill="url(#gradProtein)" name="Protein (g)" dot={{ r: 4, fill: C.protein.solid, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: C.protein.solid, stroke: "#fff", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="carbs" stroke={C.carbs.solid} strokeWidth={2.5}
                        fill="url(#gradCarbs)" name="Carbs (g)" dot={{ r: 4, fill: C.carbs.solid, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: C.carbs.solid, stroke: "#fff", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="fat" stroke={C.fat.solid} strokeWidth={2.5}
                        fill="url(#gradFat)" name="Fat (g)" dot={{ r: 4, fill: C.fat.solid, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: C.fat.solid, stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Calories + compliance area chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Calories & Compliance</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Daily caloric intake vs meal compliance %</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500">
                    {[[C.calories.solid,"Calories"],[C.compliance.solid,"Compliance %"]].map(([c,l]) => (
                      <span key={l} className="flex items-center gap-1">
                        <span className="size-2 rounded-full" style={{ background: c }} />{l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={report.dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid {...GRID} />
                      <XAxis dataKey="date" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                      <YAxis yAxisId="cal" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="pct" orientation="right" domain={[0, 100]}
                        tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area yAxisId="cal" type="monotone" dataKey="calories" stroke={C.calories.solid} strokeWidth={2.5}
                        fill="url(#gradCal)" name="Calories (kcal)"
                        dot={{ r: 4, fill: C.calories.solid, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: C.calories.solid, stroke: "#fff", strokeWidth: 2 }} />
                      <Area yAxisId="pct" type="monotone" dataKey="compliance" stroke={C.compliance.solid} strokeWidth={2.5}
                        fill="url(#gradCompliance)" name="Compliance %"
                        dot={{ r: 4, fill: C.compliance.solid, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, fill: C.compliance.solid, stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Meal status histogram + donut */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="grid grid-cols-1 gap-4 lg:grid-cols-3"
              >
                {/* Histogram */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 pt-5 pb-3">
                    <h3 className="text-sm font-bold text-gray-800">Meal Status per Day</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Eaten · Partial · Refused — frequency distribution</p>
                  </div>
                  <div className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={report.dailyData}
                        margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                        barCategoryGap={2}
                        barGap={0}
                      >
                        <CartesianGrid {...GRID} />
                        <XAxis dataKey="date" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
                        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={LEGEND_STYLE} iconType="square" iconSize={10} />
                        <Bar dataKey="eaten"   fill={C.eaten}   name="Eaten"   radius={[3, 3, 0, 0]} maxBarSize={36} />
                        <Bar dataKey="partial" fill={C.partial} name="Partial" radius={[3, 3, 0, 0]} maxBarSize={36} />
                        <Bar dataKey="refused" fill={C.refused} name="Refused" radius={[3, 3, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 pt-5 pb-3">
                    <h3 className="text-sm font-bold text-gray-800">Meal Breakdown</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Weekly totals</p>
                  </div>
                  <div className="flex flex-col items-center px-4 pb-5">
                    <div className="relative">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie
                            data={mealBreakdown} cx="50%" cy="50%"
                            innerRadius={54} outerRadius={78}
                            paddingAngle={3} dataKey="value" strokeWidth={0}
                          >
                            {mealBreakdown.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Centre label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-2xl font-extrabold text-gray-900">{totalMeals}</p>
                        <p className="text-[10px] text-gray-400 font-medium">total</p>
                      </div>
                    </div>

                    <div className="w-full space-y-2 mt-2">
                      {mealBreakdown.map((item) => {
                        const pct = totalMeals ? ((item.value / totalMeals) * 100).toFixed(0) : "0"
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 text-gray-500">
                                <span className="size-2 rounded-full" style={{ background: item.color }} />
                                {item.name}
                              </span>
                              <span className="font-bold text-gray-900">{item.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: item.color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}

      {/* ── Summary tab ── */}
      {tab === "summary" && (() => {
        const good     = summary.filter((s) => s.status === "good").length
        const warning  = summary.filter((s) => s.status === "warning").length
        const critical = summary.filter((s) => s.status === "critical").length
        const avgComp  = summary.length
          ? Math.round(summary.reduce((a, s) => a + s.complianceRate, 0) / summary.length)
          : 0

        const sorted = [...summary].sort((a, b) => {
          const av = a[sortBy] as number | string ?? 0
          const bv = b[sortBy] as number | string ?? 0
          if (typeof av === "number" && typeof bv === "number")
            return sortDir === "asc" ? av - bv : bv - av
          return sortDir === "asc"
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av))
        })

        const toggle = (col: keyof PatientSummary) => {
          if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc")
          else { setSortBy(col); setSortDir("asc") }
        }

        const SortIcon = ({ col }: { col: keyof PatientSummary }) =>
          sortBy !== col ? <ArrowUpDown size={11} className="text-gray-300" /> :
          sortDir === "asc" ? <ChevronUp size={11} className="text-violet-500" /> :
          <ChevronDown size={11} className="text-violet-500" />

        const statusBadge = (s: "good" | "warning" | "critical") => ({
          good:     "bg-emerald-100 text-emerald-700",
          warning:  "bg-amber-100  text-amber-700",
          critical: "bg-red-100    text-red-700",
        })[s]

        const compColor = (v: number) =>
          v >= 75 ? "text-emerald-600 font-bold" : v >= 50 ? "text-amber-600 font-semibold" : "text-red-500 font-semibold"

        return (
          <div className="space-y-5">
            {/* Controls + aggregate strip */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-500">Period</label>
                <select
                  value={summaryDays}
                  onChange={(e) => setSummaryDays(Number(e.target.value))}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  {[7, 14, 21, 30].map((d) => (
                    <option key={d} value={d}>Last {d} days</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Total Patients", value: summary.length, color: "bg-linear-to-br from-violet-500 to-indigo-600" },
                  { label: "Avg Compliance", value: `${avgComp}%`, color: "bg-linear-to-br from-indigo-500 to-violet-600" },
                  { label: "Good", value: good, color: "bg-linear-to-br from-emerald-500 to-green-600" },
                  { label: "Warning", value: warning, color: "bg-linear-to-br from-amber-500 to-orange-500" },
                  { label: "Critical", value: critical, color: critical > 0 ? "bg-linear-to-br from-red-500 to-rose-600" : "bg-linear-to-br from-gray-400 to-gray-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-white text-sm shadow-sm", color)}>
                    <span className="text-white/70 text-xs">{label}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
            >
              {summaryLoading ? (
                <div className="space-y-2 p-6 animate-pulse">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-gray-100" />)}
                </div>
              ) : summary.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Users size={40} className="mb-3 opacity-40" />
                  <p className="text-sm font-medium">No patient data for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        {([
                          ["patientName", "Patient"],
                          ["ward",        "Ward / Room"],
                          ["dietType",    "Diet"],
                          ["daysTracked", "Days"],
                          ["avgCalories", "Avg Cal"],
                          ["avgProtein",  "Protein"],
                          ["avgCarbs",    "Carbs"],
                          ["avgFat",      "Fat"],
                          ["complianceRate", "Compliance"],
                          ["refusalRate", "Refusal"],
                          ["status",      "Status"],
                        ] as [keyof PatientSummary, string][]).map(([col, label]) => (
                          <th
                            key={col}
                            onClick={() => toggle(col)}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none whitespace-nowrap"
                          >
                            <span className="inline-flex items-center gap-1">
                              {label} <SortIcon col={col} />
                            </span>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Deficiencies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sorted.map((s) => (
                        <tr key={s.patientId} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{s.patientName}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                            {s.ward ? `${s.ward}` : "—"}
                            {s.roomNumber ? <span className="text-xs text-gray-400 ml-1">#{s.roomNumber}</span> : null}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 capitalize">
                              {s.dietType.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-center">{s.daysTracked}</td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {s.avgCalories}
                            <span className="text-xs text-gray-400 ml-0.5">/{s.calorieTarget}</span>
                          </td>
                          <td className="px-4 py-3 text-indigo-600 font-medium">{s.avgProtein}g</td>
                          <td className="px-4 py-3 text-amber-600 font-medium">{s.avgCarbs}g</td>
                          <td className="px-4 py-3 text-rose-500 font-medium">{s.avgFat}g</td>
                          <td className={cn("px-4 py-3 whitespace-nowrap", compColor(s.complianceRate))}>
                            {s.complianceRate}%
                          </td>
                          <td className="px-4 py-3 text-gray-600">{s.refusalRate}%</td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", statusBadge(s.status))}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-52">
                            {s.deficiencies.length > 0
                              ? <span className="text-amber-600">{s.deficiencies.join("; ")}</span>
                              : <span className="text-emerald-500">None</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        )
      })()}
    </div>
  )
}
