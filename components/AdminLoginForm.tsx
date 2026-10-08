"use client";

import { useState, type FormEvent } from "react";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      window.location.assign("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  return <form className="login-form" onSubmit={signIn}>
    <label>Email<input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="admin@example.com" /></label>
    <label>Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Your admin password" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary button-full" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in to dashboard"}<span>→</span></button>
    <p className="login-note">Admin credentials are set in the project environment settings.</p>
  </form>;
}
