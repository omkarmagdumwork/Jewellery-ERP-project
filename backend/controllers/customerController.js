import Customer from "../models/Customer.js";

// POST /api/customers
export const addCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Phone number already registered" });
    }
    res.status(400).json({ message: err.message });
  }
};

// GET /api/customers?search=ramesh&page=1&limit=10
export const getCustomers = async (req, res) => {
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

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Customer.countDocuments(filter),
    ]);

    res.json({
      customers,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/customers/:id
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || !customer.isActive) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: "Invalid customer id" });
  }
};

// PUT /api/customers/:id
export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || !customer.isActive) {
      return res.status(404).json({ message: "Customer not found" });
    }

    Object.assign(customer, req.body);
    await customer.save();
    res.json(customer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Phone number already registered" });
    }
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/customers/:id  (fakt admin) - soft delete
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || !customer.isActive) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.isActive = false;
    await customer.save();
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid customer id" });
  }
};