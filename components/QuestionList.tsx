"use client";

/**
 * The /questions page body: an "ask a question" form on top, then every
 * question newest-first. Clicking a question opens its thread
 * (/questions/<id>) where people reply.
 *
 * Deliberately simple — no votes, no ranking, no infinite scroll. Just
 * questions and answers.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QuestionImage } from "@/lib/types";
import ImageUploadField from "./ImageUploadField";

type QuestionSummary = {
  id: string;
  title: string;
  body: string | null;
  imageCount: number;
  created_at: string;
  ownerUsername: string | null;
  replyCount: number;
};

export default function QuestionList() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // --- the ask form ---------------------------------------------------------
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<QuestionImage[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((d) => setQuestions(Array.isArray(d.questions) ? d.questions : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ask = async () => {
    if (!title.trim()) {
      setError("Your question needs a title.");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not post the question.");
      router.push(`/questions/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPosting(false);
    }
  };

  return (
    <div>
      {/* --- ask a question --------------------------------------------------- */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>💬 Ask a question</h3>
        <div className="field">
          <label>Your question</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Why does my servo jitter when the motor runs?"
          />
        </div>
        <div className="field">
          <label>Details (optional)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What have you tried? What parts are you using?"
          />
        </div>
        <ImageUploadField images={images} onChange={setImages} onError={setError} />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" onClick={ask} disabled={posting}>
          {posting ? "Posting…" : "Ask it"}
        </button>
      </div>

      {/* --- the list ---------------------------------------------------------- */}
      {questions.map((q) => (
        <Link key={q.id} href={`/questions/${q.id}`} className="q-list-item">
          <p className="q-title">{q.title}</p>
          {q.body && (
            <p className="muted small" style={{ margin: "0 0 6px" }}>
              {q.body.length > 160 ? q.body.slice(0, 160) + "…" : q.body}
            </p>
          )}
          <p className="muted small" style={{ margin: 0 }}>
            {q.ownerUsername ? `@${q.ownerUsername}` : "anonymous"} ·{" "}
            {new Date(q.created_at).toLocaleDateString()} · 💬{" "}
            {q.replyCount} {q.replyCount === 1 ? "reply" : "replies"}
            {q.imageCount > 0 && <> · 📷 {q.imageCount}</>}
          </p>
        </Link>
      ))}

      {questions.length === 0 && !loading && (
        <p className="center muted" style={{ padding: "48px 0" }}>
          No questions yet — ask the first one!
        </p>
      )}
      {loading && <p className="center muted">Loading…</p>}
    </div>
  );
}
