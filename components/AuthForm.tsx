"use client";

/**
 * Sign in / create account — username + password only.
 *
 * No email is required or collected at signup (a fake internal address is
 * synthesized behind the scenes — see lib/auth.ts). That's why the big
 * warning below matters: with no recovery email, a lost password means a
 * lost account. Users can add a recovery email later in /settings.
 */
import { useState } from "react";

export default function AuthForm({ next }: { next: string | null }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode === "signin" ? "login" : "signup"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    // Full reload so the server-rendered header picks up the new session.
    window.location.href = next ?? `/u/${data.username}`;
  };

  return (
    <div className="panel" style={{ maxWidth: 440, margin: "0 auto" }}>
      <div className="chips" style={{ marginBottom: 16 }}>
        <button className={`chip ${mode === "signin" ? "chip-on" : ""}`} onClick={() => setMode("signin")}>
          Sign in
        </button>
        <button className={`chip ${mode === "signup" ? "chip-on" : ""}`} onClick={() => setMode("signup")}>
          Create account
        </button>
      </div>

      <h1>{mode === "signin" ? "Welcome back" : "Join in"}</h1>
      <p className="muted small">No email needed — just pick a name and a password.</p>

      {mode === "signup" && (
        <div className="notice notice-danger" style={{ marginBottom: 16 }}>
          ⚠️ <strong>No recovery email = lost password means lost account.</strong>
          <br />
          We don&apos;t ask for an email, so nobody can reset your password for
          you. Write it down! (You can add a recovery email later in Settings.)
        </div>
      )}

      <div className="field">
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="lowercase letters, numbers, _"
          autoComplete="username"
        />
      </div>
      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "at least 8 characters" : ""}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary btn-big" onClick={submit} disabled={busy}>
        {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
    </div>
  );
}
