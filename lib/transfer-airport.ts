/** Recognise only the contracted Hurghada airport, including localized suggestions. */
export function isHurghadaAirport(value: string) {
  const normalized = value.normalize("NFKC").toLowerCase().replace(/[().,-]/g, " ").replace(/\s+/g, " ").trim();
  return [
    "hrg", "hurghada airport", "hurghada international airport", "hurghada international airport hrg",
    "hurghada airport hrg", "flughafen hurghada hrg", "flughafen hurghada",
    "международный аэропорт хургады hrg", "международный аэропорт хургады",
    "مطار الغردقة الدولي hrg", "مطار الغردقة الدولي", "مطار الغردقة",
    "międzynarodowe lotnisko w hurghadzie hrg", "międzynarodowe lotnisko w hurghadzie",
    "赫尔格达国际机场 hrg", "赫尔格达国际机场",
  ].includes(normalized);
}

/** Unknown airports cannot use a contracted Hurghada-to-hotel fare. */
export function hasUncontractedAirport(value: string) {
  return !isHurghadaAirport(value) && /\brmf\b|airport|flughafen|аэропорт|مطار|lotnisk|机场/i.test(value);
}
