import path from "node:path";
import type { Locale } from "@/lib/i18n";

/** Embedded Unicode faces per script family, registered under the shared "Noto" font name. */
export const notoFontPath = (locale: Locale) =>
  path.join(process.cwd(), "assets/fonts", locale === "ar" ? "NotoSansArabic.ttf" : locale === "zh" ? "NotoSansSC.ttf" : "NotoSans.ttf");
