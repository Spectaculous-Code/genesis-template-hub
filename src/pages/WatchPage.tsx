import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { YouTubeEmbed } from "@/components/watch/YouTubeEmbed";
import { VideoInfo } from "@/components/watch/VideoInfo";
import { VideoNavigation } from "@/components/watch/VideoNavigation";
import { SeriesDrawer } from "@/components/watch/SeriesDrawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface VideoClip {
  id: string;
  series_slug: string;
  order_index: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  host_type: string;
  host_video_id: string;
  thumbnail_url: string | null;
}

interface VideoSeries {
  slug: string;
  title: string;
  description: string | null;
}

const WatchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentVideo, setCurrentVideo] = useState<VideoClip | null>(null);
  const [series, setSeries] = useState<VideoSeries | null>(null);
  const [allVideos, setAllVideos] = useState<VideoClip[]>([]);
  const [showSeriesDrawer, setShowSeriesDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  const seriesSlug = searchParams.get("series");
  const videoIndex = parseInt(searchParams.get("v") || "1");

  useEffect(() => {
    if (!seriesSlug) {
      toast.error("Sarjan tunniste puuttuu URL-osoitteesta");
      return;
    }

    loadSeriesAndVideo();
  }, [seriesSlug, videoIndex]);

  const loadSeriesAndVideo = async () => {
    try {
      setLoading(true);

      // Fetch series info
      const { data: seriesData, error: seriesError } = await supabase
        .from("video_series")
        .select("*")
        .eq("slug", seriesSlug)
        .single();

      if (seriesError) throw seriesError;
      setSeries(seriesData);

      // Fetch all videos in series
      const { data: videosData, error: videosError } = await supabase
        .from("video_clips")
        .select("*")
        .eq("series_slug", seriesSlug)
        .eq("is_published", true)
        .order("order_index");

      if (videosError) throw videosError;
      setAllVideos(videosData || []);

      // Find current video
      const video = videosData?.find((v) => v.order_index === videoIndex);
      if (video) {
        setCurrentVideo(video);
      } else {
        toast.error("Videota ei löytynyt");
      }
    } catch (error) {
      console.error("Error loading video:", error);
      toast.error("Videon lataus epäonnistui");
    } finally {
      setLoading(false);
    }
  };

  const navigateToVideo = (newIndex: number) => {
    navigate(`/watch?series=${seriesSlug}&v=${newIndex}`);
  };

  const handlePrevious = () => {
    if (currentVideo && videoIndex > 1) {
      navigateToVideo(videoIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentVideo && videoIndex < allVideos.length) {
      navigateToVideo(videoIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Ladataan...</div>
      </div>
    );
  }

  if (!currentVideo || !series) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center p-4">
          <p>Videota ei löytynyt</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Palaa etusivulle
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = allVideos.findIndex((v) => v.id === currentVideo.id);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header - semi-transparent overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Takaisin
          </Button>
          <div className="text-white text-sm font-medium">{series.title}</div>
        </div>
      </div>

      {/* Video area - takes most of the screen */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="w-full max-w-md aspect-[9/16] relative">
          <YouTubeEmbed
            videoId={currentVideo.host_video_id}
            autoplay={true}
          />
        </div>
      </div>

      {/* Info & Navigation - bottom section */}
      <div className="bg-background border-t border-border">
        <div className="max-w-md mx-auto p-4 space-y-4">
          <VideoInfo
            title={currentVideo.title}
            subtitle={currentVideo.subtitle}
            description={currentVideo.description}
          />

          <VideoNavigation
            currentIndex={currentIndex}
            totalVideos={allVideos.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onShowAll={() => setShowSeriesDrawer(true)}
            hasPrevious={currentIndex > 0}
            hasNext={currentIndex < allVideos.length - 1}
          />
        </div>
      </div>

      {/* Series drawer */}
      <SeriesDrawer
        open={showSeriesDrawer}
        onClose={() => setShowSeriesDrawer(false)}
        seriesTitle={series.title}
        videos={allVideos}
        currentVideoId={currentVideo.id}
        onVideoSelect={navigateToVideo}
      />
    </div>
  );
};

export default WatchPage;
