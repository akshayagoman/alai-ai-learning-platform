"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { gsap } from "gsap"

type SyllabusOption = {
  value: string
  label: string
  description: string
}

export default function SetupPreferences() {
  const [selectedLanguage, setSelectedLanguage] = useState("")
  const [selectedSyllabus, setSelectedSyllabus] = useState("")
  const [syllabusOptions, setSyllabusOptions] = useState<SyllabusOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const languageOptions = [
    { value: "english", label: "English", flag: "🇺🇸" },
    { value: "hindi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
    { value: "tamil", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
    { value: "malayalam", label: "മലയാളം (Malayalam)", flag: "🇮🇳" },
    { value: "telugu", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
    { value: "kannada", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
    { value: "bengali", label: "বাংলা (Bengali)", flag: "🇮🇳" },
    { value: "marathi", label: "मराठी (Marathi)", flag: "🇮🇳" },
  ]

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchSyllabusOptions = async () => {
      try {
        const { data, error } = await supabase.from("subjects").select("syllabus_type").not("syllabus_type", "is", null)

        if (error) throw error

        const uniqueSyllabus = [...new Set(data?.map((item) => item.syllabus_type))]

        const syllabusMap: Record<string, SyllabusOption> = {
          cbse: { value: "cbse", label: "CBSE", description: "Central Board of Secondary Education" },
          icse: { value: "icse", label: "ICSE", description: "Indian Certificate of Secondary Education" },
          state_board: { value: "state_board", label: "State Board", description: "State Board of Education" },
          tn_matriculation: {
            value: "tn_matriculation",
            label: "TN Matriculation",
            description: "Tamil Nadu Matriculation Board",
          },
          kerala_board: { value: "kerala_board", label: "Kerala Board", description: "Kerala State Education Board" },
          karnataka_board: {
            value: "karnataka_board",
            label: "Karnataka Board",
            description: "Karnataka Secondary Education Board",
          },
          ap_board: { value: "ap_board", label: "AP Board", description: "Andhra Pradesh Board of Education" },
          ts_board: { value: "ts_board", label: "TS Board", description: "Telangana State Board of Education" },
        }

        const options = uniqueSyllabus
          .filter((syllabus) => syllabus && syllabusMap[syllabus])
          .map((syllabus) => syllabusMap[syllabus!])

        setSyllabusOptions(options)
      } catch (error) {
        console.error("Error fetching syllabus options:", error)
        setSyllabusOptions([
          { value: "cbse", label: "CBSE", description: "Central Board of Secondary Education" },
          { value: "icse", label: "ICSE", description: "Indian Certificate of Secondary Education" },
          { value: "state_board", label: "State Board", description: "State Board of Education" },
        ])
      } finally {
        setIsLoadingOptions(false)
      }
    }

    fetchSyllabusOptions()
  }, [user, router])

  useEffect(() => {
    gsap.fromTo(
      ".setup-card",
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" },
    )

    gsap.fromTo(".option-card", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.3 })
  }, [isLoadingOptions])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/subjects")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSavePreferences = async () => {
    if (!user) {
      setError("You must be logged in to save preferences. Please log in again.")
      router.push("/login")
      return
    }
    if (!selectedLanguage || !selectedSyllabus) {
      setError("Please select both language and syllabus preferences")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        preferred_language: selectedLanguage,
        syllabus_type: selectedSyllabus,
        username: user.email?.split("@")[0] || "",
        first_name: user.user_metadata?.name?.split(" ")[0] || null,
        last_name: user.user_metadata?.name?.split(" ").slice(1).join(" ") || null,
      })

      if (error) {
        setError(error.message || "Failed to save preferences")
        setIsLoading(false)
        return
      }

      setSuccess(true)
      toast({
        title: "Preferences saved successfully!",
        description: "Welcome to AllLearn! Your learning journey begins now.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to save preferences")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="setup-card w-full max-w-2xl border-0 bg-card/50 backdrop-blur shadow-xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to AllLearn! 🎓
          </CardTitle>
          <CardDescription className="text-lg">
            Let's personalize your learning experience by setting up your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="border-green-500 bg-green-50 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <AlertDescription className="text-green-700">Preferences saved! You can now continue learning.</AlertDescription>
            </Alert>
          )}

          {/* Language Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Preferred Video Language</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {languageOptions.map((language) => (
                <div
                  key={language.value}
                  className={`option-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedLanguage === language.value
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedLanguage(language.value)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{language.flag}</div>
                    <div className="text-sm font-medium">{language.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Syllabus Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Your Syllabus</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syllabusOptions.map((syllabus) => (
                <div
                  key={syllabus.value}
                  className={`option-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedSyllabus === syllabus.value
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedSyllabus(syllabus.value)}
                >
                  <div className="text-center">
                    <div className="font-semibold text-lg">{syllabus.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">{syllabus.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={isLoading || !selectedLanguage || !selectedSyllabus || !user}
            className="w-full h-12 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
          >
            {isLoading ? "Saving..." : success ? "Saved!" : "Start Learning! 🚀"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}