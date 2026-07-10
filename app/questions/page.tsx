/**
 * QUESTIONS PAGE (/questions) — a dead-simple Q&A board.
 *
 * Ask a question (plain text + optional pictures), anyone can reply (also
 * text + pictures). No accounts required, no votes, no ranking — newest
 * questions first. Everything lives in components/QuestionList.tsx and the
 * thread view in components/QuestionThread.tsx.
 */
import QuestionList from "@/components/QuestionList";

export const dynamic = "force-dynamic";

export default function QuestionsPage() {
  return (
    <div>
      <h1>❓ Questions</h1>
      <p className="tagline">
        Stuck on something? Ask — text and pictures welcome, no account needed.
      </p>
      <QuestionList />
    </div>
  );
}
