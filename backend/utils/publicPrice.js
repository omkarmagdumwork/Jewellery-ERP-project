import Rate from "../models/Rate.js";

// Latest rate for every metal + purity (one row each)
export async function getLatestRates() {
  return Rate.aggregate([
    { $sort: { date: -1, createdAt: -1 } },
    {
      $group: {
        _id: { metal: "$metal", purity: "$purity" },
        ratePerGram: { $first: "$ratePerGram" },
        date: { $first: "$date" },
      },
    },
    { $project: { _id: 0, metal: "$_id.metal", purity: "$_id.purity", ratePerGram: 1, date: 1 } },
  ]);
}

export const buildRateMap = (rates) =>
  new Map(rates.map((r) => [`${r.metal}|${r.purity}`, r.ratePerGram]));

// Approximate public price: metal + making + wastage + GST.
// Stone value is not included, so the storefront always says "approx."
export function estimatePrice(product, rateMap) {
  const rate = rateMap.get(`${product.metal}|${product.purity}`);
  if (!rate) return null;

  const gstPercent = Number(process.env.GST_PERCENT) || 3;
  const metalValue = product.netWeight * rate;
  const making =
    product.makingChargeType === "perGram"
      ? product.netWeight * (product.makingCharge || 0)
      : product.makingCharge || 0;
  const wastage = (metalValue * (product.wastagePercent || 0)) / 100;
  const taxable = metalValue + making + wastage;

  return Math.round(taxable + (taxable * gstPercent) / 100);
}
