"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { gsap } from "gsap"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Heart, Star, StarOff, Video } from "lucide-react"

type UserSettings = {
  user_id: string
  syllabus_type: string
  preferred_language: string
  username: string
  first_name: string | null
  middle_name: string | null
  last_name: string | null
}

type WatchHistoryItem = {
  id: number
  video_id: number
  watched_at: string
  video_title: string
  video_language: string
  subtopic_name: string
  chapter_name: string
  subject_name: string
  subtopic_id: number
}

type RatedVideo = {
  id: number
  video_id: number
  rating: number
  created_at: string
  video_title: string
  video_language: string
  subtopic_name: string
  subtopic_id: number
}

type FavoritedVideo = {
  id: number
  video_id: number
  created_at: string
  video_title: string
  video_language: string
  subtopic_name: string
  subtopic_id: number
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([])
  const [highRatedVideos, setHighRatedVideos] = useState<RatedVideo[]>([])
  const [lowRatedVideos, setLowRatedVideos] = useState<RatedVideo[]>([])
  const [favoritedVideos, setFavoritedVideos] = useState<FavoritedVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch user settings
        const { data: settings, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (settingsError && settingsError.code !== "PGRST116") {
          throw settingsError
        }

        setUserSettings(
          settings || {
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
          },
        )

        // Fetch watch history
        const { data: historyData, error: historyError } = await supabase
          .from("user_watch_history")
          .select("id, video_id, watched_at")
          .eq("user_id", user.id)
          .order("watched_at", { ascending: false })
          .limit(4)

        if (historyError) {
          throw historyError
        }

        // Process watch history
        if (historyData && historyData.length > 0) {
          const videoIds = historyData.map((item) => item.video_id)

          const { data: videosData, error: videosError } = await supabase
            .from("videos")
            .select("id, title, language, subtopic_id")
            .in("id", videoIds)

          if (videosError) {
            throw videosError
          }

          const subtopicIds = videosData?.map((v) => v.subtopic_id) || []
          const { data: subtopicsData, error: subtopicsError } = await supabase
            .from("subtopics")
            .select("id, name, chapter_id")
            .in("id", subtopicIds)

          if (subtopicsError) {
            throw subtopicsError
          }

          const chapterIds = subtopicsData?.map((s) => s.chapter_id) || []
          const { data: chaptersData, error: chaptersError } = await supabase
            .from("chapters")
            .select("id, name, subject_id")
            .in("id", chapterIds)

          if (chaptersError) {
            throw chaptersError
          }

          const subjectIds = chaptersData?.map((c) => c.subject_id) || []
          const { data: subjectsData, error: subjectsError } = await supabase
            .from("subjects")
            .select("id, name")
            .in("id", subjectIds)

          if (subjectsError) {
            throw subjectsError
          }

          const videosMap = new Map(videosData?.map((v) => [v.id, v]) || [])
          const subtopicsMap = new Map(subtopicsData?.map((s) => [s.id, s]) || [])
          const chaptersMap = new Map(chaptersData?.map((c) => [c.id, c]) || [])
          const subjectsMap = new Map(subjectsData?.map((s) => [s.id, s]) || [])

          const combinedHistory = historyData.map((item) => {
            const video = videosMap.get(item.video_id)
            const subtopic = video ? subtopicsMap.get(video.subtopic_id) : null
            const chapter = subtopic ? chaptersMap.get(subtopic.chapter_id) : null
            const subject = chapter ? subjectsMap.get(chapter.subject_id) : null

            return {
              id: item.id,
              video_id: item.video_id,
              watched_at: item.watched_at,
              video_title: video?.title || "Unknown Video",
              video_language: video?.language || "unknown",
              subtopic_name: subtopic?.name || "Unknown Subtopic",
              subtopic_id: video?.subtopic_id || 0,
              chapter_name: chapter?.name || "Unknown Chapter",
              subject_name: subject?.name || "Unknown Subject",
            }
          })

          setWatchHistory(combinedHistory)
        } else {
          setWatchHistory([])
        }

        // Fetch high rated videos (rating > 2.5)
        const { data: highRatedData, error: highRatedError } = await supabase
          .from("user_video_ratings")
          .select("id, video_id, rating, created_at")
          .eq("user_id", user.id)
          .gt("rating", 2.5)
          .order("created_at", { ascending: false })
          .limit(4)

        if (highRatedError) {
          throw highRatedError
        }

        if (highRatedData && highRatedData.length > 0) {
          // Convert video_id to numbers to ensure proper matching
          const videoIds = highRatedData.map((item) => Number(item.video_id))
          console.log("High rated video IDs (converted to numbers):", videoIds)

          const { data: videosData, error: videosError } = await supabase
            .from("videos")
            .select("id, title, language, subtopic_id")
            .in("id", videoIds)

          if (videosError) {
            throw videosError
          }

          console.log("High rated videos data:", videosData)

          const subtopicIds = videosData?.map((v) => v.subtopic_id) || []
          const { data: subtopicsData, error: subtopicsError } = await supabase
            .from("subtopics")
            .select("id, name")
            .in("id", subtopicIds)

          if (subtopicsError) {
            throw subtopicsError
          }

          const videosMap = new Map(videosData?.map((v) => [v.id, v]) || [])
          const subtopicsMap = new Map(subtopicsData?.map((s) => [s.id, s]) || [])

          const combinedHighRated = highRatedData.map((item) => {
            const videoId = Number(item.video_id) // Convert to number for lookup
            const video = videosMap.get(videoId)
            const subtopic = video ? subtopicsMap.get(video.subtopic_id) : null

            console.log(`High rated video ID ${item.video_id} (${videoId}):`, {
              videoFound: !!video,
              videoTitle: video?.title,
              videoLanguage: video?.language
            })

            return {
              id: item.id,
              video_id: Number(item.video_id),
              rating: item.rating,
              created_at: item.created_at,
              video_title: video?.title || "Unknown Video",
              video_language: video?.language || "unknown",
              subtopic_name: subtopic?.name || "Unknown Subtopic",
              subtopic_id: video?.subtopic_id || 0,
            }
          })

          setHighRatedVideos(combinedHighRated)
        } else {
          setHighRatedVideos([])
        }

        // Fetch low rated videos (rating <= 2.5)
        const { data: lowRatedData, error: lowRatedError } = await supabase
          .from("user_video_ratings")
          .select("id, video_id, rating, created_at")
          .eq("user_id", user.id)
          .lte("rating", 2.5)
          .order("created_at", { ascending: false })
          .limit(4)

        if (lowRatedError) {
          throw lowRatedError
        }

        if (lowRatedData && lowRatedData.length > 0) {
          // Convert video_id to numbers to ensure proper matching
          const videoIds = lowRatedData.map((item) => Number(item.video_id))
          console.log("Low rated video IDs (converted to numbers):", videoIds)

          const { data: videosData, error: videosError } = await supabase
            .from("videos")
            .select("id, title, language, subtopic_id")
            .in("id", videoIds)

          if (videosError) {
            throw videosError
          }

          console.log("Low rated videos data:", videosData)

          const subtopicIds = videosData?.map((v) => v.subtopic_id) || []
          const { data: subtopicsData, error: subtopicsError } = await supabase
            .from("subtopics")
            .select("id, name")
            .in("id", subtopicIds)

          if (subtopicsError) {
            throw subtopicsError
          }

          const videosMap = new Map(videosData?.map((v) => [v.id, v]) || [])
          const subtopicsMap = new Map(subtopicsData?.map((s) => [s.id, s]) || [])

          const combinedLowRated = lowRatedData.map((item) => {
            const videoId = Number(item.video_id) // Convert to number for lookup
            const video = videosMap.get(videoId)
            const subtopic = video ? subtopicsMap.get(video.subtopic_id) : null

            console.log(`Low rated video ID ${item.video_id} (${videoId}):`, {
              videoFound: !!video,
              videoTitle: video?.title,
              videoLanguage: video?.language
            })

            return {
              id: item.id,
              video_id: Number(item.video_id),
              rating: item.rating,
              created_at: item.created_at,
              video_title: video?.title || "Unknown Video",
              video_language: video?.language || "unknown",
              subtopic_name: subtopic?.name || "Unknown Subtopic",
              subtopic_id: video?.subtopic_id || 0,
            }
          })

          setLowRatedVideos(combinedLowRated)
        } else {
          setLowRatedVideos([])
        }

        // Fetch favorited videos
        const { data: favoritedData, error: favoritedError } = await supabase
          .from("user_video_favorites")
          .select("id, video_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (favoritedError) {
          throw favoritedError
        }

        if (favoritedData && favoritedData.length > 0) {
          // Convert video_id to numbers to ensure proper matching
          const videoIds = favoritedData.map((item) => Number(item.video_id))
          console.log("Favorited video IDs (converted to numbers):", videoIds)

          const { data: videosData, error: videosError } = await supabase
            .from("videos")
            .select("id, title, language, subtopic_id")
            .in("id", videoIds)

          if (videosError) {
            throw videosError
          }

          console.log("Favorited videos data:", videosData)

          const subtopicIds = videosData?.map((v) => v.subtopic_id) || []
          const { data: subtopicsData, error: subtopicsError } = await supabase
            .from("subtopics")
            .select("id, name")
            .in("id", subtopicIds)

          if (subtopicsError) {
            throw subtopicsError
          }

          const videosMap = new Map(videosData?.map((v) => [v.id, v]) || [])
          const subtopicsMap = new Map(subtopicsData?.map((s) => [s.id, s]) || [])

          const combinedFavorited = favoritedData.map((item) => {
            const videoId = Number(item.video_id) // Convert to number for lookup
            const video = videosMap.get(videoId)
            const subtopic = video ? subtopicsMap.get(video.subtopic_id) : null

            console.log(`Favorited video ID ${item.video_id} (${videoId}):`, {
              videoFound: !!video,
              videoTitle: video?.title,
              videoLanguage: video?.language
            })

            return {
              id: item.id,
              video_id: Number(item.video_id),
              created_at: item.created_at,
              video_title: video?.title || "Unknown Video",
              video_language: video?.language || "unknown",
              subtopic_name: subtopic?.name || "Unknown Subtopic",
              subtopic_id: video?.subtopic_id || 0,
            }
          })

          setFavoritedVideos(combinedFavorited)
        } else {
          setFavoritedVideos([])
        }
      } catch (error: any) {
        console.error("Error fetching user data:", error)
        setError(error.message || "Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  useEffect(() => {
    if (!isLoading) {
      // Animate profile content
      gsap.from(".profile-card", {
        opacity: 0,
        y: 20,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out",
      })
    }
  }, [isLoading])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Profile</h1>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Redirect handled in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Profile</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="profile-card">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            {userSettings && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Username</Label>
                      <p className="font-medium">{userSettings.username}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">
                        {[userSettings.first_name, userSettings.middle_name, userSettings.last_name]
                          .filter(Boolean)
                          .join(" ") || "Not set"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Learning Preferences</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Preferred Syllabus</Label>
                      <p className="font-medium capitalize">{userSettings.syllabus_type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Preferred Language</Label>
                      <p className="font-medium capitalize">{userSettings.preferred_language}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button asChild>
                <Link href="/settings">Edit Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="profile-card">
          <CardHeader>
            <CardTitle>Learning Activity</CardTitle>
            <CardDescription>Your recent activity on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="history">
              <TabsList className="mb-4">
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Watch History
                </TabsTrigger>
                <TabsTrigger value="high-rated" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  High Rated
                </TabsTrigger>
                <TabsTrigger value="low-rated" className="flex items-center gap-2">
                  <StarOff className="h-4 w-4" />
                  Low Rated
                </TabsTrigger>
                <TabsTrigger value="favorited" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Favorited
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                {watchHistory.length > 0 ? (
                  <div className="space-y-4">
                    {watchHistory.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <Link href={`/subtopics/${item.subtopic_id}`}>
                            <div className="flex flex-col sm:flex-row items-start p-4 hover:bg-muted/50 transition-colors">
                              <div className="sm:flex-1">
                                <h3 className="font-semibold text-primary">{item.video_title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.subject_name} {">"} {item.chapter_name} {">"} {item.subtopic_name}
                                </p>
                                <div className="flex items-center mt-1">
                                  <Video className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {item.video_language}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-2 sm:mt-0">
                                Watched on {formatDate(item.watched_at)}
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No watch history available.</p>
                    <Button asChild className="mt-4">
                      <Link href="/subjects">Browse Subjects</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="high-rated">
                {highRatedVideos.length > 0 ? (
                  <div className="space-y-4">
                    {highRatedVideos.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <Link href={`/subtopics/${item.subtopic_id}`}>
                            <div className="flex flex-col sm:flex-row items-start p-4 hover:bg-muted/50 transition-colors">
                              <div className="sm:flex-1">
                                <h3 className="font-semibold text-primary">{item.video_title}</h3>
                                <p className="text-sm text-muted-foreground">{item.subtopic_name}</p>
                                <div className="flex items-center mt-1">
                                  <Video className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {item.video_language}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-2 sm:mt-0">
                                Rated on {formatDate(item.created_at)}
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No high rated videos available.</p>
                    <Button asChild className="mt-4">
                      <Link href="/subjects">Browse Subjects</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="low-rated">
                {lowRatedVideos.length > 0 ? (
                  <div className="space-y-4">
                    {lowRatedVideos.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <Link href={`/subtopics/${item.subtopic_id}`}>
                            <div className="flex flex-col sm:flex-row items-start p-4 hover:bg-muted/50 transition-colors">
                              <div className="sm:flex-1">
                                <h3 className="font-semibold text-primary">{item.video_title}</h3>
                                <p className="text-sm text-muted-foreground">{item.subtopic_name}</p>
                                <div className="flex items-center mt-1">
                                  <Video className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {item.video_language}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-2 sm:mt-0">
                                Rated on {formatDate(item.created_at)}
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No low rated videos available.</p>
                    <Button asChild className="mt-4">
                      <Link href="/subjects">Browse Subjects</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="favorited">
                {favoritedVideos.length > 0 ? (
                  <div className="space-y-4">
                    {favoritedVideos.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <Link href={`/subtopics/${item.subtopic_id}`}>
                            <div className="flex flex-col sm:flex-row items-start p-4 hover:bg-muted/50 transition-colors">
                              <div className="sm:flex-1">
                                <h3 className="font-semibold text-primary">{item.video_title}</h3>
                                <p className="text-sm text-muted-foreground">{item.subtopic_name}</p>
                                <div className="flex items-center mt-1">
                                  <Video className="h-3 w-3 mr-1 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {item.video_language}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-2 sm:mt-0">
                                Favorited on {formatDate(item.created_at)}
                              </div>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No favorited videos available.</p>
                    <Button asChild className="mt-4">
                      <Link href="/subjects">Browse Subjects</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
