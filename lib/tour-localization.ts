import type { Tour } from "@/data/tours";

const germanTourOverrides: Record<string, Partial<Tour>> = {
  "orange-bay": {
    title: "Orange Bay Hurghada Bootstour mit Schnorcheln", location: "Hurghada, Ägypten", duration: "8 Stunden", category: "Inselausflug",
    description: "Sichere dir deine Orange Bay Hurghada Tickets für einen entspannten Tag auf dem Roten Meer: komfortable Bootstour, zwei Schnorchelstopps an farbenfrohen Korallenriffen, Mittagessen an Bord und Freizeit am weißen Sandstrand.",
    highlights: ["Orange Bay Island und Strandzeit", "Hurghada Bootstour auf einer komfortablen Yacht", "Zwei Schnorchelstopps an Korallenriffen", "Schwimmen im türkisfarbenen Wasser", "Mittagessen und Getränke an Bord"],
    included: ["Hotelabholung und Rücktransfer", "Bootsfahrt", "Eintritt zur Orange Bay", "Zwei Schnorchelstopps", "Schnorchelausrüstung", "Mittagessen und alkoholfreie Getränke", "Crew und Sicherheitsausrüstung"],
    notIncluded: ["Unterwasserfotos und Videos", "Strandtücher", "Badebekleidung", "Sonnenschutz"],
    notes: ["Die genaue Abholzeit bestätigen wir nach der Buchung per WhatsApp.", "Nimm deinen Reisepass oder eine Kopie für die Hafengenehmigung mit.", "Bring Badebekleidung, Handtuch und Sonnenschutz mit."],
    packageName: "Orange Bay Hurghada Bootstour", packageDescription: "Ganztägige Bootstour zur Orange Bay mit Schnorcheln, Mittagessen und Hoteltransfer.", packageLabel: "Erwachsene",
    itinerary: ["Abholung vom Hotel und Fahrt zum Hafen", "Bootsfahrt über das Rote Meer", "Zwei Schnorchelstopps", "Freizeit am Strand der Orange Bay", "Mittagessen an Bord und Rückfahrt"],
  },
  safari: {
    title: "Wüstensafari-Abenteuer", location: "Wüste bei Hurghada", duration: "5 Stunden", category: "Wüstensafari",
    description: "Erlebe die Wüste bei einer abwechslungsreichen Quad Tour Hurghada mit Kamelritt, Beduinendorf, Tee und eindrucksvoller Abendstimmung.",
    highlights: ["Quadfahrt", "Kamelritt", "Beduinentee", "Sonnenuntergang in der Wüste"], availableTimes: ["Nachmittags – genaue Abholung per WhatsApp"],
  },
  "professional-underwater-photographer": {
    title: "Professioneller Unterwasserfotograf", location: "Hurghada, Ägypten", duration: "Ganzer Tag",
    description: "Halte dein Abenteuer am Roten Meer mit einem eigenen professionellen Unterwasserfotografen fest – beim Tauchen, Schnorcheln, auf einer Bootstour und über Wasser.",
    highlights: ["Eigener professioneller Fotograf", "Unterwasser- und Oberflächenaufnahmen", "Ideal für Tauch- und Schnorcheltage", "Professionell bearbeitete Erinnerungen"],
    included: ["Fotograf für einen ganzen Tag", "Unterwasser-Fotoausrüstung", "Bearbeitete digitale Bildauswahl", "Abstimmung mit deinem Ausflug"],
    notIncluded: ["Gebühren für die gebuchte Aktivität", "Hoteltransfer, sofern nicht vereinbart", "Fotoalbum und zusätzliche Bearbeitung"],
    notes: ["Frühzeitig buchen, da die Verfügbarkeit begrenzt ist.", "Teile Aktivität und Abfahrtszeit bei der Buchung mit.", "Der Preis gilt pro Fotograf und Tag."],
    packageName: "Ganztägiger Unterwasser-Fotoservice", packageDescription: "Ein professioneller Fotograf begleitet dein Erlebnis am Roten Meer einen ganzen Tag.", packageLabel: "Pro Tag", priceUnit: "pro Tag",
    availableTimes: ["Startzeit wird per WhatsApp bestätigt"], itinerary: ["Aktivität, Treffpunkt und Bildstil abstimmen", "Fotograf vor der Abfahrt treffen", "Aufnahmen über und unter Wasser", "Bearbeitete digitale Bilder erhalten"],
  },
  "luxor-private-day-trip": {
    title: "Privater Tagesausflug nach Luxor ab Hurghada", location: "Luxor, Ägypten", duration: "Etwa 1 Tag", category: "Kultureller Tagesausflug",
    description: "Entdecke Luxor privat ab Hurghada mit klimatisiertem Fahrzeug und eigenem Ägyptologen. Besuche das Tal der Könige, den Hatschepsut-Tempel, die Memnonkolosse und Karnak; Hotelabholung, Eintritt und Mittagessen sind inklusive.",
    highlights: ["Privates Fahrzeug und eigener Reiseführer", "Drei Königsgräber im Tal der Könige", "Hatschepsut-Tempel und Memnonkolosse", "Karnak-Tempel", "Sonderpreis für Familien und Gruppen", "Kostenlose Stornierung bis 24 Stunden vorher"],
    included: ["Private Abholung und Rückfahrt", "Klimatisiertes Fahrzeug", "Drei Standardgräber im Tal der Könige", "Hatschepsut-Tempel, Memnonkolosse und Karnak", "Eintrittsgelder", "Englischsprachiger Ägyptologe", "Mittagessen mit vegetarischer Option", "Mineralwasser und Genehmigungen"],
    notIncluded: ["Grab Tutanchamuns – etwa 30 $ Aufpreis", "Deutsch- und weitere fremdsprachige Reiseführer – Aufpreis", "Getränke", "Optionale Felukenfahrt", "Trinkgeld"],
    notes: ["Ein gültiger Ausweis oder Reisepass ist erforderlich.", "120 $ ist der Startpreis pro Erwachsenen; Familien- und Gruppenpreis auf Anfrage.", "Abholung etwa um 05:00 Uhr, Bestätigung per WhatsApp.", "Alle Zeiten sind Richtwerte."],
    packageName: "Privater Luxor-Tagesausflug", packageDescription: "Privater Luxor-Tag mit Transport, Ägyptologen, wichtigen Eintrittsgeldern, drei Königsgräbern und Mittagessen.", packageLabel: "Startpreis pro Erwachsenen",
    itinerary: ["05:00 – Private Hotelabholung", "09:30 – Tal der Könige", "11:30 – Memnonkolosse", "12:30 – Hatschepsut-Tempel", "13:30 – Mittagessen", "14:45 – Karnak-Tempel", "17:00 – Rückfahrt"],
  },
  "mahmya-island": {
    title: "Mahmya Island Bootstour", location: "Hurghada, Ägypten", duration: "Ganzer Tag", category: "Inselausflug",
    description: "Genieße einen hochwertigen Inseltag im Giftun-Nationalpark mit weißem Sand, kristallklarem Wasser, Schnorcheln, Bootsfahrt und Mittagessen.",
    highlights: ["Premium-Inselerlebnis", "Weißer Sandstrand", "Kristallklares Wasser", "Schnorcheln", "Mittagessen", "Hoteltransfer"],
    included: ["Hotelabholung und Rückfahrt", "Bootsfahrt", "Inseleintritt", "Mittagessen", "Alkoholfreie Getränke"], notIncluded: ["Persönliche Ausgaben", "Fotos und Videos"],
    notes: ["Abholzeit wird per WhatsApp bestätigt.", "Badebekleidung, Sonnenschutz und Handtuch mitbringen."],
    packageName: "Mahmya Island Tagesausflug", packageDescription: "Premium-Inseltag mit Abholung, Bootsfahrt und Mittagessen.", packageLabel: "Pro Person", itinerary: ["Hotelabholung", "Bootsfahrt", "Strandzeit", "Mittagessen", "Rückfahrt"],
  },
  "full-day-snorkeling": {
    title: "Ganztägige Schnorcheltour", location: "Hurghada, Ägypten", duration: "8 Stunden", category: "Schnorcheln",
    description: "Entdecke bei dieser ganztägigen Hurghada Bootstour lokale Korallenriffe. Der Kapitän wählt je nach Wind und Meer die besten Schnorchelplätze aus.",
    highlights: ["Zwei Schnorchelstopps", "Korallenriffe im Roten Meer", "Mittagsbuffet", "Getränke", "Hotelabholung", "Professionelle Begleitung"],
    included: ["Hotelabholung", "Bootsfahrt", "Schnorchelausrüstung", "Mittagessen", "Alkoholfreie Getränke"], notIncluded: ["Inselbesuch", "Persönliche Ausgaben"],
    notes: ["Kein Inselbesuch enthalten.", "Die Plätze richten sich nach Wetter und Seegang."], packageName: "Ganztägiges Riff-Schnorcheln", packageDescription: "Bootstag mit zwei Schnorchelstopps und Mittagessen.", packageLabel: "Pro Person",
  },
  "full-day-diving": {
    title: "Ganztägige Tauchtour", location: "Hurghada, Ägypten", duration: "8 Stunden", category: "Tauchen",
    description: "Entdecke die Unterwasserwelt des Roten Meeres bei zwei geführten Tauchgängen. Die Tauchplätze werden passend zu Wetter und Seegang ausgewählt.",
    highlights: ["Zwei geführte Tauchgänge", "Professioneller Tauchlehrer", "Mittagessen an Bord", "Hoteltransfer", "Ausrüstung zubuchbar"],
    included: ["Hoteltransfer", "Bootsfahrt", "Tauchlehrer", "Mittagessen", "Getränke"], notIncluded: ["Tauchausrüstung – für 30 $ zubuchbar", "Persönliche Ausgaben"],
    notes: ["Ausrüstung ist nicht im Grundpreis enthalten.", "Tauchplätze richten sich nach Wetter und Seegang."], packageName: "Zwei geführte Tauchgänge", packageDescription: "Ganztägige Bootstour mit zwei Tauchgängen.", packageLabel: "Pro Person",
  },
  "quad-safari-morning": {
    title: "Quad Tour Hurghada am Morgen", location: "Wüste bei Hurghada", duration: "5 Stunden", category: "Wüstensafari",
    description: "Starte den Tag mit einer Quad Tour Hurghada durch die östliche Wüste, vorbei an Bergpanoramen bis zu einem traditionellen Beduinencamp.",
    highlights: ["Quadfahrt", "Wüstenabenteuer", "Beduinencamp", "Tee", "Bergpanorama"], included: ["Hotelabholung", "Quadfahrt", "Sicherheitseinweisung", "Beduinentee"],
    notIncluded: ["Schal und Schutzbrille falls benötigt", "Persönliche Ausgaben"], notes: ["Sicherheitseinweisung ist verbindlich.", "Sonnenbrille und geschlossene Schuhe mitbringen."],
    packageName: "Quad-Safari am Morgen", packageDescription: "Morgendliche Wüstenfahrt mit Beduinencamp.", packageLabel: "Pro Person",
  },
  "quad-safari-sunset": {
    title: "Quad Tour Hurghada bei Sonnenuntergang", location: "Wüste bei Hurghada", duration: "5 Stunden", category: "Wüstensafari",
    description: "Fahre bei Sonnenuntergang mit dem Quad durch die Berglandschaft der Hurghada-Wüste und genieße anschließend traditionelle Gastfreundschaft im Beduinencamp.",
    highlights: ["Fahrt bei Sonnenuntergang", "Quad", "Beduinencamp", "Tee", "Wüstenpanorama"], included: ["Hotelabholung", "Quadfahrt", "Sicherheitseinweisung", "Beduinentee"],
    notIncluded: ["Persönliche Ausgaben"], notes: ["Abholung am Nachmittag, abhängig von der Sonnenuntergangszeit; genaue Zeit per WhatsApp.", "Sonnenbrille und geschlossene Schuhe mitbringen."],
    packageName: "Quad-Safari bei Sonnenuntergang", packageDescription: "Wüstenfahrt im Abendlicht mit Beduinen-Gastfreundschaft.", packageLabel: "Pro Person", availableTimes: ["Nachmittags – genaue Abholung per WhatsApp"],
  },
  "hurghada-airport-transfer": {
    title: "Privater Flughafentransfer Hurghada", location: "Internationaler Flughafen Hurghada", duration: "Flexibel", category: "Flughafentransfer",
    description: "Zuverlässiger Flughafentransfer Hurghada zum Festpreis: 20 $ pro Strecke innerhalb Hurghadas, plus 7 $ für Makadi Bay, Soma Bay, El Gouna oder Sahl Hasheesh.",
    highlights: ["Fester Preis pro Strecke", "Empfang am Flughafen", "Flugüberwachung", "Privates klimatisiertes Fahrzeug", "Passende Fahrzeuggröße"],
    included: ["Privatfahrzeug", "Fahrer", "Kraftstoff und Parkgebühren"], notIncluded: ["Zusätzliche Stopps", "Rückfahrt"],
    notes: ["1–2 Personen: Kleinwagen mit maximal 2 Koffern.", "Ab 3 Personen: größeres Fahrzeug mit bis zu 2 Koffern pro Person.", "Flugnummer und Hotel bei der Buchung angeben."],
    packageName: "Flughafentransfer pro Strecke", packageDescription: "20 $ innerhalb Hurghadas; 7 $ Zuschlag für die Ferienorte.", packageLabel: "Festpreis pro Strecke", availableTimes: ["Zeit wird anhand der Flugdaten bestätigt"],
  },
  "senzo-transfer": {
    title: "Privater Transfer zur Senzo Mall", location: "Hurghada, Ägypten", duration: "Flexibel", category: "Shopping-Transfer",
    description: "Privater Senzo-Mall-Transfer zum Festpreis: 10 $ pro Strecke innerhalb Hurghadas, plus 7 $ für Makadi Bay, Soma Bay, El Gouna oder Sahl Hasheesh.",
    highlights: ["Fester Preis pro Strecke", "Privatfahrzeug", "Hotelabholung", "Flexible Uhrzeit", "Klimatisiertes Auto"],
    included: ["Privater Transfer", "Fahrer", "Kraftstoff und Parkgebühren"], notIncluded: ["Rückfahrt", "Reisekoffer", "Einkäufe und Mahlzeiten"],
    notes: ["Maximal 4 Personen.", "Bei diesem Service sind keine Reisekoffer möglich.", "Hin- und Rückfahrt getrennt buchen."],
    packageName: "Senzo Mall Transfer pro Strecke", packageDescription: "10 $ innerhalb Hurghadas; 7 $ Zuschlag für die Ferienorte.", packageLabel: "Festpreis pro Strecke", availableTimes: ["Wunschzeit wird per WhatsApp bestätigt"],
  },
};

export function germanTourTitle(slug: string, fallback: string) {
  return germanTourOverrides[slug]?.title || fallback;
}

export function localizeTourGerman(tour: Tour): Tour {
  return { ...tour, ...germanTourOverrides[tour.slug] };
}
