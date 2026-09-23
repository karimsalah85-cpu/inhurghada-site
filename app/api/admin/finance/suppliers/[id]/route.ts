import { NextRequest } from "next/server";
import { hasLivePermission } from "@/lib/admin-permission";
import { financeAuthorization, financeDbError, financeJson, isUuid } from "@/lib/finance/api";
import { supplierDetail } from "@/lib/finance/supplier-data";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isUuid(id)) return financeJson({ error: "Invalid supplier." }, 400);
  const { supabase, user, allowed } = await financeAuthorization("view_finance");
  if (!user) return financeJson({ error: "Sign in required." }, 401);
  if (!allowed) return financeJson({ error: "Finance access required." }, 403);
  try {
    const detail = await supplierDetail(supabase, id);
    if (!detail) return financeJson({ error: "Supplier not found." }, 404);
    const canManage = await hasLivePermission(supabase, user, "manage_finance");
    return financeJson({ configured: true, canManage, ...detail });
  } catch (error) {
    return financeDbError(error);
  }
}
