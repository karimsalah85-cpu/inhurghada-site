/**
 * Minimal line icons drawn with PDFKit's vector primitives (no icon font
 * dependency). Each icon is drawn inside a `size`x`size` box at (x, y) with
 * `strokeColor`; kept deliberately simple/abstract to match the "minimal
 * line icons" requirement rather than imitating a specific icon set.
 */
type Doc = PDFKit.PDFDocument;

function setup(doc: Doc, color: string, lineWidth = 1.3) {
  doc.strokeColor(color).lineWidth(lineWidth).lineJoin("round").lineCap("round");
}

export function iconCalendar(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  doc.roundedRect(x, y + size * 0.15, size, size * 0.78, size * 0.12).stroke();
  doc.moveTo(x, y + size * 0.4).lineTo(x + size, y + size * 0.4).stroke();
  doc.moveTo(x + size * 0.25, y).lineTo(x + size * 0.25, y + size * 0.28).stroke();
  doc.moveTo(x + size * 0.75, y).lineTo(x + size * 0.75, y + size * 0.28).stroke();
}

export function iconClock(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  const cx = x + size / 2, cy = y + size / 2, r = size / 2 - 1;
  doc.circle(cx, cy, r).stroke();
  doc.moveTo(cx, cy).lineTo(cx, cy - r * 0.55).stroke();
  doc.moveTo(cx, cy).lineTo(cx + r * 0.45, cy + r * 0.15).stroke();
}

export function iconPeople(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  const r = size * 0.16;
  doc.circle(x + size * 0.32, y + size * 0.28, r).stroke();
  doc.circle(x + size * 0.68, y + size * 0.28, r).stroke();
  doc.path(`M ${x + size * 0.08} ${y + size * 0.92} Q ${x + size * 0.08} ${y + size * 0.55} ${x + size * 0.32} ${y + size * 0.5} Q ${x + size * 0.56} ${y + size * 0.55} ${x + size * 0.56} ${y + size * 0.92}`).stroke();
  doc.path(`M ${x + size * 0.44} ${y + size * 0.92} Q ${x + size * 0.44} ${y + size * 0.55} ${x + size * 0.68} ${y + size * 0.5} Q ${x + size * 0.92} ${y + size * 0.55} ${x + size * 0.92} ${y + size * 0.92}`).stroke();
}

export function iconPin(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  const cx = x + size / 2;
  doc.path(`M ${cx} ${y + size} C ${x + size * 0.05} ${y + size * 0.55} ${x} ${y + size * 0.42} ${x} ${y + size * 0.38} A ${size * 0.5} ${size * 0.38} 0 1 1 ${x + size} ${y + size * 0.38} C ${x + size} ${y + size * 0.42} ${x + size * 0.95} ${y + size * 0.55} ${cx} ${y + size}Z`).stroke();
  doc.circle(cx, y + size * 0.36, size * 0.13).stroke();
}

export function iconWhatsapp(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  const cx = x + size / 2, cy = y + size / 2, r = size / 2 - 1;
  doc.circle(cx, cy, r).stroke();
  doc.path(`M ${cx - r * 0.35} ${cy + r * 0.3} l -${r * 0.22} ${r * 0.22} l ${r * 0.22} -${r * 0.06}`).fill(color);
  // Recognizable telephone handset inside the chat bubble.
  doc.save().translate(x + size * 0.2, y + size * 0.2).scale(size * 0.025);
  doc.path("M 22 16.92 V 20 a 2 2 0 0 1 -2.18 2 A 19.79 19.79 0 0 1 11.19 18.93 A 19.5 19.5 0 0 1 5.19 12.93 A 19.79 19.79 0 0 1 2.09 4.18 A 2 2 0 0 1 4.08 2 h 3 a 2 2 0 0 1 2 1.72 c .12 .96 .35 1.9 .69 2.79 a 2 2 0 0 1 -.45 2.11 L 8.05 9.89 a 16 16 0 0 0 6 6 l 1.27 -1.27 a 2 2 0 0 1 2.11 -.45 c .89 .34 1.83 .57 2.79 .69 A 2 2 0 0 1 22 16.92 Z").lineWidth(1.7).stroke();
  doc.restore();
}

export function iconShield(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  doc.path(`M ${x + size / 2} ${y} L ${x + size} ${y + size * 0.2} L ${x + size} ${y + size * 0.5} C ${x + size} ${y + size * 0.85} ${x + size * 0.7} ${y + size} ${x + size / 2} ${y + size} C ${x + size * 0.3} ${y + size} ${x} ${y + size * 0.85} ${x} ${y + size * 0.5} L ${x} ${y + size * 0.2} Z`).stroke();
  doc.moveTo(x + size * 0.3, y + size * 0.5).lineTo(x + size * 0.45, y + size * 0.65).lineTo(x + size * 0.72, y + size * 0.35).stroke();
}

export function iconWave(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  const cy = y + size * 0.55;
  doc.path(`M ${x} ${cy} Q ${x + size * 0.25} ${cy - size * 0.3} ${x + size * 0.5} ${cy} Q ${x + size * 0.75} ${cy + size * 0.3} ${x + size} ${cy}`).stroke();
  doc.path(`M ${x} ${cy + size * 0.3} Q ${x + size * 0.25} ${cy} ${x + size * 0.5} ${cy + size * 0.3} Q ${x + size * 0.75} ${cy + size * 0.6} ${x + size} ${cy + size * 0.3}`).stroke();
}

export function iconDiveMask(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  doc.roundedRect(x, y + size * 0.1, size, size * 0.55, size * 0.18).stroke();
  doc.circle(x + size * 0.3, y + size * 0.37, size * 0.15).stroke();
  doc.circle(x + size * 0.7, y + size * 0.37, size * 0.15).stroke();
  doc.moveTo(x + size * 0.15, y + size * 0.65).lineTo(x + size * 0.15, y + size * 0.95).stroke();
  doc.moveTo(x + size * 0.85, y + size * 0.65).lineTo(x + size * 0.85, y + size * 0.95).stroke();
}

export function iconAlert(doc: Doc, x: number, y: number, size: number, color: string) {
  setup(doc, color);
  doc.path(`M ${x + size / 2} ${y} L ${x + size} ${y + size * 0.86} L ${x} ${y + size * 0.86} Z`).stroke();
  doc.moveTo(x + size / 2, y + size * 0.34).lineTo(x + size / 2, y + size * 0.6).stroke();
  doc.circle(x + size / 2, y + size * 0.74, 0.9).fill(color);
}
