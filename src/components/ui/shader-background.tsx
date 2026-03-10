import { MeshGradient } from "@paper-design/shaders-react"
import { useEffect, useState, useSyncExternalStore } from "react"

interface ShaderBackgroundProps {
  colors?: string[]
  distortion?: number
  swirl?: number
  speed?: number
  offsetX?: number
  veilOpacity?: number
}

export function ShaderBackground({
  colors = ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6366f1"],
  distortion = 3,
  swirl = 1,
  speed = 0.15,
  offsetX = 0,
  veilOpacity = 0.85,
}: ShaderBackgroundProps) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const update = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <MeshGradient
        colors={colors}
        distortion={distortion}
        swirl={swirl}
        speed={speed}
        offsetX={offsetX}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(255, 255, 255, ${veilOpacity})` }}
      />
    </div>
  )
}
