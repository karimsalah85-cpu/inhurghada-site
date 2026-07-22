"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f8fafc", color: "#0f172a" }}><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}><section style={{ maxWidth: "520px", textAlign: "center", background: "white", borderRadius: "24px", padding: "32px", boxShadow: "0 10px 30px rgba(15,23,42,.12)" }}><title>Service unavailable | Daily Red Sea</title><h1>Service temporarily unavailable</h1><p>Please try again in a moment.</p><button type="button" onClick={reset}>Try again</button></section></main></body></html>;
}
