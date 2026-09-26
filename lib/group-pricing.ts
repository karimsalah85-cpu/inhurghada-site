/** A per-person rate that applies once a booking reaches `minTravelers` paying travelers (adults + youth). */
export type GroupPriceTier = { minTravelers: number; pricePerPerson: number };

function sortedTiers(tiers: GroupPriceTier[]) {
  return [...tiers].sort((a, b) => a.minTravelers - b.minTravelers);
}

/**
 * The per-person rate for a group of `travelers`, or undefined when the tour has no group pricing.
 * Groups smaller than the first tier pay the first tier's rate; the booking form and the server
 * both price through this so the shown and charged totals never diverge.
 */
export function groupRate(tiers: GroupPriceTier[] | undefined, travelers: number) {
  if (!tiers?.length) return undefined;
  const sorted = sortedTiers(tiers);
  return sorted.filter((tier) => travelers >= tier.minTravelers).at(-1)?.pricePerPerson ?? sorted[0].pricePerPerson;
}

/** Tiers with display ranges ("1–3", "4–5", "6+"); the first tier also covers smaller groups. */
export function groupTierRanges(tiers: GroupPriceTier[]) {
  const sorted = sortedTiers(tiers);
  return sorted.map((tier, index) => {
    const from = index === 0 ? 1 : tier.minTravelers;
    const next = sorted[index + 1];
    const to = next ? next.minTravelers - 1 : undefined;
    return { ...tier, from, to, label: to === undefined ? `${from}+` : from === to ? `${from}` : `${from}–${to}` };
  });
}
