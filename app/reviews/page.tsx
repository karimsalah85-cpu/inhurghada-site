import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { MessageSquareText, ShieldCheck } from "lucide-react";
import { googleReviewUrl } from "@/lib/contact";
import GoogleReviews from "@/components/reviews/GoogleReviews";
import TripReviewForm from "@/components/reviews/TripReviewForm";

export const metadata: Metadata = {
  title: "Review Your Trip | Daily Red Sea",
  description: "Share your experience after a Daily Red Sea tour, activity or transfer.",
  robots: { index: false, follow: true },
};

const copy = {
  en: { eyebrow: "Post-trip feedback", title: "Review your Daily Red Sea trip", intro: "Thank you for travelling with us. Your honest feedback helps future guests and helps our team improve every experience.", rateHeading: "Rate the trip you booked", rateNote: "This review is checked by our team and shown on the trip’s own page once approved. It’s only open to guests with a completed booking.", googleHeading: "Prefer Google?", googleCta: "Write your Google review", googleNote: "Reviews are submitted directly to Google under Google’s policies. Daily Red Sea cannot edit your review.", back: "Return to tours" },
  de: { eyebrow: "Feedback nach dem Ausflug", title: "Bewerte deinen Ausflug mit Daily Red Sea", intro: "Danke, dass du mit uns unterwegs warst. Dein ehrliches Feedback hilft künftigen Gästen und unserem Team, jedes Erlebnis zu verbessern.", rateHeading: "Bewerte den gebuchten Ausflug", rateNote: "Diese Bewertung wird von unserem Team geprüft und nach der Freigabe auf der Seite des Ausflugs angezeigt. Sie ist nur für Gäste mit einer abgeschlossenen Buchung möglich.", googleHeading: "Lieber über Google?", googleCta: "Google-Bewertung schreiben", googleNote: "Bewertungen werden direkt bei Google gemäß den Google-Richtlinien eingereicht. Daily Red Sea kann deine Bewertung nicht bearbeiten.", back: "Zurück zu den Ausflügen" },
  ru: { eyebrow: "Отзыв о поездке", title: "Оцените поездку с Daily Red Sea", intro: "Спасибо, что путешествовали с нами. Ваш честный отзыв помогает будущим гостям и нашей команде улучшать каждую поездку.", rateHeading: "Оцените забронированную поездку", rateNote: "Отзыв проверяется нашей командой и после одобрения публикуется на странице поездки. Оставить его могут только гости с завершённым бронированием.", googleHeading: "Предпочитаете Google?", googleCta: "Написать отзыв в Google", googleNote: "Отзывы публикуются напрямую в Google по правилам Google. Daily Red Sea не может редактировать ваш отзыв.", back: "Вернуться к экскурсиям" },
  ar: { eyebrow: "رأيك بعد الرحلة", title: "قيّم رحلتك مع Daily Red Sea", intro: "شكراً لسفرك معنا. رأيك الصادق يساعد الضيوف الآخرين ويساعد فريقنا على تحسين كل تجربة.", rateHeading: "قيّم الرحلة التي حجزتها", rateNote: "يراجع فريقنا هذا التقييم ويظهر على صفحة الرحلة بعد الموافقة عليه. وهو متاح فقط للضيوف الذين لديهم حجز مكتمل.", googleHeading: "تفضّل عبر Google؟", googleCta: "اكتب تقييمك على Google", googleNote: "تُرسل التقييمات مباشرة إلى Google وفق سياسات Google. لا يمكن لـ Daily Red Sea تعديل تقييمك.", back: "العودة إلى الرحلات" },
  pl: { eyebrow: "Opinia po wycieczce", title: "Oceń swoją wycieczkę z Daily Red Sea", intro: "Dziękujemy za podróż z nami. Twoja szczera opinia pomaga przyszłym gościom i naszemu zespołowi ulepszać każde doświadczenie.", rateHeading: "Oceń zarezerwowaną wycieczkę", rateNote: "Opinia jest sprawdzana przez nasz zespół i po zatwierdzeniu pojawia się na stronie wycieczki. Mogą ją dodać tylko goście z zakończoną rezerwacją.", googleHeading: "Wolisz Google?", googleCta: "Napisz opinię w Google", googleNote: "Opinie są przesyłane bezpośrednio do Google zgodnie z zasadami Google. Daily Red Sea nie może edytować Twojej opinii.", back: "Wróć do wycieczek" },
  zh: { eyebrow: "行程后反馈", title: "评价您的 Daily Red Sea 行程", intro: "感谢您与我们同行。您的真实反馈能帮助其他客人，也帮助我们的团队改进每一次体验。", rateHeading: "评价您预订的行程", rateNote: "该评价由我们的团队审核，通过后会显示在对应行程页面。仅限已完成预订的客人提交。", googleHeading: "想用 Google？", googleCta: "撰写 Google 评价", googleNote: "评价将根据 Google 政策直接提交至 Google。Daily Red Sea 无法编辑您的评价。", back: "返回行程列表" },
};

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ ref?: string; email?: string; lang?: string }> }) {
  const params = await searchParams;
  // This route has no /<locale> path prefix, so the proxy always reports "en".
  // A ?lang= hint (set on review links and in the review-request email) wins.
  const requested = params.lang || (await headers()).get("x-daily-red-sea-locale") || "en";
  const locale = (["en", "ar", "de", "ru", "pl", "zh"].includes(requested) ? requested : "en") as keyof typeof copy;
  const t = copy[locale];
  const rtl = locale === "ar";
  return <main dir={rtl ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 px-6 pb-20 pt-32">
    <GoogleReviews className="mx-auto mb-10 max-w-6xl" />
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-xl">
      <div className="bg-slate-950 p-8 text-white sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">{t.eyebrow}</p>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">{t.title}</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-300">{t.intro}</p>
      </div>
      <div className="space-y-8 p-8 sm:p-12">
        <div>
          <h2 className="font-black text-slate-950">{t.rateHeading}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t.rateNote}</p>
          <div className="mt-4"><TripReviewForm initialReference={params.ref || ""} initialEmail={params.email || ""} locale={locale} /></div>
        </div>
        <div className="border-t border-slate-100 pt-8">
          <h2 className="font-black text-slate-950">{t.googleHeading}</h2>
          <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white hover:bg-blue-800"><MessageSquareText size={21}/>{t.googleCta}</a>
          <div className="mt-3 flex items-start gap-3 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={19}/><p>{t.googleNote}</p></div>
        </div>
        <Link href="/#tours" className="block text-center font-bold text-cyan-800 hover:underline">{t.back}</Link>
      </div>
    </section>
  </main>;
}
