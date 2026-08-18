"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function TrainerAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          toast.error("Authentication failed")
          router.push("/trainer/auth")
          return
        }

        if (data.session?.user) {
          const user = data.session.user
          const role = searchParams.get("role") || "trainer"

          console.log("OAuth user authenticated:", user.id, "Role:", role)

          // Create user profile
          const { error: userProfileError } = await supabase.from("user_profiles").upsert({
            id: user.id,
            role: role,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
            email: user.email || "",
          })

          if (userProfileError) {
            console.error("Error creating user profile:", userProfileError)
          }

          // If trainer role, create basic trainer profile
          if (role === "trainer") {
            const { error: trainerProfileError } = await supabase.from("trainer_profiles").upsert({
              id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
              email: user.email || "",
              bio: "",
              experience_years: 0,
              rating: 0.0,
              is_approved: false,
              is_active: true,
            })

            if (trainerProfileError) {
              console.error("Error creating trainer profile:", trainerProfileError)
              toast.error("Account created but trainer profile setup failed")
            }

            // Check if trainer profile is complete
            const { data: trainerProfile } = await supabase
              .from("trainer_profiles")
              .select("*")
              .eq("id", user.id)
              .single()

            if (trainerProfile && (!trainerProfile.occupation || !trainerProfile.subjects?.length)) {
              // Profile incomplete, redirect to complete setup
              router.push("/trainer/signup?step=2")
            } else {
              // Profile complete, go to dashboard
              router.push("/trainer/dashboard")
            }
          } else {
            // Student role, redirect to main app
            router.push("/subjects")
          }

          toast.success("Successfully signed in!")
        } else {
          router.push("/trainer/auth")
        }
      } catch (error) {
        console.error("Callback handling error:", error)
        toast.error("Authentication failed")
        router.push("/trainer/auth")
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-red-700 dark:text-red-400">Completing authentication...</p>
      </div>
    </div>
  )
}
