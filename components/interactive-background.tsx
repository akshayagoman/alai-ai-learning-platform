"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface MousePosition {
  x: number
  y: number
}

export function InteractiveBackground() {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 700 }
  const mouseXSpring = useSpring(mouseX, springConfig)
  const mouseYSpring = useSpring(mouseY, springConfig)

  const mouseXTransforms = Array.from({ length: 3 }).map((_, i) => useTransform(mouseXSpring, (x) => x / (10 + i * 5)))
  const mouseYTransforms = Array.from({ length: 3 }).map((_, i) => useTransform(mouseYSpring, (y) => y / (10 + i * 5)))

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      setMousePosition({ x: clientX, y: clientY })
      mouseX.set(clientX)
      mouseY.set(clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  // Web-like lines
  const WebLines = () => (
    <svg className="absolute inset-0 w-full h-full opacity-20">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.line
          key={i}
          x1={`${i * 12.5}%`}
          y1="0%"
          x2={`${i * 12.5 + 10}%`}
          y2="100%"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 2, delay: i * 0.2 }}
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.line
          key={`h-${i}`}
          x1="0%"
          y1={`${i * 16.67}%`}
          x2="100%"
          y2={`${i * 16.67 + 5}%`}
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.2 }}
          transition={{ duration: 2, delay: i * 0.3 }}
        />
      ))}
    </svg>
  )

  // Floating geometric shapes
  const GeometricShapes = () => (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-10"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -30, 30, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          {i % 3 === 0 ? (
            <div className="w-8 h-8 border-2 border-primary rotate-45" />
          ) : i % 3 === 1 ? (
            <div className="w-6 h-6 bg-primary rounded-full" />
          ) : (
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-primary" />
          )}
        </motion.div>
      ))}
    </>
  )

  // Lab glassware
  const LabGlassware = () => (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-15"
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + (i % 2) * 40}%`,
          }}
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <svg width="40" height="60" viewBox="0 0 40 60" className="text-primary" fill="none">
            {i % 2 === 0 ? (
              // Flask
              <>
                <path
                  d="M15 20 L15 5 L25 5 L25 20 L35 45 L5 45 Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="currentColor"
                  fillOpacity="0.1"
                />
                <motion.circle
                  cx="20"
                  cy="35"
                  r="3"
                  fill="currentColor"
                  fillOpacity="0.3"
                  animate={{ r: [2, 4, 2] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </>
            ) : (
              // Beaker
              <>
                <rect
                  x="10"
                  y="15"
                  width="20"
                  height="35"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="currentColor"
                  fillOpacity="0.1"
                />
                <motion.rect
                  x="12"
                  y="40"
                  width="16"
                  height="8"
                  fill="currentColor"
                  fillOpacity="0.3"
                  animate={{ height: [6, 10, 6] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                />
              </>
            )}
          </svg>
        </motion.div>
      ))}
    </>
  )

  // Interactive elements that follow mouse
  const InteractiveElements = () => (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-primary/20 rounded-full cursor-pointer"
          style={{
            x: mouseXTransforms[i],
            y: mouseYTransforms[i],
          }}
          whileHover={{ scale: 2, opacity: 0.8 }}
          onHoverStart={() => setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
        />
      ))}
    </>
  )

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <WebLines />
      <GeometricShapes />
      <LabGlassware />
      <div className="pointer-events-auto">
        <InteractiveElements />
      </div>

      {/* Mouse follower */}
      <motion.div
        className="absolute w-6 h-6 border-2 border-primary/30 rounded-full pointer-events-none"
        style={{
          x: mouseXSpring,
          y: mouseYSpring,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: isHovering ? 0.8 : 0.4,
        }}
      />
    </div>
  )
}
