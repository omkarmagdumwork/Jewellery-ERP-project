import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Ring", "Chain", "Bangle", "Necklace", "Earring", "Bracelet", "Pendant", "Other"],
    },
    // // metal: { type: String, enum: ["gold", "silver"], required: true },
     metal: {
      type: String,
      required: true,
      enum: ["Gold", "Silver", "gold", "silver"], // Ensure both capitalized & lowercase are supported
    },
    purity: { type: String, required: true }, // 22K, 24K, 18K, 925
    grossWeight: { type: Number, required: true, min: 0 },
    netWeight: { type: Number, required: true, min: 0 },
    makingCharge: { type: Number, default: 0, min: 0 }, // fixed rupees
    wastagePercent: { type: Number, default: 0, min: 0 },
    hallmarkNo: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Net weight should not be greater than gross weight
productSchema.pre("validate", function () {
  if (this.netWeight > this.grossWeight) {
    this.invalidate("netWeight", "Net weight should not be greater than gross weight");
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product;