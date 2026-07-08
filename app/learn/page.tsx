/**
 * EXPLAINER PAGE (/learn) — honest hardware knowledge, kid-readable.
 *
 * This page renders ENTIRELY from config/explainers.ts. To add, edit or
 * reorder articles, edit that file — this page never needs to change.
 * Each entry renders as an expandable card with the five fixed sections.
 */
import { explainers } from "@/config/explainers";

export default function LearnPage() {
  return (
    <div>
      <h1>🧠 Learn</h1>
      <p className="tagline">
        Why hobby electronics are the way they are — the honest version.
        No marketing, no hand-waving.
      </p>

      {explainers.map((e, i) => (
        // First article starts open so the page doesn't look empty.
        <details key={e.title} className="explainer" open={i === 0}>
          <summary>{e.title}</summary>
          <div className="body">
            <div className="section-label">Why it is this way</div>
            <p>{e.whyItIsThisWay}</p>

            <div className="section-label">What alternatives exist</div>
            <p>{e.alternatives}</p>

            <div className="section-label">Where the alternatives fall short</div>
            <p>{e.alternativeShortfalls}</p>

            <div className="section-label">Why the standard option is better than you think</div>
            <p>{e.baseAdvantages}</p>

            {e.bottomLine && <div className="bottom-line">💡 {e.bottomLine}</div>}
          </div>
        </details>
      ))}
    </div>
  );
}
