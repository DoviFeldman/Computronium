"use client";

/**
 * ============================================================================
 * <BotCheck /> — "prove you're not a bot" PLACEHOLDER
 * ============================================================================
 *
 * ⚠️ THIS IS A STUB THAT ALWAYS PASSES. It exists so the post form already
 * has the right slot (just above the Post button) for a real check later.
 *
 * FUTURE OPTION A — Cloudflare Turnstile (free, easy):
 *   1. Get a site key + secret at https://dash.cloudflare.com → Turnstile.
 *   2. npm install @marsidev/react-turnstile
 *   3. Render <Turnstile siteKey=... onSuccess={(token) => onPass(token)} />
 *      here instead of the useEffect below.
 *   4. In POST /api/posts, verify the token against Cloudflare's
 *      /siteverify endpoint before accepting the post.
 *
 * FUTURE OPTION B — custom "drag the circle onto the dark spot" puzzle:
 *   Replace the useEffect with a tiny canvas game; call onPass("ok") when
 *   the drop position is within a few pixels of the target. Homemade, zero
 *   dependencies, stops dumb spam bots (not determined ones).
 *
 * The parent form treats a null token as "not passed yet", so a real
 * implementation only has to delay calling onPass.
 * ============================================================================
 */
import { useEffect } from "react";

export default function BotCheck({ onPass }: { onPass: (token: string) => void }) {
  // Stub behavior: pass immediately on mount.
  useEffect(() => {
    onPass("stub-always-passes");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="notice" style={{ marginBottom: 16 }}>
      🤖 <strong>Bot check:</strong> not enforced yet — this placeholder always
      passes. (Future home of Cloudflare Turnstile or a drag-the-circle puzzle;
      see comments in <code>components/BotCheck.tsx</code>.)
    </div>
  );
}
