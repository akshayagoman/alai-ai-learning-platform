"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Languages,
  Bell,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { FaGoogle, FaFacebook } from "react-icons/fa";

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "trainer";
  occupation?: string;
  subjects?: string[];
  experienceYears?: number;
  bio?: string;
}

interface TrainerProfileData {
  country: string;
  state: string;
  city: string;
  pincode: string;
  occupation: string;
  subjects: string[];
  gender: string;
  ratePerHour: number;
  languages: string[];
  enableSMS: boolean;
  enableEmail: boolean;
  bio: string;
  experienceYears: number;
}

const COUNTRIES = [
  { id: 1, name: "India", currency: "₹", code: "IN" },
  { id: 2, name: "United States", currency: "$", code: "US" },
  { id: 3, name: "United Kingdom", currency: "£", code: "UK" },
];

const STATES = {
  1: [
    { id: 1, name: "Tamil Nadu" },
    { id: 2, name: "Karnataka" },
    { id: 3, name: "Kerala" },
    { id: 4, name: "Maharashtra" },
    { id: 5, name: "Delhi" },
  ],
  2: [
    { id: 6, name: "California" },
    { id: 7, name: "New York" },
    { id: 8, name: "Texas" },
  ],
  3: [
    { id: 9, name: "England" },
    { id: 10, name: "Scotland" },
    { id: 11, name: "Wales" },
  ],
};

const CITIES = {
  1: [
    { id: 1, name: "Chennai" },
    { id: 2, name: "Coimbatore" },
  ],
  2: [
    { id: 3, name: "Bangalore" },
    { id: 4, name: "Mysore" },
  ],
  3: [
    { id: 5, name: "Kochi" },
    { id: 6, name: "Thiruvananthapuram" },
  ],
  6: [
    { id: 7, name: "Los Angeles" },
    { id: 8, name: "San Francisco" },
  ],
  7: [
    { id: 9, name: "New York City" },
    { id: 10, name: "Buffalo" },
  ],
};

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
];

const OCCUPATIONS = [
  "Student",
  "Startup Founder",
  "Business Owner",
  "Employee",
  "Freelancer",
  "Teacher",
  "Retired",
  "Others",
];

const LANGUAGES = {
  1: [
    "Hindi",
    "English",
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
    "Bengali",
    "Marathi",
    "Gujarati",
  ],
  2: ["English", "Spanish", "French", "German", "Chinese"],
  3: ["English", "Welsh", "Scottish Gaelic", "Irish"],
};

const RATE_OPTIONS = {
  1: [50, 100, 200, 300],
  2: [5, 10, 25, 50],
  3: [5, 10, 20, 40],
};

export default function TrainerSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [profileCreationStatus, setProfileCreationStatus] = useState<
    "idle" | "creating" | "success" | "error"
  >("idle");

  const [signupForm, setSignupForm] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "trainer",
  });

  const [trainerProfile, setTrainerProfile] = useState<TrainerProfileData>({
    country: "",
    state: "",
    city: "",
    pincode: "",
    occupation: "",
    subjects: [],
    gender: "",
    ratePerHour: 0,
    languages: [],
    enableSMS: true,
    enableEmail: true,
    bio: "",
    experienceYears: 0,
  });
  const [customSubject, setCustomSubject] = useState("");
  const router = useRouter();

  const selectedCountry = COUNTRIES.find(
    (c) => c.id === Number(trainerProfile.country)
  );
  
  // Fixed type-safe helper function
  const getSafeArray = <T,>(obj: Record<number, T[]>, key: string | number): T[] => {
    if (!key) return [];
    const num = Number(key);
    return Number.isInteger(num) ? obj[num] || [] : [];
  };

  const availableStates = getSafeArray(STATES, trainerProfile.country);
  const availableCities = getSafeArray(CITIES, trainerProfile.state);
  const availableLanguages = getSafeArray(LANGUAGES, trainerProfile.country);
  const availableRates = getSafeArray(RATE_OPTIONS, trainerProfile.country);

  // Handle initial signup
  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("Signup form submitted:", signupForm);

    // Validation
    if (
      !signupForm.fullName ||
      !signupForm.email ||
      !signupForm.password ||
      !signupForm.confirmPassword
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    setSignupError("");
    const { data, error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        data: {
          full_name: signupForm.fullName,
          role: "trainer",
        },
      },
    });

    if (error) {
      console.error("Signup error:", error.message);
      toast.error("Signup failed: " + error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("✅ Account created! Please check your email to verify.");
    setIsSubmitting(false);

    try {
      console.log("Creating auth user...");

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            full_name: signupForm.fullName,
            role: signupForm.role,
          },
        },
      });

      console.log("Auth signup response:", authData, "Error:", authError);

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      // Step 2: Create user profile in user_profiles table
      console.log("Creating user profile...");
      const { error: userProfileError } = await supabase
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          role: signupForm.role,
          name: signupForm.fullName,
          email: signupForm.email,
        });

      if (userProfileError) {
        console.error("Error creating user profile:", userProfileError);
        // Don't throw here, continue with the flow
      }

      // Step 3: If role is trainer, create basic trainer profile
      if (signupForm.role === "trainer") {
        console.log("Creating basic trainer profile...");
        setProfileCreationStatus("creating");

        const { error: trainerProfileError } = await supabase
          .from("trainer_profiles")
          .insert({
            id: authData.user.id,
            full_name: signupForm.fullName,
            email: signupForm.email,
            bio: "",
            experience_years: 0,
            rating: 0.0,
            is_approved: false,
            is_active: true,
          });

        if (trainerProfileError) {
          console.error("Error creating trainer profile:", trainerProfileError);
          setProfileCreationStatus("error");
          toast.error(
            "Account created but trainer profile setup failed. Please complete your profile manually."
          );
        } else {
          setProfileCreationStatus("success");
          console.log("Basic trainer profile created successfully");
        }
      }

      toast.success("Account created successfully!");

      // Move to next step for trainer profile completion
      if (signupForm.role === "trainer") {
        setCurrentStep(2);
      } else {
        // For students, redirect to main app
        router.push("/subjects");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setSignupError(error.message || "Failed to create account");
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle trainer profile completion
  const handleTrainerProfileSubmit = async () => {
    if (
      !trainerProfile.country ||
      !trainerProfile.occupation ||
      trainerProfile.subjects.length === 0 ||
      trainerProfile.languages.length === 0
    ) {
      toast.error("Please fill all required fields (*)");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("No user logged in!");

      const { error } = await supabase
        .from("trainer_profiles")
        .update({
          qualifications: trainerProfile.occupation, // assuming occupation as qualification
          experience_years: trainerProfile.experienceYears,
          specialization_subjects: trainerProfile.subjects,
          teaching_languages: trainerProfile.languages,
          rate_per_hour: trainerProfile.ratePerHour,
          bio: trainerProfile.bio,
          occupation: trainerProfile.occupation,
          is_approved: false,
          approval_date: null,
          total_sessions: 0,
          total_earnings: 0,
          enable_sms_notifications: trainerProfile.enableSMS,
          enable_email_notifications: trainerProfile.enableEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile submitted successfully!");
      router.push("/trainer/dashboard");
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle social signup
  const handleSocialSignup = async (provider: "google" | "facebook") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/trainer/auth/callback?role=trainer`,
          queryParams: {
            role: "trainer",
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error(`${provider} signup error:`, error);
      toast.error(error.message || `Failed to sign up with ${provider}`);
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setTrainerProfile((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setTrainerProfile((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const addCustomSubject = () => {
    if (customSubject && !trainerProfile.subjects.includes(customSubject)) {
      setTrainerProfile((prev) => ({
        ...prev,
        subjects: [...prev.subjects, customSubject],
      }));
      setCustomSubject("");
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderSignupStep = () => {
    switch (currentStep) {
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
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">
                Basic Details
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-2">
                Tell us about your location
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={trainerProfile.country}
                  onValueChange={(value) =>
                    setTrainerProfile((prev) => ({
                      ...prev,
                      country: value,
                      state: "",
                      city: "",
                    }))
                  }
                >
                  <SelectTrigger className="border-red-200 focus:border-red-500">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem
                        key={country.id}
                        value={country.id.toString()}
                      >
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {trainerProfile.country && (
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={trainerProfile.state}
                    onValueChange={(value) =>
                      setTrainerProfile((prev) => ({
                        ...prev,
                        state: value,
                        city: "",
                      }))
                    }
                  >
                    <SelectTrigger className="border-red-200 focus:border-red-500">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStates.map((state: { id: number; name: string }) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {trainerProfile.state && (
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={trainerProfile.city}
                    onValueChange={(value) =>
                      setTrainerProfile((prev) => ({ ...prev, city: value }))
                    }
                  >
                    <SelectTrigger className="border-red-200 focus:border-red-500">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city: { id: number; name: string }) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="col-span-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={trainerProfile.pincode}
                  onChange={(e) =>
                    setTrainerProfile((prev) => ({
                      ...prev,
                      pincode: e.target.value,
                    }))
                  }
                  className="border-red-200 focus:border-red-500"
                  placeholder="Enter pincode"
                />
              </div>
            </div>
          </motion.div>
        );

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
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">
                Professional Info
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-2">
                Tell us about your expertise
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="occupation">Occupation *</Label>
                <Select
                  value={trainerProfile.occupation}
                  onValueChange={(value) =>
                    setTrainerProfile((prev) => ({
                      ...prev,
                      occupation: value,
                    }))
                  }
                >
                  <SelectTrigger className="border-red-200 focus:border-red-500">
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
                <Label>Subjects * (Select multiple)</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {SUBJECTS.map((subject) => (
                    <Badge
                      key={subject}
                      variant={
                        trainerProfile.subjects.includes(subject)
                          ? "default"
                          : "outline"
                      }
                      className={`cursor-pointer transition-colors ${
                        trainerProfile.subjects.includes(subject)
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "border-red-200 text-red-700 hover:bg-red-50"
                      }`}
                      onClick={() => handleSubjectToggle(subject)}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="border-red-200 focus:border-red-500"
                    onKeyPress={(e) => e.key === "Enter" && addCustomSubject()}
                  />
                  <Button
                    type="button"
                    onClick={addCustomSubject}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <Label>Gender</Label>
                <RadioGroup
                  value={trainerProfile.gender}
                  onValueChange={(value) =>
                    setTrainerProfile((prev) => ({ ...prev, gender: value }))
                  }
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

              {selectedCountry && (
                <div>
                  <Label>Rate per Hour ({selectedCountry.currency})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableRates.map((rate: number) => (
                      <Badge
                        key={rate}
                        variant={
                          trainerProfile.ratePerHour === rate
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer transition-colors ${
                          trainerProfile.ratePerHour === rate
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "border-red-200 text-red-700 hover:bg-red-50"
                        }`}
                        onClick={() =>
                          setTrainerProfile((prev) => ({
                            ...prev,
                            ratePerHour: rate,
                          }))
                        }
                      >
                        {selectedCountry.currency}
                        {rate}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="experienceYears">Years of Experience</Label>
                <Select
                  value={trainerProfile.experienceYears.toString()}
                  onValueChange={(value) =>
                    setTrainerProfile((prev) => ({
                      ...prev,
                      experienceYears: Number.parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="border-red-200 focus:border-red-500">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Less than 1 year</SelectItem>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="2">2 years</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="10">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Input
                  id="bio"
                  value={trainerProfile.bio}
                  onChange={(e) =>
                    setTrainerProfile((prev) => ({
                      ...prev,
                      bio: e.target.value,
                    }))
                  }
                  className="border-red-200 focus:border-red-500"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </motion.div>
        );

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
              <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">
                Preferences
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-2">
                Language and notification preferences
              </p>
            </div>

            <div className="space-y-4">
              {availableLanguages.length > 0 && (
                <div>
                  <Label>Languages (Select multiple)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableLanguages.map((language: string) => (
                      <Badge
                        key={language}
                        variant={
                          trainerProfile.languages.includes(language)
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer transition-colors ${
                          trainerProfile.languages.includes(language)
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
              )}

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableSMS"
                    checked={trainerProfile.enableSMS}
                    onCheckedChange={(checked) =>
                      setTrainerProfile((prev) => ({
                        ...prev,
                        enableSMS: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="enableSMS" className="text-sm">
                    Enable SMS notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableEmail"
                    checked={trainerProfile.enableEmail}
                    onCheckedChange={(checked) =>
                      setTrainerProfile((prev) => ({
                        ...prev,
                        enableEmail: !!checked,
                      }))
                    }
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
                    <strong>Name:</strong> {signupForm.fullName}
                  </p>
                  <p>
                    <strong>Occupation:</strong> {trainerProfile.occupation}
                  </p>
                  <p>
                    <strong>Subjects:</strong>{" "}
                    {trainerProfile.subjects.join(", ")}
                  </p>
                  {selectedCountry && trainerProfile.ratePerHour > 0 && (
                    <p>
                      <strong>Rate:</strong> {selectedCountry.currency}
                      {trainerProfile.ratePerHour}/hour
                    </p>
                  )}
                  <p>
                    <strong>Experience:</strong>{" "}
                    {trainerProfile.experienceYears} years
                  </p>
                  <div>
                    <Label>
                      Languages * (Select multiple)
                      {trainerProfile.languages.length === 0 && (
                        <span className="text-red-500 text-xs ml-2">
                          (Required)
                        </span>
                      )}
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableLanguages.map((language) => (
                        <Badge
                          key={language}
                          variant={
                                                        trainerProfile.languages.includes(language)
                              ? "default"
                              : "outline"
                          }
                          className={`cursor-pointer transition-colors ${
                            trainerProfile.languages.includes(language)
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
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${20 + Math.random() * 40}px`,
            }}
          >
            {i % 3 === 0 ? (
              <GraduationCap className="text-red-500" />
            ) : i % 3 === 1 ? (
              <Sparkles className="text-blue-500" />
            ) : (
              <User className="text-purple-500" />
            )}
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Join AllLearn as a Trainer
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Share your knowledge and make a difference in students' lives
          </p>
        </motion.div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-red-200 dark:border-red-800 shadow-2xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {currentStep === 1
                    ? "Create Your Account"
                    : currentStep === 2
                    ? "Step 1 of 3: Basic Details"
                    : currentStep === 3
                    ? "Step 2 of 3: Professional Info"
                    : "Step 3 of 3: Preferences"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {currentStep === 1 ? (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {signupError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{signupError}</AlertDescription>
                        </Alert>
                      )}

                      {profileCreationStatus === "creating" && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Creating your trainer profile...
                          </AlertDescription>
                        </Alert>
                      )}

                      {profileCreationStatus === "success" && (
                        <Alert className="border-green-200 bg-green-50 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>
                            Account created successfully! Please complete your
                            profile.
                          </AlertDescription>
                        </Alert>
                      )}

                      <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                          <Label
                            htmlFor="role"
                            className="text-red-700 dark:text-red-400"
                          >
                            I want to join as
                          </Label>
                          <Select
                            value={signupForm.role}
                            onValueChange={(value: "student" | "trainer") =>
                              setSignupForm((prev) => ({
                                ...prev,
                                role: value,
                              }))
                            }
                          >
                            <SelectTrigger className="border-red-200 focus:border-red-500">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="trainer">Trainer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label
                            htmlFor="signup-name"
                            className="text-red-700 dark:text-red-400"
                          >
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder="John Doe"
                              value={signupForm.fullName}
                              onChange={(e) =>
                                setSignupForm((prev) => ({
                                  ...prev,
                                  fullName: e.target.value,
                                }))
                              }
                              className="pl-10 border-red-200 focus:border-red-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="signup-email"
                            className="text-red-700 dark:text-red-400"
                          >
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="trainer@example.com"
                              value={signupForm.email}
                              onChange={(e) =>
                                setSignupForm((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className="pl-10 border-red-200 focus:border-red-500"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="signup-password"
                            className="text-red-700 dark:text-red-400"
                          >
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
                            <Input
                              id="signup-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={signupForm.password}
                              onChange={(e) =>
                                setSignupForm((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              className="pl-10 pr-10 border-red-200 focus:border-red-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor="signup-confirm-password"
                            className="text-red-700 dark:text-red-400"
                          >
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
                            <Input
                              id="signup-confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              value={signupForm.confirmPassword}
                              onChange={(e) =>
                                setSignupForm((prev) => ({
                                  ...prev,
                                  confirmPassword: e.target.value,
                                }))
                              }
                              className="pl-10 pr-10 border-red-200 focus:border-red-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                        >
                          {isSubmitting
                            ? "Creating Account..."
                            : "Create Account"}
                        </Button>

                        <div className="space-y-2">
                          <Separator className="my-4" />

                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSocialSignup("google")}
                              className="w-full border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <FaGoogle className="w-4 h-4 mr-2" />
                              Sign up with Google
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleSocialSignup("facebook")}
                              className="w-full border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <FaFacebook className="w-4 h-4 mr-2" />
                              Sign up with Facebook
                            </Button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  ) : (
                    <div className="space-y-6">
                      {/* Progress indicator */}
                      <div className="flex items-center justify-between">
                        {[2, 3, 4].map((step) => (
                          <div key={step} className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step <= currentStep
                                  ? "bg-red-600 text-white"
                                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {step - 1}
                            </div>
                            {step < 4 && (
                              <div
                                className={`w-16 h-1 mx-2 ${
                                  step < currentStep
                                    ? "bg-red-600"
                                    : "bg-red-200 dark:bg-red-800"
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Step content */}
                      <AnimatePresence mode="wait">
                        {renderSignupStep()}
                      </AnimatePresence>

                      {/* Navigation buttons */}
                      <div className="flex justify-between pt-6">
                        <Button
                          variant="outline"
                          onClick={handlePrev}
                          disabled={currentStep === 2}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>

                        {currentStep < 4 ? (
                          <Button
                            onClick={handleNext}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <Button
                              onClick={handleTrainerProfileSubmit}
                              disabled={isSubmitting}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {isSubmitting ? "Submitting..." : "Submit Application"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

