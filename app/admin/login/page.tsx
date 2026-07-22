"use client";
import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error || "Sign-in failed. Please try again.");
        return;
      }

      window.location.assign("/admin");
    } catch {
      setError("Could not connect to the sign-in service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6">
      <form onSubmit={signIn} className="w-full max-w-md rounded-3xl bg-white p-8">
        <h1 className="text-3xl font-black">Admin sign in</h1>
        <p className="mt-2 text-slate-600">Daily Red Sea booking management</p>
        <input className="mt-6 w-full rounded-xl border p-3" type="email" autoComplete="username" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input className="mt-3 w-full rounded-xl border p-3" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
        <button className="mt-5 w-full rounded-xl bg-cyan-600 p-3 font-bold text-white disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
