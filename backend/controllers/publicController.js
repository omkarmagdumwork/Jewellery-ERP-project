import mongoose from "mongoose";
import Banner from "../models/Banner.js";
import SiteSettings from "../models/SiteSettings.js";
import Enquiry from "../models/Enquiry.js";
import Testimonial from "../models/Testimonial.js";
import Product from "../models/Product.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getLatestRates, buildRateMap, estimatePrice } from "../utils/publicPrice.js";

const CATEGORIES = ["Ring", "Chain", "Bangle", "Earring", "Necklace"];
const METALS = ["Gold", "Silver"];

// Customers only ever see products that are active and not hidden from the website
const visible = { isActive: true, showOnWebsite: { $ne: false } };

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Public shape: no stock count, making charge, wastage or purchase data
function toPublicProduct(p, rateMap, showPrices) {
  // Safe image extraction supporting various database formats (Array of objects, Array of strings, or single string)
  let formattedImages = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    formattedImages = p.images.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean);
  } else if (p.imageUrl) {
    formattedImages = [p.imageUrl];
  }

  return {
    _id: p._id,
    name: p.name,
    category: p.category,
    metal: p.metal,
    purity: p.purity,
    grossWeight: p.grossWeight,
    netWeight: p.netWeight,
    stoneWeight: p.stoneWeight || 0,
    hallmarked: Boolean(p.hallmarkNo || p.huid),
    huid: p.huid || "",
    images: formattedImages, // <-- आता इथे योग्य इमेजेसची अरे जाईल
    inStock: p.quantity > 0,
    isFeatured: Boolean(p.isFeatured),
    estimatedPrice: showPrices ? estimatePrice(p, rateMap) : null,
  };
}

// One call gives the storefront everything it needs to draw the shell
export const getSite = asyncHandler(async (req, res) => {
  const [settings, banners, rates, testimonials] = await Promise.all([
    SiteSettings.getSingleton(),
    Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean(),
    getLatestRates(),
    Testimonial.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).limit(12).lean(),
  ]);

  // eslint-disable-next-line no-unused-vars
  const { _id, __v, key, createdAt, updatedAt, ...publicSettings } = settings.toObject();

  res.set("Cache-Control", "public, max-age=60");
  res.json({
    settings: publicSettings,
    banners: banners.map((b) => ({
      _id: b._id,
      title: b.title,
      subtitle: b.subtitle,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink,
      placement: b.placement,
      image: b.image.url,
    })),
    rates: settings.showRates ? rates : [],
    testimonials: testimonials.map((t) => ({
      _id: t._id,
      name: t.name,
      text: t.text,
      place: t.place,
      rating: t.rating,
    })),
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const { metal, category, search, sort = "new", featured } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 24);

  // Values are checked against fixed lists, so query-string tricks cannot reach MongoDB
  const filter = { ...visible };
  if (METALS.includes(metal)) filter.metal = metal;
  if (CATEGORIES.includes(category)) filter.category = category;
  if (featured === "true") filter.isFeatured = true;
  if (typeof search === "string" && search.trim()) {
    filter.name = { $regex: escapeRegex(search.trim().slice(0, 50)), $options: "i" };
  }

  const sortMap = {
    new: { createdAt: -1, _id: -1 },
    weightAsc: { netWeight: 1, _id: 1 },
    weightDesc: { netWeight: -1, _id: 1 },
  };

  const [products, total, settings, rates] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[sort] || sortMap.new)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
    SiteSettings.getSingleton(),
    getLatestRates(),
  ]);

  const rateMap = buildRateMap(rates);
  res.json({
    products: products.map((p) => toPublicProduct(p, rateMap, settings.showPrices)),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError("Product not found", 404);

  const product = await Product.findOne({ _id: req.params.id, ...visible }).lean();
  if (!product) throw new AppError("Product not found", 404);

  const [settings, rates, related] = await Promise.all([
    SiteSettings.getSingleton(),
    getLatestRates(),
    Product.find({ ...visible, category: product.category, _id: { $ne: product._id } })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean(),
  ]);

  const rateMap = buildRateMap(rates);
  res.json({
    product: toPublicProduct(product, rateMap, settings.showPrices),
    related: related.map((p) => toPublicProduct(p, rateMap, settings.showPrices)),
  });
});

export const createEnquiry = asyncHandler(async (req, res) => {
  const { name, phone, message, productId, productName, website } = req.body;

  // Bots fill the hidden field. Pretend it worked and save nothing.
  if (website) return res.status(201).json({ success: true });

  await Enquiry.create({ name, phone, message, productId, productName });
  res.status(201).json({ success: true, message: "Thank you. We will call you soon." });
});