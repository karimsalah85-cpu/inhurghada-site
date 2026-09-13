/** Human-facing trip reference. URL slugs and internal database UUIDs stay separate. */
export function normalizeTripId(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") throw new Error("Trip ID must be text.");
  const id = value.trim().toUpperCase();
  if (!id) return null;
  if (!/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(id)) {
    throw new Error("Trip ID must contain 2–32 letters, numbers, hyphens or underscores.");
  }
  return id;
}
