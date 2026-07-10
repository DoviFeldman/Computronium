"use client";

/**
 * The endless-scroll project feed with search + filters.
 * Used by the main page (scope="main"), /advanced (scope="advanced"),
 * and /attempted (scope="attempted").
 *
 * How it works:
 *  - Filters/search live in React state; changing any of them refetches
 *    page 0 from GET /api/posts (which applies the hot ranking).
 *  - An IntersectionObserver watches an invisible div at the bottom; when
 *    it scrolls into view we fetch the next page. No "load more" button.
 *  - The featured-board quick filters come from config/featuredBoards.ts;
 *    cost brackets from config/site.ts; the parts multi-select from
 *    config/hardware.ts.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { featuredBoards } from "@/config/featuredBoards";
import { hardware, hardwareCategories } from "@/config/hardware";
import { site } from "@/config/site";
import type { FeedPost } from "@/lib/types";
import PostCard from "./PostCard";

type Filters = {
  q: string;
  board: string | null;
  difficulty: string | null;
  cost: string | null;
  parts: string[];
  videoOnly: boolean;
};

const EMPTY_FILTERS: Filters = {
  q: "",
  board: null,
  difficulty: null,
  cost: null,
  parts: [],
  videoOnly: false,
};

export default function Feed({ scope }: { scope: "main" | "advanced" | "attempted" }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showParts, setShowParts] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Increments on every filter change so stale fetches can be ignored.
  const fetchIdRef = useRef(0);

  const buildQuery = useCallback(
    (offset: number) => {
      const p = new URLSearchParams();
      p.set("scope", scope);
      p.set("offset", String(offset));
      if (filters.q) p.set("q", filters.q);
      if (filters.board) p.set("board", filters.board);
      if (filters.difficulty) p.set("difficulty", filters.difficulty);
      if (filters.cost) p.set("cost", filters.cost);
      if (filters.parts.length) p.set("parts", filters.parts.join(","));
      if (filters.videoOnly) p.set("video", "1");
      return p.toString();
    },
    [filters, scope]
  );

  const loadPage = useCallback(
    async (offset: number, replace: boolean) => {
      const fetchId = ++fetchIdRef.current;
      setLoading(true);
      try {
        const res = await fetch(`/api/posts?${buildQuery(offset)}`);
        const data = await res.json();
        if (fetchId !== fetchIdRef.current) return; // a newer fetch superseded us
        // If the API errored (e.g. Supabase not configured yet), show nothing
        // rather than crashing the page.
        const page: FeedPost[] = Array.isArray(data.posts) ? data.posts : [];
        setPosts((prev) => (replace ? page : [...prev, ...page]));
        setHasMore(Boolean(data.hasMore));
      } finally {
        if (fetchId === fetchIdRef.current) setLoading(false);
      }
    },
    [buildQuery]
  );

  // Refetch from the top whenever filters change (debounced for typing).
  useEffect(() => {
    const t = setTimeout(() => loadPage(0, true), 250);
    return () => clearTimeout(t);
  }, [loadPage]);

  // Infinite scroll: load the next page when the sentinel becomes visible.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPage(posts.length, false);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, posts.length, loadPage]);

  const toggle = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value } as Filters));

  return (
    <div>
      {/* Featured board quick-filter row (config/featuredBoards.ts) */}
      <div className="board-row">
        {featuredBoards.map((b) => (
          <button
            key={b.hardwareId}
            className={`board-btn ${filters.board === b.hardwareId ? "on" : ""}`}
            onClick={() => toggle("board", b.hardwareId)}
          >
            <span>{b.emoji}</span> {b.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="filters">
        <input
          className="search-input"
          type="text"
          placeholder="Search projects…"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <div className="row">
          <span className="row-label">Difficulty</span>
          {(["green", "yellow", "red"] as const).map((d) => (
            <button
              key={d}
              className={`chip ${filters.difficulty === d ? "chip-on" : ""}`}
              onClick={() => toggle("difficulty", d)}
            >
              {d === "green" ? "🟢 Plug & play" : d === "yellow" ? "🟡 Some assembly" : "🔴 Advanced"}
            </button>
          ))}
        </div>
        <div className="row">
          <span className="row-label">Cost</span>
          {site.costBrackets.map((b) => (
            <button
              key={b.id}
              className={`chip ${filters.cost === b.id ? "chip-on" : ""}`}
              onClick={() => toggle("cost", b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="row">
          <span className="row-label">More</span>
          <button
            className={`chip ${filters.videoOnly ? "chip-on" : ""}`}
            onClick={() => setFilters((f) => ({ ...f, videoOnly: !f.videoOnly }))}
          >
            🎬 Has video
          </button>
          <button className="chip chip-muted" onClick={() => setShowParts((s) => !s)}>
            🔩 Parts filter {filters.parts.length ? `(${filters.parts.length})` : ""} {showParts ? "▴" : "▾"}
          </button>
          {(filters.board || filters.difficulty || filters.cost || filters.parts.length > 0 || filters.videoOnly || filters.q) && (
            <button className="chip chip-muted" onClick={() => setFilters(EMPTY_FILTERS)}>
              ✕ Clear all
            </button>
          )}
        </div>

        {/* Multi-select parts filter, grouped by category */}
        {showParts && (
          <div>
            {hardwareCategories.map((cat) => {
              const items = hardware.filter((h) => h.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat} className="hw-category">
                  <div className="hw-cat-name">{cat}</div>
                  <div className="chips">
                    {items.map((h) => {
                      const on = filters.parts.includes(h.id);
                      return (
                        <button
                          key={h.id}
                          className={`chip ${on ? "chip-on" : ""}`}
                          onClick={() =>
                            setFilters((f) => ({
                              ...f,
                              parts: on ? f.parts.filter((p) => p !== h.id) : [...f.parts, h.id],
                            }))
                          }
                        >
                          {h.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* The grid: 2 per row (1 on mobile) */}
      <div className="feed-grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <p className="center muted" style={{ padding: "48px 0" }}>
          {scope === "attempted"
            ? "No attempted builds yet. Tried something that didn't quite work? Post it — tick “attempted build” on the form."
            : `No projects here yet. ${scope === "main" ? "Be the first — make a personal page and post one!" : ""}`}
        </p>
      )}
      {loading && <p className="center muted">Loading…</p>}

      {/* Invisible scroll sentinel that triggers the next page */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
