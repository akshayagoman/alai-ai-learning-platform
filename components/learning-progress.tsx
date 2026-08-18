"use client"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

interface LearningProgressProps {
  currentStage: number
  onStageChange: (stage: number) => void
  size?: "sm" | "md" | "lg"
  readonly?: boolean
}

const stageConfig = [
  { stage: 0, label: "Not Started", color: "bg-gray-200", description: "Haven't started learning this topic yet" },
  { stage: 1, label: "Yet to Learn", color: "bg-red-500", description: "Just beginning to explore this topic" },
  { stage: 2, label: "Walking", color: "bg-yellow-500", description: "Making steady progress" },
  { stage: 3, label: "Running", color: "bg-green-400", description: "Good understanding, practicing regularly" },
  { stage: 4, label: "Completed", color: "bg-blue-600", description: "Mastered this topic completely" },
]

export function LearningProgress({
  currentStage,
  onStageChange,
  size = "md",
  readonly = false,
}: LearningProgressProps) {
  const [hoveredStage, setHoveredStage] = useState<number | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const segmentsRef = useRef<(HTMLDivElement | null)[]>([])

  const sizeClasses = {
    sm: "h-2 gap-1",
    md: "h-3 gap-1.5",
    lg: "h-4 gap-2",
  }

  const segmentSizeClasses = {
    sm: "h-2 rounded-sm",
    md: "h-3 rounded",
    lg: "h-4 rounded-md",
  }

  useEffect(() => {
    if (progressRef.current) {
      gsap.fromTo(
        progressRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
      )
    }
  }, [])

  const handleStageClick = (stage: number) => {
    if (readonly) return

    // Animate the clicked segment
    const segment = segmentsRef.current[stage]
    if (segment) {
      gsap.fromTo(segment, { scale: 1 }, { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1 })
    }

    onStageChange(stage)
  }

  const getDisplayStage = () => {
    return hoveredStage !== null ? hoveredStage : currentStage
  }

  return (
    <div className="space-y-2">
      <div
        ref={progressRef}
        className={cn("flex w-full", sizeClasses[size])}
        onMouseLeave={() => setHoveredStage(null)}
      >
        {[1, 2, 3, 4].map((stage) => {
          const isActive = stage <= getDisplayStage()
          const config = stageConfig[stage]

          return (
            <div
              key={stage}
              ref={(el) => (segmentsRef.current[stage] = el)}
              className={cn(
                "flex-1 transition-all duration-300 cursor-pointer",
                segmentSizeClasses[size],
                isActive ? config.color : "bg-gray-200 dark:bg-gray-700",
                !readonly && "hover:opacity-80",
                readonly && "cursor-default",
              )}
              onClick={() => handleStageClick(stage)}
              onMouseEnter={() => !readonly && setHoveredStage(stage)}
              title={readonly ? config.label : `${config.label}: ${config.description}`}
            />
          )
        })}
      </div>

      {!readonly && size !== "sm" && (
        <div className="text-xs text-muted-foreground">
          {hoveredStage !== null
            ? stageConfig[hoveredStage]?.description
            : currentStage > 0
              ? `Current: ${stageConfig[currentStage]?.label}`
              : "Click segments to update your progress"}
        </div>
      )}
    </div>
  )
}
