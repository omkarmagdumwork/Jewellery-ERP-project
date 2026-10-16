import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";

// Helper function to upload memory buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "jewellery-erp" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper to parse FormData fields correctly
const parseProductData = (body) => {
  const parsed = { ...body };
  
  // Convert numeric fields if present
  const numericFields = ["grossWeight", "netWeight", "stoneWeight", "quantity", "makingCharge", "wastagePercentage"];
  numericFields.forEach((field) => {
    if (parsed[field] !== undefined && parsed[field] !== "") {
      parsed[field] = Number(parsed[field]);
    }
  });

  // Convert boolean fields if present
  if (parsed.isFeatured !== undefined) {
    parsed.isFeatured = parsed.isFeatured === "true" || parsed.isFeatured === true;
  }
  if (parsed.showOnWebsite !== undefined) {
    parsed.showOnWebsite = parsed.showOnWebsite === "true" || parsed.showOnWebsite === true;
  }

  return parsed;
};

// POST /api/products  (admin, manager)
export const addProduct = async (req, res) => {
  try {
    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const cleanedData = parseProductData(req.body);
    const productData = { 
      ...cleanedData, 
      createdBy: req.user._id 
    };

    if (imageUrl) {
      productData.imageUrl = imageUrl;
      productData.images = [imageUrl];
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    const cleanedData = parseProductData(req.body);
    Object.assign(product, cleanedData);

    if (imageUrl) {
      product.imageUrl = imageUrl;
      product.images = [imageUrl];
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
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