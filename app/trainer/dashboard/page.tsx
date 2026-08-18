"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, Star } from "lucide-react";
import { useTrainerAuth } from "@/contexts/trainer-auth-context";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  totalStudents: number;
  upcomingSessions: number;
  pendingRequests: number;
  averageRating: number;
}
interface Session {
  id: string;
  trainer_id: string;
  student_id: string;
  subject: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  status: string;
}

interface TrainerRequest {
  id: string;
  trainer_id: string;
  student_id: string;
  subject: string;
  grade: string;
  board: string;
  status: string;
}

interface Feedback {
  id: string;
  trainer_id: string;
  student_id: string;
  session_id: string;
  rating: number;
  review: string;
}

export default function TrainerDashboard() {
  const { user, trainerProfile } = useTrainerAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    upcomingSessions: 0,
    pendingRequests: 0,
    averageRating: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [recentRequests, setRecentRequests] = useState<TrainerRequest[]>([]); // Changed from Request
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  useEffect(() => {
    if (trainerProfile) {
      fetchDashboardData();
    }
  }, [trainerProfile]);

  const fetchDashboardData = async () => {
    if (!trainerProfile) return;

    // Use trainerProfile.id instead of trainerData.id throughout the function
    const { data: sessionsData } = await supabase
      .from("training_sessions")
      .select("*")
      .eq("trainer_id", trainerProfile.id);

    const { data: requestsData } = await supabase
      .from("trainer_requests")
      .select("*")
      .eq("trainer_id", trainerProfile.id)
      .eq("status", "pending");

    const { data: feedbackData } = await supabase
      .from("session_feedback")
      .select("*")
      .eq("trainer_id", trainerProfile.id);

    // Calculate unique students
    const uniqueStudents = new Set(sessionsData?.map((s) => s.student_id) || [])
      .size;

    // Calculate upcoming sessions (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming =
      sessionsData?.filter((s) => {
        const sessionDate = new Date(s.session_date);
        return (
          sessionDate >= today &&
          sessionDate <= nextWeek &&
          s.status === "scheduled"
        );
      }) || [];

    setStats({
      totalStudents: uniqueStudents,
      upcomingSessions: upcoming.length,
      pendingRequests: requestsData?.length || 0,
      averageRating: trainerProfile.rating || 0,
    });

    setUpcomingSessions(upcoming.slice(0, 5));
    setRecentRequests(requestsData?.slice(0, 5) || []);
    setRecentFeedback(feedbackData?.slice(-5) || []);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-red-800 dark:text-red-400 mb-2">
            Trainer Dashboard
          </h1>
          <p className="text-red-600 dark:text-red-300">
            Welcome back! Here's your training overview.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-white/70 dark:bg-red-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                  {stats.totalStudents}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-white/70 dark:bg-red-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  Upcoming Sessions
                </CardTitle>
                <Calendar className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                  {stats.upcomingSessions}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-white/70 dark:bg-red-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  Pending Requests
                </CardTitle>
                <Clock className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                  {stats.pendingRequests}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-white/70 dark:bg-red-950/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  Average Rating
                </CardTitle>
                <Star className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800 dark:text-red-300">
                  {stats.averageRating.toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Sessions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-white/70 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session: Session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-300">
                            {session.subject}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {new Date(
                              session.session_date
                            ).toLocaleDateString()}{" "}
                            at {session.session_time}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-red-100 text-red-800"
                        >
                          {session.duration_minutes}m
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-600 dark:text-red-400">
                    No upcoming sessions
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Requests */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-red-200 dark:border-red-800 bg-white/70 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400">
                  Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRequests.length > 0 ? (
                  <div className="space-y-4">
                    {recentRequests.map((request: TrainerRequest) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-red-800 dark:text-red-300">
                            {request.subject}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            Grade {request.grade} • {request.board}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-600 dark:text-red-400">
                    No pending requests
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Card className="border-red-200 dark:border-red-800 bg-white/70 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-400">
                Recent Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentFeedback.length > 0 ? (
                <div className="space-y-4">
                  {recentFeedback.map((feedback: Feedback) => (
                    <div
                      key={feedback.id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < feedback.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-red-600 dark:text-red-400">
                            {feedback.rating}/5
                          </span>
                        </div>
                      </div>
                      <p className="text-red-700 dark:text-red-300">
                        {feedback.review}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-600 dark:text-red-400">
                  No feedback yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}