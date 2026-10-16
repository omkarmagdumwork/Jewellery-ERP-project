import Invoice from "../models/Invoice.js";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import OldGold from "../models/OldGold.js";
import Rate from "../models/Rate.js";
import { getDateRange, startOfToday, endOfToday, startOfMonth } from "../utils/dateRange.js";

const round2 = (n) => Math.round(((n || 0) + Number.EPSILON) * 100) / 100;

const LOW_STOCK_LIMIT = 2; // products with quantity <= 2 are "low stock"

// Helper: total sales, bill count and GST for a date range
const salesSummary = async (start, end) => {
  const [row] = await Invoice.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: null,
        sales: { $sum: "$total" },
        bills: { $sum: 1 },
        gst: { $sum: "$gst" },
        oldGold: { $sum: "$oldGoldTotal" },
      },
    },
  ]);
  return {
    sales: round2(row?.sales),
    bills: row?.bills || 0,
    gst: round2(row?.gst),
    oldGoldExchanged: round2(row?.oldGold),
  };
};

// Helper: total purchase amount for a date range
const purchaseSummary = async (start, end) => {
  const [row] = await Purchase.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, amount: { $sum: "$total" }, count: { $sum: 1 } } },
  ]);
  return { amount: round2(row?.amount), count: row?.count || 0 };
};

// GET /api/reports/dashboard
export const getDashboard = async (req, res) => {
  try {
    const [
      today,
      month,
      purchasesMonth,
      productStats,
      lowStock,
      oldGoldStock,
      latestRates,
      recentInvoices,
    ] = await Promise.all([
      salesSummary(startOfToday(), endOfToday()),
      salesSummary(startOfMonth(), endOfToday()),
      purchaseSummary(startOfMonth(), endOfToday()),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            products: { $sum: 1 },
            pieces: { $sum: "$quantity" },
          },
        },
      ]),
      Product.find({ isActive: true, quantity: { $lte: LOW_STOCK_LIMIT } })
        .select("name category metal purity quantity")
        .sort({ quantity: 1 })
        .limit(10),
      OldGold.aggregate([
        { $match: { status: "in_stock" } },
        {
          $group: {
            _id: null,
            weight: { $sum: "$payableWeight" },
            value: { $sum: "$value" },
          },
        },
      ]),
      Rate.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: { metal: "$metal", purity: "$purity" },
            ratePerGram: { $first: "$ratePerGram" },
            updatedAt: { $first: "$createdAt" },
          },
        },
      ]),
      Invoice.find()
        .populate("customer", "name")
        .select("invoiceNo customer total createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({
      today,
      month: { ...month, purchases: purchasesMonth },
      inventory: {
        products: productStats[0]?.products || 0,
        pieces: productStats[0]?.pieces || 0,
        lowStockLimit: LOW_STOCK_LIMIT,
        lowStock,
      },
      oldGoldInStock: {
        weight: Math.round((oldGoldStock[0]?.weight || 0) * 1000) / 1000,
        value: round2(oldGoldStock[0]?.value),
      },
      latestRates,
      recentInvoices,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/sales?from=2026-10-01&to=2026-10-31
// Returns one row per day (good for a line / bar chart)
export const getSalesReport = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.from, req.query.to);

    const daily = await Invoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } },
          sales: { $sum: "$total" },
          bills: { $sum: 1 },
          gst: { $sum: "$gst" },
          discount: { $sum: "$discount" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: { $round: ["$sales", 2] },
          bills: 1,
          gst: { $round: ["$gst", 2] },
          discount: { $round: ["$discount", 2] },
        },
      },
    ]);

    // Split by payment mode (cash / upi / card / bank)
    const byPaymentMode = await Invoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$paymentMode", amount: { $sum: "$total" }, bills: { $sum: 1 } } },
      { $project: { _id: 0, paymentMode: "$_id", amount: { $round: ["$amount", 2] }, bills: 1 } },
    ]);

    const totals = daily.reduce(
      (acc, d) => ({
        sales: acc.sales + d.sales,
        bills: acc.bills + d.bills,
        gst: acc.gst + d.gst,
      }),
      { sales: 0, bills: 0, gst: 0 }
    );

    res.json({
      from: start,
      to: end,
      totals: { sales: round2(totals.sales), bills: totals.bills, gst: round2(totals.gst) },
      daily,
      byPaymentMode,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/stock
// Current inventory grouped by metal + purity
export const getStockReport = async (req, res) => {
  try {
    const stock = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { metal: "$metal", purity: "$purity" },
          products: { $sum: 1 },
          pieces: { $sum: "$quantity" },
          totalNetWeight: { $sum: { $multiply: ["$netWeight", "$quantity"] } },
        },
      },
      { $sort: { "_id.metal": 1, "_id.purity": 1 } },
    ]);

    // Attach today's rate so we can show an approximate stock value
    const rates = await Rate.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { metal: "$metal", purity: "$purity" },
          ratePerGram: { $first: "$ratePerGram" },
        },
      },
    ]);
    const rateMap = new Map(rates.map((r) => [`${r._id.metal}-${r._id.purity}`, r.ratePerGram]));

    const rows = stock.map((s) => {
      const rate = rateMap.get(`${s._id.metal}-${s._id.purity}`) || 0;
      return {
        metal: s._id.metal,
        purity: s._id.purity,
        products: s.products,
        pieces: s.pieces,
        totalNetWeight: Math.round(s.totalNetWeight * 1000) / 1000,
        currentRate: rate,
        approxValue: round2(s.totalNetWeight * rate),
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        pieces: acc.pieces + r.pieces,
        value: acc.value + r.approxValue,
      }),
      { pieces: 0, value: 0 }
    );

    const lowStock = await Product.find({ isActive: true, quantity: { $lte: LOW_STOCK_LIMIT } })
      .select("name category metal purity quantity")
      .sort({ quantity: 1 });

    res.json({
      rows,
      totals: { pieces: totals.pieces, approxValue: round2(totals.value) },
      lowStockLimit: LOW_STOCK_LIMIT,
      lowStock,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/profit?from=2026-10-01&to=2026-10-31
//
// Profit is calculated from the supplier rate we paid for each product:
// for every sold item we find the most recent purchase cost of that product
// (netWeight * purchase ratePerGram + purchase making charge). If a product
// was never purchased (added manually), we skip its cost and report it
// under "itemsWithoutCost" so the number is not misleading.
export const getProfitReport = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.from, req.query.to);

    const sold = await Invoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.amount" },
        },
      },
    ]);

    let revenue = 0;
    let cost = 0;
    let itemsWithoutCost = 0;
    const rows = [];

    for (const s of sold) {
      // Most recent purchase entry for this product
      const lastPurchase = await Purchase.findOne({ "items.product": s._id })
        .sort({ createdAt: -1 })
        .select("items");

      const purchaseItem = lastPurchase?.items.find(
        (i) => i.product.toString() === s._id.toString()
      );

      revenue += s.revenue;

      if (!purchaseItem) {
        itemsWithoutCost += s.quantity;
        rows.push({
          product: s.name,
          quantity: s.quantity,
          revenue: round2(s.revenue),
          cost: null,
          profit: null,
        });
        continue;
      }

      const unitCost = purchaseItem.netWeight * purchaseItem.ratePerGram + purchaseItem.makingCharge;
      const itemCost = unitCost * s.quantity;
      cost += itemCost;

      rows.push({
        product: s.name,
        quantity: s.quantity,
        revenue: round2(s.revenue),
        cost: round2(itemCost),
        profit: round2(s.revenue - itemCost),
      });
    }

    // Revenue of items that have a known cost (to keep profit comparable)
    const revenueWithCost = rows.reduce((sum, r) => sum + (r.cost !== null ? r.revenue : 0), 0);
    const profit = round2(revenueWithCost - cost);

    res.json({
      from: start,
      to: end,
      revenue: round2(revenue),
      cost: round2(cost),
      profit,
      marginPercent: revenueWithCost > 0 ? round2((profit / revenueWithCost) * 100) : 0,
      itemsWithoutCost,
      rows: rows.sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/top-products?from=&to=&limit=5
export const getTopProducts = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.from, req.query.to);
    const limit = Number(req.query.limit) || 5;

    const products = await Invoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          category: { $first: "$items.category" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.amount" },
        },
      },
      { $sort: { quantitySold: -1, revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: 1,
          category: 1,
          quantitySold: 1,
          revenue: { $round: ["$revenue", 2] },
        },
      },
    ]);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reports/top-customers?from=&to=&limit=5
export const getTopCustomers = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.from, req.query.to);
    const limit = Number(req.query.limit) || 5;

    const customers = await Invoice.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$customer",
          totalSpent: { $sum: "$total" },
          bills: { $sum: 1 },
          lastPurchase: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: "$customer.name",
          phone: "$customer.phone",
          totalSpent: { $round: ["$totalSpent", 2] },
          bills: 1,
          lastPurchase: 1,
        },
      },
    ]);

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};