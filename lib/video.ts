/**
 * Video link helpers — Computronium never uploads video files.
 *
 * Posters paste a YouTube (or Vimeo) link; we turn it into an embeddable
 * player URL and, for YouTube, a thumbnail image the feed cards can show.
 * Unknown platforms still work: the post page just shows a plain link.
 *
 * Used by: components/VideoEmbed.tsx, components/PostCard.tsx, the feed API.
 */

export type VideoInfo = {
  provider: "youtube" | "vimeo" | "other";
  /** URL to put in an <iframe>, or null if we can't embed this platform. */
  embedUrl: string | null;
  /** Thumbnail image URL (YouTube only), or null. */
  thumbnailUrl: string | null;
};

export function parseVideoUrl(raw: string | null | undefined): VideoInfo | null {
  if (!raw || !raw.trim()) return null;
  const url = raw.trim();

  // --- YouTube: watch?v=, youtu.be/, /shorts/, /embed/ --------------------
  const yt =
    url.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/);
  if (yt) {
    const id = yt[1];
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  // --- Vimeo: vimeo.com/12345678 ------------------------------------------
  const vimeo = url.match(/vimeo\.com\/(\d{6,12})/);
  if (vimeo) {
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
      thumbnailUrl: null,
    };
  }

  // --- Anything else: shown as a plain link on the post page ---------------
  return { provider: "other", embedUrl: null, thumbnailUrl: null };
}
