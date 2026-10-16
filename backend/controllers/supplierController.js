import Supplier from "../models/Supplier.js";

// POST /api/suppliers
export const addSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(supplier);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }
    res.status(400).json({ message: err.message });
  }
};

// GET /api/suppliers?search=&page=1&limit=10
export const getSuppliers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const filter = { isActive: true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Supplier.countDocuments(filter),
    ]);

    res.json({ suppliers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/suppliers/:id
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ message: "Invalid supplier ID" });
  }
};

// PUT /api/suppliers/:id
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    Object.assign(supplier, req.body);
    await supplier.save();
    res.json(supplier);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/suppliers/:id (soft delete)
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || !supplier.isActive) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    supplier.isActive = false;
    await supplier.save();
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid supplier ID" });
  }
};