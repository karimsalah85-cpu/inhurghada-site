/**
 * Operational guest requirements stored on `bookings.guest_requirements`
 * (jsonb, default `{}`): what the boat crew, dive centre and guide need to
 * know before the trip. Pure helpers only — validation for admin writes, a
 * lenient reader for whatever is in the database, and short summaries for the
 * pickup manifest and supplier dispatch. See tests/guest-requirements.test.ts.
 */

export const certificationLevels = ["none", "open_water", "advanced", "rescue", "divemaster_plus"] as const;
export type CertificationLevel = (typeof certificationLevels)[number];

export type GuestRequirements = {
  nonSwimmers?: number;
  medical?: string;
  dietary?: string;
  certification?: CertificationLevel;
  certificationNumber?: string;
  other?: string;
};

export const guestRequirementLimits = {
  nonSwimmers: 50,
  medical: 500,
  dietary: 200,
  certificationNumber: 60,
  other: 500,
} as const;

export const certificationLabels: Record<CertificationLevel, string> = {
  none: "Not certified",
  open_water: "Open Water",
  advanced: "Advanced Open Water",
  rescue: "Rescue Diver",
  divemaster_plus: "Divemaster or higher",
};

const certificationShort: Record<CertificationLevel, string> = {
  none: "No dive cert",
  open_water: "OW cert",
  advanced: "AOW cert",
  rescue: "Rescue cert",
  divemaster_plus: "DM+ cert",
};

const isCertification = (value: unknown): value is CertificationLevel =>
  typeof value === "string" && (certificationLevels as readonly string[]).includes(value);

/** Collapses whitespace runs (keeping single line breaks) and strips control characters. */
function cleanText(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type TextKey = "medical" | "dietary" | "certificationNumber" | "other";
const textKeys: TextKey[] = ["medical", "dietary", "certificationNumber", "other"];
const allowedKeys = new Set<string>(["nonSwimmers", "certification", ...textKeys]);

export type RequirementsValidation = { ok: true; value: GuestRequirements } | { ok: false; error: string };

const fieldNames: Record<TextKey, string> = {
  medical: "Medical notes",
  dietary: "Dietary needs",
  certificationNumber: "Certification number",
  other: "Other notes",
};

/**
 * Strict validation for an admin write. Empty values are dropped so the stored
 * object only carries what is actually known; unknown keys are rejected so a
 * typo never silently disappears.
 */
export function validateGuestRequirements(input: unknown): RequirementsValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, error: "Send the requirements as an object." };
  const raw = input as Record<string, unknown>;
  const unknown = Object.keys(raw).find((key) => !allowedKeys.has(key));
  if (unknown) return { ok: false, error: `Unknown requirement field: ${unknown.slice(0, 40)}.` };
  const value: GuestRequirements = {};

  if (raw.nonSwimmers !== undefined && raw.nonSwimmers !== null && raw.nonSwimmers !== "") {
    const count = typeof raw.nonSwimmers === "string" ? Number(raw.nonSwimmers) : raw.nonSwimmers;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0 || count > guestRequirementLimits.nonSwimmers) {
      return { ok: false, error: `Non-swimmers must be a whole number from 0 to ${guestRequirementLimits.nonSwimmers}.` };
    }
    if (count > 0) value.nonSwimmers = count;
  }

  if (raw.certification !== undefined && raw.certification !== null && raw.certification !== "") {
    if (!isCertification(raw.certification)) return { ok: false, error: "Choose a valid certification level." };
    value.certification = raw.certification;
  }

  for (const key of textKeys) {
    const field = raw[key];
    if (field === undefined || field === null) continue;
    if (typeof field !== "string") return { ok: false, error: `${fieldNames[key]} must be text.` };
    const cleaned = cleanText(key === "certificationNumber" ? field.replace(/\s+/g, " ") : field);
    if (cleaned.length > guestRequirementLimits[key]) return { ok: false, error: `${fieldNames[key]} can be at most ${guestRequirementLimits[key]} characters.` };
    if (cleaned) value[key] = cleaned;
  }

  if (value.certificationNumber && (!value.certification || value.certification === "none")) {
    return { ok: false, error: "Choose the certification level for this certification number." };
  }
  return { ok: true, value };
}

/**
 * Lenient reader for stored data (or a database that has not been migrated
 * yet): keeps each valid field, drops anything malformed, never throws.
 */
export function readGuestRequirements(value: unknown): GuestRequirements {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const result: GuestRequirements = {};
  const count = raw.nonSwimmers;
  if (typeof count === "number" && Number.isInteger(count) && count > 0 && count <= guestRequirementLimits.nonSwimmers) result.nonSwimmers = count;
  if (isCertification(raw.certification)) result.certification = raw.certification;
  for (const key of textKeys) {
    const field = raw[key];
    if (typeof field !== "string") continue;
    const cleaned = cleanText(field).slice(0, guestRequirementLimits[key]);
    if (cleaned) result[key] = cleaned;
  }
  if (result.certificationNumber && (!result.certification || result.certification === "none")) delete result.certificationNumber;
  return result;
}

export function hasGuestRequirements(value: GuestRequirements) {
  return Object.keys(value).length > 0;
}

const oneLine = (value: string, max: number) => {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};

const nonSwimmerLabel = (count: number) => `${count} non-swimmer${count === 1 ? "" : "s"}`;

/**
 * Short one-line summary for the pickup manifest, e.g.
 * "1 non-swimmer · Medical: asthma · Diet: vegetarian · OW cert".
 */
export function compactRequirementsSummary(value: unknown) {
  const requirements = readGuestRequirements(value);
  return [
    requirements.nonSwimmers ? nonSwimmerLabel(requirements.nonSwimmers) : "",
    requirements.medical ? `Medical: ${oneLine(requirements.medical, 60)}` : "",
    requirements.dietary ? `Diet: ${oneLine(requirements.dietary, 40)}` : "",
    requirements.certification ? certificationShort[requirements.certification] : "",
    requirements.other ? oneLine(requirements.other, 60) : "",
  ].filter(Boolean).join(" · ");
}

/** Label/value rows for a supplier: full text, never contact details (emails are redacted by the caller's rules). */
export function requirementRows(value: unknown): [label: string, value: string][] {
  const requirements = readGuestRequirements(value);
  const rows: [string, string][] = [];
  if (requirements.nonSwimmers) rows.push(["Non-swimmers", String(requirements.nonSwimmers)]);
  if (requirements.medical) rows.push(["Medical", requirements.medical]);
  if (requirements.certification) {
    rows.push(["Diving certification", `${certificationLabels[requirements.certification]}${requirements.certificationNumber ? ` (#${requirements.certificationNumber})` : ""}`]);
  }
  if (requirements.dietary) rows.push(["Dietary", requirements.dietary]);
  if (requirements.other) rows.push(["Other needs", requirements.other]);
  return rows;
}
