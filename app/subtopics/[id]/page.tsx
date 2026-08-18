"use client"

import React from "react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  FileQuestion,
  BookOpen,
  HelpCircle,
  Lock,
  CheckCircle,
  Zap,
  Target,
  Flame,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { VideoCarousel } from "@/components/video-carousel";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { LearningProgress } from "@/components/learning-progress";
import { DifficultyIndicator } from "@/components/difficulty-indicator";
import { useRouter } from "next/navigation";

type Subtopic = {
  id: number
  chapter_id: number
  name: string
  content: string | null
  video_id: string | null
  quiz_data: string | null
  qa_data: string | null
  notes: string | null
  difficulty_level: string | null
}

type Chapter = {
  id: number;
  name: string;
  description?: string | null;
};

type VideoType = {
  id: number
  subtopic_id: number
  language: string
  youtube_id: string
  title: string
  description: string | null
  syllabus_type: string | null
  video_code: string | null
  video_duration: number | null
  video_likes: number | null
  video_dislikes: number | null
  video_status: string | null
  is_active: boolean | null
  view_count: number | null
  created_at: string | null
  updated_at: string | null
}

type QuizQuestion = {
  id: number;
  subtopic_id: number;
  question_text: string;
  options: QuizOption[];
  userAnswer?: string | number | null;
  isCorrect?: boolean;
};

type QuizOption = {
  id: string | number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
  explanation?: string;
};

type QAItem = {
  id: number
  subtopic_id: number
  question: string
  answer: string
}

type Note = {
  id: number;
  subtopic_id: number;
  title: string;
  content: string;
  note_type?: string;
  file_url?: string | null;
  syllabus_type?: string;
  language?: string;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type Prerequisite = {
  id: number;
  subtopic_id: number;
  prerequisite_text: string;
  is_mandatory: boolean;
  prerequisite_url?: string;
};

export default function SubtopicPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [qaItems, setQaItems] = useState<QAItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguage] = useState("english");
  const [userSettings, setUserSettings] = useState<any>(null);
  const [learningProgress, setLearningProgress] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Difficulty configuration
  const getDifficultyConfig = (level: "easy" | "medium" | "hard") => {
    const configs = {
      easy: {
        icon: Zap,
        label: "Easy",
        gradient: "from-green-400 to-emerald-500",
        shadow: "shadow-green-500/25",
        ring: "ring-green-500/30",
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        text: "text-green-700 dark:text-green-300",
        hoverBg: "hover:bg-green-100 dark:hover:bg-green-900/30"
      },
      medium: {
        icon: Target,
        label: "Medium",
        gradient: "from-yellow-400 to-orange-500",
        shadow: "shadow-yellow-500/25",
        ring: "ring-yellow-500/30",
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-700 dark:text-yellow-300",
        hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
      },
      hard: {
        icon: Flame,
        label: "Hard",
        gradient: "from-red-400 to-rose-500",
        shadow: "shadow-red-500/25",
        ring: "ring-red-500/30",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-300",
        hoverBg: "hover:bg-red-100 dark:hover:bg-red-900/30"
      }
    };
    return configs[level];
  };

  // Handle difficulty change
  const handleDifficultyChange = async (level: "easy" | "medium" | "hard") => {
    if (!subtopic) return;

    try {
      const { error } = await supabase
        .from("subtopics")
        .update({ difficulty_level: level })
        .eq("id", subtopic.id);

      if (error) throw error;

      setSubtopic(prev => prev ? { ...prev, difficulty_level: level } : prev);
      
      toast({
        title: "Difficulty Updated",
        description: `Difficulty level changed to ${level}`,
      });
    } catch (error) {
      console.error("Error updating difficulty:", error);
      toast({
        title: "Error",
        description: "Failed to update difficulty level",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchSubtopicData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch subtopic
        const { data: subtopicData, error: subtopicError } = await supabase
          .from("subtopics")
          .select("*")
          .eq("id", id)
          .single()

        if (subtopicError) {
          throw new Error(`Subtopic not found: ${subtopicError.message}`);
        }

        setSubtopic(subtopicData)

        // Fetch learning progress if user is logged in
        if (user) {
          try {
            const { data: progressData, error: progressError } = await supabase
              .from("user_subtopic_progress")
              .select("progress_stage")
              .eq("user_id", user.id)
              .eq("subtopic_id", id)
              .single();

            if (progressError && progressError.code !== "PGRST116") {
              console.warn("Progress fetch warning:", progressError);
            } else if (progressData) {
              setLearningProgress(progressData.progress_stage);
            }
          } catch (error) {
            console.warn("Progress fetch error:", error);
          }
        }

        // Fetch chapter
        if (subtopicData.chapter_id) {
          try {
            const { data: chapterData, error: chapterError } = await supabase
              .from("chapters")
              .select("id, name, description")
              .eq("id", subtopicData.chapter_id)
              .single();

            if (chapterError) {
              console.warn("Chapter fetch error:", chapterError);
            } else {
              setChapter(chapterData);
            }
          } catch (error) {
            console.warn("Chapter fetch error:", error);
          }
        }

        // Fetch videos
        try {
          const { data: videosData, error: videosError } = await supabase
            .from("videos")
            .select("*")
            .eq("subtopic_id", id);

          if (videosError) {
            console.warn("Videos fetch error:", videosError);
          } else {
            setVideos(videosData || []);
          }
        } catch (error) {
          console.warn("Videos fetch error:", error);
        }

        // Fetch quiz questions with proper error handling
        try {
          const { data: questionsData, error: questionsError } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("subtopic_id", Number(id));

          if (questionsError) {
            console.warn("Quiz questions fetch error:", questionsError);
          } else if (questionsData && questionsData.length > 0) {
            // Fetch options for each question
            const questionsWithOptions = await Promise.all(
              questionsData.map(async (question) => {
                try {
                  const { data: optionsData, error: optionsError } = await supabase
                    .from("quiz_options")
                    .select('*')
                    .eq("Question_id", question.id);

                  if (optionsError) {
                    console.warn("Options fetch error:", optionsError);
                    return {
                      ...question,
                      options: [],
                      userAnswer: null,
                      isCorrect: false,
                    };
                  }

                  // Process options data safely
                  const processedOptions = (optionsData || []).flatMap((opt) => {
                    if (!opt.Option_text || !Array.isArray(opt.Option_text)) {
                      return [];
                    }
                    
                    return opt.Option_text.map((text: string, idx: number) => ({
                      id: `${opt.Id}-${idx}`,
                      question_id: opt.Question_id,
                      option_text: text,
                      is_correct: text === opt.Is_correct,
                      explanation: opt.Explanation || "",
                    }));
                  });

                  return {
                    ...question,
                    options: processedOptions,
                    userAnswer: null,
                    isCorrect: false,
                  };
                } catch (error) {
                  console.warn("Question processing error:", error);
                  return {
                    ...question,
                    options: [],
                    userAnswer: null,
                    isCorrect: false,
                  };
                }
              })
            );

            setQuizQuestions(questionsWithOptions);
          }
        } catch (error) {
          console.warn("Quiz fetch error:", error);
        }

        // Fetch Q&A items
        try {
          const { data: qaData, error: qaError } = await supabase
            .from("qa_items")
            .select("*")
            .eq("subtopic_id", id);

          if (qaError) {
            console.warn("QA fetch error:", qaError);
          } else {
            setQaItems(qaData || []);
          }
        } catch (error) {
          console.warn("QA fetch error:", error);
        }

        // Fetch notes
        try {
          const { data: notesData, error: notesError } = await supabase
            .from("notes")
            .select("*")
            .eq("subtopic_id", Number(id))
            .eq("is_active", true)
            .eq("language", "english");

          if (notesError) {
            console.warn("Notes fetch error:", notesError);
          } else {
            setNotes(notesData || []);
          }
        } catch (error) {
          console.warn("Notes fetch error:", error);
        }

        // Fetch prerequisites
        if (subtopicData?.id) {
          try {
            const { data: prerequisitesData, error: prerequisitesError } = await supabase
              .from("subtopic_prerequisites")
              .select("id, subtopic_id, prerequisite_text, is_mandatory, prerequisite_url")
              .eq("subtopic_id", subtopicData.id);

            if (prerequisitesError) {
              console.warn("Prerequisites fetch error:", prerequisitesError);
            } else {
              setPrerequisites(prerequisitesData || []);
            }
          } catch (error) {
            console.warn("Prerequisites fetch error:", error);
          }
        }

        // Fetch user settings if logged in
        if (user) {
          try {
            const { data: settings, error: settingsError } = await supabase
              .from("user_settings")
              .select("*")
              .eq("user_id", user.id)
              .single();

            if (settingsError && settingsError.code !== "PGRST116") {
              console.warn("Settings fetch error:", settingsError);
            } else if (settings) {
              setUserSettings(settings);
              setActiveLanguage(settings.preferred_language || "english");
            }
          } catch (error) {
            console.warn("Settings fetch error:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching subtopic data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false)
      }
    };

    if (id) {
      fetchSubtopicData();
    }
  }, [id, user]);

  const handleAnswerSelect = (questionId: number, optionId: string | number) => {
    if (quizSubmitted) return;

    setQuizQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, userAnswer: optionId } : q)))
  }

  const handleQuizSubmit = () => {
    const allAnswered = quizQuestions.every(
      (q) => q.userAnswer !== null && q.userAnswer !== undefined
    );

    if (!allAnswered) {
      toast({
        title: "Quiz incomplete",
        description: "Please answer all questions before submitting",
        variant: "destructive",
      })
      return
    }

    // Calculate score and mark correct/incorrect
    let score = 0;
    const markedQuestions = quizQuestions.map((question) => {
      const selectedOption = question.options.find((opt) => opt.id === question.userAnswer);
      const isCorrect = selectedOption?.is_correct || false;

      if (isCorrect) score++;

      return {
        ...question,
        isCorrect,
      }
    })

    setQuizQuestions(markedQuestions)
    setQuizScore(score)
    setQuizSubmitted(true)

    toast({
      title: "Quiz submitted",
      description: `Your score: ${score}/${quizQuestions.length}`,
    })
  }

  const resetQuiz = () => {
    setQuizQuestions((prev) => prev.map((q) => ({ ...q, userAnswer: null, isCorrect: false })))
    setQuizSubmitted(false)
    setQuizScore(0)
  }

  const handleLanguageChange = (language: string) => {
    setActiveLanguage(language)
  }

  const handleProgressChange = async (stage: number) => {
    if (!user) return

    try {
      await supabase.from("user_subtopic_progress").upsert({
        user_id: user.id,
        subtopic_id: id,
        progress_stage: stage,
        updated_at: new Date().toISOString(),
      })

      setLearningProgress(stage)

      toast({
        title: "Progress updated",
        description: `Learning stage updated to: ${["", "Yet to Learn", "Walking", "Running", "Completed"][stage]}`,
      })
    } catch (error) {
      console.error("Error updating progress:", error)
      toast({
        title: "Error",
        description: "Failed to update learning progress",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!loading && subtopic) {
      gsap.from(contentRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out",
      });

      // Animate difficulty buttons with proper visibility
      const difficultyButtons = document.querySelectorAll(".difficulty-button");
      if (difficultyButtons.length > 0) {
        gsap.set(difficultyButtons, { opacity: 1, visibility: "visible" });
        gsap.from(difficultyButtons, {
          scale: 0.8,
          y: 20,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 0.3,
        });
      }
    }
  }, [loading, subtopic]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-16 w-full mb-8 rounded-xl" />
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-[400px] w-full mb-8" />
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !subtopic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Subtopic Not Found</h1>
          <p className="mb-6 text-muted-foreground">The subtopic you're looking for doesn't exist.</p>
          <Link
            href="/subjects"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Back to Subjects
          </Link>
        </div>
      </div>
    )
  }

  // Function to handle difficulty button clicks - only works for logged-in users
  const handleDifficultyClick = async (level: "easy" | "medium" | "hard") => {
    // Strict check - do nothing if user is not logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to set difficulty preferences",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/login')}
          >
            Login
          </Button>
        ),
      })
      return
    }

    // Only proceed if user is authenticated
    try {
      const { error } = await supabase
        .from("subtopics")
        .update({ difficulty_level: level })
        .eq("id", subtopic.id)

      if (error) throw error

      setSubtopic((prev) => prev ? { ...prev, difficulty_level: level } : prev)
      
      toast({
        title: "Difficulty Updated",
        description: `Topic difficulty set to ${level}`,
      })
    } catch (error) {
      console.error("Error updating difficulty:", error)
      toast({
        title: "Error",
        description: "Failed to update difficulty",
        variant: "destructive",
      })
    }
  } // <-- This closes handleDifficultyClick

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8" ref={contentRef}>
        {/* Breadcrumbs */}
        

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <DynamicBreadcrumb
              customItems={[
                { label: "Subjects", href: "/subjects" },
                chapter ? { label: chapter.name || "Chapter", href: `/chapters/${chapter.id}` } : undefined,
                subtopic ? { label: subtopic.name, href: "", isActive: true } : undefined,
              ].filter((item): item is { label: string; href: string; isActive?: boolean } => !!item)}
            />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {subtopic.name}
            </h1>
            {subtopic.difficulty_level && (
              <DifficultyIndicator difficulty={subtopic.difficulty_level as "easy" | "medium" | "hard"} />
            )}
          </div>

          {/* Enhanced Difficulty Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Choose Your Challenge Level
            </h3>
            <div className="flex justify-center gap-4 max-w-2xl mx-auto">
              {(["easy", "medium", "hard"] as const).map((level) => {
                const config = getDifficultyConfig(level);
                const Icon = config.icon;
                const isActive = subtopic.difficulty_level === level;

                return (
                  <button
                    key={level}
                    className={`difficulty-button group relative flex-1 max-w-[200px] p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 opacity-100 visible ${
                      isActive
                        ? `bg-gradient-to-br ${config.gradient} text-white border-transparent shadow-lg ${config.shadow} ring-4 ${config.ring}`
                        : `${config.bg} ${config.border} ${config.text} ${config.hoverBg} hover:border-opacity-60 hover:shadow-md`
                    }`}
                    style={{
                      opacity: 1,
                      visibility: "visible",
                      minHeight: "120px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onClick={() => handleDifficultyChange(level)}
                    disabled={!user}
                  >
                    <div className="relative flex flex-col items-center space-y-2 flex-1 justify-center">
                      <div
                        className={`p-2 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-white/20 backdrop-blur-sm"
                            : "bg-white/50 dark:bg-gray-800/50 group-hover:bg-white/70 dark:group-hover:bg-gray-700/70"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 transition-all duration-300 ${
                            isActive ? "text-white" : config.text
                          }`}
                        />
                      </div>

                      <div className="text-center">
                        <div
                          className={`font-bold text-sm transition-all duration-300 ${
                            isActive ? "text-white" : config.text
                          }`}
                        >
                          {config.label}
                        </div>
                        <div
                          className={`text-xs mt-1 transition-all duration-300 ${
                            isActive
                              ? "text-white/80"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {level === "easy" && "Perfect for beginners"}
                          {level === "medium" && "Balanced challenge"}
                          {level === "hard" && "Expert level"}
                        </div>
                      </div>
                    </div>

                    {/* Simplified hover glow effect */}
                    {!isActive && (
                      <div
                        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${config.gradient}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Difficulty Description */}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {subtopic.difficulty_level === "easy" && (
                <p className="flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  Great for building foundational understanding
                </p>
              )}
              {subtopic.difficulty_level === "medium" && (
                <p className="flex items-center justify-center gap-2">
                  <Target className="h-4 w-4 text-yellow-500" />
                  Perfect balance of challenge and learning
                </p>
              )}
              {subtopic.difficulty_level === "hard" && (
                <p className="flex items-center justify-center gap-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  Advanced concepts for experienced learners
                </p>
              )}
            </div>
          </div>

          {user && (
            <div className="max-w-md mx-auto space-y-3">
              <h3 className="text-lg font-semibold">Your Learning Progress</h3>
              <LearningProgress currentStage={learningProgress} onStageChange={handleProgressChange} />
            </div>
          )}
        </div>

        <Tabs defaultValue="video" className="max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-5 mb-8 bg-white/50 dark:bg-gray-900/70 dark:border dark:border-blue-900/40 backdrop-blur-sm shadow-sm">
            <TabsTrigger
              value="prerequisite"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Prerequisite</span>
              {!user && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger
              value="video"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">Quiz</span>
              {!user && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger
              value="qa"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Q&A</span>
              {!user && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Notes</span>
              {!user && <Lock className="h-3 w-3 ml-1" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prerequisite" className="space-y-6">
            {!user ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Login Required
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to view prerequisites.
                </p>
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            ) : prerequisites.length > 0 ? (
              <div className="space-y-4">
                {prerequisites.map((prereq) => (
                  <div key={prereq.id} className="p-4 border rounded">
                    {prereq.prerequisite_text}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-muted-foreground mb-6">
                  No prerequisite material for this subtopic.
                </h3>
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            {videos.length > 0 ? (
              <>
                <VideoCarousel videos={videos} language={activeLanguage} />

                {videos.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                      Available Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(videos.map((v) => v.language))).map(
                        (language) => (
                          <Button
                            key={language}
                            variant={
                              activeLanguage === language ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handleLanguageChange(language)}
                            className="capitalize"
                          >
                            {language.charAt(0).toUpperCase() + language.slice(1)}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <Video className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-muted-foreground">
                  No videos available for this subtopic.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            {!user ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Login Required
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to access quizzes.
                </p>
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            ) : quizQuestions.length > 0 ? (
              <>
                <div className="space-y-8">
                  {quizQuestions.map((question, index) => (
                    <Card
                      key={question.id}
                      className="bg-white/70 dark:bg-gray-900/70 dark:border dark:border-blue-900/40 dark:shadow-lg backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    >
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                          {index + 1}. {question.question_text}
                        </h3>
                        <div className="space-y-3">
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                question.userAnswer === option.id
                                  ? quizSubmitted
                                    ? option.is_correct
                                      ? "bg-green-100 border-green-300 dark:bg-green-800/80 dark:border-green-400 text-green-800 dark:text-green-200"
                                      : "bg-red-100 border-red-300 dark:bg-red-800/80 dark:border-red-400 text-red-800 dark:text-red-200"
                                    : "bg-blue-100 border-blue-300 dark:bg-blue-900/40 dark:border-blue-400 text-blue-800 dark:text-blue-200"
                                  : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                              }`}
                              onClick={() =>
                                handleAnswerSelect(question.id, option.id)
                              }
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {option.option_text}
                                </span>
                                {quizSubmitted &&
                                  question.userAnswer === option.id && (
                                    <div className="flex items-center gap-1">
                                      {option.is_correct ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                      )}
                                    </div>
                                  )}
                              </div>
                              {quizSubmitted &&
                                question.userAnswer === option.id &&
                                option.explanation && (
                                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 border-t pt-2">
                                    <strong>Explanation:</strong> {option.explanation}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex justify-between items-center pt-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg p-4">
                    {quizSubmitted ? (
                      <>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Your Score: {quizScore}/{quizQuestions.length} (
                          {Math.round((quizScore / quizQuestions.length) * 100)}%)
                        </div>
                        <Button onClick={resetQuiz} variant="outline">
                          Try Again
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleQuizSubmit} className="ml-auto">
                        Submit Answers
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <FileQuestion className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-muted-foreground">
                  No quiz available for this subtopic.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="qa" className="space-y-6">
            {!user ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Login Required
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to access Q&A content.
                </p>
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            ) : qaItems.length > 0 ? (
              <div className="space-y-6">
                {qaItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-white/70 dark:bg-gray-900/70 dark:border dark:border-blue-900/40 dark:shadow-lg backdrop-blur-sm border-gray-200 dark:border-gray-700"
                  >
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                        {item.question}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-muted-foreground">
                  No Q&A available for this subtopic.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            {!user ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Login Required
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to access notes.
                </p>
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            ) : notes.length > 0 ? (
              <div className="space-y-6">
                {notes.map((note) => (
                  <Card
                    key={note.id}
                    className="bg-white/70 dark:bg-gray-900/70 dark:border dark:border-blue-900/40 dark:shadow-lg backdrop-blur-sm border-gray-200 dark:border-gray-700"
                  >
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        {note.title}
                      </h3>
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                      {note.file_url && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <a
                            href={note.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <BookOpen className="h-4 w-4" />
                            Download Additional Resources
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-muted-foreground">
                  No notes available for this subtopic.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

