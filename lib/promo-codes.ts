export type PromoCode = {
  id: string; code: string; discount_type: "percent" | "fixed"; discount_value: number;
  currency: string | null; minimum_amount: number; tour_slug: string | null;
  starts_at: string | null; expires_at: string | null; max_redemptions: number | null;
  redeemed_count: number; active: boolean;
};
export function normalizePromoCode(value: unknown) {
  if (typeof value !== "string" || !/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(value.trim().toUpperCase())) throw new Error("Enter a promo code with 3–32 letters, numbers, hyphens or underscores.");
  return value.trim().toUpperCase();
}
export function validatePromoDefinition(input: Record<string, unknown>) {
  const code = normalizePromoCode(input.code);
  const discount_type = input.discount_type;
  const discount_value = Number(input.discount_value);
  const minimum_amount = Number(input.minimum_amount || 0);
  const currency = input.currency ? String(input.currency).toUpperCase() : null;
  const max_redemptions = input.max_redemptions === "" || input.max_redemptions == null ? null : Number(input.max_redemptions);
  if (!["percent", "fixed"].includes(String(discount_type)) || !Number.isFinite(discount_value) || discount_value <= 0 || discount_value > 9999999999 || Math.round(discount_value * 100) !== discount_value * 100 && Math.abs(Math.round(discount_value * 100) - discount_value * 100) > 0.000001) throw new Error("Enter a valid discount with at most two decimal places.");
  if (discount_type === "percent" && discount_value > 100) throw new Error("Percentage discount cannot exceed 100%.");
  if (currency && !["USD", "EUR", "SAR"].includes(currency)) throw new Error("Choose a supported currency.");
  if (!Number.isFinite(minimum_amount) || minimum_amount < 0 || minimum_amount > 9999999999) throw new Error("Enter a valid minimum booking amount.");
  if ((discount_type === "fixed" || minimum_amount > 0) && !currency) throw new Error("Choose a currency for fixed discounts or minimum booking amounts.");
  if (max_redemptions !== null && (!Number.isInteger(max_redemptions) || max_redemptions < 1 || max_redemptions > 2147483647)) throw new Error("Usage limit must be a positive whole number.");
  const date = (value: unknown) => {
    if (!value) return null;
    if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error("Enter a valid date and time.");
    return new Date(value).toISOString();
  };
  const starts_at = date(input.starts_at), expires_at = date(input.expires_at);
  if (starts_at && expires_at && expires_at <= starts_at) throw new Error("Expiry must be after the start time.");
  return { code, discount_type: discount_type as PromoCode["discount_type"], discount_value, currency, minimum_amount, max_redemptions, starts_at, expires_at, tour_slug: typeof input.tour_slug === "string" && input.tour_slug.trim() ? input.tour_slug.trim() : null, active: input.active !== false };
}
/** Preview only. The database repeats eligibility under a row lock at redemption. */
export function quotePromo(promo: PromoCode, amount: number, currency: string, slugs: string[], now = Date.now()) {
  if (!promo.active || !Number.isFinite(amount) || amount <= 0 || amount < Number(promo.minimum_amount) ||
    (promo.starts_at && Date.parse(promo.starts_at) > now) || (promo.expires_at && Date.parse(promo.expires_at) <= now) ||
    (promo.max_redemptions !== null && promo.redeemed_count >= promo.max_redemptions) ||
    (promo.currency && promo.currency !== currency.toUpperCase()) ||
    (promo.tour_slug && (!slugs.length || slugs.some(slug => slug !== promo.tour_slug)))) throw new Error("Promo code is invalid, expired or not eligible for this booking.");
  const discount = Math.min(amount, Math.round((promo.discount_type === "percent" ? amount * Number(promo.discount_value) / 100 : Number(promo.discount_value)) * 100) / 100);
  if (discount <= 0) throw new Error("Promo code gives no discount on this booking.");
  return { code: promo.code, subtotal: amount, discount, total: Math.round((amount - discount) * 100) / 100, currency };
}
