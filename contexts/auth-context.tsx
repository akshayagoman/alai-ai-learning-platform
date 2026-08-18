"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User, Provider } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"

interface UserProfile {
  id: string
  role: "student" | "trainer" | "admin"
  name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface TrainerProfile {
  id: string
  full_name: string
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
  expertise?: string
  availability: any
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  trainerProfile: TrainerProfile | null
  isLoading: boolean
  isNewUser: boolean
  signUp: (email: string, password: string, name: string, role?: "student" | "trainer") => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: Provider) => Promise<void>
  signInWithPhone: (phone: string) => Promise<void>
  verifyOtp: (phone: string, token: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  createUserProfile: (profileData: Partial<UserProfile>) => Promise<void>
  createTrainerProfile: (profileData: Partial<TrainerProfile>) => Promise<void>
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>
  updateTrainerProfile: (profileData: Partial<TrainerProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
  const setData = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) {
      console.error(error)
      setIsLoading(false)
      return
    }

    setSession(session)
    setUser(session?.user ?? null)

    if (session?.user) {
      await fetchUserProfile(session.user.id)
    }

    setIsLoading(false)
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    setSession(session)
    setUser(session?.user ?? null)
    setIsLoading(false)

    if (event === "SIGNED_IN" && session?.user) {
      // First, check if profile exists in database
      const { data: existingProfile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (error && error.code === "PGRST116") {
        // Profile doesn't exist, create it
        try {
          await createUserProfile({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email,
            email: session.user.email,
            role: session.user.user_metadata?.role || "student",
          })
        } catch (createError) {
          console.error("Error creating user profile:", createError)
        }
      }

      // Fetch the profile (either existing or newly created)
      await fetchUserProfile(session.user.id)

      // Redirect logic after authentication
      // Use a small delay to ensure state is updated
      setTimeout(() => {
        if (pathname !== "/setup-preferences") {
          const currentProfile = userProfile || existingProfile
          if (!currentProfile) {
            router.push("/setup-preferences")
          } else {
            if (currentProfile.role === "trainer" && pathname === "/") {
              router.push("/trainer/dashboard")
            } else if (
              currentProfile.role === "student" &&
              (pathname === "/login" || pathname === "/signup" || pathname === "/")
            ) {
              router.push("/subjects")
            }
          }
        }
      }, 100)
    } else if (event === "SIGNED_OUT") {
      setUserProfile(null)
      setTrainerProfile(null)
      setIsNewUser(false)
    }

    router.refresh()
  })

  setData()

  return () => {
    subscription.unsubscribe()
  }
}, [router, pathname]) // Remove userProfile from dependencies to avoid infinite loop


  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error)
        return
      }

      if (profileData) {
        setUserProfile(profileData)
        setIsNewUser(false)

        // If user is a trainer, fetch trainer profile
        if (profileData.role === "trainer") {
          const { data: trainerData, error: trainerError } = await supabase
            .from("trainer_profiles")
            .select("*")
            .eq("id", userId)
            .single()

          if (!trainerError && trainerData) {
            setTrainerProfile(trainerData)
          }
        }
      } else {
        setUserProfile(null)
        setTrainerProfile(null)
        setIsNewUser(true)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: "student" | "trainer" = "student") => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      })

      if (error) throw error
      // Do NOT create user profile here. Wait for email verification and sign in.
    } catch (error: any) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
    } catch (error: any) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithProvider = async (provider: Provider) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setIsLoading(false)
      throw error
    }
  }

  const signInWithPhone = async (phone: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      })

      if (error) throw error
    } catch (error: any) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (phone: string, token: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      })

      if (error) throw error
    } catch (error: any) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {


  console.log('Logout initiated, isLoading:', isLoading)
  
  if (isLoading) {
    console.log('Logout already in progress, ignoring')
    return
  }
  
  setIsLoading(true)
  console.log('Setting loading to true')
  
  try {

    console.log('Clearing local state')
    setUser(null)
    setSession(null)
    setUserProfile(null)
    setTrainerProfile(null)
    setIsNewUser(false)
    




    console.log('Calling supabase signOut')
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Supabase signOut error:', error)
    } else {
      console.log('Supabase signOut successful')
    }
    




    console.log('Redirecting to home')
    router.replace('/')
    
  } catch (error: any) {
    console.error('Logout error:', error)

    router.replace('/')
  } finally {
    console.log('Setting loading to false')
    setIsLoading(false)
  }
}



  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
    } catch (error: any) {
      throw error
    }
  }

  const createUserProfile = async (profileData: Partial<UserProfile>) => {
    const currentUser = user || session?.user
    if (!currentUser) {
      // Silently return if no authenticated user
      return
    }
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .insert({
          id: currentUser.id,
          email: currentUser.email,
          ...profileData,
        })
        .select()
        .single()

      if (error) throw error

      setUserProfile(data)
      setIsNewUser(false)
      return data
    } catch (error: any) {
      console.error("Error creating user profile:", error)
      throw error
    }
  }


  const createTrainerProfile = async (profileData: Partial<TrainerProfile>) => {
    if (!user || !userProfile) throw new Error("No authenticated user or profile")

    try {
      const { data, error } = await supabase
        .from("trainer_profiles")
        .insert({
          id: user.id,
          full_name: profileData.full_name || userProfile.name || "",
          ...profileData,
        })
        .select()
        .single()

      if (error) throw error

      setTrainerProfile(data)
    } catch (error: any) {
      throw error
    }
  }

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user || !userProfile) throw new Error("No authenticated user or profile")

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error

      setUserProfile(data)
    } catch (error: any) {
      throw error
    }
  }

  const updateTrainerProfile = async (profileData: Partial<TrainerProfile>) => {
    if (!user || !trainerProfile) throw new Error("No authenticated user or trainer profile")

    try {
      const { data, error } = await supabase
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
    } catch (error: any) {
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  const value = {
    user,
    session,
    userProfile,
    trainerProfile,
    isLoading,
    isNewUser,
    signUp,
    signIn,
    signInWithProvider,
    signInWithPhone,
    verifyOtp,
    signOut,
    resetPassword,
    createUserProfile,
    createTrainerProfile,
    updateUserProfile,
    updateTrainerProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
