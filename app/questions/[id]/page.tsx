/**
 * QUESTION THREAD PAGE (/questions/<id>) — one question and its replies.
 * Thin server wrapper; the interactive part is components/QuestionThread.tsx.
 */
import QuestionThread from "@/components/QuestionThread";

export const dynamic = "force-dynamic";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuestionThread id={id} />;
}
