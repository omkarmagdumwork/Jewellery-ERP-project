import mongoose from "mongoose";

// Photos are managed from the admin panel (/api/cms/products/:id/images)
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Ring", "Chain", "Bangle", "Necklace", "Earring", "Bracelet", "Pendant", "Other"],
    },
    metal: {
      type: String,
      required: true,
      enum: ["Gold", "Silver", "gold", "silver"],
    },
    purity: { type: String, required: true }, // 22K, 24K, 18K, 925, 999
    grossWeight: { type: Number, required: true, min: 0 },
    netWeight: { type: Number, required: true, min: 0 },
    stoneWeight: { type: Number, default: 0, min: 0 },
    makingChargeType: { type: String, enum: ["perGram", "fixed"], default: "perGram" },
    makingCharge: { type: Number, default: 0, min: 0 },
    wastagePercent: { type: Number, default: 0, min: 0 },
    hallmarkNo: { type: String, trim: true },
    huid: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 0 },

    // Storefront
    images: { type: [imageSchema], default: [] },
    imageUrl: { type: String, default: "" }, // first image, kept for older code
    isFeatured: { type: Boolean, default: false },
    showOnWebsite: { type: Boolean, default: true },

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