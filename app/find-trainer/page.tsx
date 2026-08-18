"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Search, Star, MapPin, Mail, Clock } from "lucide-react"

interface Trainer {
  id: number
  user_id: string
  occupation: string
  subjects: string[]
  gender: string
  rate_per_hour: number
  languages: string[]
  rating: number
  total_sessions: number
  city_name: string
  state_name: string
  country_name: string
  currency_symbol: string
  trainer_name: string
  trainer_email: string
}

interface SearchFilters {
  board: string
  grade: number
  subject: string
  primaryLanguage: string
  secondaryLanguage: string
}

export default function FindTrainerPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [filteredTrainers, setFilteredTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [sentRequests, setSentRequests] = useState<any[]>([])

  const [filters, setFilters] = useState<SearchFilters>({
    board: "",
    grade: 12,
    subject: "",
    primaryLanguage: "",
    secondaryLanguage: "",
  })

  const [subjects, setSubjects] = useState<string[]>([])
  const [boards] = useState([
    "CBSE",
    "ICSE",
    "TN Matriculation",
    "State Board",
    "Kerala Board",
    "Karnataka Board",
    "AP Board",
    "TS Board",
  ])
  const [languages] = useState([
    "English",
    "Hindi",
    "Tamil",
    "Telugu",
    "Malayalam",
    "Kannada",
    "Bengali",
    "Marathi",
    "Gujarati",
  ])

  useEffect(() => {
    fetchSubjects()
    fetchSentRequests()
  }, [])

  const fetchSubjects = async () => {
    const { data, error } = await supabase.from("subjects").select("name").order("name")

    if (!error && data) {
      setSubjects(data.map((s) => s.name))
    }
  }

  const fetchSentRequests = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("trainer_requests")
      .select(`
        *,
        trainers!inner(
          id,
          user_id,
          auth.users!trainers_user_id_fkey(
            raw_user_meta_data
          )
        )
      `)
      .eq("student_id", user.id)

    if (!error && data) {
      setSentRequests(data)
    }
  }

  const searchTrainers = async () => {
    if (!filters.board || !filters.subject || !filters.primaryLanguage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("trainers")
        .select(`
          *,
          cities!inner(name, states!inner(name, countries!inner(name, currency_symbol))),
          auth.users!trainers_user_id_fkey(email, raw_user_meta_data)
        `)
        .eq("is_approved", true)
        .contains("subjects", [filters.subject])
        .contains("languages", [filters.primaryLanguage])

      if (error) throw error

      const formattedTrainers =
        data?.map((trainer) => ({
          id: trainer.id,
          user_id: trainer.user_id,
          occupation: trainer.occupation,
          subjects: trainer.subjects,
          gender: trainer.gender,
          rate_per_hour: trainer.rate_per_hour,
          languages: trainer.languages,
          rating: trainer.rating,
          total_sessions: trainer.total_sessions,
          city_name: trainer.cities.name,
          state_name: trainer.cities.states.name,
          country_name: trainer.cities.states.countries.name,
          currency_symbol: trainer.cities.states.countries.currency_symbol,
          trainer_name: trainer.auth?.users?.raw_user_meta_data?.name || "Unknown",
          trainer_email: trainer.auth?.users?.email || "",
        })) || []

      setTrainers(formattedTrainers)
      setFilteredTrainers(formattedTrainers)
      setSearchPerformed(true)
    } catch (error: any) {
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendRequest = async (trainerId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send a request",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("trainer_requests").insert({
        student_id: user.id,
        trainer_id: trainerId,
        board: filters.board,
        grade: filters.grade,
        subject: filters.subject,
        primary_language: filters.primaryLanguage,
        secondary_language: filters.secondaryLanguage,
        message: `Request for ${filters.subject} tutoring`,
      })

      if (error) throw error

      toast({
        title: "Request Sent",
        description: "Your request has been sent to the trainer",
      })

      fetchSentRequests()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const isRequestSent = (trainerId: number) => {
    return sentRequests.some((req) => req.trainer_id === trainerId)
  }

  const getRequestStatus = (trainerId: number) => {
    const request = sentRequests.find((req) => req.trainer_id === trainerId)
    return request?.status || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-400 mb-2">Find a Trainer</h1>
          <p className="text-blue-600 dark:text-blue-300">Connect with qualified trainers for personalized learning</p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Search className="w-5 h-5" />
                Search Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="board">Board *</Label>
                  <select
                    id="board"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.board}
                    onChange={(e) => setFilters((prev) => ({ ...prev, board: e.target.value }))}
                    required
                  >
                    <option value="">Select Board</option>
                    {boards.map((board) => (
                      <option key={board} value={board}>
                        {board}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    type="number"
                    value={filters.grade}
                    onChange={(e) => setFilters((prev) => ({ ...prev, grade: Number.parseInt(e.target.value) }))}
                    min="1"
                    max="12"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <select
                    id="subject"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.subject}
                    onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="primaryLanguage">Primary Language *</Label>
                  <select
                    id="primaryLanguage"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.primaryLanguage}
                    onChange={(e) => setFilters((prev) => ({ ...prev, primaryLanguage: e.target.value }))}
                    required
                  >
                    <option value="">Select Language</option>
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="secondaryLanguage">Secondary Language</Label>
                  <select
                    id="secondaryLanguage"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.secondaryLanguage}
                    onChange={(e) => setFilters((prev) => ({ ...prev, secondaryLanguage: e.target.value }))}
                  >
                    <option value="">Select Language</option>
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button onClick={searchTrainers} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {loading ? "Searching..." : "Search Trainers"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Results */}
        {searchPerformed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-4">
              Search Results ({filteredTrainers.length})
            </h2>

            {filteredTrainers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrainers.map((trainer) => (
                  <motion.div
                    key={trainer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-400">{trainer.trainer_name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {trainer.occupation}
                          </Badge>
                          <Badge variant="outline" className="text-blue-600">
                            {trainer.gender}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {trainer.city_name}, {trainer.state_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">{trainer.trainer_email}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            {trainer.currency_symbol}
                            {trainer.rate_per_hour}/hour
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {trainer.rating.toFixed(1)} ({trainer.total_sessions} sessions)
                          </span>
                        </div>

                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Languages:</p>
                          <div className="flex flex-wrap gap-1">
                            {trainer.languages.map((lang) => (
                              <Badge key={lang} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Subjects:</p>
                          <div className="flex flex-wrap gap-1">
                            {trainer.subjects.slice(0, 3).map((subject) => (
                              <Badge key={subject} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                {subject}
                              </Badge>
                            ))}
                            {trainer.subjects.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{trainer.subjects.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="pt-2">
                          {isRequestSent(trainer.id) ? (
                            <Badge
                              variant={
                                getRequestStatus(trainer.id) === "accepted"
                                  ? "default"
                                  : getRequestStatus(trainer.id) === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="w-full justify-center"
                            >
                              {getRequestStatus(trainer.id) === "accepted"
                                ? "Request Accepted"
                                : getRequestStatus(trainer.id) === "rejected"
                                  ? "Request Rejected"
                                  : "Request Sent"}
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => sendRequest(trainer.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              Send Request
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="text-center py-8">
                  <Search className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">No trainers found</h3>
                  <p className="text-blue-600 dark:text-blue-300">
                    Try adjusting your search criteria to find more trainers
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Requests Sent Table */}
        {sentRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-700 dark:text-blue-400">Your Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-blue-200 dark:border-blue-800">
                        <th className="text-left py-2 text-blue-700 dark:text-blue-400">Trainer Name</th>
                        <th className="text-left py-2 text-blue-700 dark:text-blue-400">Subject</th>
                        <th className="text-left py-2 text-blue-700 dark:text-blue-400">Status</th>
                        <th className="text-left py-2 text-blue-700 dark:text-blue-400">Date Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentRequests.map((request) => (
                        <tr key={request.id} className="border-b border-blue-100 dark:border-blue-900">
                          <td className="py-2 text-blue-800 dark:text-blue-300">
                            {request.trainers?.auth?.users?.raw_user_meta_data?.name || "Unknown"}
                          </td>
                          <td className="py-2 text-blue-700 dark:text-blue-300">{request.subject}</td>
                          <td className="py-2">
                            <Badge
                              variant={
                                request.status === "accepted"
                                  ? "default"
                                  : request.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {request.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-blue-600 dark:text-blue-400">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
