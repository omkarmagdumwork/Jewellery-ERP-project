import OldGold from "../models/OldGold.js";
import { buildOldGoldItems, sumOldGold } from "../utils/oldGold.js";

// POST /api/old-gold/calculate
// Preview only, nothing is saved. Salesman uses this at the counter before billing.
export const calculateOldGold = async (req, res) => {
  try {
    const items = await buildOldGoldItems(req.body.oldGold);
    res.json({ items, total: sumOldGold(items) });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

// GET /api/old-gold?status=in_stock&customer=<id>&page=1&limit=10
export const getOldGold = async (req, res) => {
  try {
    const { status, customer, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    const skip = (Number(page) - 1) * Number(limit);

    const [records, total, stockSummary] = await Promise.all([
      OldGold.find(filter)
        .populate("customer", "name phone")
        .populate("invoice", "invoiceNo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      OldGold.countDocuments(filter),
      // Total old gold currently in stock, grouped by metal + purity
      OldGold.aggregate([
        { $match: { status: "in_stock" } },
        {
          $group: {
            _id: { metal: "$metal", purity: "$purity" },
            totalPayableWeight: { $sum: "$payableWeight" },
            totalValue: { $sum: "$value" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      records,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      stockSummary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/old-gold/:id/status   body: { "status": "melted" }
export const updateOldGoldStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["in_stock", "melted"].includes(status)) {
      return res.status(400).json({ message: "Status must be in_stock or melted" });
    }

    const record = await OldGold.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Old gold record not found" });
    }

    record.status = status;
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: "Invalid old gold id" });
  }
};