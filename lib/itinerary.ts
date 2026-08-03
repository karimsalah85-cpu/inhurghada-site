export type ItineraryStep = {
  title: string;
  detail?: string;
  duration?: string;
  optional: boolean;
};

const optionalPattern = /\boptional\b|optional|по желанию|اختياري|可选/i;

export function parseItineraryStep(value: string): ItineraryStep {
  const parts = value.split(/\s+[·•]\s+/).map((part) => part.trim()).filter(Boolean);
  const durationMatch = value.match(/\(([^()]*(?:minute|hour|day|دقيقة|ساعة|分钟|小时|день|час)[^()]*)\)/i);
  const optional = optionalPattern.test(value);
  const cleaned = (part: string) => part
    .replace(durationMatch?.[0] || "", "")
    .replace(optionalPattern, "")
    .replace(/^[\s,:;–—-]+|[\s,:;–—-]+$/g, "")
    .trim();
  const title = cleaned(parts[0] || value) || value;
  const detail = parts.slice(1).map(cleaned).filter(Boolean).join(" · ");
  return { title, detail: detail || undefined, duration: durationMatch?.[1], optional };
}
