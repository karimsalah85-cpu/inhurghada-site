import Link from "next/link";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { localePath } from "@/lib/i18n";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Daily Red Sea tours and transfer bookings.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage({ locale = "en" }: { locale?: "en" | "de" | "ru" | "ar" | "zh" }) {
  const de = locale === "de";
  const zh = locale === "zh";
  return (
    <main className="mx-auto max-w-5xl px-6 py-24 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700">{de ? "Rechtliches" : zh ? "法律信息" : "Legal"}</p>
        <h1 className="mt-4 text-4xl font-black text-slate-900">{de ? "Datenschutzerklärung" : zh ? "隐私政策" : "Privacy Policy"}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          {de ? "Diese Datenschutzerklärung erläutert, wie Daily Red Sea personenbezogene Daten bei der Buchung eines Ausflugs oder Transfers erhebt, verwendet und schützt." : zh ? "本隐私政策说明 Daily Red Sea 在您预订旅游或接送服务时如何收集、使用和保护您的个人信息。" : "This privacy policy explains how Daily Red Sea collects, uses, and protects your personal information when you book a tour or transfer."}
        </p>
        <div className="mt-10 space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Erhobene Informationen" : zh ? "我们收集的信息" : "Information we collect"}</h2>
            <p className="mt-3 leading-8">{de ? "Wir erheben Name, Telefonnummer, E-Mail-Adresse, Reisedatum, Hotel- oder Abholdetails und Buchungswünsche, wenn du eine Anfrage oder Buchung sendest." : zh ? "当您提交咨询或预订请求时，我们会收集姓名、电话号码、电子邮箱、出行日期、酒店或接送详情以及预订偏好。" : "We collect your name, phone number, email address, travel date, hotel or pickup details, and booking preferences when you submit an inquiry or booking request."}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Verwendung der Daten" : zh ? "信息用途" : "How we use it"}</h2>
            <p className="mt-3 leading-8">{de ? "Wir verwenden die Daten, um Verfügbarkeit zu bestätigen, Abholungen zu koordinieren, über die Reise zu informieren und vor und nach der Buchung zu helfen." : zh ? "我们使用您的信息确认名额、协调接送、沟通行程，并在预订前后提供支持。" : "We use your information to confirm availability, coordinate pickups, communicate about your trip, and provide support before and after your booking."}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900">{de ? "Kontakt" : zh ? "联系我们" : "Contact"}</h2>
            <p className="mt-3 leading-8">{de ? "Bei Fragen zu dieser Erklärung kontaktiere uns per WhatsApp oder per E-Mail an info@dailyredsea.com." : zh ? "如对本政策有疑问，请通过 WhatsApp 或发送电子邮件至 info@dailyredsea.com 联系我们。" : "If you have questions about this policy, contact us on WhatsApp or by email at info@dailyredsea.com."}</p>
          </section>
        </div>
        <Link href={localePath(locale)} className="mt-10 inline-flex text-sm font-semibold text-cyan-700">← {de ? "Zur Startseite" : zh ? "返回首页" : "Back to home"}</Link>
      </div>
    </main>
  );
}
