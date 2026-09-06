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
 * Validates a WhatsApp/phone number using libphonenumber-js so realistic
 * international numbers (correct length, valid area/operator prefix for the
 * country) are accepted while fake-looking input (repeated digits, malformed
 * prefixes, too short/long, non-numeric noise) is rejected. `defaultCountry`
 * is only used as a fallback for numbers typed without a leading "+" or "00"
 * international prefix; an explicit country code in the input always wins, so
 * this never silently assumes every customer is from one country.
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
  return { valid: true, e164: phoneNumber.number };
}

export type { CountryCode };
