import PDFDocument from "pdfkit";

// Indian number format: 1,23,456.00
const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);

const formatDate = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

const LEFT = 40;
const RIGHT = 555; // A4 width 595 - 40 margin
const WIDTH = RIGHT - LEFT;
const PAGE_BOTTOM = 740;

// Item table columns (widths add up to WIDTH = 515)
const COLS = [
  { key: "no", label: "#", width: 25, align: "left" },
  { key: "name", label: "Item", width: 150, align: "left" },
  { key: "purity", label: "Purity", width: 45, align: "left" },
  { key: "weight", label: "Net Wt (g)", width: 55, align: "right" },
  { key: "rate", label: "Rate/g", width: 60, align: "right" },
  { key: "making", label: "Making", width: 55, align: "right" },
  { key: "qty", label: "Qty", width: 30, align: "right" },
  { key: "amount", label: "Amount", width: 95, align: "right" },
];

const drawRow = (doc, y, values, { bold = false } = {}) => {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
  let x = LEFT;
  for (const col of COLS) {
    doc.text(String(values[col.key] ?? ""), x + 2, y, {
      width: col.width - 4,
      align: col.align,
      lineBreak: false,
      ellipsis: true,
    });
    x += col.width;
  }
};

const drawTableHeader = (doc, y) => {
  doc.rect(LEFT, y - 4, WIDTH, 20).fill("#f0f0f0");
  doc.fillColor("#000");
  drawRow(doc, y + 2, Object.fromEntries(COLS.map((c) => [c.key, c.label])), { bold: true });
  return y + 22;
};

const drawHeader = (doc, invoice) => {
  const shop = {
    name: process.env.SHOP_NAME || "Jewellery Shop",
    address: process.env.SHOP_ADDRESS || "",
    phone: process.env.SHOP_PHONE || "",
    gstin: process.env.SHOP_GSTIN || "",
  };

  doc.font("Helvetica-Bold").fontSize(20).text(shop.name, LEFT, 40, { align: "center", width: WIDTH });
  doc.font("Helvetica").fontSize(9);
  if (shop.address) doc.text(shop.address, { align: "center", width: WIDTH });
  if (shop.phone) doc.text(`Phone: ${shop.phone}`, { align: "center", width: WIDTH });
  if (shop.gstin) doc.text(`GSTIN: ${shop.gstin}`, { align: "center", width: WIDTH });

  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(13).text("TAX INVOICE", { align: "center", width: WIDTH });

  // Line under header
  const lineY = doc.y + 4;
  doc.moveTo(LEFT, lineY).lineTo(RIGHT, lineY).strokeColor("#999").stroke().strokeColor("#000");

  // Invoice info (left: customer, right: invoice details)
  const top = lineY + 10;
  const c = invoice.customer || {};

  doc.font("Helvetica-Bold").fontSize(10).text("Billed To", LEFT, top);
  doc.font("Helvetica").fontSize(10);
  doc.text(c.name || "-", LEFT, top + 14);
  if (c.phone) doc.text(`Phone: ${c.phone}`);
  const addr = [c.address, c.city].filter(Boolean).join(", ");
  if (addr) doc.text(addr, { width: 250 });
  if (c.gstin) doc.text(`GSTIN: ${c.gstin}`);

  doc.font("Helvetica-Bold").fontSize(10).text("Invoice No:", 350, top, { continued: true });
  doc.font("Helvetica").text(`  ${invoice.invoiceNo}`);
  doc.font("Helvetica-Bold").text("Date:", 350, top + 14, { continued: true });
  doc.font("Helvetica").text(`  ${formatDate(invoice.createdAt)}`);
  doc.font("Helvetica-Bold").text("Payment:", 350, top + 28, { continued: true });
  doc.font("Helvetica").text(`  ${String(invoice.paymentMode).toUpperCase()}`);
  if (invoice.createdBy?.name) {
    doc.font("Helvetica-Bold").text("Served by:", 350, top + 42, { continued: true });
    doc.font("Helvetica").text(`  ${invoice.createdBy.name}`);
  }

  return Math.max(doc.y, top + 60) + 15;
};

// Right aligned "label ........ value" line used in the totals block
const totalLine = (doc, y, label, value, { bold = false, big = false } = {}) => {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(big ? 12 : 10);
  doc.text(label, 330, y, { width: 120, align: "left", lineBreak: false });
  doc.text(value, 450, y, { width: RIGHT - 450, align: "right", lineBreak: false });
  return y + (big ? 20 : 16);
};

export const buildInvoicePdf = (invoice, stream) => {
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(stream);

  let y = drawHeader(doc, invoice);
  y = drawTableHeader(doc, y);

  // Item rows
  invoice.items.forEach((item, i) => {
    if (y > PAGE_BOTTOM - 40) {
      doc.addPage();
      y = drawTableHeader(doc, 40);
    }

    const nameLine = item.hallmarkNo ? `${item.name} (HM: ${item.hallmarkNo})` : item.name;

    drawRow(doc, y, {
      no: i + 1,
      name: nameLine,
      purity: `${item.metal === "gold" ? "Au" : "Ag"} ${item.purity}`,
      weight: Number(item.netWeight).toFixed(3),
      rate: money(item.rate),
      making: money(item.makingCharge),
      qty: item.quantity,
      amount: money(item.amount),
    });

    y += 18;
    doc.moveTo(LEFT, y - 4).lineTo(RIGHT, y - 4).strokeColor("#ddd").stroke().strokeColor("#000");
  });

  // Make sure the totals block fits on the page
  if (y > PAGE_BOTTOM - 140) {
    doc.addPage();
    y = 40;
  }

  y += 10;
  y = totalLine(doc, y, "Subtotal", `Rs. ${money(invoice.subtotal)}`);
  if (invoice.discount > 0) {
    y = totalLine(doc, y, "Discount", `- Rs. ${money(invoice.discount)}`);
  }
  y = totalLine(doc, y, `CGST (${invoice.gstPercent / 2}%)`, `Rs. ${money(invoice.cgst)}`);
  y = totalLine(doc, y, `SGST (${invoice.gstPercent / 2}%)`, `Rs. ${money(invoice.sgst)}`);

  doc.moveTo(330, y).lineTo(RIGHT, y).strokeColor("#999").stroke().strokeColor("#000");
  y += 6;
  y = totalLine(doc, y, "Invoice Total", `Rs. ${money(invoice.total)}`, { bold: true });

  // Old gold exchange section
  if (invoice.oldGoldItems && invoice.oldGoldItems.length > 0) {
    y += 8;
    doc.font("Helvetica-Bold").fontSize(10).text("Old Gold / Silver Exchange", LEFT, y);
    y += 16;

    invoice.oldGoldItems.forEach((og) => {
      const line =
        `${og.metal} ${og.purity}  |  Gross ${Number(og.grossWeight).toFixed(3)} g` +
        `  |  Stone ${Number(og.stoneWeight).toFixed(3)} g` +
        `  |  Deduction ${og.deductionPercent}%` +
        `  |  Payable ${Number(og.payableWeight).toFixed(3)} g @ Rs. ${money(og.rate)}`;
      doc.font("Helvetica").fontSize(8.5).text(line, LEFT, y, { width: 400, lineBreak: false });
      doc.text(`Rs. ${money(og.value)}`, 450, y, { width: RIGHT - 450, align: "right", lineBreak: false });
      y += 14;
    });

    y += 4;
    y = totalLine(doc, y, "Old Gold Value", `- Rs. ${money(invoice.oldGoldTotal)}`);
  }

  doc.moveTo(330, y).lineTo(RIGHT, y).strokeColor("#000").stroke();
  y += 6;
  y = totalLine(doc, y, "Amount Payable", `Rs. ${money(invoice.amountPayable)}`, {
    bold: true,
    big: true,
  });

  // Footer (kept at a fixed position near the bottom of the last page)
  doc.font("Helvetica").fontSize(8).fillColor("#555");
  doc.text(
    "Goods once sold will not be taken back. Weights and purity are as per hallmark. " +
      "Subject to local jurisdiction.",
    LEFT,
    PAGE_BOTTOM + 15,
    { width: WIDTH, align: "center" }
  );
  doc.text("Thank you for shopping with us!", LEFT, PAGE_BOTTOM + 40, { width: WIDTH, align: "center" });
  doc.fillColor("#000");

  doc.end();
};