/**
 * /api/posts
 *
 * GET  — the feed: search + filters + hot-ranked, paged for infinite scroll.
 *        Query params (all optional):
 *          q          text search in name/description
 *          board      hardware id (from the featured-boards row)
 *          difficulty green | yellow | red
 *          cost       a bracket id from config/site.ts (e.g. "10to25")
 *          parts      comma-separated hardware ids (must have ALL of them)
 *          video      "1" = only posts with a video link
 *          scope      "main" (default, everything) | "advanced" (advanced only)
 *          offset     for paging
 *
 * POST — create a post (from the Post form).
 *        Signed in  → owned post on their personal page.
 *        Signed out → anonymous post; returns a one-time edit password.
 */
import { NextResponse } from "next/server";
import { site } from "@/config/site";
import { getCurrentProfile } from "@/lib/auth";
import { generateEditPassword, hashEditPassword } from "@/lib/password";
import {
  inputToPostColumns,
  POST_SELECT,
  saveRelations,
  saveVersionSnapshot,
  toFeedPost,
} from "@/lib/posts";
import { hotScore } from "@/lib/ranking";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PostFull, PostInput } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const board = url.searchParams.get("board");
  const difficulty = url.searchParams.get("difficulty");
  const cost = url.searchParams.get("cost");
  const parts = (url.searchParams.get("parts") ?? "").split(",").filter(Boolean);
  const videoOnly = url.searchParams.get("video") === "1";
  const scope = url.searchParams.get("scope") ?? "main";
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;
  const limit = site.feedPageSize;

  const admin = createSupabaseAdminClient();

  // A hobby site has hundreds of posts, not millions — so we grab the most
  // recent 500 with their relations and do scoring/filtering in plain JS.
  // Simple to read, easy to change, plenty fast at this scale. If the site
  // ever explodes in popularity, move the filters into the SQL query.
  let query = admin
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);
  if (scope === "advanced") query = query.eq("advanced", true);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = (data ?? []) as unknown as PostFull[];

  // --- filters ------------------------------------------------------------
  if (q) {
    rows = rows.filter((p) =>
      (p.name + " " + (p.description ?? "")).toLowerCase().includes(q)
    );
  }
  if (difficulty) rows = rows.filter((p) => p.difficulty === difficulty);
  if (videoOnly) rows = rows.filter((p) => Boolean(p.video_url));
  if (board) {
    rows = rows.filter((p) =>
      p.post_hardware?.some((h) => h.hardware_id === board)
    );
  }
  for (const part of parts) {
    rows = rows.filter((p) =>
      p.post_hardware?.some((h) => h.hardware_id === part)
    );
  }
  if (cost) {
    const bracket = site.costBrackets.find((b) => b.id === cost);
    if (bracket) {
      rows = rows.filter((p) => {
        const price = p.price_estimate;
        if (price == null) return false;
        return price >= bracket.min && (bracket.max === null || price < bracket.max);
      });
    }
  }

  // --- hot ranking + paging -------------------------------------------------
  rows.sort((a, b) => hotScore(b) - hotScore(a));
  const page = rows.slice(offset, offset + limit);

  return NextResponse.json({
    posts: page.map(toFeedPost),
    hasMore: offset + limit < rows.length,
  });
}

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as PostInput | null;
  if (!input) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  const admin = createSupabaseAdminClient();

  // Anonymous posters get a one-time edit password (shown ONCE in the UI).
  let editPassword: string | null = null;
  let passwordHash: string | null = null;
  if (!profile) {
    editPassword = generateEditPassword();
    passwordHash = hashEditPassword(editPassword);
  }

  const { data: created, error } = await admin
    .from("posts")
    .insert({
      ...inputToPostColumns(input),
      owner_id: profile?.id ?? null,
      anon_edit_password: passwordHash,
    })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create post." },
      { status: 500 }
    );
  }

  await saveRelations(created.id, input);
  await saveVersionSnapshot(created.id, 1); // version 1 = the original

  return NextResponse.json({
    id: created.id,
    editPassword, // null for signed-in posts
    ownerUsername: profile?.username ?? null,
  });
}
