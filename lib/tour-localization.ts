const germanTourTitles: Record<string, string> = {
  "orange-bay": "Orange Bay Bootstour mit Schnorcheln",
  safari: "Wüstensafari-Abenteuer",
  "professional-underwater-photographer": "Professioneller Unterwasserfotograf",
  "luxor-private-day-trip": "Privater Tagesausflug nach Luxor ab Hurghada",
  "mahmya-island": "Mahmya Island Bootstour",
  "full-day-snorkeling": "Ganztägige Schnorcheltour",
  "full-day-diving": "Ganztägige Tauchtour",
  "quad-safari-morning": "Quad-Safari am Morgen",
  "quad-safari-sunset": "Quad-Safari bei Sonnenuntergang",
  "hurghada-airport-transfer": "Privater Flughafentransfer Hurghada",
  "senzo-transfer": "Privater Transfer zur Senzo Mall",
};

export function germanTourTitle(slug: string, fallback: string) {
  return germanTourTitles[slug] || fallback;
}
