"use client"

import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"
import { Zap, Mountain, Flame } from "lucide-react"

interface DifficultyIndicatorProps {
  difficulty: "easy" | "medium" | "hard"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    color: "bg-green-100 text-green-700 border-green-200",
    darkColor: "dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    icon: Zap,
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    darkColor: "dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    icon: Mountain,
  },
  hard: {
    label: "Hard",
    color: "bg-red-100 text-red-700 border-red-200",
    darkColor: "dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    icon: Flame,
  },
}

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
}

const iconSizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

export function DifficultyIndicator({ difficulty, size = "md", showLabel = true }: DifficultyIndicatorProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const config = difficultyConfig[difficulty]
  const Icon = config.icon

  useEffect(() => {
    if (badgeRef.current) {
      gsap.fromTo(
        badgeRef.current,
        { opacity: 0, scale: 0.8, rotate: -5 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(1.7)" },
      )
    }
  }, [])

  return (
    <div
      ref={badgeRef}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-300 hover:scale-105",
        config.color,
        config.darkColor,
        sizeClasses[size],
      )}
    >
      <Icon className={cn("flex-shrink-0", iconSizeClasses[size])} />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}
