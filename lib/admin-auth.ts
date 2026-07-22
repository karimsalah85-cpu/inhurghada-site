type AuthUser = {
  email?: string | null;
};

export const configuredAdminEmail = () => (process.env.ADMIN_EMAIL || "info@dailyredsea.com").trim().toLowerCase();

export function isAuthorizedAdmin(user: AuthUser | null | undefined) {
  return Boolean(user?.email && user.email.trim().toLowerCase() === configuredAdminEmail());
}
