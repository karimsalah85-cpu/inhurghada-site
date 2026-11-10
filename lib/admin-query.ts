type PageResult<T> = { data: T[] | null; error: { message: string } | null; count?: number | null };

/** Read through PostgREST's response cap; never mistake one capped response for the whole dataset. */
export async function readAdminRows<T>(fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>, limit: number) {
  const data: T[] = [];
  let total: number | null = null;
  while (data.length < limit) {
    const requested = Math.min(500, limit - data.length);
    const result = await fetchPage(data.length, data.length + requested - 1);
    if (result.error) return { data: [], error: result.error, truncated: false };
    if (result.count != null) total = result.count;
    const rows = result.data || [];
    data.push(...rows);
    if (total != null && data.length >= total) return { data, error: null, truncated: false };
    if (!rows.length) return { data, error: null, truncated: total != null && data.length < total };
    if (total == null && rows.length < requested) return { data, error: null, truncated: false };
  }
  return { data, error: null, truncated: total == null || data.length < total };
}
