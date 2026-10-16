import mongoose from "mongoose";

const text = { type: String, trim: true, default: "" };

// A single document (key = "main") that holds all storefront settings
const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    shopName: { type: String, trim: true, default: "Jewellery Shop" },
    tagline: text,
    announcement: text,
    phone: text,
    whatsapp: text, // digits with country code, e.g. 919876543210
    email: text,
    address: text,
    workingHours: text,
    mapUrl: text,
    about: text,
    instagram: text,
    facebook: text,
    gstin: text,
    showRates: { type: Boolean, default: true },
    showPrices: { type: Boolean, default: false },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = function () {
  return this.findOneAndUpdate(
    { key: "main" },
    { $setOnInsert: { key: "main" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export default mongoose.model("SiteSettings", siteSettingsSchema);
