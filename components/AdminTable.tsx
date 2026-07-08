"use client";

/**
 * The interactive table on /admin: per-post delete, pin toggle, and
 * Alternatives-category assignment (dropdown from config/categories.ts,
 * plus an optional 1–3 "top pick" rank). Calls /api/admin/posts/[id].
 */
import { useState } from "react";
import Link from "next/link";
import { alternativesCategories } from "@/config/categories";

type AdminPost = {
  id: string;
  name: string;
  created_at: string;
  difficulty: string | null;
  advanced: boolean;
  pinned: boolean;
  alternatives_category: string | null;
  alternatives_rank: number | null;
  upvotes: number;
  views: number;
  ownerUsername: string | null;
};

export default function AdminTable({ posts: initial }: { posts: AdminPost[] }) {
  const [posts, setPosts] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) setError((await res.json()).error ?? "Update failed.");
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" forever?`)) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((p) => p.filter((x) => x.id !== id));
    else setError((await res.json()).error ?? "Delete failed.");
  };

  return (
    <div className="panel" style={{ overflowX: "auto" }}>
      {error && <p className="error-text">{error}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Post</th>
            <th>By</th>
            <th>📌 Pin</th>
            <th>Alternatives category</th>
            <th>Rank</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/p/${p.id}`}>{p.name}</Link>
                <div className="muted small">
                  ❤️{p.upvotes} · 👁{p.views} · {new Date(p.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="small">{p.ownerUsername ? `@${p.ownerUsername}` : "anon"}</td>
              <td>
                <input
                  type="checkbox"
                  defaultChecked={p.pinned}
                  onChange={(e) => patch(p.id, { pinned: e.target.checked })}
                />
              </td>
              <td>
                <select
                  defaultValue={p.alternatives_category ?? ""}
                  onChange={(e) => patch(p.id, { alternativesCategory: e.target.value || null })}
                >
                  <option value="">— none —</option>
                  {alternativesCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min={1}
                  max={3}
                  style={{ width: 56 }}
                  defaultValue={p.alternatives_rank ?? ""}
                  placeholder="–"
                  title="1–3 = top pick on the category page"
                  onChange={(e) =>
                    patch(p.id, {
                      alternativesRank: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </td>
              <td>
                <button className="btn btn-danger" onClick={() => remove(p.id, p.name)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && <p className="muted center">No posts yet.</p>}
    </div>
  );
}
