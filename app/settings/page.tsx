/**
 * SETTINGS PAGE (/settings) — bio + optional recovery email + sign out.
 * Signed-in users only; others are pointed at /login.
 */
import Link from "next/link";
import SettingsForm from "@/components/SettingsForm";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="panel center">
        <p>You need to be signed in for settings.</p>
        <Link className="btn btn-primary" href="/login?next=/settings">Sign in</Link>
      </div>
    );
  }

  return (
    <SettingsForm
      username={profile.username}
      initialBio={profile.bio ?? ""}
      initialRecoveryEmail={profile.recovery_email ?? ""}
    />
  );
}
