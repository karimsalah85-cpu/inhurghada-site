type InvitationUser = {
  invited_at?: string;
  confirmed_at?: string;
};

export const adminInvitationRedirectUrl = "https://dailyredsea.com/admin/reset-password";

export function isPendingInvitation(user: InvitationUser | null | undefined) {
  return Boolean(user?.invited_at && !user.confirmed_at);
}

export function escapeInvitationHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}
