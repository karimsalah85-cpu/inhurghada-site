import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { tours } from "../data/tours.ts";

const outputPath = new URL("../Tour-Catalog-Editing-Workbook.docx", import.meta.url).pathname;
const work = mkdtempSync(join(tmpdir(), "tour-docx-"));
for (const dir of ["_rels", "docProps", "word", "word/_rels", "word/theme"]) {
  mkdirSync(join(work, dir), { recursive: true });
}

const xml = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char]);

const run = (text, options = {}) => {
  const props = [
    options.bold ? "<w:b/>" : "",
    options.italic ? "<w:i/>" : "",
    options.color ? `<w:color w:val="${options.color}"/>` : "",
    options.size ? `<w:sz w:val="${options.size * 2}"/><w:szCs w:val="${options.size * 2}"/>` : "",
  ].join("");
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
};

const paragraph = (content = "", options = {}) => {
  const style = options.style ? `<w:pStyle w:val="${options.style}"/>` : "";
  const num = options.numId ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${options.numId}"/></w:numPr>` : "";
  const pageBreakBefore = options.pageBreakBefore ? "<w:pageBreakBefore/>" : "";
  const keepNext = options.keepNext ? "<w:keepNext/>" : "";
  const align = options.align ? `<w:jc w:val="${options.align}"/>` : "";
  const spacing = options.spacing ? `<w:spacing w:before="${options.spacing.before ?? 0}" w:after="${options.spacing.after ?? 0}" w:line="${options.spacing.line ?? 276}" w:lineRule="auto"/>` : "";
  const pPr = style || num || pageBreakBefore || keepNext || align || spacing
    ? `<w:pPr>${style}${num}${pageBreakBefore}${keepNext}${align}${spacing}</w:pPr>` : "";
  const body = Array.isArray(content) ? content.join("") : run(content);
  return `<w:p>${pPr}${body}</w:p>`;
};

const fieldLine = (label, value) => paragraph([
  run(`${label}: `, { bold: true, color: "1F4D78" }),
  run(value === undefined || value === null || value === "" ? "[Not currently set]" : value),
]);

const listSection = (label, values, body) => {
  body.push(paragraph(label, { style: "Heading2", keepNext: true }));
  if (!values?.length) {
    body.push(paragraph("[Not currently set]", { style: "Placeholder" }));
    return;
  }
  for (const item of values) body.push(paragraph(item, { numId: 1 }));
};

const body = [];
body.push(paragraph("TRIP CATALOG", { style: "Kicker", align: "center" }));
body.push(paragraph("Editing Workbook", { style: "DocTitle", align: "center" }));
body.push(paragraph("Daily Red Sea • 27 current trip records", { style: "Subtitle", align: "center" }));
body.push(paragraph("Review and edit the wording directly in Microsoft Word, then upload the revised .docx. Keep each Trip slug and Field key unchanged so updates can be mapped safely back to the website.", { style: "Lead" }));
body.push(paragraph("Editing instructions", { style: "Heading1" }));
for (const item of [
  "Edit the text after each field label; you may add, remove, or reorder list items.",
  "Do not change a Trip slug. It is the stable identifier used to match your edits to the correct website trip.",
  "Use [Not currently set] wherever you want a field to remain empty, or replace it with new content.",
  "For prices, enter numbers only unless the field is descriptive. The website currently stores base prices in USD.",
  "Add comments in Word if you want to explain a change instead of directly editing the content.",
]) body.push(paragraph(item, { numId: 1 }));
body.push(paragraph("Catalog index", { style: "Heading1" }));
for (const [index, tour] of tours.entries()) {
  body.push(paragraph(`${index + 1}. ${tour.title}  [${tour.slug}]`, { style: "IndexItem" }));
}

const scalarFields = [
  ["Destination slug", "destinationSlug"], ["Title", "title"], ["Image path", "image"],
  ["Price", "price"], ["Original price", "originalPrice"], ["Rating", "rating"],
  ["Reviews", "reviews"], ["Location", "location"], ["Duration", "duration"],
  ["Category", "category"], ["Badge", "badge"], ["Booking mode", "bookingMode"],
  ["Pricing mode", "pricingMode"], ["Price unit", "priceUnit"],
];

for (const [index, tour] of tours.entries()) {
  body.push(paragraph(`TRIP ${String(index + 1).padStart(2, "0")} OF ${tours.length}`, { style: "Kicker", pageBreakBefore: true }));
  body.push(paragraph(tour.title, { style: "Heading1" }));
  body.push(fieldLine("Trip slug — DO NOT CHANGE", tour.slug));
  body.push(paragraph("Core details", { style: "Heading2" }));
  for (const [label, key] of scalarFields) body.push(fieldLine(`Field key: ${key} — ${label}`, tour[key]));
  body.push(paragraph("Description", { style: "Heading2", keepNext: true }));
  body.push(paragraph(tour.description ?? "[Not currently set]", { style: tour.description ? "Normal" : "Placeholder" }));
  listSection("Highlights", tour.highlights, body);
  listSection("Included", tour.included, body);
  listSection("Not included", tour.notIncluded, body);
  listSection("Notes", tour.notes, body);
  listSection("Itinerary", tour.itinerary, body);
  listSection("Not suitable for", tour.notSuitableFor, body);
  listSection("What to bring", tour.whatToBring, body);
  listSection("Available times", tour.availableTimes, body);

  body.push(paragraph("Package and pricing fields", { style: "Heading2" }));
  for (const [label, key] of [
    ["Package name", "packageName"], ["Package description", "packageDescription"],
    ["Package price", "packagePrice"], ["Package label", "packageLabel"],
  ]) body.push(fieldLine(`Field key: ${key} — ${label}`, tour[key]));
  body.push(fieldLine("Field key: participantPricing.adults — Adult price", tour.participantPricing?.adults));
  body.push(fieldLine("Field key: participantPricing.youth — Youth/child price", tour.participantPricing?.youth));
  body.push(fieldLine("Field key: participantPricing.infants — Infant price", tour.participantPricing?.infants));
  body.push(fieldLine("Field key: ageBands.adults — Adult age band", tour.ageBands?.adults));
  body.push(fieldLine("Field key: ageBands.children — Child age band", tour.ageBands?.children));
  body.push(fieldLine("Field key: ageBands.infants — Infant age band", tour.ageBands?.infants));

  body.push(paragraph("Search and sharing text", { style: "Heading2" }));
  body.push(fieldLine("Field key: seoTitle — SEO title", tour.seoTitle));
  body.push(fieldLine("Field key: metaDescription — Meta description", tour.metaDescription));

  body.push(paragraph("Frequently asked questions", { style: "Heading2" }));
  if (!tour.faqs?.length) {
    body.push(paragraph("[Not currently set]", { style: "Placeholder" }));
  } else {
    for (const [faqIndex, faq] of tour.faqs.entries()) {
      body.push(paragraph([run(`Question ${faqIndex + 1}: `, { bold: true }), run(faq.question)], { keepNext: true }));
      body.push(paragraph([run("Answer: ", { bold: true }), run(faq.answer)]));
    }
  }
}

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${body.join("")}
<w:sectPr><w:headerReference w:type="default" r:id="rId2"/><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>
</w:body></w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="120" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="DocTitle"><w:name w:val="Document Title"/><w:basedOn w:val="Normal"/><w:next w:val="Subtitle"/><w:qFormat/><w:pPr><w:spacing w:before="600" w:after="120"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:color w:val="0B2545"/><w:sz w:val="60"/><w:szCs w:val="60"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="480"/></w:pPr><w:rPr><w:color w:val="55606D"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Kicker"><w:name w:val="Kicker"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="160" w:after="100"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:color w:val="B56A2A"/><w:caps/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="360" w:after="200"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="280" w:after="140"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Lead"><w:name w:val="Lead"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="160" w:after="240" w:line="320" w:lineRule="auto"/><w:ind w:left="360" w:right="360"/></w:pPr><w:rPr><w:color w:val="334155"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="IndexItem"><w:name w:val="Index Item"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="60"/><w:ind w:left="360"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Placeholder"><w:name w:val="Placeholder"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:i/><w:color w:val="7A5A00"/></w:rPr></w:style>
</w:styles>`;

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="270"/><w:spacing w:after="80" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:hint="default"/></w:rPr></w:lvl></w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:after="0"/></w:pPr>${run("DAILY RED SEA  •  TRIP CATALOG EDITING WORKBOOK", { bold: true, color: "667085", size: 9 })}</w:p></w:hdr>`;
const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="0"/></w:pPr>${run("Page ", { color: "667085", size: 9 })}<w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:color w:val="667085"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`;

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`;
const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Trip Catalog Editing Workbook</dc:title><dc:subject>Editable Daily Red Sea trip catalog</dc:subject><dc:creator>Daily Red Sea</dc:creator><cp:lastModifiedBy>Daily Red Sea</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-08-06T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-06T00:00:00Z</dcterms:modified></cp:coreProperties>`;
const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Office Word</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company>Daily Red Sea</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>`;

const files = {
  "[Content_Types].xml": contentTypes, "_rels/.rels": rootRels,
  "docProps/core.xml": coreXml, "docProps/app.xml": appXml,
  "word/document.xml": documentXml, "word/styles.xml": stylesXml,
  "word/numbering.xml": numberingXml, "word/header1.xml": headerXml,
  "word/footer1.xml": footerXml, "word/_rels/document.xml.rels": documentRels,
};
for (const [relativePath, contents] of Object.entries(files)) writeFileSync(join(work, relativePath), contents);
execFileSync("/usr/bin/zip", ["-q", "-r", outputPath, "."], { cwd: work });
console.log(`Created ${outputPath} with ${tours.length} trips.`);
