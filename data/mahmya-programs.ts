import type { Tour } from "@/data/tours";
import type { Locale } from "@/lib/i18n";

const included = ["Boat transfer to/from the island", "Beach use with a reserved shaded seating area", "Mahmya towel"];
const lunch = "Buffet-style lunch (free water and soft drinks during mealtime)";
const snorkeling = "Snorkeling trip by boat to Sabina Reef, including equipment";
const aLaCarte = "Food and drinks from the à la carte menu";

export const mahmyaEnglish = {
  title: "Mahmya Island Snorkeling Boat Trip from Hurghada",
  currency: "EUR",
  fulfillmentType: "meeting_point",
  departureMarina: "Mahmya Beach Marina, Hurghada",
  price: "38",
  participantPricing: { adults: 38, youth: 19, infants: 0 },
  ageBands: { adults: "Adults (7+)", children: "Children (3–6)", infants: "Infants (under 3)" },
  description: "Enjoy Mahmya's white sandy beach and clear Red Sea water. Choose Day Use, Day Use + Lunch, or the Full Program with lunch and a Sabina Reef snorkeling trip.",
  highlights: ["Three program options", "Boat transfer to/from Mahmya", "Reserved shaded beach seating", "Mahmya towel", "Buffet lunch with the lunch and full programs", "Sabina Reef snorkeling with equipment in the full program"],
  included,
  notIncluded: [aLaCarte, "Buffet-style lunch", "Snorkeling trip"],
  packageName: "Day Use Program",
  packageDescription: "Boat transfer, beach use with reserved shaded seating, and a Mahmya towel.",
  packagePrice: "38",
  packageLabel: "Per adult",
  additionalPackages: [
    { name: "Day Use Program + Lunch", description: "The Day Use Program plus buffet-style lunch with free water and soft drinks during mealtime.", price: "60", youthPrice: 30, label: "Per adult", included: [...included, lunch], notIncluded: [aLaCarte, "Snorkeling trip"] },
    { name: "Full Program", description: "The Day Use Program plus buffet lunch and a boat snorkeling trip to Sabina Reef, including equipment.", price: "85", youthPrice: 42.5, label: "Per adult", included: [...included, lunch, snorkeling], notIncluded: [aLaCarte] },
  ],
  notes: ["Choose your program before booking. Lunch and snorkeling depend on the selected program.", "Children aged 7 and above pay the adult rate; children aged 3–6 pay the child rate; infants under 3 are free.", "Bring swimwear and sunscreen. A Mahmya towel is included."],
  itinerary: ["Boat transfer to Mahmya", "Beach time with reserved shaded seating", "Buffet lunch if included in your selected program", "Sabina Reef snorkeling if you choose the Full Program", "Boat transfer back from the island"],
  seoTitle: "Mahmya Island from Hurghada | 3 Programs from €38",
  metaDescription: "Choose Mahmya Day Use (€38), Day Use + Lunch (€60), or Full Program with Sabina Reef snorkeling (€85). Child prices available.",
} satisfies Partial<Tour>;

// Replace the legacy translations that promised lunch and snorkeling in every package.
const translations = {
  de: {
    title: "Mahmya Island Bootsausflug ab Hurghada",
    names: ["Tagesprogramm", "Tagesprogramm + Mittagessen", "Komplettprogramm"],
    items: ["Bootstransfer zur Insel und zurück", "Strandnutzung mit reserviertem schattigem Sitzbereich", "Mahmya-Handtuch", "Mittagsbuffet mit kostenlosem Wasser und Softdrinks während der Mahlzeit", "Schnorchelausflug per Boot zum Sabina-Riff inklusive Ausrüstung", "Speisen und Getränke à la carte"],
    description: "Wähle einen Strandtag, einen Strandtag mit Mittagessen oder das Komplettprogramm mit Mittagessen und Schnorcheln am Sabina-Riff.",
    ageBands: { adults: "Erwachsene (ab 7)", children: "Kinder (3–6)", infants: "Kleinkinder (unter 3)" }, label: "Pro Erwachsenem",
  },
  ru: {
    title: "Морская прогулка на остров Махмия из Хургады",
    names: ["Дневная программа", "Дневная программа + обед", "Полная программа"],
    items: ["Трансфер на лодке на остров и обратно", "Пляж с зарезервированным местом в тени", "Полотенце Mahmya", "Обед-буфет с бесплатной водой и безалкогольными напитками во время еды", "Сноркелинг с лодки на рифе Сабина со снаряжением", "Еда и напитки по меню à la carte"],
    description: "Выберите пляжный день, программу с обедом или полную программу с обедом и сноркелингом на рифе Сабина.",
    ageBands: { adults: "Взрослые (от 7 лет)", children: "Дети (3–6 лет)", infants: "Малыши (до 3 лет)" }, label: "За взрослого",
  },
  ar: {
    title: "رحلة جزيرة محمية البحرية من الغردقة",
    names: ["برنامج اليوم الواحد", "برنامج اليوم الواحد + الغداء", "البرنامج الكامل"],
    items: ["الانتقال بالقارب من وإلى الجزيرة", "استخدام الشاطئ مع مكان جلوس مظلل محجوز", "منشفة محمية", "غداء بوفيه مع مياه ومشروبات غازية مجانية أثناء الوجبة", "رحلة سنوركلينج بالقارب إلى شعاب سابينا تشمل المعدات", "المأكولات والمشروبات من قائمة الطلبات الفردية"],
    description: "اختر يوم الشاطئ، أو يوم الشاطئ مع الغداء، أو البرنامج الكامل مع الغداء والسنوركلينج في شعاب سابينا.",
    ageBands: { adults: "بالغون (7 سنوات فأكثر)", children: "أطفال (3–6 سنوات)", infants: "رضّع (أقل من 3 سنوات)" }, label: "لكل بالغ",
  },
  zh: {
    title: "赫尔格达出发 Mahmya 岛游船之旅",
    names: ["日间项目", "日间项目 + 午餐", "完整项目"],
    items: ["岛屿往返游船接送", "海滩使用及预留遮阳座位", "Mahmya 毛巾", "自助午餐（用餐期间免费提供水和软饮）", "乘船前往 Sabina 礁浮潜，含装备", "单点菜单中的餐饮"],
    description: "可选择海滩日游、含午餐日游，或含午餐和 Sabina 礁浮潜的完整项目。",
    ageBands: { adults: "成人（7岁及以上）", children: "儿童（3–6岁）", infants: "婴儿（3岁以下）" }, label: "每位成人",
  },
  pl: {
    title: "Rejs na wyspę Mahmya z Hurghady",
    names: ["Program dzienny", "Program dzienny + lunch", "Pełny program"],
    items: ["Transfer łodzią na wyspę i z powrotem", "Plaża z zarezerwowanym miejscem w cieniu", "Ręcznik Mahmya", "Lunch w formie bufetu z bezpłatną wodą i napojami bezalkoholowymi podczas posiłku", "Snorkeling z łodzi przy rafie Sabina ze sprzętem", "Jedzenie i napoje z menu à la carte"],
    description: "Wybierz dzień na plaży, program z lunchem lub pełny program z lunchem i snorkelingiem przy rafie Sabina.",
    ageBands: { adults: "Dorośli (od 7 lat)", children: "Dzieci (3–6 lat)", infants: "Niemowlęta (poniżej 3 lat)" }, label: "Za dorosłego",
  },
};

export function localizeMahmya(tour: Tour, locale: Locale): Tour {
  if (tour.slug !== "mahmya-island" || locale === "en") return tour;
  const copy = translations[locale];
  const [boat, beach, towel, meal, reef, menu] = copy.items;
  const base = [boat, beach, towel];
  const packages = tour.additionalPackages?.map((pkg, index) => ({ ...pkg, name: copy.names[index + 1], description: index === 0 ? meal : `${meal}. ${reef}.`, label: copy.label, included: index === 0 ? [...base, meal] : [...base, meal, reef], notIncluded: index === 0 ? [menu, reef] : [menu] }));
  return { ...tour, title: copy.title, description: copy.description, highlights: [boat, beach, towel, copy.description], included: base, notIncluded: [menu, meal, reef], packageName: copy.names[0], packageDescription: base.join(". "), packageLabel: copy.label, additionalPackages: packages, ageBands: copy.ageBands, notes: [copy.description], itinerary: [boat, beach, copy.description], seoTitle: copy.title, metaDescription: copy.description };
}
