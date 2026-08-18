"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, BookOpen, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedBreadcrumb } from "@/components/animated-breadcrumb"

type Subject = {
  id: number
  name: string
  description: string | null
}

type Chapter = {
  id: number
  subject_id: number
  name: string
  description: string | null
}

export default function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise
  const { id } = use(params);
  const subjectId = parseInt(id);

  const [subject, setSubject] = useState<Subject | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch subject
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("*")
          .eq("id", subjectId)
          .single()

        if (subjectError) {
          throw new Error(`Subject not found: ${subjectError.message}`)
        }

        setSubject(subjectData)

        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from("chapters")
          .select("*")
          .eq("subject_id", subjectId)
          .order("id", { ascending: true })

        if (chaptersError) {
          console.error("Chapters error:", chaptersError)
        } else {
          setChapters(chaptersData || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (subjectId) {
      fetchSubjectData()
    }
  }, [subjectId])

  // Animation effect
  useEffect(() => {
    if (!loading && subject && chapters.length >= 0) {
      const timer = setTimeout(() => {
        // Animate title
        const titleElement = document.querySelector(".subject-title")
        if (titleElement) {
          gsap.fromTo(titleElement, 
            { opacity: 0, y: -20 }, 
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
          )
        }

        // Animate chapters with proper stagger
        const chapterElements = document.querySelectorAll(".chapter-card")
        if (chapterElements.length > 0) {
          gsap.fromTo(chapterElements,
            { opacity: 0, y: 30, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.1,
              duration: 0.6,
              ease: "power2.out",
            }
          )
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [loading, subject, chapters])

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

  // Build breadcrumb items
  const buildBreadcrumbItems = () => {
    const items = [
      { label: "Subjects", href: "/subjects", isActive: false }
    ]

    if (subject) {
      const displayName = cleanSubjectName(subject.name)
      items.push({
        label: displayName,
        href: `/subjects/${subject.id}`,
        isActive: true
      })
    }

    return items
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-16 w-full max-w-md rounded-xl" />
          </div>
          
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="grid gap-4 max-w-4xl mx-auto">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb for error state */}
          <AnimatedBreadcrumb items={[
            { label: "Subjects", href: "/subjects", isActive: false },
            { label: "Subject Not Found", href: "#", isActive: true }
          ]} />
          
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Subject Not Found</h1>
            <p className="mb-6 text-muted-foreground">{error || "The subject you're looking for doesn't exist."}</p>
            <Button asChild>
              <Link href="/subjects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subjects
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const displayName = cleanSubjectName(subject.name)
  const breadcrumbItems = buildBreadcrumbItems()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8">
        {/* Animated Breadcrumb */}
        <AnimatedBreadcrumb items={breadcrumbItems} />

        {/* Back Navigation - Optional since we have breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/subjects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subjects
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent subject-title">
            {displayName}
          </h1>
          {subject.description && (
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{subject.description}</p>
          )}
        </div>

        {/* Chapters */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Chapters</h2>
          <div className="grid gap-4">
            {chapters.length > 0 ? (
              chapters.map((chapter, index) => (
                <Link href={`/chapters/${chapter.id}`} key={chapter.id}>
                  <Card className="chapter-card group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur hover:bg-white/90 hover:scale-[1.02] transform">
                    <CardContent className="p-6 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors duration-300">
                            {chapter.name}
                          </h3>
                          {chapter.description && (
                            <p className="text-muted-foreground text-sm">{chapter.description}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No chapters available</h3>
                <p className="text-muted-foreground text-lg">Chapters for this subject will be added soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
