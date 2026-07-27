import type { Tour } from "@/data/tours";

const tourAliases: Record<string, string[]> = {
  "orange-bay": ["island beach boat cruise orange bay insel strand boot", "остров пляж лодка оранж бэй", "wyspa plaża rejs", "جزيرة شاطئ قارب", "海岛 海滩 游船"],
  "mahmya-island": ["mahmya island beach boat insel strand boot", "махмия остров пляж лодка", "wyspa plaża rejs", "جزيرة شاطئ قارب", "海岛 海滩 游船"],
  "full-day-snorkeling": ["snorkeling snorkelling reef coral schnorcheln riff korallen", "снорклинг риф кораллы", "snorkeling rafa koralowa", "سنوركلينج شعاب مرجانية", "浮潜 珊瑚礁"],
  "full-day-diving": ["diving scuba dive tauchen", "дайвинг погружение", "nurkowanie", "غوص", "潜水"],
  "professional-underwater-photographer": ["underwater photographer photo diving unterwasser fotograf", "подводный фотограф фото дайвинг", "fotograf podwodny", "تصوير تحت الماء", "水下 摄影"],
  "safari": ["desert safari quad camel wüste kamel", "пустыня сафари квадроцикл верблюд", "pustynia safari quad", "صحراء سفاري كواد جمل", "沙漠 探险 四轮摩托"],
  "quad-safari-morning": ["desert safari quad morning wüste morgens", "пустыня сафари квадроцикл утро", "pustynia safari quad rano", "صحراء سفاري كواد صباح", "沙漠 四轮摩托 上午"],
  "quad-safari-sunset": ["desert safari quad sunset wüste sonnenuntergang", "пустыня сафари квадроцикл закат", "pustynia safari quad zachód słońca", "صحراء سفاري كواد غروب", "沙漠 四轮摩托 日落"],
  "luxor-private-day-trip": ["luxor history temple cultural historical geschichte tempel", "луксор история храм", "luksor historia świątynia", "الأقصر تاريخ معبد", "卢克索 历史 神庙"],
  "hurghada-airport-transfer": ["airport hotel transfer taxi flughafen", "аэропорт отель трансфер такси", "lotnisko hotel transfer", "مطار فندق انتقال", "机场 酒店 接送"],
  "senzo-transfer": ["senzo mall transfer taxi shopping einkaufszentrum", "сензо молл трансфер такси", "senzo centrum handlowe transfer", "سنزو مول انتقال", "森佐 商场 接送"],
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();
}

export function tourMatchesSearch(tour: Tour, query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const searchable = normalize([
    tour.title,
    tour.description,
    tour.location,
    tour.duration,
    tour.category,
    tour.badge,
    ...(tour.highlights || []),
    ...(tour.included || []),
    ...(tour.notIncluded || []),
    ...(tourAliases[tour.slug] || []),
  ].filter(Boolean).join(" "));
  return words.every((word) => searchable.includes(word));
}

export function filterTours(tours: Tour[], query: string) {
  return tours.filter((tour) => tourMatchesSearch(tour, query));
}
