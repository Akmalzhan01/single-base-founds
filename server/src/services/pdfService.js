const PDFDocument = require('pdfkit');
const path = require('path');

const FONT      = path.join(__dirname, '../assets/fonts/arial.ttf');
const FONT_BOLD = path.join(__dirname, '../assets/fonts/arialbd.ttf');

// ─── Colors ────────────────────────────────────────────────────────────────
const C = {
  primary:    '#10b981',
  primaryDark:'#059669',
  dark:       '#0d0d18',
  navy:       '#1e293b',
  slate:      '#475569',
  slateLight: '#94a3b8',
  border:     '#e2e8f0',
  rowAlt:     '#f8fafc',
  white:      '#ffffff',
  badge: {
    Карыя:       { bg: '#eff6ff', text: '#3b82f6' },
    Жесир:       { bg: '#fdf4ff', text: '#a855f7' },
    Майып:       { bg: '#fff7ed', text: '#f97316' },
    Зейнеткер:   { bg: '#f0fdf4', text: '#22c55e' },
    Башка:       { bg: '#f8fafc', text: '#64748b' },
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function hex2rgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return [r, g, b];
}
function fillColor(doc, hex) { return doc.fillColor(hex2rgb(hex)); }
function strokeColor(doc, hex) { return doc.strokeColor(hex2rgb(hex)); }

function sectionTitle(doc, title, y) {
  const x = 50;
  const w = 495;
  // Background strip
  fillColor(doc, '#f0fdf4').rect(x, y, w, 24).fill();
  // Left accent bar
  fillColor(doc, C.primary).rect(x, y, 4, 24).fill();
  // Title text
  doc.font(FONT_BOLD).fontSize(9.5).fillColor(hex2rgb(C.primaryDark))
     .text(title.toUpperCase(), x + 14, y + 7, { lineBreak: false });
  return y + 24 + 8;
}

function infoRow(doc, label, value, x, y, width) {
  doc.font(FONT).fontSize(8.5).fillColor(hex2rgb(C.slateLight))
     .text(label, x, y, { lineBreak: false });
  doc.font(FONT_BOLD).fontSize(9.5).fillColor(hex2rgb(C.navy))
     .text(String(value || '—'), x, y + 11, { width, lineBreak: false });
  return y + 30;
}

function tableHeader(doc, cols, y) {
  fillColor(doc, C.navy).rect(50, y, 495, 20).fill();
  let x = 58;
  cols.forEach(({ label, width }) => {
    doc.font(FONT_BOLD).fontSize(8).fillColor([255,255,255])
       .text(label, x, y + 6, { width: width - 8, lineBreak: false });
    x += width;
  });
  return y + 20;
}

function tableRow(doc, cols, values, y, alt) {
  if (alt) fillColor(doc, C.rowAlt).rect(50, y, 495, 20).fill();
  // bottom border
  strokeColor(doc, C.border).moveTo(50, y + 20).lineTo(545, y + 20).lineWidth(0.5).stroke();
  let x = 58;
  cols.forEach(({ width }, i) => {
    doc.font(FONT).fontSize(8.5).fillColor(hex2rgb(C.slate))
       .text(String(values[i] || '—'), x, y + 6, { width: width - 8, lineBreak: false });
    x += width;
  });
  return y + 20;
}

// ─── Main export ────────────────────────────────────────────────────────────
exports.generateBeneficiaryPDF = (beneficiary, aidRecords, stream) => {
  const doc = new PDFDocument({ margin: 0, size: 'A4' });
  doc.pipe(stream);

  const PW = 595.28;
  const now = new Date().toLocaleDateString('ru-RU');

  // ── HEADER BANNER ──────────────────────────────────────────────────────────
  fillColor(doc, C.dark).rect(0, 0, PW, 90).fill();

  // Green accent line at bottom of header
  fillColor(doc, C.primary).rect(0, 88, PW, 3).fill();

  // FD logo box
  fillColor(doc, C.primary).roundedRect(38, 18, 38, 38, 6).fill();
  doc.font(FONT_BOLD).fontSize(14).fillColor([255,255,255])
     .text('FD', 38, 30, { width: 38, align: 'center', lineBreak: false });

  // FundsDB title
  doc.font(FONT_BOLD).fontSize(16).fillColor([255,255,255])
     .text('FundsDB', 88, 20, { lineBreak: false });
  doc.font(FONT).fontSize(9).fillColor(hex2rgb(C.slateLight))
     .text(beneficiary.registeredBy?.name || 'Платформа', 88, 39, { lineBreak: false });

  // Document title (right side)
  doc.font(FONT_BOLD).fontSize(13).fillColor([255,255,255])
     .text('Муктаж Профили', 0, 22, { align: 'right', width: PW - 38, lineBreak: false });
  doc.font(FONT).fontSize(8.5).fillColor(hex2rgb(C.slateLight))
     .text(`Басылган күнү: ${now}`, 0, 42, { align: 'right', width: PW - 38, lineBreak: false });

  // ── MAIN INFO SECTION ──────────────────────────────────────────────────────
  let y = 107;
  y = sectionTitle(doc, 'Муктаж тууралуу маалымат', y);

  // Two-column grid: left (250px) | right (245px)
  const lx = 50, rx = 318, colW = 230;

  // Left column
  infoRow(doc, 'ИНН / Паспорт', beneficiary.inn, lx, y, colW);
  infoRow(doc, 'Туулган жылы', beneficiary.birthDate ? new Date(beneficiary.birthDate).toLocaleDateString('ru-RU') : '—', lx, y + 30, colW);
  infoRow(doc, 'Телефону', beneficiary.phone, lx, y + 60, colW);
  infoRow(doc, 'Абалы', beneficiary.status, lx, y + 90, colW);
  infoRow(doc, 'Балдарынын саны', beneficiary.childrenCount ?? '0', lx, y + 120, colW);

  // Right column
  infoRow(doc, 'Аты-жөнү', beneficiary.fullName, rx, y, colW);
  const region = [beneficiary.region, beneficiary.district, beneficiary.village].filter(Boolean).join(', ');
  infoRow(doc, 'Жашаган жери', region || '—', rx, y + 30, colW);
  infoRow(doc, 'Дареги', beneficiary.address, rx, y + 60, colW);
  infoRow(doc, 'Муктаждыгы', beneficiary.needType, rx, y + 90, colW);
  infoRow(doc, 'Катталган күнү', new Date(beneficiary.createdAt).toLocaleDateString('ru-RU'), rx, y + 120, colW);

  y += 155;

  // Divider
  strokeColor(doc, C.border).moveTo(50, y).lineTo(545, y).lineWidth(0.5).stroke();
  y += 12;

  // Comments
  if (beneficiary.comments) {
    doc.font(FONT).fontSize(8.5).fillColor(hex2rgb(C.slateLight)).text('Комментарий:', 50, y, { lineBreak: false });
    y += 11;
    doc.font(FONT).fontSize(9).fillColor(hex2rgb(C.navy))
       .text(beneficiary.comments, 50, y, { width: 495 });
    y = doc.y + 10;
  }

  // ── SPOUSE ────────────────────────────────────────────────────────────────
  if (beneficiary.spouse?.fullName) {
    y += 4;
    y = sectionTitle(doc, 'Үй-бүлөсү тууралуу маалымат', y);

    infoRow(doc, 'Байланышы', beneficiary.spouse.relation, lx, y, colW);
    infoRow(doc, 'ИНН', beneficiary.spouse.inn, lx, y + 30, colW);
    infoRow(doc, 'Аты-жөнү', beneficiary.spouse.fullName, rx, y, colW);
    infoRow(doc, 'Телефону', beneficiary.spouse.phone, rx, y + 30, colW);

    y += 65;
    // Employed badge
    const emp = beneficiary.spouse.employed;
    const badgeBg = emp ? '#f0fdf4' : '#fef2f2';
    const badgeTxt = emp ? '#16a34a' : '#dc2626';
    fillColor(doc, badgeBg).roundedRect(50, y, 80, 18, 4).fill();
    doc.font(FONT_BOLD).fontSize(8.5).fillColor(hex2rgb(badgeTxt))
       .text(emp ? 'Иштейт' : 'Иштебейт', 50, y + 4, { width: 80, align: 'center', lineBreak: false });
    y += 28;
  }

  // ── CHILDREN ──────────────────────────────────────────────────────────────
  if (beneficiary.children?.length > 0) {
    y += 4;
    y = sectionTitle(doc, 'Балдары тууралуу маалымат', y);

    const childCols = [
      { label: '#',         width: 30  },
      { label: 'Аты-жөнү', width: 185 },
      { label: 'ИНН',       width: 140 },
      { label: 'Туулган жылы', width: 140 },
    ];
    y = tableHeader(doc, childCols, y);
    beneficiary.children.forEach((child, i) => {
      const bday = child.birthDate ? new Date(child.birthDate).toLocaleDateString('ru-RU') : '—';
      y = tableRow(doc, childCols, [i + 1, child.fullName, child.inn, bday], y, i % 2 === 1);
    });
    y += 10;
  }

  // ── AID RECORDS ───────────────────────────────────────────────────────────
  y += 4;
  y = sectionTitle(doc, 'Жардам тарыхы', y);

  if (aidRecords.length === 0) {
    fillColor(doc, C.rowAlt).rect(50, y, 495, 32).fill();
    doc.font(FONT).fontSize(9).fillColor(hex2rgb(C.slateLight))
       .text('Жардам жазуулары жок', 50, y + 10, { width: 495, align: 'center', lineBreak: false });
    y += 42;
  } else {
    const aidCols = [
      { label: '№',           width: 28  },
      { label: 'Күнү',        width: 80  },
      { label: 'Фонд',        width: 155 },
      { label: 'Жардам түрү', width: 130 },
      { label: 'Сумма',       width: 102 },
    ];
    y = tableHeader(doc, aidCols, y);
    aidRecords.forEach((rec, i) => {
      const date   = rec.givenAt ? new Date(rec.givenAt).toLocaleDateString('ru-RU') : '—';
      const amount = rec.amount  ? `${rec.amount} сом` : '—';
      const alt = i % 2 === 1;
      y = tableRow(doc, aidCols, [i + 1, date, rec.foundation?.name, rec.aidType, amount], y, alt);

      // Description sub-row
      if (rec.description) {
        if (alt) fillColor(doc, C.rowAlt).rect(50, y, 495, 16).fill();
        strokeColor(doc, C.border).moveTo(50, y + 16).lineTo(545, y + 16).lineWidth(0.5).stroke();
        doc.font(FONT).fontSize(8).fillColor(hex2rgb(C.slateLight))
           .text(rec.description, 66, y + 4, { width: 471, lineBreak: false });
        y += 16;
      }
    });
    y += 10;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const footerY = 820;
  strokeColor(doc, C.border).moveTo(38, footerY).lineTo(PW - 38, footerY).lineWidth(0.5).stroke();
  doc.font(FONT).fontSize(7.5).fillColor(hex2rgb(C.slateLight))
     .text('FundsDB — Кыргызстандагы жардам фонддорунун бирдиктүү платформасы', 38, footerY + 6, { lineBreak: false });
  doc.font(FONT).fontSize(7.5).fillColor(hex2rgb(C.slateLight))
     .text(now, 0, footerY + 6, { align: 'right', width: PW - 38, lineBreak: false });

  doc.end();
};
