import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { useAuthStore, useAlertStore } from "../store"
import {
  Users, UtensilsCrossed, BarChart3, Package,
  LogOut, Bell, Stethoscope, Leaf, ChevronRight, Heart, ClipboardList,
  Menu, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ShaderBackground } from "@/components/ui/shader-background"
import { motion, AnimatePresence } from "framer-motion"

const NAV_ITEMS = [
  { to: "/my-dashboard", label: "My Dashboard", icon: Heart,           roles: ["patient"] },
  { to: "/doctor",    label: "Doctor",    icon: Stethoscope,    roles: ["admin", "doctor"] },
  { to: "/patient",   label: "Patient",   icon: Users,          roles: ["admin", "doctor"] },
  { to: "/kitchen",   label: "Kitchen",   icon: UtensilsCrossed,roles: ["admin", "kitchen_staff"] },
  { to: "/analytics", label: "Analytics", icon: BarChart3,      roles: ["admin", "doctor"] },
  { to: "/orders",    label: "Orders",    icon: ClipboardList,  roles: ["admin", "kitchen_staff"] },
  { to: "/inventory", label: "Inventory", icon: Package,        roles: ["admin", "kitchen_staff"] },
]

const PAGE_TITLES: Record<string, string> = {
  "/doctor": "Doctor Dashboard",
  "/patient": "Patient Dashboard",
  "/my-dashboard": "My Dashboard",
  "/kitchen": "Kitchen Dashboard",
  "/analytics": "Analytics & Reports",
  "/orders": "Orders",
  "/inventory": "Ingredient Inventory",
}

function SidebarContent({ visibleNav, user, onNavClick, onLogout }: {
  visibleNav: typeof NAV_ITEMS
  user: { name?: string; role?: string } | null
  onNavClick: () => void
  onLogout: () => void
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-100 shrink-0">
        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-200/50 animate-glow-pulse"
        >
          <Leaf size={18} className="text-white" />
        </motion.div>
        <div>
          <p className="text-base font-extrabold text-gray-900 tracking-tight leading-none">NutriSync</p>
          <p className="text-[10px] text-violet-400 mt-0.5 tracking-widest uppercase">Clinical AI</p>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Overview</p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pb-3 overflow-y-auto">
        {visibleNav.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
          >
            <NavLink
              to={item.to}
              onClick={onNavClick}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-violet-50 text-violet-700 border border-violet-100 shadow-sm shadow-violet-100/50"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent hover:scale-[1.02]"
                )
              }
            >
              <item.icon size={16} className="transition-transform duration-200 group-hover:scale-110" />
              {item.label}
              <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-40 transition-all duration-200 group-hover:translate-x-0.5" />
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3 space-y-1 shrink-0">
        <div className="rounded-xl bg-linear-to-r from-violet-50 to-indigo-50 border border-violet-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-violet-500 capitalize mt-0.5">{user?.role?.replace("_", " ")}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const alerts = useAlertStore((s) => s.alerts)
  const dismiss = useAlertStore((s) => s.dismiss)
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleNav = NAV_ITEMS.filter((n) => !user || n.roles.includes(user.role))
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Clinical Nutrition Management System"

  const handleLogout = () => { logout(); navigate("/login") }

  return (
    <div className="flex h-screen overflow-hidden bg-linear-to-br from-gray-50 via-white to-violet-50/30">
      <ShaderBackground veilOpacity={0.75} speed={0.1} />
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-gray-100 shadow-sm">
        <SidebarContent visibleNav={visibleNav} user={user} onNavClick={() => {}} onLogout={handleLogout} />
      </aside>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative flex w-64 max-w-[80%] h-full flex-col bg-white shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <SidebarContent visibleNav={visibleNav} user={user} onNavClick={() => setMobileOpen(false)} onLogout={handleLogout} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ── Right content panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-400 hover:text-gray-600 transition"
            >
              <Menu size={20} />
            </button>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="hidden sm:flex items-center gap-2"
            >
              <div className="h-5 w-1 rounded-full bg-linear-to-b from-violet-500 to-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-600 tracking-tight">
                {pageTitle}
              </h2>
            </motion.div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-gray-400 hover:text-gray-600 transition hover:scale-110 duration-200">
              <Bell size={18} />
              {alerts.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -top-1.5 -right-1.5 inline-flex size-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white"
                >
                  {alerts.length}
                </motion.span>
              )}
            </button>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-violet-100 to-indigo-100 text-violet-700 text-xs font-bold ring-2 ring-violet-200/50"
              >
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </motion.div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Toast alerts */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <div className="absolute right-4 top-20 z-50 flex flex-col gap-2">
              {alerts.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: 80, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 80, scale: 0.9 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  onClick={() => dismiss(a.id)}
                  className={cn(
                    "cursor-pointer rounded-xl px-4 py-3 text-sm font-medium shadow-lg border",
                    a.type === "error"   && "bg-red-50 border-red-200 text-red-700",
                    a.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-700",
                    a.type === "warning" && "bg-amber-50 border-amber-200 text-amber-700",
                    a.type === "info"    && "bg-violet-50 border-violet-200 text-violet-700"
                  )}
                >
                  {a.message}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
