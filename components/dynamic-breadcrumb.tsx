"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { ChevronRight, Home, BookOpen, FileText, Video } from "lucide-react"
import { supabase } from "@/lib/supabase"

type BreadcrumbItem = {
  label: string
  href: string
  icon?: React.ReactNode
  isActive?: boolean
}

interface DynamicBreadcrumbProps {
  customItems?: BreadcrumbItem[]
}

const cleanSubjectName = (name: string): string => {
  const syllabusTypes = ["CBSE", "ICSE", "State Board", "TN Matriculation"]
  let cleanName = name
  for (const type of syllabusTypes) {
    if (name.startsWith(type)) {
      cleanName = name.substring(type.length).trim()
      break
    }
  }
  return cleanName
}

export function DynamicBreadcrumb({ customItems }: DynamicBreadcrumbProps) {
  const pathname = usePathname()
  const breadcrumbRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<BreadcrumbItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      if (customItems) {
        setItems(customItems)
        setLoading(false)
        return
      }

      const pathSegments = pathname.split("/").filter(Boolean)
      const breadcrumbs: BreadcrumbItem[] = []

      try {
        for (let i = 0; i < pathSegments.length; i++) {
          const segment = pathSegments[i]
          const id = pathSegments[i + 1]
          const isLast = i === pathSegments.length - 1 || (i === pathSegments.length - 2 && pathSegments[i + 1])

          switch (segment) {
            case "subjects":
              if (id) {
                // Fetch subject name
                const { data: subject } = await supabase.from("subjects").select("name").eq("id", id).single()

                if (subject) {
                  const cleanName = cleanSubjectName(subject.name)
                  breadcrumbs.push({
                    label: cleanName,
                    href: `/subjects/${id}`,
                    icon: <BookOpen className="h-4 w-4" />,
                    isActive: isLast,
                  })
                }
                i++ // Skip the ID segment
              } else {
                breadcrumbs.push({
                  label: "Subjects",
                  href: "/subjects",
                  icon: <BookOpen className="h-4 w-4" />,
                  isActive: isLast,
                })
              }
              break

            case "chapters":
              if (id) {
                // Fetch chapter and subject names
                const { data: chapter } = await supabase
                  .from("chapters")
                  .select(`
                    name,
                    subjects (id, name)
                  `)
                  .eq("id", id)
                  .single()

                if (chapter && chapter.subjects) {
                  const cleanSubjectNameValue = cleanSubjectName(chapter.subjects.name)
                  // Add subject breadcrumb if not already present
                  if (!breadcrumbs.some((b) => b.href === `/subjects/${chapter.subjects.id}`)) {
                    breadcrumbs.push({
                      label: cleanSubjectNameValue,
                      href: `/subjects/${chapter.subjects.id}`,
                      icon: <BookOpen className="h-4 w-4" />,
                    })
                  }

                  breadcrumbs.push({
                    label: chapter.name,
                    href: `/chapters/${id}`,
                    icon: <FileText className="h-4 w-4" />,
                    isActive: isLast,
                  })
                }
                i++ // Skip the ID segment
              }
              break

            case "subtopics":
              if (id) {
                // Fetch subtopic, chapter, and subject names
                const { data: subtopic } = await supabase
                  .from("subtopics")
                  .select(`
                    name,
                    chapters (
                      id,
                      name,
                      subjects (id, name)
                    )
                  `)
                  .eq("id", id)
                  .single()

                if (subtopic && subtopic.chapters && subtopic.chapters.subjects) {
                  const cleanSubjectNameValue = cleanSubjectName(subtopic.chapters.subjects.name)

                  // Add subject breadcrumb if not already present
                  if (!breadcrumbs.some((b) => b.href === `/subjects/${subtopic.chapters.subjects.id}`)) {
                    breadcrumbs.push({
                      label: cleanSubjectNameValue,
                      href: `/subjects/${subtopic.chapters.subjects.id}`,
                      icon: <BookOpen className="h-4 w-4" />,
                    })
                  }

                  // Add chapter breadcrumb if not already present
                  if (!breadcrumbs.some((b) => b.href === `/chapters/${subtopic.chapters.id}`)) {
                    breadcrumbs.push({
                      label: subtopic.chapters.name,
                      href: `/chapters/${subtopic.chapters.id}`,
                      icon: <FileText className="h-4 w-4" />,
                    })
                  }

                  breadcrumbs.push({
                    label: subtopic.name,
                    href: `/subtopics/${id}`,
                    icon: <Video className="h-4 w-4" />,
                    isActive: isLast,
                  })
                }
                i++ // Skip the ID segment
              }
              break

            case "profile":
              breadcrumbs.push({
                label: "Profile",
                href: "/profile",
                icon: <BookOpen className="h-4 w-4" />,
                isActive: isLast,
              })
              break

            case "settings":
              breadcrumbs.push({
                label: "Settings",
                href: "/settings",
                icon: <BookOpen className="h-4 w-4" />,
                isActive: isLast,
              })
              break

            case "trainers":
              breadcrumbs.push({
                label: "Trainers",
                href: "/trainers",
                icon: <BookOpen className="h-4 w-4" />,
                isActive: isLast,
              })
              break
          }
        }
      } catch (error) {
        console.error("Error generating breadcrumbs:", error)
      }

      setItems(breadcrumbs)
      setLoading(false)
    }

    generateBreadcrumbs()
  }, [pathname, customItems])

  useEffect(() => {
    if (!loading && breadcrumbRef.current) {
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
  }, [loading, items])

  if (loading || items.length === 0) {
    return null
  }

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
            <div className="breadcrumb-item flex items-center space-x-2 px-3 py-2">
              {item.icon && <span className="text-blue-600">{item.icon}</span>}
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {item.label}
              </span>
            </div>
          ) : (
            <Link
              href={item.href}
              className="breadcrumb-item flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 group"
            >
              {item.icon && (
                <span className="text-muted-foreground group-hover:text-blue-600 transition-colors">{item.icon}</span>
              )}
              <span>{item.label}</span>
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
