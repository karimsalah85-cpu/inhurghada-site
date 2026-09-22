import { bookingLocale } from "@/lib/booking-communications-i18n";
import { localePath } from "@/lib/i18n";
import { referralCopy, referralProgramCopy } from "@/lib/referral-i18n";
import { referralNotificationCopy } from "@/lib/referral-notification-copy";
import { referralLink } from "@/lib/referral";
import { createPdfDocument, renderPdfToBuffer } from "@/lib/pdf/render";
import { pdfPage, pdfColors } from "@/lib/pdf/theme";
import { drawPdfHero, pdfPageBackground, pdfWrite, pdfTextHeight, drawQrCodeBlock } from "@/lib/pdf/components";
import { resolveHeroImage } from "@/lib/pdf/hero-image";
import { renderQrCodePng } from "@/lib/pdf/qrcode";
import { stampPdfFooters } from "@/lib/pdf/layout";

export type PostTripPdfData = { reference: string; customerName: string; itemName?: string | null; tourSlug?: string | null; locale?: string | null; qualified: boolean; referralCode?: string | null; generatedAt?: Date };
/** A separate thank-you keeps the financial receipt out of post-trip invitations. */
export async function createPostTripPdf(input: PostTripPdfData): Promise<Buffer> {
  const locale = bookingLocale(input.locale), rtl = locale === "ar";
  const copy = referralCopy[locale], program = referralProgramCopy[locale], note = referralNotificationCopy[locale];
  const reviewUrl = `https://dailyredsea.com${localePath(locale, "/reviews")}`;
  const accountUrl = `https://dailyredsea.com${localePath(locale, "/referrals")}`;
  const link = new URL(input.qualified && input.referralCode ? referralLink("https://dailyredsea.com", input.referralCode) : accountUrl);
  if (input.qualified && input.referralCode) link.pathname = localePath(locale, "/");
  const [reviewQr, referralQr] = await Promise.all([renderQrCodePng(reviewUrl), renderQrCodePng(link.toString())]);
  const doc = createPdfDocument({title: note.thanks, locale, createdAt: input.generatedAt});
  doc.addPage(); pdfPageBackground(doc);
  drawPdfHero(doc, {image: resolveHeroImage(input.tourSlug, input.itemName), height: 230, title: note.thanks, subtitle: "Daily Red Sea", rtl});
  const m = pdfPage.margin, w = pdfPage.width - m * 2;
  let y = 258;
  pdfWrite(doc, input.customerName, m, y, w, {size:19, color:pdfColors.navy, rtl});
  y += pdfTextHeight(doc,input.customerName,w,19,rtl)+10;
  pdfWrite(doc, note.enjoyed, m, y, w, {size:11,rtl,wrap:true});
  y += pdfTextHeight(doc,note.enjoyed,w,11,rtl)+26;
  // Review QR has no personal contact information. The referral QR contains only the public token.
  const reviewY=y;
  doc.roundedRect(m,y,w,118,14).fill(pdfColors.white);
  const reviewX=rtl ? m+w-98 : m+18;
  drawQrCodeBlock(doc,reviewQr,reviewX,y+18,80);
  const textX=rtl ? m+18 : m+118;
  pdfWrite(doc,note.review,textX,y+22,w-140,{size:15,color:pdfColors.navy,rtl,wrap:true});
  pdfWrite(doc,"dailyredsea.com/reviews",textX,y+78,w-140,{size:9,color:pdfColors.aqua});
  doc.link(m,reviewY,w,118,reviewUrl);
  y+=138;
  const cardHeight=230;
  doc.roundedRect(m,y,w,cardHeight,14).fill(pdfColors.navy);
  pdfWrite(doc,copy.heading,m+22,y+20,w-44,{size:21,color:pdfColors.white,rtl});
  const body=input.qualified ? copy.tagline : program.locked;
  pdfWrite(doc,body,m+22,y+58,w-146,{size:10,color:"#E0F2F5",rtl,wrap:true});
  drawQrCodeBlock(doc,referralQr,m+w-108,y+62,82);
  doc.link(m+w-108,y+62,82,82,link.toString());
  pdfWrite(doc,program.terms,m+22,y+146,w-44,{size:8.5,color:"#E0F2F5",rtl,wrap:true});
  const target=input.qualified&&input.referralCode ? `https://wa.me/?text=${encodeURIComponent(`${copy.whatsappMessage} ${link}`)}` : accountUrl;
  doc.roundedRect(m+22,y+193,w-44,25,12).fill(pdfColors.aqua);
  pdfWrite(doc,input.qualified ? copy.shareWhatsapp : program.viewRewards,m+28,y+199,w-56,{size:9,color:pdfColors.white,align:"center",rtl});
  doc.link(m+22,y+193,w-44,25,target);
  stampPdfFooters(doc,{reference:input.reference,rtl});
  doc.end(); return renderPdfToBuffer(doc);
}
