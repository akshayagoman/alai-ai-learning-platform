"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { gsap } from "gsap"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Key, Trash2, Palette, Monitor, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"

type UserSettings = {
  user_id: string
  syllabus_type: string
  preferred_language: string
  username: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
}

export default function SettingsPage() {
  const { user, isLoading: authLoading, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { toast } = useToast()

  // User profile fields
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [syllabus, setSyllabus] = useState("cbse")
  const [language, setLanguage] = useState("english")

  // Email change fields
  const [newEmail, setNewEmail] = useState("")
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("")
  const [emailError, setEmailError] = useState<string | null>(null)

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        const settings = data || {
          user_id: user.id,
          syllabus_type: "cbse",
          preferred_language: "english",
          username: user.email?.split("@")[0] || "",
          first_name: user.user_metadata.name?.split(" ")[0] || null,
          last_name:
            user.user_metadata.name?.split(" ").length > 1
              ? user.user_metadata.name?.split(" ").slice(1).join(" ")
              : null,
          middle_name: null,
        }

        setUserSettings(settings)
        setUsername(settings.username || "")
        setFirstName(settings.first_name || "")
        setMiddleName(settings.middle_name || "")
        setLastName(settings.last_name || "")
        setSyllabus(settings.syllabus_type || "cbse")
        setLanguage(settings.preferred_language || "english")
        setNewEmail(user.email || "")
      } catch (error: any) {
        console.error("Error fetching user settings:", error)
        setError(error.message || "Failed to load user settings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserSettings()
  }, [user])

  useEffect(() => {
    if (user) {
      gsap.fromTo(
        ".settings-header",
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
        ".settings-tabs",
        {
          y: 30,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          delay: 0.2,
        },
      )

      gsap.fromTo(
        ".settings-card",
        {
          y: 40,
          opacity: 0,
          scale: 0.95,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
          delay: 0.4,
        },
      )
    }
  }, [user])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  useEffect(() => {
    if (newEmail && newEmail !== user?.email) {
      if (!validateEmail(newEmail)) {
        setEmailError("Please enter a valid email address")
      } else {
        setEmailError(null)
      }
    } else {
      setEmailError(null)
    }
  }, [newEmail, user?.email])

const handleUpdateProfile = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!user) return

  try {
    setIsLoading(true)
    setError(null)

    const updates = {
      username,
      first_name: firstName || null,
      middle_name: middleName || null,
      last_name: lastName || null,
      syllabus_type: syllabus,
      preferred_language: language,
    }

    // Upsert the record (insert or update)
    const { data, error: updateError } = await supabase
      .from("user_settings")
      .upsert({ ...updates, user_id: user.id })
      .select()
      .single()

    if (updateError) {
      console.error("Database update error:", updateError)
      throw updateError
    }

    // Update user metadata
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ")

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        name: fullName,
        username,
      },
    })

    if (metadataError) throw metadataError

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    })

    // Update local state with the returned data
    setUserSettings(data)

  } catch (error: any) {
    console.error("Error updating profile:", error)
    setError(error.message || "Failed to update profile")
  } finally {
    setIsLoading(false)
  }
}

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (!validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address")
      return
    }

    if (newEmail === user.email) {
      setEmailError("New email must be different from current email")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setEmailError(null)

      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
        password: currentPasswordForEmail,
      })

      if (updateError) throw updateError

      toast({
        title: "Email update initiated",
        description: "Please check your new email for a confirmation link",
      })

      setCurrentPasswordForEmail("")
    } catch (error: any) {
      console.error("Error changing email:", error)
      setError(error.message || "Failed to change email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      })
    } catch (error: any) {
      console.error("Error changing password:", error)
      setError(error.message || "Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")

    if (!confirmed) return

    try {
      setIsLoading(true)

      const { error: settingsError } = await supabase.from("user_settings").delete().eq("user_id", user.id)
      if (settingsError) throw settingsError

      const { error: ratingsError } = await supabase.from("user_video_ratings").delete().eq("user_id", user.id)
      if (ratingsError) throw ratingsError

      const { error: historyError } = await supabase.from("user_watch_history").delete().eq("user_id", user.id)
      if (historyError) throw historyError

      await signOut()

      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="settings-header text-center mb-8">
            <Skeleton className="h-12 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        <div className="settings-header text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">Customize your AllLearn experience</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="profile" className="settings-tabs">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8 bg-card/50 backdrop-blur">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Theme</span>
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">Password</span>
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="flex items-center gap-2 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="settings-card border-0 bg-card/50 backdrop-blur shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <User className="h-6 w-6 text-primary" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal details and learning preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-sm font-medium">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middleName" className="text-sm font-medium">
                          Middle Name (Optional)
                        </Label>
                        <Input
                          id="middleName"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-sm font-medium">
                          Last Name (Optional)
                        </Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="syllabus" className="text-sm font-medium">
                          Preferred Syllabus
                        </Label>
                        <select
                          id="syllabus"
                          value={syllabus}
                          onChange={(e) => setSyllabus(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                        >
                          <option value="cbse">CBSE</option>
                          <option value="icse">ICSE</option>
                          <option value="tn_matriculation">TN Matriculation</option>
                          <option value="state_board">State Board</option>
                          <option value="kerala_board">Kerala Board</option>
                          <option value="karnataka_board">Karnataka Board</option>
                          <option value="ap_board">AP Board</option>
                          <option value="ts_board">TS Board</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language" className="text-sm font-medium">
                          Preferred Language
                        </Label>
                        <select
                          id="language"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                        >
                          <option value="english">English</option>
                          <option value="hindi">Hindi</option>
                          <option value="tamil">Tamil</option>
                          <option value="telugu">Telugu</option>
                          <option value="malayalam">Malayalam</option>
                          <option value="kannada">Kannada</option>
                          <option value="bengali">Bengali</option>
                          <option value="marathi">Marathi</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance">
              <Card className="settings-card border-0 bg-card/50 backdrop-blur shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Palette className="h-6 w-6 text-primary" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize the look and feel of your interface</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Theme Preference</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        onClick={() => setTheme("light")}
                        className="h-20 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                      >
                        <Sun className="h-6 w-6" />
                        <span>Light</span>
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        onClick={() => setTheme("dark")}
                        className="h-20 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                      >
                        <Moon className="h-6 w-6" />
                        <span>Dark</span>
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        onClick={() => setTheme("system")}
                        className="h-20 flex flex-col items-center justify-center space-y-2 transition-all duration-300"
                      >
                        <Monitor className="h-6 w-6" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Quick Theme Toggle</Label>
                        <p className="text-xs text-muted-foreground mt-1">Toggle between light and dark mode</p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card className="settings-card border-0 bg-card/50 backdrop-blur shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Mail className="h-6 w-6 text-primary" />
                    Change Email
                  </CardTitle>
                  <CardDescription>Update your email address</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangeEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentEmail" className="text-sm font-medium">
                        Current Email
                      </Label>
                      <Input id="currentEmail" value={user.email || ""} disabled className="bg-muted/50" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newEmail" className="text-sm font-medium">
                        New Email
                      </Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        className={`bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300 ${
                          emailError ? "border-destructive focus:border-destructive" : ""
                        }`}
                      />
                      {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentPasswordForEmail" className="text-sm font-medium">
                        Current Password
                      </Label>
                      <Input
                        id="currentPasswordForEmail"
                        type="password"
                        value={currentPasswordForEmail}
                        onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || !!emailError || newEmail === user.email}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300"
                    >
                      {isLoading ? "Updating..." : "Change Email"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card className="settings-card border-0 bg-card/50 backdrop-blur shadow-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Key className="h-6 w-6 text-primary" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-medium">
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                      />
                      <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300"
                    >
                      {isLoading ? "Updating..." : "Change Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card className="settings-card border-0 bg-card/50 backdrop-blur shadow-xl border-destructive/20">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl flex items-center gap-2 text-destructive">
                    <Trash2 className="h-6 w-6" />
                    Delete Account
                  </CardTitle>
                  <CardDescription>Permanently delete your account and all data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-destructive/50 bg-destructive/5">
                      <AlertDescription className="text-destructive">
                        <strong>Warning:</strong> This action cannot be undone. All your data will be permanently
                        deleted.
                      </AlertDescription>
                    </Alert>

                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-destructive to-red-600 hover:from-destructive/90 hover:to-red-600/90 transition-all duration-300"
                    >
                      {isLoading ? "Processing..." : "Delete Account"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}