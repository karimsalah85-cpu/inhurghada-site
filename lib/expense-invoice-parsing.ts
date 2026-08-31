/**
 * Pure heuristics that turn the raw text of an invoice (from a PDF text layer or
 * OCR) into a best-effort structured guess. Everything here is deterministic and
 * unit-tested; it never touches the network or the DOM.
 */

export type InvoiceLineItem = { description: string; amount: number };

export type ParsedInvoice = {
  vendor: string | null;
  amount: number | null;
  currency: string | null;
  date: string | null; // ISO YYYY-MM-DD
  lineItems: InvoiceLineItem[];
  expenseType: string;
  category: string | null;
  confidence: number; // 0..1
};

const CURRENCY_CODES = ["EGP", "USD", "EUR", "GBP", "AED", "SAR"];
const SYMBOL_TO_CODE: Record<string, string> = { "£": "GBP", "€": "EUR", $: "USD" };
const ARABIC_CURRENCY: [RegExp, string][] = [
  [/جنيه|ج\.?م/, "EGP"],
  [/دولار/, "USD"],
  [/يورو/, "EUR"],
  [/جنيه\s*إسترليني|استرليني/, "GBP"],
  [/درهم/, "AED"],
  [/ريال/, "SAR"],
];

const EN_MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const CATEGORY_RULES: { pattern: RegExp; type: string; label: string }[] = [
  { pattern: /(fuel|petrol|gasoline|diesel|benzine|gas station|وقود|بنزين|سولار)/i, type: "fuel", label: "Fuel" },
  { pattern: /(google\s*ads?|adwords|google\s+(llc|ireland))/i, type: "google_ads", label: "Google Ads" },
  {
    pattern: /(subscription|renewal|monthly plan|annual plan|billing period|saas|اشتراك|تجديد)/i,
    type: "subscriptions",
    label: "Subscriptions",
  },
  { pattern: /(marina|mooring|berth|boat|vessel|yacht|قارب|مركب|يخت|رسو)/i, type: "boat_costs", label: "Boat costs" },
  { pattern: /(tour guide|\bguide\b|dragoman|مرشد)/i, type: "guide_fees", label: "Guide fees" },
];

const TOTAL_PATTERNS: { pattern: RegExp; weight: number }[] = [
  { pattern: /grand\s*total/i, weight: 5 },
  { pattern: /(amount|balance|total)\s*(due|payable|paid)/i, weight: 4 },
  { pattern: /(الإجمالي|الاجمالي|الاجمالى|المبلغ المستحق|إجمالي)/i, weight: 4 },
  { pattern: /\btotal\b/i, weight: 3 },
  { pattern: /(المجموع|القيمة الإجمالية)/i, weight: 3 },
];
const TOTAL_EXCLUDE = /(sub\s*-?\s*total|vat|tax|discount|shipping|قبل الضريبة|ضريبة)/i;

/** Normalises "1,234.56", "1.234,56", "1 234,56", "1234.5" → 1234.56 */
export function normalizeAmount(raw: string): number | null {
  let s = raw.replace(/[^\d.,\s]/g, "").replace(/\s/g, "").trim();
  if (!s) return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // The right-most separator is the decimal mark.
    const decimalMark = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const thousands = decimalMark === "," ? "." : ",";
    s = s.split(thousands).join("");
    s = s.replace(decimalMark, ".");
  } else if (hasComma) {
    const parts = s.split(",");
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length !== 3) {
      s = `${parts[0]}.${last}`; // decimal comma
    } else {
      s = parts.join(""); // grouped thousands
    }
  } else if (hasDot) {
    const parts = s.split(".");
    if (parts.length > 2) {
      s = parts.join(""); // 1.234.567 → thousands
    } else if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3 && /^0\d*$/.test(`0${parts[0]}`) === false) {
      // ambiguous "1.234"; keep as decimal by default (invoice prices usually have cents)
      s = `${parts[0]}.${parts[1]}`;
    }
  }

  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}

function splitLines(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const AMOUNT_TOKEN = /-?\d[\d.,\s]*\d|\d/g;

function numbersOnLine(line: string): number[] {
  const matches = line.match(AMOUNT_TOKEN) || [];
  return matches
    .map((token) => normalizeAmount(token))
    .filter((value): value is number => value !== null && value > 0);
}

export function detectCurrency(text: string): string | null {
  const upper = text.toUpperCase();
  for (const code of CURRENCY_CODES) {
    if (new RegExp(`\\b${code}\\b`).test(upper) || upper.includes(`${code} `)) return code;
  }
  if (/\bLE\b|ج\.?م|جنيه/.test(text)) return "EGP";
  for (const [pattern, code] of ARABIC_CURRENCY) if (pattern.test(text)) return code;
  for (const symbol of Object.keys(SYMBOL_TO_CODE)) if (text.includes(symbol)) return SYMBOL_TO_CODE[symbol];
  return null;
}

function clampDate(year: number, month: number, day: number): string | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCDate() !== day) return null;
  return iso;
}

export function detectDate(text: string): string | null {
  const candidates: { iso: string; keyworded: boolean }[] = [];
  const lines = splitLines(text);

  for (const line of lines) {
    const keyworded = /(date|issued|invoice date|تاريخ)/i.test(line);

    let match = line.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (match) {
      const iso = clampDate(Number(match[1]), Number(match[2]), Number(match[3]));
      if (iso) candidates.push({ iso, keyworded });
    }

    match = line.match(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
    if (match) {
      const [, a, b, y] = match;
      let day = Number(a);
      let month = Number(b);
      if (day <= 12 && month > 12) [day, month] = [month, day];
      let year = Number(y);
      if (year < 100) year += year >= 70 ? 1900 : 2000;
      const iso = clampDate(year, month, day);
      if (iso) candidates.push({ iso, keyworded });
    }

    const enMonth = line
      .toLowerCase()
      .match(/(\d{1,2})\s+([a-z]{3,})\s+(\d{4})|([a-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
    if (enMonth) {
      const day = Number(enMonth[1] || enMonth[5]);
      const monthName = (enMonth[2] || enMonth[4] || "").toLowerCase();
      const year = Number(enMonth[3] || enMonth[6]);
      const monthIndex = EN_MONTHS.findIndex((name) => name.startsWith(monthName.slice(0, 3)));
      if (monthIndex >= 0) {
        const iso = clampDate(year, monthIndex + 1, day);
        if (iso) candidates.push({ iso, keyworded });
      }
    }

    const arMonth = line.match(/(\d{1,2})\s+([؀-ۿ]+)\s+(\d{4})/);
    if (arMonth) {
      const day = Number(arMonth[1]);
      const monthIndex = AR_MONTHS.findIndex((name) => arMonth[2].includes(name));
      const year = Number(arMonth[3]);
      if (monthIndex >= 0) {
        const iso = clampDate(year, monthIndex + 1, day);
        if (iso) candidates.push({ iso, keyworded });
      }
    }
  }

  if (!candidates.length) return null;
  const keyworded = candidates.find((entry) => entry.keyworded);
  return (keyworded || candidates[0]).iso;
}

function detectVendor(lines: string[]): string | null {
  const skip = /^(tax\s+)?invoice|^receipt|^bill\b|^statement|^فاتورة|^إيصال/i;
  for (const line of lines.slice(0, 6)) {
    if (skip.test(line)) continue;
    const letters = line.replace(/[^\p{L}]/gu, "").length;
    if (letters >= 3 && letters >= line.length / 2) return line.slice(0, 120);
  }
  return lines[0]?.slice(0, 120) || null;
}

function detectAmount(text: string): { amount: number | null; keyworded: boolean } {
  const lines = splitLines(text);
  let best: { amount: number; weight: number } | null = null;

  for (const line of lines) {
    if (TOTAL_EXCLUDE.test(line)) continue;
    for (const { pattern, weight } of TOTAL_PATTERNS) {
      if (!pattern.test(line)) continue;
      const values = numbersOnLine(line);
      if (!values.length) continue;
      const amount = Math.max(...values);
      if (!best || weight > best.weight || (weight === best.weight && amount > best.amount)) {
        best = { amount, weight };
      }
      break;
    }
  }
  if (best) return { amount: best.amount, keyworded: true };

  const all = lines.flatMap(numbersOnLine);
  if (!all.length) return { amount: null, keyworded: false };
  return { amount: Math.max(...all), keyworded: false };
}

function detectLineItems(lines: string[]): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];
  for (const line of lines) {
    if (/total|vat|tax|subtotal|الإجمالي|المجموع|ضريبة/i.test(line)) continue;
    const match = line.match(/^(.*?\p{L}.*?)\s+([\d.,]+\d)\s*$/u);
    if (!match) continue;
    const description = match[1].trim().slice(0, 80);
    const amount = normalizeAmount(match[2]);
    if (description.length >= 2 && amount && amount > 0) items.push({ description, amount });
    if (items.length >= 50) break;
  }
  return items;
}

export function categorize(text: string): { expenseType: string; category: string | null } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return { expenseType: rule.type, category: rule.label };
  }
  return { expenseType: "other", category: null };
}

export function parseInvoiceText(text: string): ParsedInvoice {
  const clean = (text || "").normalize("NFKC");
  const lines = splitLines(clean);

  const vendor = detectVendor(lines);
  const { amount, keyworded } = detectAmount(clean);
  const currency = detectCurrency(clean);
  const date = detectDate(clean);
  const lineItems = detectLineItems(lines);
  const { expenseType, category } = categorize(clean);

  let confidence = 0;
  if (vendor) confidence += 0.2;
  if (amount) confidence += keyworded ? 0.4 : 0.25;
  if (currency) confidence += 0.15;
  if (date) confidence += 0.2;
  confidence = Math.min(1, Number(confidence.toFixed(2)));

  return { vendor, amount, currency, date, lineItems, expenseType, category, confidence };
}
