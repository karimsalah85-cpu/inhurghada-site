"use client";

import { useMemo, useState } from "react";
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { Check, ChevronDown } from "lucide-react";
import { validatePhoneNumber, type CountryCode } from "@/lib/phone";
import type { Language } from "@/components/settings/SiteSettingsContext";

type PhoneNumberInputProps = {
  id?: string;
  /** Fallback country for numbers typed without a "+" prefix. The traveller can change it. */
  defaultCountry: CountryCode;
  /** Last value emitted by this field (E.164 when complete, otherwise a partial "+<code><digits>"). */
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  language: Language;
  /** Parent submit-time error — turns the field red even before blur. */
  hasError?: boolean;
  required?: boolean;
  placeholder?: string;
  ariaLabel?: string;
};

// Common traveller origins for the Red Sea market, shown above the full list.
const PINNED: CountryCode[] = ["EG", "SA", "DE", "GB", "RU", "PL", "CZ", "FR", "IT", "NL", "AT", "CH", "BE", "UA", "CN", "US"];

function flagEmoji(country: string) {
  return String.fromCodePoint(...[...country.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}

function isSupportedCountry(value: string): value is CountryCode {
  return (getCountries() as string[]).includes(value);
}

export default function PhoneNumberInput({
  id,
  defaultCountry,
  value,
  onChange,
  language,
  hasError = false,
  required = false,
  placeholder,
  ariaLabel,
}: PhoneNumberInputProps) {
  const parsedInitial = useMemo(() => (value ? parsePhoneNumberFromString(value) : undefined), [value]);
  const [country, setCountry] = useState<CountryCode>(parsedInitial?.country ?? (isSupportedCountry(defaultCountry) ? defaultCountry : "EG"));
  const [national, setNational] = useState(() => (parsedInitial ? parsedInitial.formatNational() : ""));
  const [touched, setTouched] = useState(false);
  const [prevDefault, setPrevDefault] = useState(defaultCountry);

  // Follow the destination country while the traveller has not picked one or typed anything.
  if (prevDefault !== defaultCountry) {
    setPrevDefault(defaultCountry);
    if (!national && !touched && isSupportedCountry(defaultCountry)) setCountry(defaultCountry);
  }

  const countryOptions = useMemo(() => {
    let names: Intl.DisplayNames | undefined;
    try {
      names = new Intl.DisplayNames([language], { type: "region" });
    } catch {
      names = undefined;
    }
    const label = (code: CountryCode) => {
      const name = names?.of(code) ?? code;
      return { code, name, calling: getCountryCallingCode(code) };
    };
    const all = (getCountries() as CountryCode[]).map(label).sort((a, b) => a.name.localeCompare(b.name, language));
    const pinned = PINNED.filter(isSupportedCountry).map(label);
    return { pinned, all };
  }, [language]);

  const callingCode = getCountryCallingCode(country);

  function emit(nextCountry: CountryCode, nextNational: string) {
    const digits = nextNational.replace(/[^\d]/g, "");
    const composed = digits ? `+${getCountryCallingCode(nextCountry)}${digits}` : "";
    onChange(composed, composed ? validatePhoneNumber(composed).valid : false);
  }

  function handleCountry(next: string) {
    if (!isSupportedCountry(next)) return;
    setTouched(true);
    setCountry(next);
    // Re-format the existing digits for the new country.
    const digits = national.replace(/[^\d]/g, "");
    const reformatted = digits ? new AsYouType(next).input(digits) : "";
    setNational(reformatted);
    emit(next, reformatted);
  }

  function handleNational(raw: string) {
    setTouched(true);
    const formatted = new AsYouType(country).input(raw);
    setNational(formatted);
    emit(country, formatted);
  }

  const validity = value ? validatePhoneNumber(value) : null;
  const showValid = Boolean(validity?.valid);
  const showError = (touched || hasError) && Boolean(value) && !showValid;
  const borderClass = showError
    ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-100"
    : showValid
      ? "border-emerald-400 focus-within:border-emerald-500 focus-within:ring-emerald-100"
      : "border-line focus-within:border-ocean focus-within:ring-ocean-tint";

  return (
    <span dir="ltr" className={`mt-1 flex items-stretch overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 ${borderClass}`}>
      <span className="relative flex shrink-0 items-center gap-1 border-r border-line bg-surface-muted px-3 text-sm font-semibold text-ink">
        <span aria-hidden="true" className="text-base leading-none">{flagEmoji(country)}</span>
        <span className="tabular-nums">+{callingCode}</span>
        <ChevronDown size={14} className="text-muted" aria-hidden="true" />
        <select
          aria-label={ariaLabel ? `${ariaLabel} — country code` : "Country code"}
          value={country}
          onChange={(event) => handleCountry(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
        >
          <optgroup label="—">
            {countryOptions.pinned.map((option) => (
              <option key={`p-${option.code}`} value={option.code}>
                {flagEmoji(option.code)} {option.name} +{option.calling}
              </option>
            ))}
          </optgroup>
          <optgroup label="A–Z">
            {countryOptions.all.map((option) => (
              <option key={option.code} value={option.code}>
                {flagEmoji(option.code)} {option.name} +{option.calling}
              </option>
            ))}
          </optgroup>
        </select>
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        value={national}
        aria-label={ariaLabel}
        aria-invalid={showError || undefined}
        onChange={(event) => handleNational(event.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder ?? "10 1234 5678"}
        className="w-full bg-transparent px-3 py-3 font-normal text-ink outline-none placeholder:text-muted"
      />
      {showValid ? (
        <span className="flex shrink-0 items-center pr-3 text-emerald-600" aria-hidden="true">
          <Check size={18} />
        </span>
      ) : null}
    </span>
  );
}
