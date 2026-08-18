"use client"

import { useRef, useEffect, useState } from "react"
import { gsap } from "gsap"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface FavoriteHeartProps {
  isFavorited: boolean
  onToggle: () => void
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function FavoriteHeart({ isFavorited, onToggle, size = "md", disabled = false }: FavoriteHeartProps) {
  const heartRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [favorited, setFavorited] = useState(isFavorited)

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const buttonSizeClasses = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  }

  useEffect(() => {
    if (heartRef.current) {
      gsap.fromTo(
        heartRef.current,
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
      )
    }
  }, [])

  // Keep local favorited state in sync with prop
  useEffect(() => {
    setFavorited(isFavorited)
  }, [isFavorited])

  const handleClick = () => {
    if (disabled) return

    // Heart animation
    if (heartRef.current) {
      if (!favorited) {
        // Blossom effect when favoriting
        gsap
          .timeline()
          .to(heartRef.current, { scale: 1.5, duration: 0.2 })
          .to(heartRef.current, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.3)" })

        // Particle explosion effect
        if (particlesRef.current) {
          const particles = particlesRef.current.children
          Array.from(particles).forEach((particle, index) => {
            const angle = (index / particles.length) * Math.PI * 2
            const distance = 30
            const x = Math.cos(angle) * distance
            const y = Math.sin(angle) * distance

            gsap
              .timeline()
              .set(particle, { opacity: 1, scale: 0 })
              .to(particle, { scale: 1, duration: 0.2 })
              .to(particle, { x, y, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.1")
              .set(particle, { x: 0, y: 0 })
          })
        }
      } else {
        // Simple scale down when unfavoriting
        gsap.fromTo(heartRef.current, { scale: 1 }, { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
      }
    }

    setFavorited(!favorited)
    onToggle()
  }

  // Heart should be pink if hovered or favorited
  const heartIsActive = hovered || favorited

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative rounded-full transition-all duration-200 hover:bg-pink-50 dark:hover:bg-pink-900/20",
          buttonSizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div ref={heartRef}>
          <Heart
            className={cn(
              sizeClasses[size],
              "transition-all duration-200",
              heartIsActive
                ? "fill-pink-500 text-pink-500"
                : "fill-none text-gray-400 hover:text-pink-400 dark:text-gray-600 dark:hover:text-pink-400",
            )}
          />
        </div>
      </button>

      {/* Particle effects */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-1 h-1 bg-pink-400 rounded-full opacity-0"
            style={{ transform: "translate(-50%, -50%)" }}
          />
        ))}
      </div>
    </div>
  )
}
