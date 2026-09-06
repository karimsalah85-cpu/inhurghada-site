import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export type PhoneValidationResult =
  | { valid: true; e164: string }
  | { valid: false; message: string };

const INVALID_MESSAGE = "Please enter a valid WhatsApp phone number including the country code.";

const arabicIndicDigits = "٠١٢٣٤٥٦٧٨٩";
const persianIndicDigits = "۰۱۲۳۴۵۶۷۸۹";

/** Converts Arabic-Indic and Eastern Arabic-Indic digits to plain ASCII digits, so a number typed on an Arabic keyboard still parses. */
function toAsciiDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (char) => {
    const arabicIndex = arabicIndicDigits.indexOf(char);
    if (arabicIndex !== -1) return String(arabicIndex);
    return String(persianIndicDigits.indexOf(char));
  });
}

/**
 * Flags nonsense strings of digits that libphonenumber-js can still consider
 * "valid" because they happen to match a country's national number pattern
 * (length + allowed prefix). Real customers never enter numbers like
 * "1111111111", "1212121212" or "123456789", so these are rejected before the
 * booking is saved. Operates on the national significant number only, so a
 * legitimate country calling code (e.g. "20") is never mistaken for a pattern.
 */
export function looksLikeFakeNumber(nationalDigits: string) {
  const digits = nationalDigits.replace(/\D/g, "");
  if (digits.length < 5) return false;

  // Every digit identical: "0000000000", "1111111111".
  if (/^(\d)\1+$/.test(digits)) return true;

  // A short block that tiles the whole number: "1212121212" (12×5),
  // "123123123" (123×3), "20202020" (20×4).
  for (let unit = 1; unit <= 3; unit += 1) {
    if (digits.length % unit !== 0 || digits.length / unit < 3) continue;
    const block = digits.slice(0, unit);
    if (block.repeat(digits.length / unit) === digits) return true;
  }

  // Strictly ascending or descending run, wrapping mod 10 so "1234567890" and
  // "9876543210" are both caught.
  const stepsAscending = (index: number) => (Number(digits[index]) - Number(digits[index - 1]) + 10) % 10 === 1;
  const stepsDescending = (index: number) => (Number(digits[index - 1]) - Number(digits[index]) + 10) % 10 === 1;
  let ascending = true;
  let descending = true;
  for (let index = 1; index < digits.length; index += 1) {
    if (!stepsAscending(index)) ascending = false;
    if (!stepsDescending(index)) descending = false;
  }
  if (ascending || descending) return true;

  return false;
}

/**
 * Validates a WhatsApp/phone number using libphonenumber-js so realistic
 * international numbers (correct length, valid area/operator prefix for the
 * country) are accepted while fake-looking input (repeated digits, malformed
 * prefixes, too short/long, non-numeric noise, repeating or sequential
 * patterns) is rejected. `defaultCountry` is only used as a fallback for
 * numbers typed without a leading "+" or "00" international prefix; an explicit
 * country code in the input always wins, so this never silently assumes every
 * customer is from one country.
 *
 * On success, returns the number normalized to E.164 (e.g. "+201012345678")
 * for storage. On failure, returns a plain, non-technical message suitable
 * for display to the customer.
 */
export function validatePhoneNumber(rawValue: unknown, defaultCountry?: CountryCode): PhoneValidationResult {
  const cleaned = toAsciiDigits(String(rawValue ?? "")).trim();
  if (!cleaned) return { valid: false, message: INVALID_MESSAGE };

  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumberFromString(cleaned, defaultCountry);
  } catch {
    return { valid: false, message: INVALID_MESSAGE };
  }

  if (!phoneNumber || !phoneNumber.isValid()) return { valid: false, message: INVALID_MESSAGE };
  if (looksLikeFakeNumber(phoneNumber.nationalNumber)) return { valid: false, message: INVALID_MESSAGE };
  return { valid: true, e164: phoneNumber.number };
}

export type { CountryCode };
