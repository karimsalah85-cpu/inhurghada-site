import type { Metadata } from "next";
import { CheckCircle2, ShieldAlert, Stethoscope } from "lucide-react";
import { certificationLabels, certificationLevels } from "@/lib/guest-requirements";
import { waiverErrorMessages, type WaiverError } from "@/lib/waiver";
import { getWaiverContent } from "@/lib/waiver-content";
import { loadWaiverBooking } from "@/lib/waiver-server";
import { verifyWaiverToken } from "@/lib/waiver-token";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diving waiver | Daily Red Sea",
  robots: { index: false, follow: false },
};

const pageErrors: Record<string, string> = {
  ...waiverErrorMessages,
  expired: "This waiver link has expired. Please ask Daily Red Sea on WhatsApp for a new one.",
  busy: "Too many attempts. Please wait a few minutes and try again.",
  cancelled: "This booking was cancelled, so no waiver is needed.",
  complete: "All waivers for this booking are already signed. If someone else is diving, please tell Daily Red Sea on WhatsApp.",
  missing: "We could not find this booking.",
  unavailable: "We could not save the waiver right now. Please try again in a minute, or contact us on WhatsApp.",
  invalid: "Something went wrong. Please try again.",
};

function formatDate(value: string | null) {
  if (!value) return "Date to be confirmed";
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-surface-muted px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-cta" aria-hidden="true" />
        <h1 className="mt-3 text-xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">{body}</p>
      </div>
    </main>
  );
}

const input = "mt-1 w-full rounded-xl border border-line bg-white p-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-ocean";

export default async function WaiverPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const { token } = await params;
  const { done, error } = await searchParams;
  const verified = verifyWaiverToken(token);
  const database = createAdminClient();
  if (!verified || !database) return <Message title="Link not recognised" body="This waiver link is not valid. Please contact Daily Red Sea on WhatsApp with your booking reference." />;
  const booking = await loadWaiverBooking(database, verified.reference);
  if (!booking) return <Message title="Link not recognised" body="This waiver link is not valid or the booking no longer exists. Please contact Daily Red Sea on WhatsApp." />;
  if (!booking.available) return <Message title="Waivers are not open yet" body="Online waivers are being set up. Please try again later, or sign the waiver at the dive centre on the day." />;
  if (booking.cancelled) return <Message title="Booking cancelled" body={pageErrors.cancelled} />;
  if (verified.expired) return <Message title="Link expired" body={pageErrors.expired} />;

  const content = getWaiverContent("en");
  const signedCount = booking.signed.length;
  const complete = signedCount >= booking.needed;
  const next = signedCount + 1;
  const action = `/api/waivers/${encodeURIComponent(token)}`;
  const errorMessage = error ? pageErrors[error as WaiverError] || pageErrors.invalid : null;

  return (
    <main className="min-h-screen bg-surface-muted px-4 py-8">
      <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="bg-primary px-5 py-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">Daily Red Sea · diving waiver</p>
          <h1 className="mt-1 text-xl font-extrabold leading-tight">{content.title}</h1>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-line px-5 py-4 text-sm">
          <div className="col-span-2"><dt className="text-xs text-muted">Trip</dt><dd className="font-semibold text-ink">{booking.tourName}</dd></div>
          <div><dt className="text-xs text-muted">Date</dt><dd className="font-semibold text-ink">{formatDate(booking.date)}</dd></div>
          <div><dt className="text-xs text-muted">Booking</dt><dd className="font-mono font-semibold text-primary">{booking.reference}</dd></div>
          <div className="col-span-2">
            <dt className="text-xs text-muted">Signatures</dt>
            <dd className="font-semibold text-ink">{Math.min(signedCount, booking.needed)} of {booking.needed} signed</dd>
            {signedCount ? <dd className="mt-1 text-muted">{booking.signed.map((row) => row.participantName).join(", ")}</dd> : null}
          </div>
        </dl>

        <div id="status">
          {done ? (
            <div role="status" className={`border-b border-line px-5 py-3 text-sm font-semibold ${done === "flagged" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}>
              {done === "flagged" ? <p className="flex gap-2"><Stethoscope className="h-5 w-5 shrink-0" aria-hidden="true" />Thank you, the waiver is signed. {content.medicalYesNote}</p>
                : done === "already" ? <p>This participant has already signed. Thank you!</p>
                : <p className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />Thank you — the waiver is signed.</p>}
            </div>
          ) : null}
          {errorMessage ? <p role="alert" className="border-b border-line bg-cta-soft px-5 py-3 text-sm font-semibold text-cta-dark">{errorMessage}</p> : null}
        </div>

        {complete ? (
          <div className="px-5 py-6 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-ocean" aria-hidden="true" />
            <p className="mt-2 text-lg font-bold text-ink">All waivers are signed</p>
            <p className="mt-1 text-sm text-muted">See you on the boat! If someone else joins the dive, please tell Daily Red Sea on WhatsApp.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 border-b border-line px-5 py-5 text-sm leading-relaxed text-ink">
              <p>{content.intro}</p>
              {content.sections.map((section) => (
                <section key={section.id} aria-labelledby={`waiver-${section.id}`}>
                  <h2 id={`waiver-${section.id}`} className="font-bold text-ink">{section.title}</h2>
                  {section.paragraphs.map((paragraph, index) => <p key={index} className="mt-1 text-muted">{paragraph}</p>)}
                </section>
              ))}
            </div>

            <form method="post" action={action} className="space-y-5 px-5 py-5">
              <h2 className="text-lg font-extrabold text-ink">Diver {next} of {booking.needed}</h2>
              <label className="block text-sm font-semibold text-ink">Participant&apos;s full name
                <input name="participant_name" required minLength={2} maxLength={120} autoComplete="off" className={input} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-ink">Date of birth <span className="font-normal text-muted">(optional)</span>
                  <input name="date_of_birth" type="date" className={input} />
                </label>
                <label className="block text-sm font-semibold text-ink">Diving certification
                  <select name="certification" defaultValue="" className={input}>
                    <option value="">Not sure / first dive</option>
                    {certificationLevels.map((level) => <option key={level} value={level}>{certificationLabels[level]}</option>)}
                  </select>
                </label>
              </div>

              <fieldset className="group rounded-2xl border border-line p-4">
                <legend className="px-1 text-sm font-bold text-ink">Medical statement</legend>
                <p className="text-sm text-muted">{content.medicalIntro}</p>
                <ol className="mt-3 space-y-3">
                  {content.medicalQuestions.map((question, index) => (
                    <li key={question.id} className="rounded-xl bg-primary-tint p-3">
                      <fieldset>
                        <legend className="text-sm text-ink">{index + 1}. {question.text}</legend>
                        <div className="mt-2 flex gap-2">
                          {(["no", "yes"] as const).map((answer) => (
                            <label key={answer} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-semibold has-[:checked]:border-ocean has-[:checked]:bg-ocean-soft">
                              <input type="radio" name={`medical_${question.id}`} value={answer} required className="h-4 w-4 accent-ocean" />
                              {answer === "yes" ? "Yes" : "No"}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 hidden rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900 group-has-[input[value=yes]:checked]:block" role="note">
                  {content.medicalYesNote}
                </p>
              </fieldset>

              <div className="space-y-2">
                {content.acknowledgements.map((acknowledgement) => (
                  <label key={acknowledgement.id} className="flex items-start gap-3 text-sm text-ink">
                    <input type="checkbox" name={`ack_${acknowledgement.id}`} required className="mt-0.5 h-5 w-5 shrink-0 accent-ocean" />
                    <span>{acknowledgement.text}</span>
                  </label>
                ))}
                <label className="flex items-start gap-3 text-sm text-muted">
                  <input type="checkbox" name="photo_consent" className="mt-0.5 h-5 w-5 shrink-0 accent-ocean" />
                  <span>{content.photoConsent}</span>
                </label>
              </div>

              <label className="block text-sm font-semibold text-ink">{content.signatureLabel}
                <input name="signature_name" required minLength={2} maxLength={120} autoComplete="name" className={`${input} font-serif italic`} />
                <span className="mt-1 block text-xs font-normal text-muted">{content.signatureHelp}</span>
              </label>

              <button className="w-full rounded-xl bg-cta px-4 py-3.5 text-base font-bold text-white hover:bg-cta-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta">
                Sign waiver for diver {next}
              </button>
            </form>
          </>
        )}

        <p className="border-t border-line px-5 py-4 text-xs text-muted">This page is personal to your booking. Please share it only with the people diving with you. Questions? Contact Daily Red Sea on WhatsApp.</p>
      </div>
    </main>
  );
}
