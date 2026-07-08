/**
 * Next.js configuration for Computronium.
 *
 * Kept intentionally tiny. We use plain <img> tags (not next/image) so that
 * images from Supabase Storage and YouTube thumbnails "just work" without
 * having to whitelist every hostname here. On the Vercel free tier this also
 * avoids burning through the image-optimization quota.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nothing special needed. Add options here later if you want them.
};

export default nextConfig;
