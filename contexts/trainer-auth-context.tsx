"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User, Provider } from "@supabase/supabase-js"
import { trainerSupabase } from "@/lib/trainer-supabase"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface TrainerProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  country_id?: number
  state_id?: number
  city_id?: number
  pincode?: string
  occupation?: string
  subjects: string[]
  gender?: string
  rate_per_hour: number
  languages: string[]
  enable_sms_notifications: boolean
  enable_email_notifications: boolean
  is_approved: boolean
  is_active: boolean
  rating: number
  total_sessions: number
  total_earnings: number
  bio?: string
  photo_url?: string
  experience_years: number
  created_at: string
  updated_at: string
}

interface TrainerAuthContextType {
  user: User | null
  session: Session | null
  trainerProfile: TrainerProfile | null
  isLoading: boolean
  isNewTrainer: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: Provider) => Promise<void>
  signInWithPhone: (phone: string) => Promise<void>
  verifyOtp: (phone: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  createTrainerProfile: (profileData: Partial<TrainerProfile>) => Promise<void>
  updateTrainerProfile: (profileData: Partial<TrainerProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const TrainerAuthContext = createContext<TrainerAuthContextType | undefined>(undefined)

export function TrainerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewTrainer, setIsNewTrainer] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...")
        const {
          data: { session },
          error,
        } = await trainerSupabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          setIsLoading(false)
          return
        }

        console.log("Initial session:", session)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchTrainerProfile(session.user.id)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = trainerSupabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session)
      setSession(session)
      setUser(session?.user ?? null)

      if (event === "SIGNED_IN" && session?.user) {
        await fetchTrainerProfile(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setTrainerProfile(null)
        setIsNewTrainer(false)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchTrainerProfile = async (userId: string) => {
    try {
      console.log("Fetching trainer profile for user:", userId)

      // First check if user profile exists
      const { data: userProfile, error: userError } = await trainerSupabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      console.log("User profile:", userProfile, "Error:", userError)

      if (userError && userError.code !== "PGRST116") {
        console.error("Error fetching user profile:", userError)
        return
      }

      if (!userProfile) {
        console.log("No user profile found, marking as new trainer")
        setIsNewTrainer(true)
        return
      }

      // If user exists but not a trainer, update role
      if (userProfile.role !== "trainer") {
        console.log("Updating user role to trainer")
        const { error: updateError } = await trainerSupabase
          .from("user_profiles")
          .update({ role: "trainer" })
          .eq("id", userId)

        if (updateError) {
          console.error("Error updating user role:", updateError)
        }
      }

      // Check for trainer profile
      const { data: trainerData, error: trainerError } = await trainerSupabase
        .from("trainer_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      console.log("Trainer profile:", trainerData, "Error:", trainerError)

      if (trainerError && trainerError.code !== "PGRST116") {
        console.error("Error fetching trainer profile:", trainerError)
        return
      }

      if (trainerData) {
        setTrainerProfile(trainerData)
        setIsNewTrainer(false)
      } else {
        setTrainerProfile(null)
        setIsNewTrainer(true)
      }
    } catch (error) {
      console.error("Error fetching trainer profile:", error)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true)
    try {
      console.log("Signing up user:", email, fullName)

      const { data, error } = await trainerSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      console.log("Signup response:", data, "Error:", error)

      if (error) throw error

      if (data.user) {
        console.log("Creating user profile...")
        // Create user profile with trainer role
        const { error: profileError } = await trainerSupabase.from("user_profiles").insert({
          id: data.user.id,
          role: "trainer",
          name: fullName,
          email: email,
        })

        if (profileError) {
          console.error("Error creating user profile:", profileError)
          // Don't throw here, continue with the flow
        }

        setIsNewTrainer(true)
        toast.success("Account created successfully! Please complete your trainer profile.")
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      toast.error(error.message || "Failed to create account")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log("Signing in user:", email)

      const { data, error } = await trainerSupabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Signin response:", data, "Error:", error)

      if (error) throw error

      toast.success("Welcome back!")
    } catch (error: any) {
      console.error("Signin error:", error)
      toast.error(error.message || "Failed to sign in")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithProvider = async (provider: Provider) => {
    setIsLoading(true)
    try {
      console.log("Signing in with provider:", provider)

      const { error } = await trainerSupabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/trainer/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      console.error("Provider signin error:", error)
      toast.error(error.message || "Failed to sign in with provider")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithPhone = async (phone: string) => {
    setIsLoading(true)
    try {
      console.log("Signing in with phone:", phone)

      const { error } = await trainerSupabase.auth.signInWithOtp({
        phone,
      })

      if (error) throw error

      toast.success("OTP sent to your phone!")
    } catch (error: any) {
      console.error("Phone signin error:", error)
      toast.error(error.message || "Failed to send OTP")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (phone: string, token: string) => {
    setIsLoading(true)
    try {
      console.log("Verifying OTP for phone:", phone)

      const { data, error } = await trainerSupabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      })

      if (error) throw error

      if (data.user) {
        // Check if user profile exists
        const { data: userProfile } = await trainerSupabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (!userProfile) {
          // Create user profile with trainer role
          await trainerSupabase.from("user_profiles").insert({
            id: data.user.id,
            role: "trainer",
            name: data.user.user_metadata?.full_name || "",
            email: data.user.email,
            phone: phone,
          })
          setIsNewTrainer(true)
        }
      }

      toast.success("Phone verified successfully!")
    } catch (error: any) {
      console.error("OTP verification error:", error)
      toast.error(error.message || "Failed to verify OTP")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await trainerSupabase.auth.signOut()
      if (error) throw error

      setTrainerProfile(null)
      setIsNewTrainer(false)
      router.push("/trainer/auth")
      toast.success("Signed out successfully")
    } catch (error: any) {
      console.error("Signout error:", error)
      toast.error(error.message || "Failed to sign out")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await trainerSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/trainer/reset-password`,
      })

      if (error) throw error

      toast.success("Password reset email sent! Check your inbox.")
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast.error(error.message || "Failed to send reset email")
      throw error
    }
  }

  const createTrainerProfile = async (profileData: Partial<TrainerProfile>) => {
    if (!user) throw new Error("No authenticated user")

    setIsLoading(true)
    try {
      console.log("Creating trainer profile:", profileData)

      const { data, error } = await trainerSupabase
        .from("trainer_profiles")
        .insert({
          id: user.id,
          full_name: profileData.full_name || user.user_metadata?.full_name || "",
          email: user.email || "",
          ...profileData,
        })
        .select()
        .single()

      console.log("Create trainer profile response:", data, "Error:", error)

      if (error) throw error

      setTrainerProfile(data)
      setIsNewTrainer(false)
      toast.success("Trainer profile created successfully!")
      router.push("/trainer/dashboard")
    } catch (error: any) {
      console.error("Create trainer profile error:", error)
      toast.error(error.message || "Failed to create trainer profile")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateTrainerProfile = async (profileData: Partial<TrainerProfile>) => {
    if (!user || !trainerProfile) throw new Error("No authenticated user or profile")

    setIsLoading(true)
    try {
      const { data, error } = await trainerSupabase
        .from("trainer_profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error

      setTrainerProfile(data)
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Update trainer profile error:", error)
      toast.error(error.message || "Failed to update profile")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchTrainerProfile(user.id)
    }
  }

  const value = {
    user,
    session,
    trainerProfile,
    isLoading,
    isNewTrainer,
    signUp,
    signIn,
    signInWithProvider,
    signInWithPhone,
    verifyOtp,
    signOut,
    resetPassword,
    createTrainerProfile,
    updateTrainerProfile,
    refreshProfile,
  }

  return <TrainerAuthContext.Provider value={value}>{children}</TrainerAuthContext.Provider>
}

export const useTrainerAuth = () => {
  const context = useContext(TrainerAuthContext)
  if (context === undefined) {
    throw new Error("useTrainerAuth must be used within a TrainerAuthProvider")
  }
  return context
}
