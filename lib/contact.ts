export const defaultWhatsappNumber = "201154516040";

/**
 * WhatsApp number in international format, digits only (no "+", spaces or
 * dashes), e.g. 201154516040. Anything else falls back to the default so a
 * malformed env value can never produce a broken wa.me link.
 */
export function resolveWhatsappNumber(value: string | undefined) {
  const trimmed = value?.trim() || "";
  return /^[1-9]\d{7,14}$/.test(trimmed) ? trimmed : defaultWhatsappNumber;
}

/** "+20 115 451 6040" for Egyptian mobiles; other numbers are shown as "+<digits>". */
export function formatDisplayPhoneNumber(digits: string) {
  const egyptianMobile = digits.match(/^20(\d{3})(\d{3})(\d{4})$/);
  return egyptianMobile ? `+20 ${egyptianMobile[1]} ${egyptianMobile[2]} ${egyptianMobile[3]}` : `+${digits}`;
}

// Referenced literally so Next.js inlines the value into client bundles.
export const whatsappNumber = resolveWhatsappNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@dailyredsea.com";
export const displayPhoneNumber = formatDisplayPhoneNumber(whatsappNumber);
export const facebookUrl = "https://www.facebook.com/profile.php?id=61592247695069";
export const instagramUrl = "https://www.instagram.com/dailyredsea.com7/";
export const googleReviewUrl = "https://g.page/r/CZO2rT5pTQOXEAI/review";
export const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Daily+Red+Sea&query_place_id=ChIJXZ9eh4x-YCURk7atPmlNA5c";

export function whatsappUrl(message?: string) {
  const baseUrl = `https://wa.me/${whatsappNumber}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}
