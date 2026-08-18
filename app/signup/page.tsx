"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Facebook, Mail, Phone, CheckCircle, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function SignUp() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp, signInWithProvider, signInWithPhone, verifyOtp } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Function to check if email already exists
  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailError(null)
      return false
    }

    setIsCheckingEmail(true)
    setEmailError(null)

    try {
      // Use Supabase Admin API to check if user exists
      const { data, error } = await supabase.rpc('check_user_exists', {
        email_to_check: emailToCheck
      })

      if (error) {
        console.error('Error checking email:', error)
        // If the RPC function doesn't exist, we'll handle it in the signup attempt
        return false
      }

      if (data === true) {
        setEmailError("Account already exists with this email")
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    } finally {
      setIsCheckingEmail(false)
    }
  }

  // Debounced email checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email) {
        checkEmailExists(email)
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [email])

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Check if email already exists before attempting signup
    const emailExists = await checkEmailExists(email)
    if (emailExists) {
      setError("Account already exists. Please try logging in instead.")
      setIsLoading(false)
      return
    }

    try {
      await signUp(email, password, name)
      setUserEmail(email)
      setEmailVerificationSent(true)
      toast({
        title: "Account created successfully",
        description: "Please check your email for verification link",
        duration: 5000,
      })
    } catch (error: any) {
      console.error("Signup error:", error)
      
      // Handle specific Supabase error messages
      if (error?.message) {
        const errorMessage = error.message.toLowerCase()
        
        // Check for various "user already exists" error patterns
        if (
          errorMessage.includes("user already registered") || 
          errorMessage.includes("email already registered") ||
          errorMessage.includes("already been registered") ||
          errorMessage.includes("user already exists") ||
          errorMessage.includes("email address already registered") ||
          errorMessage.includes("duplicate") ||
          error.message.includes("User already registered")
        ) {
          setError("Account already exists. Please try logging in instead.")
        } 
        // Password validation errors
        else if (errorMessage.includes("password") && errorMessage.includes("6")) {
          setError("Password must be at least 6 characters long")
        }
        // Email validation errors
        else if (errorMessage.includes("invalid") && errorMessage.includes("email")) {
          setError("Please enter a valid email address")
        }
        // Rate limiting errors
        else if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
          setError("Too many signup attempts. Please try again later.")
        }
        // Signup disabled
        else if (errorMessage.includes("signup") && errorMessage.includes("disabled")) {
          setError("Account registration is currently disabled. Please contact support.")
        }
        // Generic error fallback
        else {
          setError(error.message)
        }
      } 
      // Handle cases where error.message doesn't exist
      else if (error?.code) {
        switch (error.code) {
          case 'user_already_exists':
          case 'email_already_exists':
            setError("Account already exists. Please try logging in instead.")
            break
          default:
            setError("An error occurred during sign up. Please try again.")
        }
      }
      // Final fallback
      else {
        setError("An error occurred during sign up. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: "google" | "facebook") => {
    // Show disabled message
    toast({
      title: "Feature temporarily disabled",
      description: `${provider} signup is currently unavailable. Please use email signup.`,
      variant: "destructive",
    })
  }

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    // Show disabled message
    toast({
      title: "Feature temporarily disabled",
      description: "Phone signup is currently unavailable. Please use email signup.",
      variant: "destructive",
    })
  }

  // Show email verification success screen
  if (emailVerificationSent) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Check Your Email</CardTitle>
              <CardDescription className="text-base">
                We've sent a verification link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <Mail className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Verification email sent to:</p>
                <p className="text-sm text-blue-700 break-all">{userEmail}</p>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="font-semibold text-gray-900">1.</span>
                  <span>Check your email inbox (and spam folder)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-semibold text-gray-900">2.</span>
                  <span>Click the verification link in the email</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-semibold text-gray-900">3.</span>
                  <span>Return to login and access your account</span>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Didn't receive the email?</strong> Check your spam folder or wait a few minutes. 
                  The verification link will expire in 24 hours.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                onClick={() => router.push("/login")} 
                className="w-full"
              >
                Go to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailVerificationSent(false)
                  setUserEmail("")
                  setName("")
                  setEmail("")
                  setPassword("")
                  setConfirmPassword("")
                  setEmailError(null)
                  setShowPassword(false)
                  setShowConfirmPassword(false)
                }} 
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign Up
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>Sign up to access all features of AllLearn</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {error}
                  {(error.includes("Account already exists") || error.includes("already exists")) && (
                    <div className="mt-2">
                      <Link href="/login" className="text-red-800 hover:text-red-900 underline font-medium">
                        Go to Login Page
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="phone" 
                  className="flex items-center gap-2 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Phone className="h-4 w-4" />
                  <span>Phone</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="social" 
                  className="flex items-center gap-2 opacity-50 cursor-not-allowed"
                  disabled
                >
                  <Facebook className="h-4 w-4" />
                  <span>Social</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setEmailError(null) // Clear error when user starts typing
                        }} 
                        required 
                        className={emailError ? "border-red-500" : ""}
                      />
                      {isCheckingEmail && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        </div>
                      )}
                    </div>
                    {emailError && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{emailError}</span>
                        <Link href="/login" className="underline hover:text-red-800">
                          Login instead
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading || emailError !== null}>
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                <div className="space-y-4 opacity-50">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Phone signup is temporarily disabled. Please use email signup instead.
                    </AlertDescription>
                  </Alert>
                  
                  <form onSubmit={handlePhoneSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled
                        className="cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
                    </div>

                    {otpSent && (
                      <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter the code sent to your phone"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          disabled
                          className="cursor-not-allowed"
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled>
                      {otpSent ? "Verify & Create Account" : "Send Verification Code"}
                    </Button>

                    {otpSent && (
                      <Button type="button" variant="outline" className="w-full mt-2" disabled>
                        Change Phone Number
                      </Button>
                    )}
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="social">
                <div className="space-y-4 opacity-50">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Social signup is temporarily disabled. Please use email signup instead.
                    </AlertDescription>
                  </Alert>
                  
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => handleSocialSignUp("google")}
                    disabled
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign up with Google (Disabled)
                  </Button>

                  <Button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleSocialSignUp("facebook")}
                    disabled
                  >
                    <Facebook className="h-5 w-5 mr-2" />
                    Sign up with Facebook (Disabled)
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4">
            <span className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </span>
            <span className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
