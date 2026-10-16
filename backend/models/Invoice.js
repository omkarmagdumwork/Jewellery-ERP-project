import mongoose from "mongoose";


const invoiceItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    category: String,
    metal: String,
    purity: String,
    hallmarkNo: String,
    netWeight: Number,
    wastagePercent: Number,
    rate: Number, // rate per gram at the time of invoice creation
    makingCharge: Number,
    quantity: Number,
    amount: Number,
  },
  { _id: false }
);
const oldGoldItemSchema = new mongoose.Schema(
  {
    metal: String,
    purity: String,
    grossWeight: Number,
    stoneWeight: Number,
    netWeight: Number,
    deductionPercent: Number,
    payableWeight: Number,
    rate: Number,
    value: Number,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    items: { type: [invoiceItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    gstPercent: { type: Number, required: true },
    cgst: { type: Number, required: true },
    sgst: { type: Number, required: true },
    gst: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMode: { type: String, enum: ["cash", "upi", "card", "bank"], default: "cash" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      total: { type: Number, required: true },
    oldGoldItems: { type: [oldGoldItemSchema], default: [] },
    oldGoldTotal: { type: Number, default: 0 },
    amountPayable: { type: Number, required: true }, // total - oldGoldTotal
   
    },
  { timestamps: true }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;