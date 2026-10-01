/**
 * Pure rules for diving waivers: which bookings need one, how many signatures,
 * and validation of a submitted form. No database or network access, so it is
 * all unit-testable (see tests/waiver.test.ts). Wording lives in
 * lib/waiver-content.ts; signed links in lib/waiver-token.ts.
 */
import { tours } from "@/data/tours";
import { certificationLevels, type CertificationLevel } from "@/lib/guest-requirements";
import type { WaiverContent } from "@/lib/waiver-content";

const divingSlugs = new Set(tours.filter((tour) => tour.category === "Diving").map((tour) => tour.slug));

/** Tours whose catalogue category is "Diving" need a signed waiver from every diver. */
export function requiresWaiver(tourSlug: string | null | undefined) {
  return Boolean(tourSlug && divingSlugs.has(tourSlug.trim()));
}

type Counts = { adults?: number | null; youth?: number | null; infants?: number | null; guests?: number | null };
const whole = (value: unknown) => (typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0);

/**
 * One signature per diver: adults + youth. Infants never dive. Older bookings
 * without the split fall back to the guest total.
 */
export function waiverSignaturesNeeded(booking: Counts) {
  const split = whole(booking.adults) + whole(booking.youth);
  if (split > 0) return Math.min(split, 50);
  if (whole(booking.adults) + whole(booking.youth) + whole(booking.infants) > 0) return 0;
  return Math.min(whole(booking.guests), 50);
}

export type MedicalAnswer = "yes" | "no";

export type WaiverSubmission = {
  participantName: string;
  dateOfBirth: string | null;
  certification: CertificationLevel | null;
  medicalAnswers: Record<string, MedicalAnswer>;
  medicalFlagged: boolean;
  photoConsent: boolean;
  signatureName: string;
};

export type WaiverValidation = { ok: true; value: WaiverSubmission } | { ok: false; error: WaiverError };
export type WaiverError = "name" | "dob" | "medical" | "acknowledge" | "signature" | "certification";

export const waiverErrorMessages: Record<WaiverError, string> = {
  name: "Please enter the participant's full name (2–120 characters).",
  dob: "Please enter a valid date of birth, or leave it empty.",
  medical: "Please answer every medical question with Yes or No.",
  acknowledge: "Please tick all three confirmations to sign.",
  signature: "Please type your full name as your signature (2–120 characters).",
  certification: "Please choose a valid certification level.",
};

const cleanName = (value: unknown) =>
  typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim() : "";

const validName = (value: string) => value.length >= 2 && value.length <= 120 && /\p{L}/u.test(value);

/** Read a value from FormData or a plain object. */
type FormLike = { get(name: string): unknown };

function validDateOfBirth(value: string, today: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const age = (today.getTime() - date.getTime()) / (365.25 * 86_400_000);
  return age >= 0 && age <= 110;
}

/** Validates one participant's form against the exact questions shown to them. */
export function validateWaiverSubmission(form: FormLike, content: WaiverContent, today = new Date()): WaiverValidation {
  const participantName = cleanName(form.get("participant_name"));
  if (!validName(participantName)) return { ok: false, error: "name" };

  const rawDob = typeof form.get("date_of_birth") === "string" ? String(form.get("date_of_birth")).trim() : "";
  if (rawDob && !validDateOfBirth(rawDob, today)) return { ok: false, error: "dob" };

  const rawCertification = typeof form.get("certification") === "string" ? String(form.get("certification")).trim() : "";
  if (rawCertification && !(certificationLevels as readonly string[]).includes(rawCertification)) return { ok: false, error: "certification" };

  const medicalAnswers: Record<string, MedicalAnswer> = {};
  for (const question of content.medicalQuestions) {
    const answer = form.get(`medical_${question.id}`);
    if (answer !== "yes" && answer !== "no") return { ok: false, error: "medical" };
    medicalAnswers[question.id] = answer;
  }
  for (const acknowledgement of content.acknowledgements) {
    if (form.get(`ack_${acknowledgement.id}`) !== "on") return { ok: false, error: "acknowledge" };
  }
  const signatureName = cleanName(form.get("signature_name"));
  if (!validName(signatureName)) return { ok: false, error: "signature" };

  return {
    ok: true,
    value: {
      participantName,
      dateOfBirth: rawDob || null,
      certification: (rawCertification || null) as CertificationLevel | null,
      medicalAnswers,
      medicalFlagged: Object.values(medicalAnswers).includes("yes"),
      photoConsent: form.get("photo_consent") === "on",
      signatureName,
    },
  };
}

/** Admin summary line, e.g. "Waivers 1/2 signed". */
export function waiverStatusLabel(signed: number, needed: number) {
  if (needed <= 0) return signed ? `Waivers ${signed} signed` : "No divers on this booking";
  return `Waivers ${Math.min(signed, needed)}/${needed} signed${signed >= needed ? " ✓" : ""}`;
}

/** Prefilled WhatsApp text the admin sends to the guest. */
export function waiverWhatsAppText(input: { customerName: string | null; reference: string; tourName: string | null; link: string; needed: number }) {
  const first = (input.customerName || "").trim().split(/\s+/)[0];
  return [
    `Hello${first ? ` ${first}` : ""}! Before your ${input.tourName || "dive"} (booking ${input.reference}), each diver needs to sign the diving waiver and medical form${input.needed > 1 ? ` (${input.needed} signatures)` : ""}.`,
    "It takes about 3 minutes on your phone:",
    input.link,
    "Thank you — Daily Red Sea",
  ].join("\n");
}
