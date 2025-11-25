interface YouTubeEmbedProps {
  videoId: string;
  autoplay?: boolean;
  className?: string;
}

export const YouTubeEmbed = ({ videoId, autoplay = true, className = "" }: YouTubeEmbedProps) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1`;

  return (
    <iframe
      src={embedUrl}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className={`w-full h-full border-0 ${className}`}
      title="Video player"
    />
  );
};
