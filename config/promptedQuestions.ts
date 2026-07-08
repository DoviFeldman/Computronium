/**
 * ============================================================================
 * PROMPTED QUESTIONS — the guided questions on the Post page
 * ============================================================================
 *
 * WHAT THIS FILE CONTROLS
 *   The short-answer questions shown on the Post form (right after name +
 *   description). Answers are optional and are displayed on the public post
 *   page as little Q&A sections.
 *
 * WHO READS IT
 *   - app/post/page.tsx (renders one textarea per question)
 *   - app/p/[id]/page.tsx (renders the answers)
 *
 * HOW TO EDIT
 *   - Reword a `question` freely — old answers keep working because they're
 *     stored by `id`, not by the question text.
 *   - Add a question: new object with a NEW unique `id`.
 *   - Remove a question: delete its line. Old posts that answered it will
 *     simply stop showing that answer (the data stays in the database).
 * ============================================================================
 */

export type PromptedQuestion = {
  /** Permanent key the answer is stored under. Don't reuse old ids. */
  id: string;
  /** The question shown to the poster AND as the heading on the post page. */
  question: string;
  /** Optional placeholder text in the input box. */
  placeholder?: string;
};

export const promptedQuestions: PromptedQuestion[] = [
  {
    id: "problem",
    question: "What problem does this solve?",
    placeholder: "e.g. My plants kept dying, so this waters them when the soil gets dry…",
  },
  {
    id: "quirks",
    question: "What quirks or gotchas should builders know about?",
    placeholder: "e.g. The cheap clone boards need the CH340 driver installed first…",
  },
  {
    id: "hardest",
    question: "What was the hardest part of building this, and how did you get past it?",
    placeholder: "e.g. The servo jittered until I gave it its own 5V supply…",
  },
];
