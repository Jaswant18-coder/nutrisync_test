import {
  Leaf, Brain, ShieldCheck, BarChart3, Users, ChefHat,
  Utensils, Activity, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/ui/hero-section-with-smooth-bg-shader";
import { motion } from "framer-motion";
import { ShaderBackground } from "@/components/ui/shader-background";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Meal Planning",
    desc: "Personalised 7-day meal plans generated using clinical protocols, patient diagnoses, and nutritional science.",
    color: "bg-violet-100 text-violet-600",
  },
  {
    icon: Activity,
    title: "Real-time Tracking",
    desc: "Monitor meal compliance, calorie intake, and macro targets across every patient — updated in real time.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: ShieldCheck,
    title: "Diet Safety Engine",
    desc: "Automatic validation against allergies, renal limits, diabetic constraints, and drug–food interactions.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: ChefHat,
    title: "Kitchen Production",
    desc: "Auto-group patients by diet type and texture, generate batch cooking plans, and track ingredient inventory.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    icon: BarChart3,
    title: "Clinical Analytics",
    desc: "Ward-level compliance dashboards, patient nutrition trends, deficiency alerts, and exportable reports.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Users,
    title: "Role-based Access",
    desc: "Doctors, kitchen staff, patients, and admins — each sees a tailored dashboard with the right controls.",
    color: "bg-purple-100 text-purple-600",
  },
];

const STATS = [
  { value: "50+", label: "Patients Managed" },
  { value: "7-Day", label: "AI Meal Plans" },
  { value: "6", label: "Diet Protocols" },
  { value: "24/7", label: "Tracking Coverage" },
];

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      <ShaderBackground veilOpacity={0.75} speed={0.12} />
      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-100/80">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-200">
              <Leaf size={17} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">NutriSync</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </a>
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-200/50"
            >
              <Users size={14} />
              Sign Up
            </a>
          </div>
        </div>
      </header>

      {/* ── Shader Hero ── */}
      <HeroSection
        title="Wellness"
        highlightText="Lifestyle"
        description="Our goal is to offer you accessible and dependable healthcare nutrition management — powered by AI meal planning and real-time tracking."
        buttonText="Get Started"
        onButtonClick={() => navigate("/login")}
        colors={["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6366f1"]}
        speed={0.15}
        distortion={3}
        swirl={1}
        veilOpacity={0.25}
        titleClassName="text-gray-900"
        descriptionClassName="text-gray-600"
      />

      {/* ── Stats strip ── */}
      <section className="relative z-10 border-y border-gray-100/80 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <p className="text-3xl font-extrabold text-violet-600">{s.value}</p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="relative z-10 py-20 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center mb-14"
          >
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">Features</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything your nutrition team needs
            </h2>
            <p className="mt-4 text-gray-500 text-base leading-relaxed">
              From AI-generated meal plans to real-time compliance analytics — NutriSync replaces
              spreadsheets, manual calculations, and guesswork.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="group rounded-2xl border border-gray-100/80 bg-white/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg hover:border-violet-100 transition-all duration-300 card-hover"
              >
                <div className={`inline-flex size-11 items-center justify-center rounded-xl ${f.color} mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <f.icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="relative z-10 bg-linear-to-br from-violet-600 via-indigo-600 to-purple-700">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 md:px-6 py-16 text-center"
        >
          <Utensils size={32} className="mx-auto text-white/30 mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to modernise your hospital nutrition?
          </h2>
          <p className="text-white/60 text-base max-w-lg mx-auto mb-8">
            Sign in with a demo account to explore AI meal planning, patient tracking, and kitchen dashboards.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-violet-700 hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Try the Demo <ArrowRight size={15} />
          </a>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-gray-100 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600">
              <Leaf size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">NutriSync</span>
            <span className="text-xs text-gray-400 ml-1">Clinical Nutrition AI</span>
          </div>
          <p className="text-xs text-gray-400">&copy; 2026 NutriSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
