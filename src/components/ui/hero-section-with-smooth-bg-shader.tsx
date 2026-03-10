import { MeshGradient } from "@paper-design/shaders-react"
import { useEffect, useState, useSyncExternalStore } from "react"

interface HeroSectionProps {
  title?: string
  highlightText?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  colors?: string[]
  distortion?: number
  swirl?: number
  speed?: number
  offsetX?: number
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  buttonClassName?: string
  maxWidth?: string
  veilOpacity?: number
  fontFamily?: string
  fontWeight?: number
}

export function HeroSection({
  title = "Wellness",
  highlightText = "Lifestyle",
  description = "Our goal is to offer you accessible and dependable healthcare nutrition management — powered by AI meal planning and real-time tracking.",
  buttonText = "Get Started",
  onButtonClick,
  colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6366f1"],
  distortion = 3,
  swirl = 1,
  speed = 0.15,
  offsetX = 0,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  buttonClassName = "",
  maxWidth = "64rem",
  veilOpacity = 0.3,
  fontFamily = "system-ui, sans-serif",
  fontWeight = 700,
}: HeroSectionProps) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  if (!mounted) return null

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Shader background */}
      <div className="fixed inset-0 -z-10">
        <MeshGradient
          colors={colors}
          distortion={distortion}
          swirl={swirl}
          speed={speed}
          offsetX={offsetX}
          style={{ width: dimensions.width, height: dimensions.height }}
        />
        {/* Veil overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(255, 255, 255, ${veilOpacity})` }}
        />
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center"
        style={{ maxWidth, margin: "0 auto" }}
      >
        <h1
          className={`text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6 ${titleClassName}`}
          style={{ fontFamily, fontWeight }}
        >
          {title}{" "}
          <span className="bg-linear-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            {highlightText}
          </span>
        </h1>
        <p
          className={`text-lg max-w-xl leading-relaxed mb-10 text-gray-600 ${descriptionClassName}`}
        >
          {description}
        </p>
        {buttonText && (
          <button
            onClick={onButtonClick}
            className={`inline-flex items-center gap-2.5 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-300/40 cursor-pointer ${buttonClassName}`}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}
