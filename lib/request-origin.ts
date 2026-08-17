import type { NextRequest } from "next/server";

export function hasValidRequestOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}
