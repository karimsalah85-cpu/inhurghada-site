export const whatsappNumber = "201030809150";
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@dailyredsea.com";
export const displayPhoneNumber = "+20 103 080 9150";
export const facebookUrl = "https://www.facebook.com/profile.php?id=61592247695069";
export const instagramUrl = "https://www.instagram.com/dailyredsea.com7/";
export const googleReviewUrl = "https://g.page/r/CZO2rT5pTQOXEAI/review";
export const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=Daily+Red+Sea&query_place_id=ChIJXZ9eh4x-YCURk7atPmlNA5c";

export function whatsappUrl(message?: string) {
  const baseUrl = `https://wa.me/${whatsappNumber}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}
