"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ChevronRight, Home } from "lucide-react"

type BreadcrumbItem = {
  label: string
  href: string
  isActive?: boolean
}

interface AnimatedBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function AnimatedBreadcrumb({ items }: AnimatedBreadcrumbProps) {
  const breadcrumbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (breadcrumbRef.current) {
      const breadcrumbItems = breadcrumbRef.current.querySelectorAll(".breadcrumb-item")

      gsap.fromTo(
        breadcrumbItems,
        {
          opacity: 0,
          y: -10,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(1.7)",
        },
      )
    }
  }, [items])

  return (
    <div
      ref={breadcrumbRef}
      className="flex items-center space-x-2 p-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-blue-950/50 dark:via-gray-900 dark:to-purple-950/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm backdrop-blur-sm mb-6"
    >
      <Link
        href="/"
        className="breadcrumb-item flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
      >
        <Home className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700">Home</span>
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.isActive ? (
            <span className="breadcrumb-item px-3 py-2 text-sm font-bold text-blue-700 dark:text-blue-400">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="breadcrumb-item flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 group"
            >
              <span className="group-hover:scale-105 transition-transform">
                {item.label}
              </span>
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
