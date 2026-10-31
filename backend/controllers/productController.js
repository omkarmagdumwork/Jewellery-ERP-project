import Product from "../models/Product.js";
import { uploadBuffer } from "../utils/cloudinary.js";

// Parse FormData text fields into real numbers / booleans.
// images and imageUrl are never taken from the form: photos are saved only
// through the upload code below and the /api/cms image endpoints.
const parseProductData = (body) => {
  const parsed = { ...body };
  delete parsed.images;
  delete parsed.imageUrl;
  delete parsed._id;
  delete parsed.__v;
  delete parsed.createdBy;
  delete parsed.createdAt;
  delete parsed.updatedAt;

  const numericFields = [
    "grossWeight", "netWeight", "stoneWeight", "quantity", "makingCharge", "wastagePercent",
  ];
  numericFields.forEach((field) => {
    if (parsed[field] !== undefined && parsed[field] !== "") {
      parsed[field] = Number(parsed[field]);
    } else if (parsed[field] === "") {
      delete parsed[field];
    }
  });

  ["isFeatured", "showOnWebsite", "isActive"].forEach((field) => {
    if (parsed[field] !== undefined) {
      parsed[field] = parsed[field] === "true" || parsed[field] === true;
    }
  });

  return parsed;
};

// POST /api/products  (admin, manager)
export const addProduct = async (req, res) => {
  try {
    const productData = { ...parseProductData(req.body), createdBy: req.user._id };

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, "products"); // { url, publicId }
      productData.images = [uploaded];
      productData.imageUrl = uploaded.url;
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

// GET /api/products?search=ring&metal=gold&category=Ring&page=1&limit=10
export const getProducts = async (req, res) => {
  try {
    const { search, metal, category, purity, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (metal) filter.metal = metal;
    if (category) filter.category = category;
    if (purity) filter.purity = purity;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { hallmarkNo: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid product id" });
  }
};

// PUT /api/products/:id  (admin, manager)
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, parseProductData(req.body));

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, "products");
      product.images.push(uploaded);
      product.imageUrl = product.images[0].url;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

// DELETE /api/products/:id  (only admin) - soft delete
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = false;
    await product.save();
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid product id" });
  }
};