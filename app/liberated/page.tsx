/**
 * ALTERNATIVES PAGE (/liberated) — open-source, self-hosted replacements
 * for closed-source subscription products.
 *
 * The display title ("Liberated Hardware" — rename in config/site.ts) and
 * the category tiles (config/categories.ts) are both owner-editable.
 * Posts only appear inside a category when the admin assigns them on /admin.
 */
import Link from "next/link";
import { alternativesCategories } from "@/config/categories";
import { site } from "@/config/site";

export default function LiberatedPage() {
  return (
    <div>
      <h1>🔓 {site.liberated.title}</h1>
      <p className="tagline">{site.liberated.tagline}</p>

      <div className="tile-grid">
        {alternativesCategories.map((cat) => (
          <Link key={cat.id} href={`/liberated/${cat.id}`} className="tile">
            <div className="emoji">{cat.emoji}</div>
            <h3>{cat.name}</h3>
            <p>{cat.blurb}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
