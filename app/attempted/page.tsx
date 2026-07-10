/**
 * ATTEMPTED BUILDS PAGE — the exact same feed as the main page, but for
 * builds that didn't (fully) work out: works-in-progress, near-misses,
 * abandoned experiments. Same cards, same search + filters, same post form —
 * a post lands here (instead of the main feed) when the poster ticks
 * "attempted build" on the form.
 */
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default function AttemptedPage() {
  return (
    <div>
      <h1>🧪 Attempted Builds</h1>
      <p className="tagline">
        Builds that didn&apos;t (fully) work — share what you tried so others can
        learn from it, or pick it up and finish the job.
      </p>
      <Feed scope="attempted" />
    </div>
  );
}
