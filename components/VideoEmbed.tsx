/**
 * Embeds a pasted video link (YouTube/Vimeo → iframe player; anything
 * else → a plain link). Computronium never hosts video files itself.
 */
import { parseVideoUrl } from "@/lib/video";

export default function VideoEmbed({ url }: { url: string }) {
  const info = parseVideoUrl(url);
  if (!info) return null;

  if (info.embedUrl) {
    return (
      <iframe
        className="video-frame"
        src={info.embedUrl}
        title="Project video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Unknown platform — still useful as a link.
  return (
    <p>
      🎬 <a href={url} target="_blank" rel="noopener noreferrer">Watch the project video</a>
    </p>
  );
}
