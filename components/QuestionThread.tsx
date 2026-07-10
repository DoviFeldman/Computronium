"use client";

/**
 * One question thread (/questions/<id>): the question with its pictures,
 * every reply below it (oldest first), and a reply form at the bottom.
 *
 * Delete buttons appear only where the API says the viewer may delete
 * (the item's owner, or the admin) — see app/api/questions/[id]/route.ts.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { QuestionImage } from "@/lib/types";
import ImageUploadField from "./ImageUploadField";

type ThreadItem = {
  id: string;
  body: string | null;
  images: QuestionImage[];
  created_at: string;
  ownerUsername: string | null;
  canDelete: boolean;
};

type Thread = {
  question: ThreadItem & { title: string };
  replies: ThreadItem[];
};

function Byline({ item }: { item: ThreadItem }) {
  return (
    <p className="muted small" style={{ margin: "0 0 8px" }}>
      {item.ownerUsername ? (
        <Link href={`/u/${item.ownerUsername}`}>@{item.ownerUsername}</Link>
      ) : (
        "anonymous"
      )}{" "}
      · {new Date(item.created_at).toLocaleDateString()}
    </p>
  );
}

function Pictures({ images }: { images: QuestionImage[] }) {
  return (
    <>
      {images.map((img) => (
        <a key={img.url} href={img.url} target="_blank" rel="noopener noreferrer">
          <img className="q-thread-img" src={img.url} alt={img.filename ?? "picture"} />
        </a>
      ))}
    </>
  );
}

export default function QuestionThread({ id }: { id: string }) {
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [notFound, setNotFound] = useState(false);

  // --- the reply form ---------------------------------------------------------
  const [body, setBody] = useState("");
  const [images, setImages] = useState<QuestionImage[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/questions/${id}`);
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    setThread(await res.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const reply = async () => {
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not post the reply.");
      setBody("");
      setImages([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPosting(false);
    }
  };

  const deleteQuestion = async () => {
    if (!confirm("Really delete this question and all its replies?")) return;
    const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/questions");
  };

  const deleteReply = async (replyId: string) => {
    if (!confirm("Really delete this reply?")) return;
    const res = await fetch(`/api/questions/${id}/replies/${replyId}`, { method: "DELETE" });
    if (res.ok) await load();
  };

  if (notFound) {
    return (
      <p className="center muted" style={{ padding: "48px 0" }}>
        That question is gone. <Link href="/questions">← back to all questions</Link>
      </p>
    );
  }
  if (!thread) return <p className="center muted">Loading…</p>;

  const { question, replies } = thread;

  return (
    <div>
      <p className="small" style={{ marginTop: 0 }}>
        <Link href="/questions">← all questions</Link>
      </p>
      <h1>{question.title}</h1>
      <Byline item={question} />

      {(question.body || question.images.length > 0) && (
        <div className="panel">
          {question.body && <p className="prose" style={{ margin: 0 }}>{question.body}</p>}
          <Pictures images={question.images} />
        </div>
      )}
      {question.canDelete && (
        <p>
          <button className="chip chip-muted" onClick={deleteQuestion}>🗑 Delete question</button>
        </p>
      )}

      {/* --- replies ------------------------------------------------------------ */}
      <h2>
        💬 {replies.length} {replies.length === 1 ? "reply" : "replies"}
      </h2>
      {replies.map((r) => (
        <div key={r.id} className="panel">
          <Byline item={r} />
          {r.body && <p className="prose" style={{ margin: 0 }}>{r.body}</p>}
          <Pictures images={r.images} />
          {r.canDelete && (
            <p style={{ margin: "8px 0 0" }}>
              <button className="chip chip-muted" onClick={() => deleteReply(r.id)}>🗑 Delete</button>
            </p>
          )}
        </div>
      ))}
      {replies.length === 0 && <p className="muted">No replies yet — know the answer?</p>}

      {/* --- reply form ----------------------------------------------------------- */}
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Your reply</h3>
        <div className="field">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share what you know…"
          />
        </div>
        <ImageUploadField images={images} onChange={setImages} onError={setError} />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" onClick={reply} disabled={posting}>
          {posting ? "Posting…" : "Reply"}
        </button>
      </div>
    </div>
  );
}
