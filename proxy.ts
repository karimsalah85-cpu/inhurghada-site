import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey && !pathname.startsWith("/api/") && !pathname.startsWith("/admin")) {
    try {
      const query = new URLSearchParams({ select: "destination_path,permanent", active: "eq.true", source_path: `eq.${pathname}`, limit: "1" });
      const response = await fetch(`${url}/rest/v1/redirect_rules?${query}`, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" });
      if (response.ok) {
        const [rule] = await response.json() as Array<{ destination_path: string; permanent: boolean }>;
        if (rule?.destination_path) return NextResponse.redirect(new URL(rule.destination_path, request.url), rule.permanent ? 308 : 307);
      }
    } catch (error) {
      console.error("Redirect lookup failed", error);
    }
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
