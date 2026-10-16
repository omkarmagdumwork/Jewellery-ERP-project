import { z } from "zod";

const text = (max) => z.string().trim().max(max);
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const digits = z.string().regex(/^\d{10,15}$/, "Use digits only, 10 to 15 characters").or(z.literal(""));
const url = z.string().trim().url("Enter a full link starting with https://").or(z.literal(""));
// Multipart forms send booleans as the strings "true" / "false"
const bool = z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]);

export const bannerSchema = z.object({
  title: text(80).min(1, "Title is required"),
  subtitle: text(160).optional(),
  ctaText: text(30).optional(),
  ctaLink: text(200).optional(),
  placement: z.enum(["hero", "category", "promo"]),
  order: z.coerce.number().int().min(0).max(999).optional(),
  isActive: bool.optional(),
});
export const updateBannerSchema = bannerSchema.partial();

export const settingsSchema = z
  .object({
    shopName: text(60).min(1, "Shop name is required"),
    tagline: text(160),
    announcement: text(160),
    phone: digits,
    whatsapp: digits,
    email: z.string().trim().email("Enter a valid email").or(z.literal("")),
    address: text(300),
    workingHours: text(160),
    mapUrl: url,
    about: text(1500),
    instagram: url,
    facebook: url,
    gstin: text(15),
    showRates: z.boolean(),
    showPrices: z.boolean(),
  })
  .partial();

export const enquirySchema = z.object({
  name: text(80).min(1, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  message: text(1000).optional(),
  productId: objectId.optional(),
  productName: text(120).optional(),
  website: z.string().optional(), // honeypot field, real users leave it empty
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

export const testimonialSchema = z.object({
  name: text(60).min(1, "Name is required"),
  text: text(300).min(1, "Write what the customer said"),
  place: text(60).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});
export const updateTestimonialSchema = testimonialSchema.partial();
