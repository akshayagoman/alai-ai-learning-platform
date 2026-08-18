"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Book, Calculator, FlaskRoundIcon as Flask, Leaf, Search, Filter, Grid, List } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb"

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type Subject = {
  id: number
  name: string
  description: string | null
  icon: string | null
  syllabus_type: string | null
}

const iconMap: Record<string, React.ReactNode> = {
  atom: <Flask className="h-8 w-8" />,
  flask: <Flask className="h-8 w-8" />,
  calculator: <Calculator className="h-8 w-8" />,
  leaf: <Leaf className="h-8 w-8" />,
  book: <Book className="h-8 w-8" />,
}

const colorMap: Record<string, { bg: string; text: string; gradient: string }> = {
  atom: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 to-cyan-500",
  },
  flask: {
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    gradient: "from-green-500 to-emerald-500",
  },
  calculator: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500 to-pink-500",
  },
  leaf: {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    gradient: "from-red-500 to-orange-500",
  },
  book: {
    bg: "bg-orange-100 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    gradient: "from-orange-500 to-yellow-500",
  },
}

export default function SubjectsPage() {
  const { user } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [userSyllabus, setUserSyllabus] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const headerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true)

        // Get user's syllabus preference if logged in
        let syllabusType = "cbse" // default
        if (user) {
          const { data: userSettings } = await supabase
            .from("user_settings")
            .select("syllabus_type")
            .eq("user_id", user.id)
            .single()

          if (userSettings?.syllabus_type) {
            syllabusType = userSettings.syllabus_type
          }
          setUserSyllabus(syllabusType)

          // Fetch subjects filtered by user's syllabus
          const { data, error } = await supabase
            .from("subjects")
            .select("*")
            .eq("syllabus_type", syllabusType)
            .order("id")

          if (error) {
            throw error
          }

          setSubjects(data || [])
        } else {
          // Show all subjects if not logged in
          const { data, error } = await supabase.from("subjects").select("*").order("id")

          if (error) {
            throw error
          }

          setSubjects(data || [])
        }
      } catch (error) {
        console.error("Error fetching subjects:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
  }, [user])

  useEffect(() => {
    if (!loading) {
      // Enhanced animations with ScrollTrigger
      gsap.fromTo(
        headerRef.current,
        {
          y: -50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        },
      )

      gsap.fromTo(
        searchRef.current,
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.3,
        },
      )

      // Animate subject cards with stagger and scroll trigger
      gsap.fromTo(
        ".subject-card",
        {
          y: 60,
          opacity: 0,
          scale: 0.8,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 0.5,
          scrollTrigger: {
            trigger: ".subjects-grid",
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        },
      )
    }
  }, [loading])

  // Filter subjects based on search term
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Function to clean subject name (remove syllabus prefix)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <DynamicBreadcrumb />

        {/* Header Section */}
        <div ref={headerRef} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Explore Subjects
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            Discover our comprehensive curriculum designed to help you excel in your studies
          </p>
          {userSyllabus && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-800/50">
              <Filter className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">{userSyllabus.toUpperCase()} Syllabus</span>
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div ref={searchRef} className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 dark:bg-gray-900/70 dark:text-foreground dark:border dark:border-blue-900/40 focus:border-blue-400 transition-all duration-300 rounded-xl shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "border-blue-200 hover:bg-blue-50"
                }`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    : "border-blue-200 hover:bg-blue-50"
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div
            className={`subjects-grid grid ${viewMode === "grid" ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 max-w-3xl mx-auto"} gap-6`}
          >
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-0 bg-white/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <Skeleton className="h-16 w-16 rounded-2xl" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Subjects Grid */
          <div
            className={`subjects-grid grid ${viewMode === "grid" ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 max-w-3xl mx-auto"} gap-6`}
          >
            {filteredSubjects.map((subject, index) => {
              const icon = subject.icon || "book"
              const color = colorMap[icon] || colorMap.book
              const displayName = cleanSubjectName(subject.name)

              return (
                <Link href={`/subjects/${subject.id}`} key={subject.id} className="subject-card group">
                  <Card className="overflow-hidden border-0 bg-white/70 dark:bg-gray-900/70 dark:border dark:border-blue-900/40 dark:shadow-lg backdrop-blur hover:bg-white/90 dark:hover:bg-gray-900/90 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 group-hover:border-blue-200/50">
                    <CardContent
                      className={`p-6 ${viewMode === "list" ? "flex items-center space-x-4" : "text-center"}`}
                    >
                      {viewMode === "grid" ? (
                        <div className="flex flex-col items-center h-full space-y-4">
                          <div
                            className={`${color.bg} p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 relative overflow-hidden shadow-lg`}
                          >
                            <div
                              className={`absolute inset-0 bg-gradient-to-r ${color.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                            ></div>
                            <span className={`${color.text} relative z-10 transition-colors duration-300`}>
                              {iconMap[icon] || iconMap.book}
                            </span>
                          </div>
                          <div className="space-y-2 flex-1">
                            <h2 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                              {displayName}
                            </h2>
                            {subject.description && (
                              <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                                {subject.description}
                              </p>
                            )}
                          </div>
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`${color.bg} p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-lg`}
                          >
                            <span className={color.text}>{iconMap[icon] || iconMap.book}</span>
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors duration-300">
                              {displayName}
                            </h2>
                            {subject.description && (
                              <p className="text-muted-foreground text-sm mt-1 group-hover:text-foreground/80 transition-colors duration-300">
                                {subject.description}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSubjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <Search className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No subjects found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "Try adjusting your search terms" : "No subjects available for your syllabus"}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")} variant="outline" className="border-blue-200 hover:bg-blue-50">
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
