// PostgREST caps every response at max_rows (1000 in supabase/config.toml), whatever .limit() says.
// Reads that may exceed that must page with .range() or they silently drop rows.
export const PAGE_SIZE = 1000;

type PageResult<T> = PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>;

export async function fetchAllPages<T>(page: (from: number, to: number) => PageResult<T>, maxRows = 100_000) {
  const rows: T[] = [];
  for (let from = 0; from < maxRows; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return { data: rows, error: null };
  }
  return { data: null, error: { message: `More than ${maxRows} rows — narrow the selection.` } };
}
