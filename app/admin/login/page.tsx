"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function signIn(event: React.FormEvent) { event.preventDefault(); const { error } = await createClient().auth.signInWithPassword({ email, password }); if (error) return setError(error.message); router.push("/admin"); router.refresh(); }
  return <main className="grid min-h-screen place-items-center bg-slate-950 p-6"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl bg-white p-8"><h1 className="text-3xl font-black">Admin sign in</h1><p className="mt-2 text-slate-600">Daily Red Sea booking management</p><input className="mt-6 w-full rounded-xl border p-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required /><input className="mt-3 w-full rounded-xl border p-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button className="mt-5 w-full rounded-xl bg-cyan-600 p-3 font-bold text-white">Sign in</button></form></main>;
}
