"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { StarRating } from "@/components/star-rating";
import { FavoriteHeart } from "@/components/favorite-heart";

// Unified VideoType definition
type VideoType = {
  id: number;
  subtopic_id: number;
  language: string;
  youtube_id: string;
  title: string;
  description: string | null;
  syllabus_type: string | null;
  video_start_time?: string | null;
  video_end_time?: string | null;
  video_code?: string | null;
  video_duration?: number | null;
  video_likes?: number | null;
  video_dislikes?: number | null;
  video_status?: string | null;
  is_active?: boolean | null;
  view_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type VideoStats = {
  average_rating: number;
  total_ratings: number;
  total_favorites: number;
};

type UserVideoData = {
  isFavorited: boolean;
  userRating: number;
};

interface VideoCarouselProps {
  videos: VideoType[];
  language: string;
}

export function VideoCarousel({ videos, language }: VideoCarouselProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoStats, setVideoStats] = useState<Record<number, VideoStats>>({});
  const [userVideoData, setUserVideoData] = useState<Record<number, UserVideoData>>({});
  const [sortedVideos, setSortedVideos] = useState<VideoType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  // Use ref for tracked videos to avoid unnecessary re-renders
  const trackedVideosRef = useRef<Set<number>>(new Set());

  // Function to track watch history
  const trackWatchHistory = async (videoId: number) => {
    if (!user) return;

    try {
      // Check if this video was already watched recently (within last 30 minutes to avoid duplicates)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: recentWatch, error: checkError } = await supabase
        .from("user_watch_history")
        .select("id, watched_at")
        .eq("user_id", user.id)
        .eq("video_id", videoId)
        .gte("watched_at", thirtyMinutesAgo)
        .order("watched_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // Only insert if not watched recently
      if (!recentWatch) {
        const { error: insertError } = await supabase
          .from("user_watch_history")
          .insert({
            user_id: user.id,
            video_id: videoId,
            watched_at: new Date().toISOString(),
            watch_duration_seconds: 0,
            total_duration_seconds: null,
            completion_percentage: 0,
            is_completed: false,
            last_position_seconds: 0,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error("Error tracking watch history:", insertError);
        } else {
          console.log("✅ Watch history tracked for video:", videoId);
        }
      } else {
        console.log("📝 Video already watched recently, skipping duplicate entry");
      }
    } catch (error) {
      console.error("Error in trackWatchHistory:", error);
    }
  };


  // Function to recalculate and update video statistics
  const updateVideoStatistics = async (videoId: number) => {
    console.log("📊 updateVideoStatistics called for video:", videoId);

    try {
      // Get all ratings for this video (video_id is string in user_video_star_ratings)
      console.log("🔍 Fetching all ratings for video:", videoId);
      const { data: allRatings, error: ratingsError } = await supabase
        .from("user_video_ratings")
        .select("rating")
        .eq("video_id", videoId.toString()); // Convert to string

      if (ratingsError) {
        console.error("❌ Error fetching ratings:", ratingsError);
        throw ratingsError;
      }

      console.log("📝 All ratings found:", allRatings);

      // Get favorites count for this video
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("user_video_favorites")
        .select("id")
        .eq("video_id", videoId); // Assuming this is integer

      if (favoritesError) {
        console.error("❌ Error fetching favorites:", favoritesError);
        throw favoritesError;
      }

      console.log("❤️ Favorites found:", favoritesData);

      // Calculate statistics
      const totalRatings = allRatings?.length || 0;
      const averageRating =
        totalRatings > 0
          ? allRatings.reduce((sum, r) => sum + Number(r.rating), 0) /
            totalRatings
          : 0;
      const totalFavorites = favoritesData?.length || 0;

      console.log("🧮 Calculated stats:", {
        totalRatings,
        averageRating,
        totalFavorites,
      });

      // Update or insert video statistics (video_id is integer in video_statistics)
      console.log("💾 Updating video_statistics table...");
      const { data: upsertData, error: upsertError } = await supabase
        .from("video_statistics")
        .upsert({
          video_id: videoId, // Keep as integer
          average_rating: averageRating,
          total_ratings: totalRatings,
          total_favorites: totalFavorites,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (upsertError) {
        console.error("❌ Error upserting video statistics:", upsertError);
        throw upsertError;
      }

      console.log("✅ Video statistics updated:", upsertData);
    } catch (error) {
      console.error("❌ Error in updateVideoStatistics:", error);
    }
  };

  useEffect(() => {
    // Filter videos by language and ensure they have valid youtube_id
    const filteredVideos = videos.filter((v) =>
      v.language === language && v.youtube_id && v.youtube_id.trim() !== ""
    );
    console.log("🎥 Filtered videos:", filteredVideos);
    const fetchVideoData = async () => {
      if (filteredVideos.length === 0) {
        console.log("❌ No filtered videos found");
        return;
      }

      const videoIds = filteredVideos.map((v) => v.id);
      console.log("🔍 Video IDs to fetch stats for:", videoIds);

      try {
        // Fetch video statistics
        console.log("📊 Fetching video statistics...");
        const { data: statsData, error: statsError } = await supabase
          .from("video_statistics")
          .select("*")
          .in("video_id", videoIds);

        if (statsError) {
          console.error("❌ Error fetching stats:", statsError);
          throw statsError;
        }

        console.log("📊 Stats data from database:", statsData);

        const statsMap: Record<number, VideoStats> = {};

        // Initialize all videos with default stats
        videoIds.forEach((id) => {
          statsMap[id] = {
            average_rating: 0,
            total_ratings: 0,
            total_favorites: 0,
          };
        });

        // Update with actual stats from database
        statsData?.forEach((stat) => {
          console.log(`📈 Setting stats for video ${stat.video_id}:`, stat);
          statsMap[stat.video_id] = {
            average_rating: Number(stat.average_rating) || 0,
            total_ratings: stat.total_ratings || 0,
            total_favorites: stat.total_favorites || 0,
          };
        });

        console.log("📊 Final statsMap:", statsMap);
        setVideoStats(statsMap);

        // Fetch user data if logged in
        let userDataMap: Record<number, UserVideoData> = {};
        if (user) {
          // Fetch user favorites
          const { data: favoritesData, error: favoritesError } = await supabase
            .from("user_video_favorites")
            .select("video_id")
            .eq("user_id", user.id)
            .in("video_id", videoIds);

          if (favoritesError) throw favoritesError;

          // Fetch user ratings (video_id is string in user_video_star_ratings)
          const { data: ratingsData, error: ratingsError } = await supabase
            .from("user_video_ratings")
            .select("video_id, rating")
            .eq("user_id", user.id)
            .in(
              "video_id",
              videoIds.map((id) => id.toString())
            ); // Convert to strings

          if (ratingsError) throw ratingsError;

          console.log("👤 User ratings data:", ratingsData);
          console.log("❤️ User favorites data:", favoritesData);

          userDataMap = {};
          videoIds.forEach((id) => {
            userDataMap[id] = {
              isFavorited:
                favoritesData?.some((f) => f.video_id === id) || false,
              userRating:
                ratingsData?.find((r) => parseInt(r.video_id) === id)?.rating ||
                0, // Parse back to int for comparison
            };
          });
          setUserVideoData(userDataMap);
        } else {
          // Initialize user data for non-logged in users
          userDataMap = {};
          videoIds.forEach((id) => {
            userDataMap[id] = {
              isFavorited: false,
              userRating: 0,
            };
          });
          setUserVideoData(userDataMap);
        }

        // Sort videos: favorited first, then by average rating
        const sorted = [...filteredVideos].sort((a, b) => {
          const aFavorited = userDataMap[a.id]?.isFavorited || false;
          const bFavorited = userDataMap[b.id]?.isFavorited || false;

          if (aFavorited && !bFavorited) return -1;
          if (!aFavorited && bFavorited) return 1;

          const aRating = statsMap[a.id]?.average_rating || 0;
          const bRating = statsMap[b.id]?.average_rating || 0;
          return bRating - aRating;
        });

        setSortedVideos(sorted);
      } catch (error) {
        console.error("Error fetching video data:", error);
      }
    };

    fetchVideoData();
  }, [videos, language, user, refreshKey]);

  // Track watch history when current video changes
  useEffect(() => {
    if (
      sortedVideos.length > 0 &&
      user &&
      sortedVideos[currentIndex] &&
      !trackedVideosRef.current.has(sortedVideos[currentIndex].id)
    ) {
      // Add a small delay to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        trackWatchHistory(sortedVideos[currentIndex].id);
        trackedVideosRef.current.add(sortedVideos[currentIndex].id);
      }, 500); // 500ms delay
      return () => clearTimeout(timeoutId);
    }
  }, [currentIndex, user, sortedVideos]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? sortedVideos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === sortedVideos.length - 1 ? 0 : prev + 1));
  };

  // Unified favorite toggle logic
  const handleFavoriteToggle = async (videoId: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to favorite videos",
        variant: "destructive",
      });
      return;
    }
    try {
      const isCurrentlyFavorited = userVideoData[videoId]?.isFavorited || false;
      let operationError;
      if (isCurrentlyFavorited) {
        const { error } = await supabase
          .from('user_video_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);
        operationError = error;
      } else {
        const { error } = await supabase
          .from('user_video_favorites')
          .insert({
            user_id: user.id,
            video_id: videoId,
            created_at: new Date().toISOString(),
          });
        operationError = error;
      }
      if (operationError) throw operationError;
      setUserVideoData((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          isFavorited: !isCurrentlyFavorited,
        },
      }));
      setRefreshKey((k) => k + 1);
      toast({
        title: isCurrentlyFavorited ? "Removed from favorites" : "Added to favorites",
        description: isCurrentlyFavorited
          ? "Video removed from your favorites"
          : "Video added to your favorites",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  // Unified rating logic
  const handleRatingChange = async (videoId: number, rating: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to rate videos",
        variant: "destructive",
      });
      return;
    }
    try {
      const currentRating = userVideoData[videoId]?.userRating;
      let result;
      if (currentRating !== undefined && currentRating !== null && currentRating !== 0) {
        // Update existing rating
        result = await supabase
          .from("user_video_ratings")
          .update({
            rating: rating,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("video_id", videoId);
      } else {
        // Insert new rating
        result = await supabase
          .from("user_video_ratings")
          .insert({
            user_id: user.id,
            video_id: videoId,
            rating: rating,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
      if (result.error) throw result.error;
      setUserVideoData((prev) => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          userRating: rating,
        },
      }));
      setRefreshKey((k) => k + 1);
      toast({
        title: currentRating && currentRating !== 0 ? "Rating updated" : "Rating submitted",
        description: `You rated this video ${rating} stars`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    }
  };

  if (sortedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No videos available in {language}.
        </p>
      </div>
    );
  }

  const currentVideo = sortedVideos[currentIndex];
  const currentStats = videoStats[currentVideo.id] || {
    average_rating: 0,
    total_ratings: 0,
    total_favorites: 0,
  };
  const currentUserData = userVideoData[currentVideo.id] || {
    isFavorited: false,
    userRating: 0,
  };

  function intervalToSeconds(interval: string | null): number {
    if (!interval) return 0;
    const parts = interval.split(":").map(Number);
    if (parts.length !== 3) return 0;
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  const start = intervalToSeconds(currentVideo.video_start_time ?? null);
  const end = intervalToSeconds(currentVideo.video_end_time ?? null);

  return (
    <div className="space-y-6">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${currentVideo.youtube_id}?start=${start}&end=${end}&autoplay=1&enablejsapi=1`}
          title={currentVideo.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{currentVideo.title}</h2>
            {currentVideo.description && (
              <p className="text-muted-foreground mt-1">
                {currentVideo.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <FavoriteHeart
              isFavorited={currentUserData.isFavorited}
              onToggle={() => handleFavoriteToggle(currentVideo.id)}
              disabled={!user}
            />
          </div>
        </div>
        {/* Rating Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Average Rating</p>
              <div className="flex items-center gap-2">
                <StarRating
                  rating={currentStats.average_rating}
                  readonly
                  size="sm"
                />
                <span className="text-xs text-muted-foreground">
                  ({currentStats.total_ratings} rating
                  {currentStats.total_ratings !== 1 ? "s" : ""})
                </span>
              </div>
            </div>
            {currentUserData.isFavorited && (
              <div className="flex items-center gap-1 text-pink-500 text-xs">
                <span>⭐</span>
                <span>Favorited</span>
              </div>
            )}
          </div>
          {user && (
            <div>
              <p className="text-sm font-medium mb-2">Your Rating</p>
              <StarRating
                rating={currentUserData.userRating}
                onRatingChange={(rating) => handleRatingChange(currentVideo.id, rating)}
                size="md"
                showValue={false}
              />
            </div>
          )}
        </div>
        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Video {currentIndex + 1} of {sortedVideos.length}
          </div>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


