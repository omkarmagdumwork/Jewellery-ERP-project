import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const phone = z.string().regex(/^\d{10}$/, "Phone must be 10 digits");
const optionalText = z.string().trim().optional();
const money = z.coerce.number().min(0, "Cannot be negative");

// ---------- Auth ----------
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/\d/, "Password needs a digit");

// Do not enforce the password policy at login, only check it is present
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

// ---------- Rate ----------
export const rateSchema = z.object({
  metal: z.enum(["Gold", "Silver"]),
  purity: z.enum(["24K", "22K", "18K", "999", "925"]),
  ratePerGram: z.coerce.number().positive("Rate must be greater than 0"),
});

// ---------- Product ----------
const productBase = z.object({
  name: z.string().trim().min(1, "Name is required"),
  sku: z.string().trim().min(1, "SKU is required"),
  category: z.enum(["Ring", "Chain", "Bangle", "Earring", "Necklace"]),
  metal: z.enum(["Gold", "Silver"]),
  purity: z.enum(["24K", "22K", "18K", "999", "925"]),
  grossWeight: z.coerce.number().positive("Gross weight must be greater than 0"),
  netWeight: z.coerce.number().positive("Net weight must be greater than 0"),
  stoneWeight: money.optional(),
  makingChargeType: z.enum(["perGram", "fixed"]),
  makingCharge: money,
  wastagePercent: z.coerce.number().min(0).max(100).optional(),
  hallmarkNo: optionalText,
  huid: optionalText,
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  isActive: z.boolean().optional(),
});

const weightCheck = (d) =>
  d.netWeight === undefined || d.grossWeight === undefined || d.netWeight <= d.grossWeight;
const weightIssue = { message: "Net weight cannot exceed gross weight", path: ["netWeight"] };

export const createProductSchema = productBase.refine(weightCheck, weightIssue);
export const updateProductSchema = productBase.partial().refine(weightCheck, weightIssue);

// ---------- Customer ----------
const customerBase = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone,
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: optionalText,
  city: optionalText,
  dob: z.coerce.date().nullish(),
  anniversary: z.coerce.date().nullish(),
  notes: optionalText,
});
export const createCustomerSchema = customerBase;
export const updateCustomerSchema = customerBase.partial();

// ---------- Invoice ----------
export const createInvoiceSchema = z.object({
  customer: objectId,
  items: z
    .array(
      z.object({
        product: objectId,
        quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "Add at least one item"),
  discount: money.default(0),
  exchangeAmount: money.default(0),
  paymentMode: z.enum(["Cash", "UPI", "Card", "Mixed"]),
  paidAmount: money,
});

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

// ---------- Supplier ----------
const gstin = z
  .string()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/, "Invalid GSTIN")
  .optional()
  .or(z.literal(""));

const supplierBase = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone,
  gstin,
  address: optionalText,
});
export const createSupplierSchema = supplierBase;
export const updateSupplierSchema = supplierBase.partial();

// ---------- Purchase ----------
export const createPurchaseSchema = z.object({
  supplier: objectId,
  supplierInvoiceNo: optionalText,
  date: z.coerce.date().optional(),
  items: z
    .array(
      z
        .object({
          product: objectId.optional(),
          newProduct: productBase.omit({ quantity: true, isActive: true }).optional(),
          quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
          costPrice: z.coerce.number().positive("Cost price must be greater than 0"),
        })
        .refine((i) => Boolean(i.product) !== Boolean(i.newProduct), {
          message: "Each item needs either an existing product or a new product",
        })
    )
    .min(1, "Add at least one item"),
});
