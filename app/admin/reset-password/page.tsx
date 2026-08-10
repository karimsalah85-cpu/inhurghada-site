"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { parseAuthSessionHash } from "@/lib/admin-invitations";
import { passwordPolicyError } from "@/lib/password-policy";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Checking your invitation…");
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function initializeSession() {
      const query = new URLSearchParams(window.location.search);
      const code = query.get("code");
      const hashSession = parseAuthSessionHash(window.location.hash);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const redirectError = hash.get("error_description");

      let error = null;
      if (code) {
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      } else if (hashSession) {
        ({ error } = await supabase.auth.setSession(hashSession));
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (error || sessionError || !session) {
        setSessionReady(false);
        setMessage(redirectError || error?.message || sessionError?.message || "This invitation is invalid or has expired. Ask the owner to resend it, then open only the newest email.");
        return;
      }

      setSessionReady(true);
      setMessage("Invitation verified. Choose your password.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    void initializeSession();
    return () => { active = false; };
  }, [supabase]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionReady || busy) return;
    const invalid = passwordPolicyError(password);
    if (invalid) return setMessage(invalid);

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/admin/login?password=updated");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-black">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-500">At least 12 characters with upper/lowercase, a number, and a symbol.</p>
        <input required disabled={!sessionReady || busy} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-5 w-full rounded-xl border p-3 disabled:bg-slate-100" />
        <button disabled={!sessionReady || busy} className="mt-3 w-full rounded-xl bg-slate-900 p-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? "Updating…" : "Update password"}
        </button>
        <p role="status" className="mt-4 text-sm font-semibold">{message}</p>
        {!sessionReady && message !== "Checking your invitation…" ? <Link href="/admin/login" className="mt-3 inline-block text-sm font-bold text-cyan-700 underline">Return to admin login</Link> : null}
      </form>
    </main>
  );
}
