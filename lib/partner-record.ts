/** Validation shared by the partner create (POST) and edit (PATCH) routes. Partners are the `suppliers` table. */
export const PARTNER_TYPES = ["boat", "guide", "driver", "hotel", "company", "other"] as const;
export type PartnerKind = typeof PARTNER_TYPES[number];
export const PARTNER_PAYMENT_METHODS = ["cash", "bank_transfer", "instapay", "vodafone_cash", "other"] as const;
export type PartnerPaymentMethod = typeof PARTNER_PAYMENT_METHODS[number];

export const partnerTypeLabels: Record<PartnerKind, string> = {
  boat: "Boat", guide: "Guide", driver: "Driver", hotel: "Hotel", company: "Company", other: "Other",
};
export const paymentMethodLabels: Record<PartnerPaymentMethod, string> = {
  cash: "Cash", bank_transfer: "Bank transfer", instapay: "InstaPay", vodafone_cash: "Vodafone Cash", other: "Other",
};

type Body = Record<string, unknown> | null;
const text = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max) || null;

export function normalizePartnerRecord(type: "supplier" | "sales_person", body: Body):
  { record: Record<string, unknown> } | { error: string } {
  const name = String(body?.name || "").trim().slice(0, 120);
  const phone = text(body?.phone, 40);
  const email = text(body?.email, 160)?.toLowerCase() ?? null;
  const notes = text(body?.notes, 500);
  if (name.length < 2 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { error: "Enter a valid name and email address." };
  const record: Record<string, unknown> = { name, phone, email, notes };

  if (type === "supplier") {
    record.contact_name = text(body?.contact_name, 120);
    const kind = String(body?.supplier_type || "").trim().toLowerCase();
    if (kind) {
      if (!(PARTNER_TYPES as readonly string[]).includes(kind)) return { error: "Choose a valid partner type." };
      record.type = kind;
    }
    record.whatsapp = text(body?.whatsapp, 40);
    const method = String(body?.payment_method || "").trim().toLowerCase();
    if (method && !(PARTNER_PAYMENT_METHODS as readonly string[]).includes(method)) return { error: "Choose a valid payment method." };
    record.payment_method = method || null;
    record.payment_details = text(body?.payment_details, 500);
  } else {
    const commission = body?.commission_percent === "" || body?.commission_percent == null ? null : Number(body.commission_percent);
    if (commission !== null && (!Number.isFinite(commission) || commission < 0 || commission > 100)) return { error: "Commission must be between 0 and 100%." };
    record.commission_percent = commission;
  }
  return { record };
}
