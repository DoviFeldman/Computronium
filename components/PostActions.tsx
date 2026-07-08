"use client";

/**
 * The interactive strip on a post's public page:
 *   - counts a view once per browser session (feeds the hot ranking)
 *   - ❤️ upvote button (one per browser, tracked in localStorage)
 *   - ⑂ Fork button (signed-in users get their own copy)
 *   - ✏️ Edit link (the edit form itself checks permission / password)
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PostActions({
  postId,
  upvotes,
  views,
  forkCount,
  isSignedIn,
}: {
  postId: string;
  upvotes: number;
  views: number;
  forkCount: number;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [votes, setVotes] = useState(upvotes);
  const [voted, setVoted] = useState(false);
  const [forking, setForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  // Count one view per browser session.
  useEffect(() => {
    const key = `viewed-${postId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});
    }
    setVoted(Boolean(localStorage.getItem(`voted-${postId}`)));
  }, [postId]);

  const vote = async () => {
    if (voted) return;
    setVoted(true);
    setVotes((v) => v + 1);
    localStorage.setItem(`voted-${postId}`, "1");
    await fetch(`/api/posts/${postId}/vote`, { method: "POST" }).catch(() => {});
  };

  const fork = async () => {
    if (!isSignedIn) {
      setForkError("Sign in first — your fork needs a personal page to live on.");
      return;
    }
    setForking(true);
    const res = await fetch(`/api/posts/${postId}/fork`, { method: "POST" });
    const data = await res.json();
    setForking(false);
    if (!res.ok) {
      setForkError(data.error ?? "Fork failed.");
      return;
    }
    // Jump straight into editing the fresh fork.
    router.push(`/post?edit=${data.id}&forked=1`);
  };

  return (
    <div>
      <div className="chips" style={{ gap: 10, alignItems: "center" }}>
        <button className="btn" onClick={vote} disabled={voted}>
          {voted ? "❤️" : "🤍"} {votes}
        </button>
        <span className="muted small">👁 {views} views</span>
        <button className="btn" onClick={fork} disabled={forking}>
          ⑂ {forking ? "Forking…" : "Fork"} {forkCount > 0 && `(${forkCount})`}
        </button>
        <Link className="btn" href={`/post?edit=${postId}`}>
          ✏️ Edit
        </Link>
        <Link className="btn" href={`/p/${postId}/history`}>
          🕘 History
        </Link>
      </div>
      {forkError && (
        <p className="error-text small" style={{ marginTop: 8 }}>
          {forkError} {!isSignedIn && <Link href="/login">Sign in →</Link>}
        </p>
      )}
    </div>
  );
}
