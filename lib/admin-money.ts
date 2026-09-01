export const money = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);

export const sumByCurrency = (items: { amount: unknown; currency: string }[]) => {
  const totals: Record<string, number> = {};
  for (const item of items) totals[item.currency] = (totals[item.currency] || 0) + Number(item.amount);
  return totals;
};

/** Renders a per-currency total map as "$100.00 · EGP1,200.00", USD first, never blending currencies into one number. */
export const moneyBreakdown = (byCurrency: Record<string, number>) => {
  const entries = Object.entries(byCurrency).filter(([, amount]) => amount !== 0);
  if (!entries.length) return money(0);
  return entries
    .sort(([a], [b]) => (a === "USD" ? -1 : b === "USD" ? 1 : a.localeCompare(b)))
    .map(([currency, amount]) => money(amount, currency))
    .join(" · ");
};
