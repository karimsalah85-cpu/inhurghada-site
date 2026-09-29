import { z } from "zod";
import { FINANCE_CURRENCIES, fromMinor, toMinor } from "@/lib/finance/money";

/**
 * The single server-side validation layer for every finance write. Each
 * schema is used for both create and update, and its output maps 1:1 onto
 * the finance_* database functions (which validate again).
 */

const MAX_MINOR = 100_000_000_000n; // 1,000,000,000.00

export const currencySchema = z.enum(FINANCE_CURRENCIES, { error: "Choose USD, EUR, GBP, EGP or SAR." });

const decimalAmount = (options: { allowNegative?: boolean; allowZero?: boolean } = {}) =>
  z.union([z.string(), z.number()]).transform((value, context) => {
    let cents: bigint;
    try {
      cents = toMinor(value);
    } catch {
      context.addIssue({ code: "custom", message: "Enter an amount with at most two decimals." });
      return z.NEVER;
    }
    if (cents < 0n && !options.allowNegative) {
      context.addIssue({ code: "custom", message: "Amount cannot be negative." });
      return z.NEVER;
    }
    if (cents === 0n && !options.allowZero) {
      context.addIssue({ code: "custom", message: "Amount must not be zero." });
      return z.NEVER;
    }
    if ((cents < 0n ? -cents : cents) >= MAX_MINOR) {
      context.addIssue({ code: "custom", message: "Amount is too large." });
      return z.NEVER;
    }
    return fromMinor(cents);
  });

/** Positive amount as a canonical decimal string. */
export const positiveAmountSchema = decimalAmount();
/** Zero or positive (fees, commissions, refunds). */
export const nonNegativeAmountSchema = decimalAmount({ allowZero: true });
/** Signed, non-zero (adjustments only). */
export const signedAmountSchema = decimalAmount({ allowNegative: true });

export const percentSchema = z.union([z.string(), z.number()]).transform((value, context) => {
  const text = String(value).trim();
  const number = Number(text);
  if (!/^\d{1,3}(\.\d{1,4})?$/.test(text) || number < 0 || number > 100) {
    context.addIssue({ code: "custom", message: "Enter a percentage between 0 and 100 (up to 4 decimals)." });
    return z.NEVER;
  }
  return text;
});

export const isoDateSchema = z.string().trim().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid date (YYYY-MM-DD).");

export const idSchema = z.uuid({ error: "Invalid identifier." });

const noteSchema = z.string().trim().max(1000, "Keep the note under 1000 characters.");
export const requiredNoteSchema = noteSchema.min(3, "A note of at least 3 characters is required.");
const optionalNoteSchema = noteSchema.optional().transform((value) => value || null);

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().transform((value) => value || null);
const optionalId = z.union([idSchema, z.literal(""), z.null()]).optional().transform((value) => value || null);

// ---------------------------------------------------------------------------
// Expenses (manual form, reviewed invoice upload, edits).
// ---------------------------------------------------------------------------
export const expenseInputSchema = z.object({
  description: z.string().trim().min(2, "Enter a description.").max(200),
  amount: positiveAmountSchema,
  currency: currencySchema.default("USD"),
  date: isoDateSchema,
  category: optionalText(80),
  expense_type: z.string().trim().max(40).optional().default("other"),
  supplier_id: optionalId,
  sales_person_id: optionalId,
  booking_id: optionalId,
  vendor: optionalText(200),
  invoice_number: optionalText(120),
}).superRefine((value, context) => {
  if (value.expense_type === "supplier_per_trip" && !value.supplier_id) {
    context.addIssue({ code: "custom", path: ["supplier_id"], message: "Choose a supplier for this trip expense." });
  }
  if (value.expense_type === "sales_commission" && !value.sales_person_id) {
    context.addIssue({ code: "custom", path: ["sales_person_id"], message: "Choose a sales person for this commission." });
  }
});
export type ExpenseInput = z.output<typeof expenseInputSchema>;

/** Accepts the legacy field names used by the existing admin forms (expense_date, lowercase currency). */
export function expenseInputFromBody(body: Record<string, unknown> | null) {
  return expenseInputSchema.safeParse({
    ...body,
    date: body?.date ?? body?.expense_date,
    currency: typeof body?.currency === "string" && body.currency ? body.currency.toUpperCase() : undefined,
  });
}

export const voidExpenseSchema = z.object({ reason: requiredNoteSchema });

// ---------------------------------------------------------------------------
// Booking financial lines.
// ---------------------------------------------------------------------------
export const supplierCostSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("auto") }),
  z.object({ mode: z.literal("amount"), amount: nonNegativeAmountSchema, currency: currencySchema }),
  z.object({ mode: z.literal("percent"), percent: percentSchema }),
]);

export const lineUpdateSchema = z.object({
  collected_by: z.enum(["daily_red_sea", "supplier"]).optional(),
  collection_status: z.enum(["not_collected", "partial", "collected"]).optional(),
  collected_amount: nonNegativeAmountSchema.optional(),
  no_show: z.boolean().optional(),
  payment_fees: nonNegativeAmountSchema.optional(),
  agent_commission: nonNegativeAmountSchema.nullable().optional(),
  refunded_amount: nonNegativeAmountSchema.nullable().optional(),
  supplier_cancellation_fee: nonNegativeAmountSchema.optional(),
  supplier_id: idSchema.nullable().optional(),
  supplier_cost: supplierCostSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Nothing to update.")
  .refine((value) => value.collection_status !== "not_collected" || !value.collected_amount || value.collected_amount === "0.00",
    { path: ["collected_amount"], message: "A collected amount needs a collected or partial status." });
export type LineUpdate = z.output<typeof lineUpdateSchema>;

// ---------------------------------------------------------------------------
// Supplier ledger.
// ---------------------------------------------------------------------------
const ledgerBase = { supplier_id: idSchema, currency: currencySchema, entry_date: isoDateSchema, line_id: idSchema.nullable().optional().transform((value) => value ?? null) };

export const ledgerEntrySchema = z.discriminatedUnion("entry_type", [
  z.object({ ...ledgerBase, entry_type: z.literal("payment_to_supplier"), amount: positiveAmountSchema, note: optionalNoteSchema }),
  z.object({ ...ledgerBase, entry_type: z.literal("commission_received_from_supplier"), amount: positiveAmountSchema, note: optionalNoteSchema }),
  z.object({ ...ledgerBase, entry_type: z.literal("adjustment"), amount: signedAmountSchema, note: requiredNoteSchema }),
]);
export type LedgerEntryInput = z.output<typeof ledgerEntrySchema>;

export const netSettlementSchema = z.object({
  /** Client-generated once per settlement form submission; retries reuse it. */
  idempotency_key: idSchema,
  supplier_id: idSchema,
  line_ids: z.array(idSchema).min(1, "Select at least one booking.").max(500)
    .refine((ids) => new Set(ids).size === ids.length, "Each booking can only be selected once."),
  entry_date: isoDateSchema,
  note: optionalNoteSchema,
});

export const reverseEntrySchema = z.object({ entry_id: idSchema, note: requiredNoteSchema });

// ---------------------------------------------------------------------------
// FX overrides.
// ---------------------------------------------------------------------------
export const fxOverrideSchema = z.object({
  rate_date: isoDateSchema.refine((value) => value <= new Date().toISOString().slice(0, 10), "Rates cannot be set for future dates."),
  currency: currencySchema.exclude(["USD"], { error: "USD is the reporting currency." }),
  units_per_usd: z.union([z.string(), z.number()]).transform((value, context) => {
    const text = String(value).trim();
    if (!/^\d{1,10}(\.\d{1,10})?$/.test(text) || Number(text) <= 0) {
      context.addIssue({ code: "custom", message: "Enter how many units equal 1 USD (positive, up to 10 decimals)." });
      return z.NEVER;
    }
    return text;
  }),
  note: optionalNoteSchema,
});

// ---------------------------------------------------------------------------
// Guest payments, refunds, credit notes and cancellations.
// ---------------------------------------------------------------------------
export const GUEST_PAYMENT_METHODS = ["cash", "card", "stripe", "bank_transfer", "paypal", "instapay", "vodafone_cash", "other"] as const;
export const CANCELLATION_REASONS = ["weather", "guest", "partner", "other"] as const;

export const guestPaymentSchema = z.object({
  /** Client-generated once per form submission; a retry or double tap reuses it. */
  idempotency_key: idSchema,
  kind: z.enum(["deposit", "balance", "refund"], { error: "Choose deposit, balance or refund." }),
  amount: positiveAmountSchema,
  currency: currencySchema,
  method: z.enum(GUEST_PAYMENT_METHODS, { error: "Choose how the money was paid." }),
  paid_on: isoDateSchema,
  /** Only when paid in another currency: the booking-currency amount this covers (the rate used at the desk). */
  applied_amount: z.union([positiveAmountSchema, z.literal(""), z.null()]).optional().transform((value) => value || null),
  reference: optionalText(120),
  note: optionalNoteSchema,
});

export const creditNoteIssueSchema = z.object({
  idempotency_key: idSchema,
  amount: positiveAmountSchema,
  issued_on: isoDateSchema,
  expires_on: z.union([isoDateSchema, z.literal(""), z.null()]).optional().transform((value) => value || null),
  reason: requiredNoteSchema,
}).refine((value) => !value.expires_on || value.expires_on >= value.issued_on, { path: ["expires_on"], message: "The expiry date must be after the issue date." });

export const creditNoteRedeemSchema = z.object({
  idempotency_key: idSchema,
  /** The credit note number the guest quotes (CN-2026-0001), or its id. */
  credit_note: z.string().trim().min(3, "Enter the credit note number.").max(60),
  amount: positiveAmountSchema,
  paid_on: isoDateSchema,
  applied_amount: z.union([positiveAmountSchema, z.literal(""), z.null()]).optional().transform((value) => value || null),
});

export const guestReversalSchema = z.object({ note: requiredNoteSchema });

export const cancellationSchema = z.object({
  cancellation_reason: z.enum(CANCELLATION_REASONS, { error: "Choose weather, guest, partner or other." }),
  cancellation_note: optionalText(500),
});

// ---------------------------------------------------------------------------
// Extra partners on a trip (guide, driver, hotel ... next to the main partner).
// ---------------------------------------------------------------------------
export const PARTNER_ROLES = ["boat", "guide", "driver", "hotel", "company", "other"] as const;

export const partnerCostAddSchema = z.object({
  supplier_id: idSchema,
  role: z.enum(PARTNER_ROLES, { error: "Choose the partner's role on this trip." }),
  /** Blank = use the partner's price for this tour. */
  cost: z.union([nonNegativeAmountSchema, z.literal(""), z.null()]).optional().transform((value) => (value === "" || value === undefined ? null : value)),
  currency: z.union([currencySchema, z.literal(""), z.null()]).optional().transform((value) => value || null),
  cancellation_fee: nonNegativeAmountSchema.optional().default("0.00"),
  note: optionalText(500),
}).refine((value) => value.cost === null || value.currency !== null, { path: ["currency"], message: "Choose the currency of the cost." });

export const partnerCostUpdateSchema = z.object({
  cost: nonNegativeAmountSchema.optional(),
  currency: currencySchema.optional(),
  cancellation_fee: nonNegativeAmountSchema.optional(),
  role: z.enum(PARTNER_ROLES).optional(),
  /** Omitted = keep the note; "" = clear it. */
  note: z.string().trim().max(500).optional().transform((value) => (value === undefined ? undefined : value || null)),
}).strict().refine((value) => Object.values(value).some((entry) => entry !== undefined), "Nothing to update.");

export const partnerCostRemoveSchema = z.object({ reason: requiredNoteSchema });

/** First human-readable validation message, for API error responses. */
export function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return issue ? (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message) : "Invalid input.";
}
