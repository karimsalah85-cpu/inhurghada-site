import { NextResponse } from "next/server";
import { deploymentEnvironmentIssues } from "@/lib/environment";

export const dynamic = "force-dynamic";

const healthTimeoutMs = 5_000;

export async function GET() {
  const startedAt = Date.now();
  const configurationIssues = deploymentEnvironmentIssues(process.env);

  if (configurationIssues.length) {
    console.error(JSON.stringify({
      level: "error",
      message: "Health check failed",
      component: "configuration",
      issues: configurationIssues.map((issue) => issue.split(" ")[0]),
      durationMs: Date.now() - startedAt,
    }));
    return NextResponse.json(
      { status: "unhealthy", checks: { configuration: "failed", supabase: "not_checked" } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), healthTimeoutMs);

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Supabase health returned HTTP ${response.status}`);

    console.log(JSON.stringify({
      level: "info",
      message: "Health check passed",
      durationMs: Date.now() - startedAt,
    }));
    return NextResponse.json(
      { status: "healthy", checks: { configuration: "passed", supabase: "passed" } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "Health check failed",
      component: "supabase",
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    }));
    return NextResponse.json(
      { status: "unhealthy", checks: { configuration: "passed", supabase: "failed" } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  } finally {
    clearTimeout(timeout);
  }
}
