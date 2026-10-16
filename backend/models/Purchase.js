import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    metal: String,
    purity: String,
    netWeight: Number,
    ratePerGram: Number, // supplier cha rate (kharedi rate)
    makingCharge: Number, // supplier cha making
    quantity: Number,
    amount: Number,
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNo: { type: String, required: true, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierInvoiceNo: { type: String, trim: true }, // supplier invoice number
    items: { type: [purchaseItemSchema], required: true },
    subtotal: { type: Number, required: true },
    gstPercent: { type: Number, default: 3 },
    gst: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMode: { type: String, enum: ["cash", "upi", "card", "bank"], default: "cash" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;