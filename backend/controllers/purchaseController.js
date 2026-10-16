import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";
import Counter from "../models/Counter.js";

const GST_PERCENT = 3;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const getNextPurchaseNo = async (session) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "purchase" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return `PUR-${String(counter.seq).padStart(5, "0")}`;
};

/*
POST /api/purchases
Body:
{
  "supplier": "<supplierId>",
  "supplierInvoiceNo": "KR-101",
  "paymentMode": "bank",
  "items": [
    { "product": "<existingProductId>", "quantity": 2, "ratePerGram": 6300 },
    { "newProduct": { name, category, metal, purity, grossWeight, netWeight,
                      makingCharge, wastagePercent, hallmarkNo },
      "quantity": 1, "ratePerGram": 6300 }
  ]
}
*/
export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { supplier, supplierInvoiceNo, items, paymentMode = "cash" } = req.body;

    if (!supplier || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "supplier ani items (kamit kami 1) dya" });
    }

    let purchase;

    await session.withTransaction(async () => {
      const sup = await Supplier.findOne({ _id: supplier, isActive: true }).session(session);
      if (!sup) throw new AppError("Supplier sapadla nahi", 404);

      const purchaseItems = [];
      let subtotal = 0;

      for (const it of items) {
        const qty = Number(it.quantity);
        const ratePerGram = Number(it.ratePerGram);

        if (!Number.isInteger(qty) || qty < 1) {
          throw new AppError("Quantity 1 kinva jast purna sankhya asavi");
        }
        if (!(ratePerGram > 0)) {
          throw new AppError("ratePerGram dya (0 peksha jast)");
        }

        let product;

        if (it.product) {
          // Existing product: stock vadhav
          product = await Product.findOneAndUpdate(
            { _id: it.product, isActive: true },
            { $inc: { quantity: qty } },
            { new: true, session }
          );
          if (!product) throw new AppError("Product sapadla nahi");
        } else if (it.newProduct) {
          // Navin product inventory madhe add kar
          const created = await Product.create(
            [{ ...it.newProduct, quantity: qty, createdBy: req.user._id }],
            { session }
          );
          product = created[0];
        } else {
          throw new AppError("Pratyek item madhe product kinva newProduct dya");
        }

        const makingCharge = Number(it.makingCharge ?? product.makingCharge) || 0;
        const amount = round2((product.netWeight * ratePerGram + makingCharge) * qty);

        subtotal += amount;
        purchaseItems.push({
          product: product._id,
          name: product.name,
          metal: product.metal,
          purity: product.purity,
          netWeight: product.netWeight,
          ratePerGram,
          makingCharge,
          quantity: qty,
          amount,
        });
      }

      subtotal = round2(subtotal);
      const gst = round2((subtotal * GST_PERCENT) / 100);
      const total = round2(subtotal + gst);
      const purchaseNo = await getNextPurchaseNo(session);

      const created = await Purchase.create(
        [
          {
            purchaseNo,
            supplier: sup._id,
            supplierInvoiceNo,
            items: purchaseItems,
            subtotal,
            gstPercent: GST_PERCENT,
            gst,
            total,
            paymentMode,
            createdBy: req.user._id,
          },
        ],
        { session }
      );
      purchase = created[0];
    });

    res.status(201).json(purchase);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id (supplier kinva product)" });
    }
    res.status(err.status || 400).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// GET /api/purchases?supplier=<id>&from=2026-10-01&to=2026-10-31&page=1&limit=10
export const getPurchases = async (req, res) => {
  try {
    const { supplier, from, to, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (supplier) filter.supplier = supplier;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .populate("supplier", "name phone")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Purchase.countDocuments(filter),
    ]);

    res.json({ purchases, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/purchases/:id
export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("supplier", "name phone email address city gstin")
      .populate("createdBy", "name");

    if (!purchase) return res.status(404).json({ message: "Purchase sapadla nahi" });
    res.json(purchase);
  } catch (err) {
    res.status(400).json({ message: "Invalid purchase id" });
  }
};