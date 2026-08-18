"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, BookOpen } from "lucide-react"
import { AnimatedBreadcrumb } from "@/components/animated-breadcrumb"

type Chapter = {
  id: number
  subject_id: number
  name: string
  description: string | null
}

type Subject = {
  id: number
  name: string
}

type Subtopic = {
  id: number
  chapter_id: number
  name: string
  content: string | null
  video_id: string | null
  difficulty_level: string | null
}

export default function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params promise
  const { id } = use(params);
  const chapterId = parseInt(id);

  const { user } = useAuth()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [subject, setSubject] = useState<Subject | null>(null)
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [userProgress, setUserProgress] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching chapter with ID:", chapterId)

        // Fetch chapter
        const { data: chapterData, error: chapterError } = await supabase
          .from("chapters")
          .select("*")
          .eq("id", chapterId)
          .single()

        if (chapterError) {
          console.error("Chapter error:", chapterError)
          throw new Error(`Chapter not found: ${chapterError.message}`)
        }

        if (!chapterData) {
          throw new Error("Chapter not found")
        }

        console.log("Chapter data:", chapterData)
        setChapter(chapterData)

        // Fetch subject
        if (chapterData.subject_id) {
          const { data: subjectData, error: subjectError } = await supabase
            .from("subjects")
            .select("id, name")
            .eq("id", chapterData.subject_id)
            .single()

          if (subjectError) {
            console.error("Subject error:", subjectError)
          } else {
            console.log("Subject data:", subjectData)
            setSubject(subjectData)
          }
        }

        // Fetch subtopics
        const { data: subtopicsData, error: subtopicsError } = await supabase
          .from("subtopics")
          .select("*")
          .eq("chapter_id", chapterId)
          .order("id", { ascending: true })

        if (subtopicsError) {
          console.error("Subtopics error:", subtopicsError)
        } else {
          console.log("Subtopics data:", subtopicsData)
          console.log("Number of subtopics:", subtopicsData?.length || 0)
          setSubtopics(subtopicsData || [])
        }

        // Fetch user progress if logged in
        if (user && subtopicsData && subtopicsData.length > 0) {
          const subtopicIds = subtopicsData.map((s) => s.id)
          const { data: progressData, error: progressError } = await supabase
            .from("user_subtopic_progress")
            .select("subtopic_id, progress_stage")
            .eq("user_id", user.id)
            .in("subtopic_id", subtopicIds)

          if (!progressError && progressData) {
            const progressMap: Record<number, number> = {}
            progressData.forEach((p) => {
              progressMap[p.subtopic_id] = p.progress_stage
            })
            setUserProgress(progressMap)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (chapterId) {
      fetchChapterData()
    }
  }, [chapterId, user])

  useEffect(() => {
    if (!loading && chapter && subtopics.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Animate title
        gsap.fromTo(".chapter-title", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })

        // Animate subtopics with proper stagger
        gsap.fromTo(
          ".subtopic-card",
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.1,
            duration: 0.6,
            ease: "power2.out",
          },
        )
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [loading, chapter, subtopics])

  const handleProgressChange = async (subtopicId: number, newStage: number) => {
    if (!user) return

    try {
      const { error } = await supabase.from("user_subtopic_progress").upsert(
        {
          user_id: user.id,
          subtopic_id: subtopicId,
          progress_stage: newStage,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,subtopic_id",
        },
      )

      if (!error) {
        setUserProgress((prev) => ({
          ...prev,
          [subtopicId]: newStage,
        }))
      }
    } catch (error) {
      console.error("Error updating progress:", error)
    }
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getProgressColor = (stage: number) => {
    switch (stage) {
      case 1:
        return "bg-red-500"
      case 2:
        return "bg-yellow-500"
      case 3:
        return "bg-green-400"
      case 4:
        return "bg-blue-600"
      default:
        return "bg-gray-200"
    }
  }

  const getProgressLabel = (stage: number) => {
    switch (stage) {
      case 1:
        return "Yet to Learn"
      case 2:
        return "Walking"
      case 3:
        return "Running"
      case 4:
        return "Completed"
      default:
        return "Not Started"
    }
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
        isActive: false
      })
    }

    if (chapter) {
      items.push({
        label: chapter.name,
        href: `/chapters/${chapter.id}`,
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
            <Skeleton className="h-16 w-full max-w-lg rounded-xl" />
          </div>
          
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="space-y-4 max-w-4xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb for error state */}
          <AnimatedBreadcrumb items={[
            { label: "Subjects", href: "/subjects", isActive: false },
            { label: "Chapter Not Found", href: "#", isActive: true }
          ]} />
          
          <div className="text-center mt-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Chapter Not Found</h1>
            <p className="mb-6 text-muted-foreground">{error || "The chapter you're looking for doesn't exist."}</p>
          </div>
        </div>
      </div>
    )
  }

  const breadcrumbItems = buildBreadcrumbItems()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8 pb-16">
        {/* Animated Breadcrumb */}
        <AnimatedBreadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent chapter-title">
            {chapter.name}
          </h1>
          {chapter.description && (
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{chapter.description}</p>
          )}
        </div>

        {/* Subtopics */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Topics to Learn</h2>
            <span className="text-sm text-muted-foreground">
              {subtopics.length} topic{subtopics.length !== 1 ? "s" : ""} available
            </span>
          </div>

          {/* Subtopics Container with proper spacing */}
          <div className="space-y-6 w-full">
            {subtopics.length > 0 ? (
              subtopics.map((subtopic, index) => (
                <div key={subtopic.id} className="subtopic-card w-full">
                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur hover:bg-white/90 hover:scale-[1.01] transform w-full">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors duration-300 break-words">
                              {subtopic.name}
                            </h3>
                          </div>

                          {subtopic.content && (
                            <p className="text-muted-foreground text-sm ml-13 mb-3 leading-relaxed">
                              {subtopic.content}
                            </p>
                          )}

                          {subtopic.video_id && (
                            <div className="ml-13 mb-3">
                              <span className="inline-flex items-center text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                                📹 Video available
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Difficulty Badge */}
                        <div className="flex-shrink-0">
                          {subtopic.difficulty_level && (
                            <div
                              className={`px-3 py-1.5 rounded-full text-xs font-medium ${getDifficultyColor(subtopic.difficulty_level)}`}
                            >
                              {subtopic.difficulty_level.charAt(0).toUpperCase() + subtopic.difficulty_level.slice(1)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Learning Progress */}
                      {user && (
                        <div className="mt-4 ml-13">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">Your Progress:</span>
                            <span className="text-xs text-muted-foreground">
                              {getProgressLabel(userProgress[subtopic.id] || 0)}
                            </span>
                          </div>
                          <div className="flex gap-1.5 max-w-xs">
                            {[1, 2, 3, 4].map((stage) => (
                              <button
                                key={stage}
                                onClick={() => handleProgressChange(subtopic.id, stage)}
                                className={`flex-1 h-3 rounded-sm transition-all duration-300 hover:opacity-80 hover:scale-105 ${
                                  stage <= (userProgress[subtopic.id] || 0)
                                    ? getProgressColor(stage)
                                    : "bg-gray-200 dark:bg-gray-700"
                                }`}
                                title={getProgressLabel(stage)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Link */}
                      <div className="mt-4">
                        <Link href={`/subtopics/${subtopic.id}`} className="block">
                          <div className="flex justify-between items-center ml-13 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-blue-900/40 dark:bg-gray-900/70 transition-colors border dark:border-blue-900/40">
                            <span className="text-sm text-muted-foreground">Click to explore this topic</span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No topics available</h3>
                <p className="text-muted-foreground text-lg">Topics for this chapter will be added soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
