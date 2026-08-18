"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { gsap } from "gsap"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  X,
  BookOpen,
  ChevronDown,
  ChevronRight,
  User,
  Settings,
  GraduationCap,
  Star,
  Plus,
  Home,
  Search,
} from "lucide-react"

type Subject = {
  id: number
  name: string
  icon?: string
  syllabus_type?: string
}

type Chapter = {
  id: number
  subject_id: number
  name: string
}

type Subtopic = {
  id: number
  chapter_id: number
  name: string
}

type Trainer = {
  id: string
  full_name: string
  expertise: string
  bio: string
  photo_url: string
  rating: number
  experience_years: number
}

interface AnimatedSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AnimatedSidebar({ isOpen, onClose }: AnimatedSidebarProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [chapters, setChapters] = useState<{ [key: number]: Chapter[] }>({})
  const [subtopics, setSubtopics] = useState<{ [key: number]: Subtopic[] }>({})
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [userSyllabus, setUserSyllabus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTrainer, setIsTrainer] = useState(false)

  const sidebarRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's syllabus preference first
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

          // Check if user is a trainer
          const { data: trainerData } = await supabase.from("trainers").select("id").eq("user_id", user.id).single()

          setIsTrainer(!!trainerData)
        }

        // Fetch subjects filtered by user's syllabus
        const { data: subjectsData } = await supabase
          .from("subjects")
          .select("id, name, icon, syllabus_type")
          .eq("syllabus_type", syllabusType)
          .order("id")

        setSubjects(subjectsData || [])

        // Fetch chapters for the filtered subjects
        if (subjectsData && subjectsData.length > 0) {
          const subjectIds = subjectsData.map((s) => s.id)
          const { data: chaptersData } = await supabase
            .from("chapters")
            .select("*")
            .in("subject_id", subjectIds)
            .order("id")

          if (chaptersData) {
            const chaptersGrouped = chaptersData.reduce(
              (acc, chapter) => {
                if (!acc[chapter.subject_id]) acc[chapter.subject_id] = []
                acc[chapter.subject_id].push(chapter)
                return acc
              },
              {} as { [key: number]: Chapter[] },
            )
            setChapters(chaptersGrouped)

            // Fetch subtopics for the chapters
            const chapterIds = chaptersData.map((c) => c.id)
            const { data: subtopicsData } = await supabase
              .from("subtopics")
              .select("*")
              .in("chapter_id", chapterIds)
              .order("id")

            if (subtopicsData) {
              const subtopicsGrouped = subtopicsData.reduce(
                (acc, subtopic) => {
                  if (!acc[subtopic.chapter_id]) acc[subtopic.chapter_id] = []
                  acc[subtopic.chapter_id].push(subtopic)
                  return acc
                },
                {} as { [key: number]: Subtopic[] },
              )
              setSubtopics(subtopicsGrouped)
            }
          }
        }

        // Fetch user's trainers if logged in
        if (user) {
          const { data: userTrainersData } = await supabase
            .from("user_trainers")
            .select(
              `
              trainer_id,
              trainers (
                id,
                full_name,
                expertise,
                bio,
                photo_url,
                rating,
                experience_years
              )
            `,
            )
            .eq("user_id", user.id)

          if (userTrainersData) {
            const trainersData = userTrainersData.map((ut: any) => ut.trainers).filter(Boolean)
            setTrainers(trainersData)
          }
        }
      } catch (error) {
        console.error("Error fetching sidebar data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    // Animate sidebar
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        x: isOpen ? 0 : -320,
        duration: 0.4,
        ease: "power2.out",
      })
    }

    // Animate overlay
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden",
        duration: 0.3,
      })
    }

    // Animate sidebar content when opening
    if (isOpen && sidebarRef.current) {
      const items = sidebarRef.current.querySelectorAll(".sidebar-item")
      gsap.fromTo(items, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, delay: 0.2 })
    }
  }, [isOpen])

  const toggleSubject = (subjectId: number) => {
    setExpandedSubjects((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId)
      } else {
        newSet.add(subjectId)
      }
      return newSet
    })
  }

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
      return newSet
    })
  }

  const handleLinkClick = () => {
    onClose()
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

  if (!user) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] invisible opacity-0"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 border-r border-blue-200/50 dark:border-blue-800/50 shadow-2xl z-[45] transform -translate-x-80 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="sidebar-item flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AllLearn
                </h2>
                <p className="text-xs text-muted-foreground">
                  {userSyllabus ? `${userSyllabus.toUpperCase()} Syllabus` : "Learning Platform"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="space-y-6">
            {/* Home */}
            <div className="sidebar-item">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
              >
                <Home className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Home</span>
              </Link>
            </div>

            {/* Subjects */}
            <div className="sidebar-item">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                My Courses
              </h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {subjects.map((subject) => (
                  <div key={subject.id}>
                    <button
                      onClick={() => toggleSubject(subject.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 dark:bg-gray-900/70 transition-all duration-200 group border dark:border-blue-900/40"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {cleanSubjectName(subject.name).charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-sm">{cleanSubjectName(subject.name)}</span>
                      </div>
                      {chapters[subject.id] && (
                        <>
                          {expandedSubjects.has(subject.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                          )}
                        </>
                      )}
                    </button>

                    {/* Chapters */}
                    {expandedSubjects.has(subject.id) && chapters[subject.id] && (
                      <div className="ml-6 mt-2 space-y-1">
                        {chapters[subject.id].map((chapter) => (
                          <div key={chapter.id}>
                            <button
                              onClick={() => toggleChapter(chapter.id)}
                              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                            >
                              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                {chapter.name}
                              </span>
                              {subtopics[chapter.id] && (
                                <>
                                  {expandedChapters.has(chapter.id) ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </>
                              )}
                            </button>

                            {/* Subtopics */}
                            {expandedChapters.has(chapter.id) && subtopics[chapter.id] && (
                              <div className="ml-4 mt-1 space-y-1">
                                {subtopics[chapter.id].map((subtopic) => (
                                  <Link
                                    key={subtopic.id}
                                    href={`/subtopics/${subtopic.id}`}
                                    onClick={handleLinkClick}
                                    className="block p-2 text-xs text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 dark:bg-gray-900/70 rounded-lg transition-all duration-200 border dark:border-blue-900/40"
                                  >
                                    {subtopic.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* My Account */}
            <div className="sidebar-item">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                My Account
              </h3>
              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
                >
                  <User className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Profile</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
                >
                  <Settings className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Settings</span>
                </Link>
              </div>
            </div>

            {/* Trainer Section */}
            <div className="sidebar-item">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                Training
              </h3>
              <div className="space-y-1">
                <Link
                  href="/find-trainer"
                  onClick={handleLinkClick}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
                >
                  <Search className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Find a Trainer</span>
                </Link>

                {isTrainer && (
                  <Link
                    href="/trainer/dashboard"
                    onClick={handleLinkClick}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 group"
                  >
                    <GraduationCap className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Trainer Dashboard</span>
                  </Link>
                )}
              </div>
            </div>

            {/* My Trainers */}
            <div className="sidebar-item">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                My Trainers
              </h3>
              <div className="space-y-3">
                {trainers.length > 0 ? (
                  trainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/50"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border-2 border-blue-200">
                          <AvatarImage src={trainer.photo_url || "/placeholder.svg"} alt={trainer.full_name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {trainer.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{trainer.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{trainer.expertise}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{trainer.rating}</span>
                            <Badge variant="secondary" className="text-xs">
                              {trainer.experience_years}y
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200/50 dark:border-orange-800/50 text-center">
                    <div className="text-2xl mb-2">🚀</div>
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-3">
                      Level Up – Choose your trainer and start crushing your goals with expert support!
                    </p>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0"
                      onClick={handleLinkClick}
                      asChild
                    >
                      <Link href="/find-trainer">
                        <Plus className="h-3 w-3 mr-1" />
                        Find a Trainer
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
