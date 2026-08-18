"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, GraduationCap, MapPin, User, Languages, Bell } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface TrainerSignupModalProps {
  children: React.ReactNode
}

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "Computer Science",
  "History",
  "Geography",
  "Economics",
  "Political Science",
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
]

const OCCUPATIONS = [
  "Student",
  "Startup Founder",
  "Business Owner",
  "Employee",
  "Freelancer",
  "Teacher",
  "Retired",
  "Others",
]

const LANGUAGES = {
  India: ["Hindi", "English", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati"],
  "United States": ["English", "Spanish", "French", "German", "Chinese"],
  "United Kingdom": ["English", "Welsh", "Scottish Gaelic", "Irish"],
}

const RATE_OPTIONS = {
  India: [50, 100, 200, 300],
  "United States": [5, 10, 25, 50],
  "United Kingdom": [5, 10, 20, 40],
}

export function TrainerSignupModal({ children }: TrainerSignupModalProps) {
  const { user, signUp, signIn, createTrainerProfile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Auth
    email: "",
    password: "",
    confirmPassword: "",

    // Step 2: Location
    country: "",
    state: "",
    city: "",
    pincode: "",

    // Step 3: Professional
    fullName: "",
    occupation: "",
    subjects: [] as string[],
    gender: "",
    ratePerHour: 0,

    // Step 4: Preferences
    languages: [] as string[],
    enableSMS: true,
    enableEmail: true,
  })

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }))
  }

  const handleLanguageToggle = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const currentUser = user

      // Step 1: Handle authentication
      if (!user) {
        if (isLogin) {
          await signIn(formData.email, formData.password)
        } else {
          if (formData.password !== formData.confirmPassword) {
            throw new Error("Passwords don't match")
          }
          await signUp(formData.email, formData.password, formData.fullName, "trainer")
        }
      }

      // Step 2: Create trainer profile
      await createTrainerProfile({
        full_name: formData.fullName,
        country_id: Number.parseInt(formData.country),
        state_id: Number.parseInt(formData.state),
        city_id: Number.parseInt(formData.city),
        pincode: formData.pincode,
        occupation: formData.occupation,
        subjects: formData.subjects,
        gender: formData.gender,
        rate_per_hour: formData.ratePerHour,
        languages: formData.languages,
        enable_sms_notifications: formData.enableSMS,
        enable_email_notifications: formData.enableEmail,
        is_approved: false,
      })

      toast.success("Trainer application submitted successfully! We'll review and approve your profile soon.")
      setIsOpen(false)
      setCurrentStep(1)
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">
                {isLogin ? "Welcome Back!" : "Join as a Trainer"}
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-2">
                {isLogin ? "Sign in to your trainer account" : "Create your trainer account"}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="flex bg-red-100 dark:bg-red-900/30 rounded-lg p-1">
                <button
                  onClick={() => setIsLogin(false)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isLogin
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setIsLogin(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isLogin
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
                  }`}
                >
                  Login
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="border-red-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="border-red-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="border-red-200 focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">Location Details</h3>
              <p className="text-red-700 dark:text-red-300 mt-2">Help students find you in their area</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="border-red-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
                >
                  <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">India</SelectItem>
                    <SelectItem value="2">United States</SelectItem>
                    <SelectItem value="3">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
                >
                  <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tamil Nadu</SelectItem>
                    <SelectItem value="2">Karnataka</SelectItem>
                    <SelectItem value="3">Kerala</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
                >
                  <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Chennai</SelectItem>
                    <SelectItem value="2">Bangalore</SelectItem>
                    <SelectItem value="3">Coimbatore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                className="border-red-200 focus:border-red-500 focus:ring-red-500"
                placeholder="Enter pincode"
              />
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">Professional Info</h3>
              <p className="text-red-700 dark:text-red-300 mt-2">Tell us about your expertise</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Select
                  value={formData.occupation}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, occupation: value }))}
                >
                  <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Select occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map((occupation) => (
                      <SelectItem key={occupation} value={occupation}>
                        {occupation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label>Subjects (Select multiple)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SUBJECTS.map((subject) => (
                  <Badge
                    key={subject}
                    variant={formData.subjects.includes(subject) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.subjects.includes(subject)
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "border-red-200 text-red-700 hover:bg-red-50"
                    }`}
                    onClick={() => handleSubjectToggle(subject)}
                  >
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Rate per Hour</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {RATE_OPTIONS.India.map((rate) => (
                  <Badge
                    key={rate}
                    variant={formData.ratePerHour === rate ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.ratePerHour === rate
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "border-red-200 text-red-700 hover:bg-red-50"
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, ratePerHour: rate }))}
                  >
                    ₹{rate}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Languages className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">Preferences</h3>
              <p className="text-red-700 dark:text-red-300 mt-2">Set your language and notification preferences</p>
            </div>

            <div>
              <Label>Languages (Select multiple)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LANGUAGES.India.map((language) => (
                  <Badge
                    key={language}
                    variant={formData.languages.includes(language) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.languages.includes(language)
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "border-red-200 text-red-700 hover:bg-red-50"
                    }`}
                    onClick={() => handleLanguageToggle(language)}
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableSMS"
                  checked={formData.enableSMS}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enableSMS: !!checked }))}
                />
                <Label htmlFor="enableSMS" className="text-sm">
                  Enable SMS notifications
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableEmail"
                  checked={formData.enableEmail}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enableEmail: !!checked }))}
                />
                <Label htmlFor="enableEmail" className="text-sm">
                  Enable Email notifications
                </Label>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                <Bell className="h-5 w-5" />
                <span className="font-medium">Review Summary</span>
              </div>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
                <p>
                  <strong>Name:</strong> {formData.fullName}
                </p>
                <p>
                  <strong>Occupation:</strong> {formData.occupation}
                </p>
                <p>
                  <strong>Subjects:</strong> {formData.subjects.join(", ")}
                </p>
                <p>
                  <strong>Rate:</strong> ₹{formData.ratePerHour}/hour
                </p>
                <p>
                  <strong>Languages:</strong> {formData.languages.join(", ")}
                </p>
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-900 dark:text-red-100">Become a Trainer</DialogTitle>
          <DialogDescription className="text-red-700 dark:text-red-300">
            Join our community of expert trainers and help students achieve their goals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-red-600 text-white"
                      : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-red-600" : "bg-red-200 dark:bg-red-800"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} className="bg-red-600 hover:bg-red-700 text-white">
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
