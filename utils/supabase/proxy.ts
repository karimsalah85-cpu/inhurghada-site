import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const firstPathSegment = request.nextUrl.pathname.split("/").filter(Boolean)[0];
  requestHeaders.set("x-daily-red-sea-locale", ["ar", "de", "ru", "pl", "zh"].includes(firstPathSegment) ? firstPathSegment : "en");
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const needsAdminSession = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/") || request.nextUrl.pathname.startsWith("/api/admin/");
  if (!needsAdminSession || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return response;
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}
