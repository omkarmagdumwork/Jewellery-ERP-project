import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Rate from "../models/Rate.js";
import Counter from "../models/Counter.js";
import OldGold from "../models/OldGold.js";
import { buildOldGoldItems, sumOldGold } from "../utils/oldGold.js";
import { buildInvoicePdf } from "../utils/invoicePdf.js";

const GST_PERCENT = 3;

const round2 = (number) => Math.round((number + Number.EPSILON) * 100) / 100;

class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Generate the next invoice number
const getNextInvoiceNo = async (session) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "invoice" },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
      session,
    },
  );

  return `INV-${String(counter.seq).padStart(5, "0")}`;
};

// POST /api/invoices
// Create a new invoice
export const createInvoice = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      customer,
      items,
      discount = 0,
      paymentMode = "cash",
      oldGold = [],
    } = req.body;

    if (
      !customer ||
      !mongoose.isValidObjectId(customer) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      throw new AppError(
        "Please provide a valid customer and at least one product.",
      );
    }

    if (!["cash", "card", "upi", "bank_transfer"].includes(paymentMode)) {
      throw new AppError("Invalid payment mode.");
    }

    const discountAmount = Number(discount);

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      throw new AppError("Discount must be a valid non-negative number.");
    }

    if (!Array.isArray(oldGold)) {
      throw new AppError("Old gold must be an array.");
    }

    if (!req.user?._id) {
      throw new AppError("Authenticated user not found.", 401);
    }

    let invoice;

    await session.withTransaction(async () => {
      const cust = await Customer.findOne({
        _id: customer,
        isActive: true,
      }).session(session);

      if (!cust) {
        throw new AppError("Customer not found or inactive.", 404);
      }

      const billItems = [];
      let subtotal = 0;

      // Validate and process each product
      for (const item of items) {
        if (!item?.product || !mongoose.isValidObjectId(item.product)) {
          throw new AppError("Invalid product ID.");
        }

        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new AppError("Quantity must be a positive whole number.");
        }

        // Reduce stock atomically inside the transaction
        const product = await Product.findOneAndUpdate(
          {
            _id: item.product,
            isActive: true,
            quantity: { $gte: quantity },
          },
          {
            $inc: { quantity: -quantity },
          },
          {
            new: true,
            session,
          },
        );

        if (!product) {
          throw new AppError(
            "Product not found, inactive, or insufficient stock.",
          );
        }

        const rateDoc = await Rate.findOne({
          metal: product.metal,
          purity: product.purity,
        })
          .sort({ createdAt: -1 })
          .session(session);

        if (!rateDoc) {
          throw new AppError(
            `No rate configured for ${product.metal} ${product.purity}.`,
          );
        }

        const weightWithWastage =
          Number(product.netWeight) *
          (1 + Number(product.wastagePercent) / 100);

        const metalValue = weightWithWastage * Number(rateDoc.ratePerGram);

        const amount = round2(
          (metalValue + Number(product.makingCharge)) * quantity,
        );

        subtotal += amount;

        billItems.push({
          product: product._id,
          name: product.name,
          category: product.category,
          metal: product.metal,
          purity: product.purity,
          hallmarkNo: product.hallmarkNo,
          netWeight: product.netWeight,
          wastagePercent: product.wastagePercent,
          rate: rateDoc.ratePerGram,
          makingCharge: product.makingCharge,
          quantity,
          amount,
        });
      }

      subtotal = round2(subtotal);

      if (discountAmount > subtotal) {
        throw new AppError("Discount cannot exceed the subtotal.");
      }

      const taxable = round2(subtotal - discountAmount);

      const gst = round2((taxable * GST_PERCENT) / 100);

      const cgst = round2(gst / 2);
      const sgst = round2(gst - cgst);
      const total = round2(taxable + gst);

      // Calculate old gold exchange value
      const oldGoldItems = await buildOldGoldItems(oldGold, session);

      const oldGoldTotal = round2(sumOldGold(oldGoldItems));

      if (!Number.isFinite(oldGoldTotal) || oldGoldTotal < 0) {
        throw new AppError("Invalid old gold value.");
      }

      if (oldGoldTotal > total) {
        throw new AppError("Old gold value cannot exceed the invoice total.");
      }

      const amountPayable = round2(total - oldGoldTotal);

      const invoiceNo = await getNextInvoiceNo(session);

      const createdInvoices = await Invoice.create(
        [
          {
            invoiceNo,
            customer: cust._id,
            items: billItems,
            subtotal,
            discount: discountAmount,
            gstPercent: GST_PERCENT,
            cgst,
            sgst,
            gst,
            total,
            oldGoldItems,
            oldGoldTotal,
            amountPayable,
            paymentMode,
            createdBy: req.user._id,
          },
        ],
        { session },
      );

      invoice = createdInvoices[0];

      // Store exchanged old gold
      if (oldGoldItems.length > 0) {
        await OldGold.insertMany(
          oldGoldItems.map((item) => ({
            ...item,
            customer: cust._id,
            invoice: invoice._id,
            createdBy: req.user._id,
          })),
          { session },
        );
      }
    });

    // return res.status(201).json({
    //   success: true,
    //   message: "Invoice created successfully.",
    //   invoice,
    // });

    return res.status(201).json({
      ...invoice.toObject(),
      success: true,
      message: "Invoice created successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid customer or product ID.",
      });
    }

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create invoice.",
    });
  } finally {
    await session.endSession();
  }
};

// GET /api/invoices
// Get invoices with filters and pagination
export const getInvoices = async (req, res) => {
  try {
    const { from, to, customer, page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100.",
      });
    }

    const filter = {};

    if (customer) {
      if (!mongoose.isValidObjectId(customer)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID.",
        });
      }

      filter.customer = customer;
    }

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        const startDate = new Date(from);

        if (Number.isNaN(startDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }

        filter.createdAt.$gte = startDate;
      }

      if (to) {
        const endDate = new Date(to);

        if (Number.isNaN(endDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }

        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }

      if (
        filter.createdAt.$gte &&
        filter.createdAt.$lte &&
        filter.createdAt.$gte > filter.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date.",
        });
      }
    }

    // Salesman can see only their own invoices
    if (req.user?.role === "salesman") {
      filter.createdBy = req.user._id;
    }

    const skip = (pageNumber - 1) * pageSize;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate("customer", "name phone")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),

      Invoice.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      invoices,
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch invoices.",
    });
  }
};

// GET /api/invoices/:id
// Get a single invoice
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID.",
      });
    }

    const invoice = await Invoice.findById(id)
      .populate("customer", "name phone email address city gstin")
      .populate("createdBy", "name");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    if (
      req.user?.role === "salesman" &&
      invoice.createdBy?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this invoice.",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch invoice.",
    });
  }
};

// GET /api/invoices/customer/:customerId
// Get customer purchase history
export const getCustomerHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    const invoices = await Invoice.find({
      customer: customerId,
      ...(req.user?.role === "salesman" ? { createdBy: req.user._id } : {}),
    })
      .select("invoiceNo items.name items.quantity total createdAt")
      .sort({ createdAt: -1 });

    const totalSpent = round2(
      invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    );

    return res.status(200).json({
      success: true,
      count: invoices.length,
      totalSpent,
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch customer history.",
    });
  }
};

// GET /api/invoices/:id/pdf
// GET /api/invoices/:id/pdf?download=1
// Preview or download invoice PDF
export const downloadInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID.",
      });
    }

    const invoice = await Invoice.findById(id)
      .populate("customer", "name phone email address city gstin")
      .populate("createdBy", "name");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    if (
      req.user?.role === "salesman" &&
      invoice.createdBy?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to print this invoice.",
      });
    }

    const disposition = req.query.download === "1" ? "attachment" : "inline";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${invoice.invoiceNo}.pdf"`,
    );

    return buildInvoicePdf(invoice, res);
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate invoice PDF.",
      });
    }

    res.destroy(error);
  }
};
