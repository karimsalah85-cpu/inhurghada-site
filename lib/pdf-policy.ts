// TODO(legal): Replace this fallback when approved legal copy is available.
export const CANCELLATION_POLICY_TEXT =
  "PLACEHOLDER - Add the approved cancellation and refund policy here.";

export function getCancellationPolicyParagraphs(): string[] {
  const configuredPolicy =
    process.env.CANCELLATION_POLICY_TEXT?.replace(/\\n/g, "\n").trim() ||
    CANCELLATION_POLICY_TEXT;

  return configuredPolicy
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
