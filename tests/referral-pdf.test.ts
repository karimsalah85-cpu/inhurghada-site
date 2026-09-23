import { describe, expect, it } from "vitest";
import { createPostTripPdf } from "@/lib/post-trip-pdf";
import { createInvoicePdf } from "@/lib/invoice-service";
import { mkdir, writeFile } from "node:fs/promises";

describe("post-trip PDF", () => {
  it("creates one branded invitation page in every supported language", async () => {
    for (const locale of ["en","de","ru","ar","pl","zh"]) {
      const pdf=await createPostTripPdf({reference:"DRS-SAMPLE",customerName:locale==="ar"?"ضيف ديلي رد سي":"Sample Guest",itemName:"Jeddah Yacht Sunset Cruise",tourSlug:"jeddah-yacht-sunset-cruise",locale,qualified:true,referralCode:"DRS-SAMPLE",generatedAt:new Date("2026-09-21T12:00:00Z")});
      expect(pdf.subarray(0,5).toString()).toBe("%PDF-");
      expect(pdf.toString("binary")).toContain("https://dailyredsea.com/reviews?lang="+locale+"&ref=DRS-SAMPLE");
      expect(pdf.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(1);
      if(process.env.GENERATE_PDF_SAMPLES){await mkdir("output/pdf",{recursive:true});await writeFile(`output/pdf/daily-red-sea-thank-you-${locale}.pdf`,pdf);}
    }
  });
  it("creates the reference-style confirmation with synthetic sample details",async()=>{
    const pdf=await createInvoicePdf({reference:"DRS-SAMPLE-20260921",issuedAt:new Date("2026-09-21T12:00:00Z"),customerName:"Sample Guest",customerEmail:"guest@example.com",customerPhone:"+20 100 000 0000",itemName:"Jeddah Yacht Sunset Cruise on Shorouk Sat",tourSlug:"jeddah-yacht-sunset-cruise",quantity:3,travelerSummary:"2 adults · 1 youth",date:"26 Sep 2026",time:"5:00 PM",hotel:"Rixos Resort Gate 2, Obhur Bay",amount:255,currency:"SAR",locale:"en"});
    expect(pdf.toString("binary").match(/\/Type \/Page\b/g)?.length).toBe(2);
    if(process.env.GENERATE_PDF_SAMPLES){await mkdir("output/pdf",{recursive:true});await writeFile("output/pdf/daily-red-sea-booking-sample.pdf",pdf);}
  });
});
