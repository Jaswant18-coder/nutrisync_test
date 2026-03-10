import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore, useAlertStore } from "../store"
import { Leaf, Stethoscope, UtensilsCrossed, ShieldCheck, User, Sparkles, Eye, EyeOff } from "lucide-react"
import { ShaderBackground } from "@/components/ui/shader-background"
import { motion } from "framer-motion"

// Demo accounts — firstname@nutrisync.com / Patient@123 for patients
const DEMO_CREDENTIALS = [
  { role: "Doctor",  email: "doctor@nutrisync.com",  pass: "Doctor@123",  icon: Stethoscope,    color: "text-blue-600" },
  { role: "Kitchen", email: "kitchen@nutrisync.com", pass: "Kitchen@123", icon: UtensilsCrossed, color: "text-orange-500" },
  { role: "Patient", email: "arjun@nutrisync.com",   pass: "Patient@123", icon: User,            color: "text-violet-500" },
  { role: "Admin",   email: "admin@nutrisync.com",   pass: "Admin@123",   icon: ShieldCheck,    color: "text-emerald-600" },
]

export default function LoginPage() {
  const [email, setEmail] = useState("doctor@nutrisync.com")
  const [password, setPassword] = useState("Doctor@123")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const push = useAlertStore((s) => s.push)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      const user = useAuthStore.getState().user
      const role = user?.role
      if (role === "patient") navigate("/my-dashboard")
      else if (role === "kitchen_staff") navigate("/kitchen")
      else navigate("/doctor")
    } catch {
      push({ type: "error", message: "Invalid credentials. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex relative">
      <ShaderBackground veilOpacity={0.15} speed={0.12} />
      {/* Left side — Hero section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden">

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 text-white max-w-lg"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm animate-glow-pulse">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">NutriSync</span>
              <p className="text-white/50 text-[10px] tracking-widest uppercase">Clinical Nutrition AI</p>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-5xl xl:text-6xl font-bold mb-6 leading-[1.1]"
          >
            Smarter nutrition for every patient.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-white/60 text-base leading-relaxed mb-10"
          >
            AI-powered meal planning, real-time dietary tracking, and clinical-grade management — all in one platform.
          </motion.p>

          <div className="space-y-3">
            {[
              { icon: Sparkles, label: "AI-generated personalised meal plans" },
              { icon: Stethoscope, label: "Clinical diet protocols built-in" },
              { icon: ShieldCheck, label: "Role-based access for your whole team" },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-white/80" />
                </div>
                <span className="text-sm text-white/70">{label}</span>
              </motion.div>
            ))}
          </div>

          <p className="mt-16 text-white/30 text-xs">© 2026 NutriSync. All rights reserved.</p>
        </motion.div>
      </div>

      {/* Right side — Login form */}
      <div className="flex-1 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-violet-500 to-indigo-600 rounded-xl mb-4 shadow-lg shadow-violet-200"
            >
              <Leaf className="w-6 h-6 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Sign in to NutriSync — Continue your journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Your email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 text-sm shadow-md shadow-violet-200/50 hover:shadow-lg hover:shadow-violet-300/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gray-50 text-gray-500">Demo accounts</span>
              </div>
            </div>
          </div>

          {/* Demo credential buttons */}
          <div className="grid grid-cols-2 gap-3">
            {DEMO_CREDENTIALS.map((c, i) => (
              <motion.button
                key={c.role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.35 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setEmail(c.email); setPassword(c.pass) }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-violet-50 hover:border-violet-200 hover:shadow-md transition-all text-sm font-medium text-gray-600 hover:text-violet-700"
              >
                <c.icon className={`w-4 h-4 ${c.color}`} />
                {c.role}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
