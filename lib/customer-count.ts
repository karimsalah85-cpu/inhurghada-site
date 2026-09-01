type CustomerRecord = {
  phone?: string | null;
  customer_email?: string | null;
  reference?: string | null;
};

/**
 * Counts distinct customers by merging records that share a phone OR an email,
 * even transitively — e.g. booking A (phone only) + booking B (same phone, plus an
 * email) + booking C (that email only, no phone) are all the same customer, even
 * though A and C alone share no identifier.
 */
export function countDistinctCustomers(records: CustomerRecord[]) {
  const parent = new Map<string, string>();
  const find = (key: string): string => {
    let root = key;
    while (parent.has(root) && parent.get(root) !== root) root = parent.get(root)!;
    let current = key;
    while (parent.has(current) && parent.get(current) !== root) {
      const next = parent.get(current)!;
      parent.set(current, root);
      current = next;
    }
    return root;
  };
  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };
  const ensure = (key: string) => {
    if (!parent.has(key)) parent.set(key, key);
  };

  const singletons: string[] = [];
  for (const [index, record] of records.entries()) {
    const phone = record.phone?.replace(/\D/g, "") || "";
    const email = record.customer_email?.trim().toLowerCase() || "";
    if (!phone && !email) {
      singletons.push(`booking:${record.reference || index}`);
      continue;
    }
    const phoneKey = phone ? `phone:${phone}` : "";
    const emailKey = email ? `email:${email}` : "";
    if (phoneKey) ensure(phoneKey);
    if (emailKey) ensure(emailKey);
    if (phoneKey && emailKey) union(phoneKey, emailKey);
  }

  const roots = new Set<string>();
  for (const key of parent.keys()) roots.add(find(key));
  return roots.size + singletons.length;
}
