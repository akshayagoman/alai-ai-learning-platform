"use client"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  showValue?: boolean
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  showValue = true,
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number>(rating)
  const starsRef = useRef<(HTMLDivElement | null)[]>([])

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  useEffect(() => {
    starsRef.current.forEach((star, index) => {
      if (star) {
        gsap.fromTo(
          star,
          { opacity: 0, scale: 0, rotate: -180 },
          { opacity: 1, scale: 1, rotate: 0, duration: 0.5, delay: index * 0.1, ease: "back.out(1.7)" },
        )
      }
    })
  }, [])

  // Keep selectedRating in sync with prop
  useEffect(() => {
    setSelectedRating(rating)
  }, [rating])

  const handleStarClick = (starRating: number) => {
    if (readonly || !onRatingChange) return

    // Animate the clicked star
    const star = starsRef.current[Math.floor(starRating) - 1]
    if (star) {
      gsap.fromTo(star, { scale: 1 }, { scale: 1.3, duration: 0.1, yoyo: true, repeat: 1 })
    }

    setSelectedRating(starRating)
    onRatingChange(starRating)
  }

  const handleStarHover = (starRating: number) => {
    if (readonly) return
    setHoveredRating(starRating)
  }

  // Use hoveredRating if present, else selectedRating
  const displayRating = hoveredRating !== null ? hoveredRating : selectedRating

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoveredRating(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating
          const isHalfFilled = star - 0.5 <= displayRating && star > displayRating

          return (
            <div
              key={star}
              ref={(el) => (starsRef.current[star - 1] = el)}
              className={cn("relative cursor-pointer transition-all duration-200", readonly && "cursor-default")}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-all duration-200",
                  isFilled || isHalfFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700",
                  !readonly && "hover:scale-110",
                )}
              />
              {isHalfFilled && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className={cn(sizeClasses[size], "fill-yellow-400 text-yellow-400")} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showValue && (
        <span className={cn("font-medium text-muted-foreground", textSizeClasses[size])}>
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
