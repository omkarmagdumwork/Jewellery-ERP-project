import mongoose from "mongoose";

// One model for every image block on the storefront home page:
// hero = top slider, category = arch tiles, promo = offer banners
const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    ctaText: { type: String, trim: true, default: "" },
    ctaLink: { type: String, trim: true, default: "" },
    placement: { type: String, enum: ["hero", "category", "promo"], required: true, index: true },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
