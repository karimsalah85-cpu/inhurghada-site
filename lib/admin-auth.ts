type AuthUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
};

export const adminRoles = ["owner", "manager", "sales", "finance", "operations", "content_editor", "operator"] as const;
export type AdminRole = typeof adminRoles[number];

export const configuredAdminEmail = () => (process.env.ADMIN_EMAIL || "info@dailyredsea.com").trim().toLowerCase();

export function isAuthorizedAdmin(user: AuthUser | null | undefined) {
  const role = user?.app_metadata?.admin_role;
  return Boolean(user?.email && (user.email.trim().toLowerCase() === configuredAdminEmail() || adminRoles.includes(role as AdminRole)));
}

export function isAdminOwner(user: AuthUser | null | undefined) { return Boolean(user?.email && (user.email.trim().toLowerCase() === configuredAdminEmail() || user.app_metadata?.admin_role === "owner")); }

export type AdminPermission = "bookings" | "content" | "operations" | "finance" | "suppliers" | "reports" | "settings" | "staff";
export const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  owner: ["bookings","content","operations","finance","suppliers","reports","settings","staff"],
  manager: ["bookings","content","operations","finance","suppliers","reports","settings"],
  sales: ["bookings","reports"],
  operations: ["bookings","operations","suppliers"],
  operator: ["bookings","operations"],
  content_editor: ["content"],
  finance: ["finance","suppliers","reports"],
};
export function permissionsForAdminRole(role: AdminRole) { return [...rolePermissions[role]]; }
export function hasAdminPermission(user: AuthUser | null | undefined, permission: AdminPermission) { if (isAdminOwner(user)) return true; const role=user?.app_metadata?.admin_role as AdminRole|undefined; return Boolean(role&&rolePermissions[role]?.includes(permission)); }
