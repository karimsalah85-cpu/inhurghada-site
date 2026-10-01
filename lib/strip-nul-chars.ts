// PDF text layers and OCR output can contain NUL (\u0000) characters, which
// Postgres rejects in text and jsonb ("unsupported Unicode escape sequence").
// Strip them from every string (and object key) before it reaches the database.
export function stripNulChars<T>(value: T): T {
  if (typeof value === "string") return value.replace(/\u0000/g, "") as T;
  if (Array.isArray(value)) return value.map((item) => stripNulChars(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [stripNulChars(key), stripNulChars(item)]),
    ) as T;
  }
  return value;
}
