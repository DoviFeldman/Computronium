/**
 * Site header — logo, nav links, and the signed-in user's name.
 *
 * Note: there is deliberately NO "new post" button here. Posting starts
 * from the personal page only (that's a product decision from the spec).
 */
import Link from "next/link";
import { site } from "@/config/site";
import { getCurrentProfile, isAdmin } from "@/lib/auth";

export default async function Header() {
  const profile = await getCurrentProfile();

  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="logo">
          🤖 {site.name}
        </Link>
        <nav className="nav">
          <Link href="/">Projects</Link>
          <Link href="/learn">Learn</Link>
          <Link href="/advanced">Advanced</Link>
          <Link href="/liberated">{site.liberated.title}</Link>
          {profile ? (
            <>
              <Link href={`/u/${profile.username}`}>@{profile.username}</Link>
              {isAdmin(profile) && <Link href="/admin">Admin</Link>}
            </>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
