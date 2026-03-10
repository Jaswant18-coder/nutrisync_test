import { useEffect, useState } from "react"
import { inventoryAPI } from "../services/api"
import { useInventoryStore, useAlertStore } from "../store"
import type { Ingredient } from "../types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Package, Plus, Search, X, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

const CATEGORIES = ["grains", "protein", "dairy", "vegetable", "fruit", "fat", "beverage", "supplement", "other"]

const EMPTY_FORM = {
  name: "", category: "grains", caloriesPer100: 0,
  proteinPer100: 0, carbsPer100: 0, fatPer100: 0,
  stockQty: 0, stockUnit: "kg", reorderLevel: 5, isAvailable: true,
  allergens: "", restrictions: "",
}

function AddIngredientModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const push = useAlertStore((s) => s.push)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return push({ type: "error", message: "Ingredient name is required" })
    setSaving(true)
    try {
      await inventoryAPI.create({
        ...form,
        commonAllergen: form.allergens ? form.allergens.split(",").map((s) => s.trim()) : [],
      })
      push({ type: "success", message: `${form.name} added to inventory` })
      onSaved()
      onClose()
    } catch {
      push({ type: "error", message: "Failed to add ingredient" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Add Ingredient</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add a new item to the kitchen inventory</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Brown Rice" />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none capitalize">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Calories /100g</Label>
            <Input type="number" value={form.caloriesPer100}
              onChange={(e) => set("caloriesPer100", +e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Protein /100g</Label>
            <Input type="number" value={form.proteinPer100}
              onChange={(e) => set("proteinPer100", +e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Carbs /100g</Label>
            <Input type="number" value={form.carbsPer100}
              onChange={(e) => set("carbsPer100", +e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Fat /100g</Label>
            <Input type="number" value={form.fatPer100}
              onChange={(e) => set("fatPer100", +e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Stock Qty</Label>
            <Input type="number" value={form.stockQty}
              onChange={(e) => set("stockQty", +e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Stock Unit</Label>
            <select value={form.stockUnit} onChange={(e) => set("stockUnit", e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none">
              {["kg", "g", "liters", "ml", "pieces", "units"].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Reorder Level</Label>
            <Input type="number" value={form.reorderLevel}
              onChange={(e) => set("reorderLevel", +e.target.value)} />
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Allergens (comma-separated)</Label>
            <Input value={form.allergens}
              onChange={(e) => set("allergens", e.target.value)}
              placeholder="e.g. gluten, nuts" />
          </div>

          <div className="col-span-2 space-y-1">
            <Label>Restrictions (comma-separated)</Label>
            <Input value={form.restrictions}
              onChange={(e) => set("restrictions", e.target.value)}
              placeholder="e.g. diabetic, renal" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 bg-violet-600 hover:bg-violet-700" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Add Ingredient"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { ingredients, lowStock, setIngredients, setLowStock } = useInventoryStore()
  const push = useAlertStore((s) => s.push)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({})

  const fetchAll = async () => {
    const [inv, low] = await Promise.all([inventoryAPI.list(), inventoryAPI.lowStock()])
    setIngredients(inv.data)
    setLowStock(low.data)
    const defaults: Record<string, number> = {}
    inv.data.forEach((i: Ingredient) => { defaults[i._id] = i.stockQty })
    setStockInputs(defaults)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAll() }, [])

  const handleUpdateStock = async (id: string) => {
    setUpdating(id)
    try {
      await inventoryAPI.updateStock(id, stockInputs[id] ?? 0)
      push({ type: "success", message: "Stock updated" })
      fetchAll()
    } catch {
      push({ type: "error", message: "Failed to update stock" })
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from inventory?`)) return
    try {
      await inventoryAPI.remove(id)
      push({ type: "success", message: `${name} removed` })
      fetchAll()
    } catch {
      push({ type: "error", message: "Failed to remove ingredient" })
    }
  }

  const filtered = ingredients.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === "all" || i.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6">
      {showAdd && <AddIngredientModal onClose={() => setShowAdd(false)} onSaved={fetchAll} />}

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingredient Inventory</h1>
          <p className="text-sm text-gray-500">Kitchen stock management and tracking</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-1.5 hover:scale-105 active:scale-95 transition-transform" onClick={() => setShowAdd(true)}>
          <Plus size={15} />
          Add Ingredient
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Items", value: ingredients.length, color: "bg-blue-500" },
          { label: "In Stock", value: ingredients.filter((i) => i.isAvailable).length, color: "bg-indigo-500" },
          { label: "Low / Out of Stock", value: lowStock.length, color: lowStock.length > 0 ? "bg-red-500" : "bg-gray-400" },
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
                <Package size={19} className="text-white" />
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

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertTriangle size={16} className="shrink-0" />
          Low stock: {lowStock.map((i) => i.name).join(", ")}
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none capitalize"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="overflow-x-auto rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              {["Ingredient", "Category", "Macros /100g", "Stock", "Reorder", "Allergens", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">No ingredients found.</td>
              </tr>
            ) : filtered.map((ing) => {
              const isLow = ing.stockQty <= ing.reorderLevel
              return (
                <tr key={ing._id} className={cn("hover:bg-gray-50/70 transition-colors", isLow && "bg-red-50/60")}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 capitalize">{ing.name}</div>
                    <div className={cn("text-xs", ing.isAvailable ? "text-indigo-600" : "text-red-500")}>
                      {ing.isAvailable ? "Available" : "Unavailable"}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-500">{ing.category}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 space-y-0.5">
                    <div>Cal: <span className="text-gray-900">{ing.caloriesPer100}</span></div>
                    <div>P/C/F: <span className="text-gray-900">{ing.proteinPer100}/{ing.carbsPer100}/{ing.fatPer100}g</span></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={stockInputs[ing._id] ?? ing.stockQty}
                        onChange={(e) => setStockInputs((s) => ({ ...s, [ing._id]: +e.target.value }))}
                        className="w-16 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-900 focus:outline-none"
                      />
                      <span className="text-xs text-gray-400">{ing.stockUnit}</span>
                      <button
                        onClick={() => handleUpdateStock(ing._id)}
                        disabled={updating === ing._id}
                        className="rounded bg-violet-100 px-2 py-1 text-xs text-violet-700 hover:bg-violet-200 disabled:opacity-50"
                      >
                        {updating === ing._id ? "…" : "Set"}
                      </button>
                    </div>
                    {isLow && <p className="mt-0.5 text-xs text-red-500">⚠ Low stock</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ing.reorderLevel} {ing.stockUnit}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(ing.commonAllergen ?? []).slice(0, 3).map((a) => (
                        <span key={a} className="rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-600 capitalize">{a}</span>
                      ))}
                      {(ing.commonAllergen ?? []).length === 0 && <span className="text-xs text-gray-400">None</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRemove(ing._id, ing.name)}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
