/**
 * Shared TypeScript types used across the whole app.
 *
 * These mirror the database tables in supabase/schema.sql. If you add a
 * column there, add it here too so the editor can help you everywhere else.
 */

/** The three difficulty levels. 'red' also routes the post to /advanced. */
export type Difficulty = "green" | "yellow" | "red";

/** A row in the `profiles` table (one per registered user). */
export type Profile = {
  id: string;
  username: string;
  bio: string | null;
  recovery_email: string | null;
  is_admin: boolean;
  created_at: string;
};

/** A row in `post_hardware` — either a config part (hardware_id) OR a custom one. */
export type PostHardwareRow = {
  id: string;
  post_id: string;
  hardware_id: string | null;
  custom_name: string | null;
  custom_link: string | null;
  custom_price: number | null;
};

/** A row in `post_files` — an uploaded file or an external link. */
export type PostFileRow = {
  id: string;
  post_id: string;
  kind: "image" | "model" | "code";
  url: string;
  storage_path: string | null;
  filename: string | null;
  is_external: boolean;
};

/** A row in the `posts` table. `anon_edit_password` is NEVER sent to browsers. */
export type PostRow = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  answers: Record<string, string> | null;
  instructions: string | null;
  code_text: string | null;
  video_url: string | null;
  difficulty: Difficulty | null;
  advanced: boolean;
  attempted: boolean;
  price_estimate: number | null;
  fork_of: string | null;
  fork_count: number;
  alternatives_category: string | null;
  alternatives_rank: number | null;
  pinned: boolean;
  upvotes: number;
  views: number;
  current_version: number;
  created_at: string;
};

/** A post with its related rows joined in (what most pages work with). */
export type PostFull = PostRow & {
  post_hardware: PostHardwareRow[];
  post_files: PostFileRow[];
  owner: { username: string } | null;
};

/**
 * What the browser sends when creating/editing a post (the Post form).
 * Everything is optional by design — "Nothing is required".
 */
export type PostInput = {
  name: string;
  description: string;
  answers: Record<string, string>;
  instructions: string;
  codeText: string;
  videoUrl: string;
  difficulty: Difficulty | null;
  advanced: boolean;
  attempted: boolean;
  priceEstimate: number | null;
  /** Ids from config/hardware.ts that the poster checked. */
  hardwareIds: string[];
  /** Add-your-own hardware rows. */
  customHardware: { name: string; link: string; price: number | null }[];
  /** Uploaded files and external links (models, images, code). */
  files: {
    kind: "image" | "model" | "code";
    url: string;
    storagePath: string | null;
    filename: string | null;
    isExternal: boolean;
  }[];
};

/** One picture attached to a question or reply (path = storage path, for cleanup). */
export type QuestionImage = {
  url: string;
  path: string | null;
  filename: string | null;
};

/** A row in the `questions` table (the simple Q&A page). */
export type QuestionRow = {
  id: string;
  owner_id: string | null; // null = asked anonymously
  title: string;
  body: string | null;
  images: QuestionImage[];
  created_at: string;
};

/** A row in `question_replies`. */
export type QuestionReplyRow = {
  id: string;
  question_id: string;
  owner_id: string | null; // null = replied anonymously
  body: string | null;
  images: QuestionImage[];
  created_at: string;
};

/** Slimmed-down post shape the feed API returns for each card. */
export type FeedPost = {
  id: string;
  name: string;
  description: string | null;
  difficulty: Difficulty | null;
  advanced: boolean;
  attempted: boolean;
  price_estimate: number | null;
  video_url: string | null;
  hardwareIds: string[];
  customNames: string[];
  imageUrl: string | null;
  upvotes: number;
  views: number;
  created_at: string;
  pinned: boolean;
  fork_count: number;
  ownerUsername: string | null;
};
