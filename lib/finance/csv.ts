/** CSV for finance exports: RFC 4180 quoting plus spreadsheet formula-injection neutralising for free text. */
const csvCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const toCsv = (rows: (string | number | null | undefined)[][]) => rows.map((cells) => cells.map(csvCell).join(",")).join("\r\n") + "\r\n";
