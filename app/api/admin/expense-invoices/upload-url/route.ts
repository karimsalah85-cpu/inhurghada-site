import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getAdminAuthorization } from "@/lib/admin-permission";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { createAdminClient } from "@/utils/supabase/admin";

const BUCKET = "expense-invoices";
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return json({ error: "Invalid origin." }, 403);
  const { allowed } = await getAdminAuthorization("edit_expenses");
  if (!allowed) return json({ error: "Expense-editing permission required." }, 403);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const fileName = String(body?.file_name || "").trim();
  const mimeType = String(body?.mime_type || "").trim().toLowerCase();
  const fileSize = Number(body?.file_size);

  if (!ALLOWED.has(mimeType)) return json({ error: "Upload a PDF, PNG, JPEG, or WebP invoice." }, 400);
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_BYTES) {
    return json({ error: "Invoice files must be under 15 MB." }, 400);
  }

  const admin = createAdminClient();
  if (!admin) return json({ error: "Storage is not configured on this server." }, 503);

  const safeStem =
    fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "invoice";
  const key = `pending/${randomUUID()}-${safeStem}.${ALLOWED.get(mimeType)}`;

  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) {
    console.error("Expense invoice signed upload URL failed", { message: error?.message });
    return json({ error: "Could not start the upload. Please try again." }, 500);
  }

  return json({ bucket: BUCKET, path: data.path, token: data.token });
}
