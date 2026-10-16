// Keep these in sync with your backend config
export const GST_PERCENT = 3;

// Find the latest rate for a metal + purity
export function findRate(latestRates, metal, purity) {
  const r = latestRates.find((x) => x.metal === metal && x.purity === purity);
  return r ? r.ratePerGram : 0;
}

// Preview of one line item (server recalculates the real value)
export function calcItem(product, ratePerGram) {
  const metalValue = product.netWeight * ratePerGram;
  const making =
    product.makingChargeType === "perGram"
      ? product.netWeight * product.makingCharge
      : product.makingCharge;
  const wastage = (metalValue * (product.wastagePercent || 0)) / 100;
  const amount = metalValue + making + wastage; // stone value not in product model
  return { metalValue, making, wastage, amount };
}

export function calcTotals(lines, discount, exchangeAmount) {
  const taxable = lines.reduce((s, l) => s + l.amount, 0);
  const gst = (taxable * GST_PERCENT) / 100;
  const grandTotal = taxable + gst - discount - exchangeAmount;
  return { taxable, gst, grandTotal: Math.max(grandTotal, 0) };
}

export const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });