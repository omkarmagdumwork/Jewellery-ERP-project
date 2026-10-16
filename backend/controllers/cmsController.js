import Banner from "../models/Banner.js";
import SiteSettings from "../models/SiteSettings.js";
import Enquiry from "../models/Enquiry.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Testimonial from "../models/Testimonial.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadBuffer, deleteImage } from "../utils/cloudinary.js";

const MAX_PRODUCT_IMAGES = 8;

// ---------- Banners ----------
export const listBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ placement: 1, order: 1, createdAt: -1 });
  res.json({ banners });
});

export const createBanner = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Banner image is required", 400);
  const image = await uploadBuffer(req.file.buffer, "banners");
  const banner = await Banner.create({ ...req.body, image });
  res.status(201).json({ banner });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new AppError("Banner not found", 404);

  const oldPublicId = banner.image?.publicId;
  if (req.file) banner.image = await uploadBuffer(req.file.buffer, "banners");

  Object.assign(banner, req.body);
  await banner.save();

  // Remove the replaced image only after the new one is saved
  if (req.file) await deleteImage(oldPublicId);
  res.json({ banner });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new AppError("Banner not found", 404);

  await banner.deleteOne();
  await deleteImage(banner.image?.publicId);
  res.json({ success: true });
});

// ---------- Site settings ----------
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  res.json({ settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.findOneAndUpdate(
    { key: "main" },
    { $set: req.body },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ settings });
});

// ---------- Enquiries ----------
export const listEnquiries = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const filter = {};
  if (["new", "contacted", "closed"].includes(req.query.status)) filter.status = req.query.status;

  const [enquiries, total, newCount] = await Promise.all([
    Enquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Enquiry.countDocuments(filter),
    Enquiry.countDocuments({ status: "new" }),
  ]);

  res.json({ enquiries, total, newCount, page, totalPages: Math.ceil(total / limit) || 1 });
});

export const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!enquiry) throw new AppError("Enquiry not found", 404);
  res.json({ enquiry });
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
  if (!enquiry) throw new AppError("Enquiry not found", 404);
  res.json({ success: true });
});

// ---------- Product images ----------
export const addProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("images");
  if (!product) throw new AppError("Product not found", 404);
  if (!req.files?.length) throw new AppError("Choose at least one image", 400);

  const existing = product.images?.length || 0;
  if (existing + req.files.length > MAX_PRODUCT_IMAGES) {
    throw new AppError(`A product can have at most ${MAX_PRODUCT_IMAGES} images`, 400);
  }

  const uploaded = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, "products")));

  // $push avoids re-validating the whole product document
  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    { $push: { images: { $each: uploaded } } },
    { new: true }
  ).select("images");

  res.status(201).json({ images: updated.images });
});

export const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select("images");
  if (!product) throw new AppError("Product not found", 404);

  const image = product.images.id(req.params.imageId);
  if (!image) throw new AppError("Image not found", 404);

  await Product.updateOne({ _id: req.params.id }, { $pull: { images: { _id: req.params.imageId } } });
  await deleteImage(image.publicId);
  res.json({ success: true });
});

// ---------- Dashboard numbers ----------
export const getStats = asyncHandler(async (req, res) => {
  const onWebsite = { isActive: true, showOnWebsite: { $ne: false } };
  const [newEnquiries, activeBanners, liveProducts, productsWithoutPhotos] = await Promise.all([
    Enquiry.countDocuments({ status: "new" }),
    Banner.countDocuments({ isActive: true }),
    Product.countDocuments(onWebsite),
    Product.countDocuments({
      ...onWebsite,
      $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
    }),
  ]);
  res.json({ newEnquiries, activeBanners, liveProducts, productsWithoutPhotos });
});

// ---------- Enquiry to customer ----------
// One click in the admin panel turns a website enquiry into a customer record
export const convertEnquiryToCustomer = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) throw new AppError("Enquiry not found", 404);

  let customer = await Customer.findOne({ phone: enquiry.phone });
  const created = !customer;

  if (!customer) {
    const about = enquiry.productName ? ` about ${enquiry.productName}` : "";
    customer = await Customer.create({
      name: enquiry.name,
      phone: enquiry.phone,
      notes: `Website enquiry${about}`,
    });
  }

  enquiry.customer = customer._id;
  if (enquiry.status === "new") enquiry.status = "contacted";
  await enquiry.save();

  res.status(created ? 201 : 200).json({ customer, created, enquiry });
});

// ---------- Testimonials ----------
export const listTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
  res.json({ testimonials });
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  res.status(201).json({ testimonial });
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  if (!testimonial) throw new AppError("Testimonial not found", 404);
  res.json({ testimonial });
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) throw new AppError("Testimonial not found", 404);
  res.json({ success: true });
});
