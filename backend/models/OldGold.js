import mongoose from "mongoose";

const oldGoldSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    metal: { type: String, enum: ["gold", "silver"], required: true },
    purity: { type: String, required: true }, // 24K, 22K, 18K, 925
    grossWeight: { type: Number, required: true, min: 0 },
    stoneWeight: { type: Number, default: 0, min: 0 }, // stones / dirt, not metal
    netWeight: { type: Number, required: true, min: 0 }, // gross - stone
    deductionPercent: { type: Number, default: 0, min: 0, max: 100 }, // melting loss
    payableWeight: { type: Number, required: true, min: 0 }, // net after deduction
    rate: { type: Number, required: true, min: 0 }, // rate per gram at exchange time
    value: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["in_stock", "melted"], default: "in_stock" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const OldGold = mongoose.model("OldGold", oldGoldSchema);
export default OldGold;