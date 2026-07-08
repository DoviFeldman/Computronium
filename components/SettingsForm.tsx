"use client";

/**
 * The settings form: bio + optional recovery email + sign out.
 *
 * About the recovery email: accounts are username-only by design, so this
 * field is the user's safety net. For now it's informational — password
 * resets are handled by the site owner by hand (see README "Password
 * recovery") — but collecting it now means automated resets can be added
 * later without asking everyone again.
 */
import { useState } from "react";

export default function SettingsForm({
  username,
  initialBio,
  initialRecoveryEmail,
}: {
  username: string;
  initialBio: string;
  initialRecoveryEmail: string;
}) {
  const [bio, setBio] = useState(initialBio);
  const [recoveryEmail, setRecoveryEmail] = useState(initialRecoveryEmail);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, recoveryEmail }),
    });
    const data = await res.json();
    setBusy(false);
    setMessage(res.ok ? "Saved ✓" : data.error ?? "Save failed.");
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="panel" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>⚙️ Settings</h1>
      <p className="muted">Signed in as <strong>@{username}</strong></p>

      <div className="field">
        <label>Bio (shown on your personal page)</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="I build robots out of…" />
      </div>

      <div className="field">
        <label>Recovery email (optional but recommended)</label>
        <p className="hint">
          Your account has no email attached. Adding one here is your only
          safety net if you ever forget your password.
        </p>
        <input
          type="email"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      {message && <p className={message.startsWith("Saved") ? "muted" : "error-text"}>{message}</p>}

      <div className="chips" style={{ gap: 10 }}>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "…" : "Save"}
        </button>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    </div>
  );
}
