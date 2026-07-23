export const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201004933150";
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@dailyredsea.com";
export const displayPhoneNumber = "+20 100 493 3150";
export const facebookUrl = "https://www.facebook.com/profile.php?id=61592247695069";
export const instagramUrl = "https://www.instagram.com/dailyredsea.com7/";

export function whatsappUrl(message?: string) {
  const baseUrl = `https://wa.me/${whatsappNumber}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}
