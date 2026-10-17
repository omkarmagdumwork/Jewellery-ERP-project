import express from "express";
import {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { getCustomerHistory } from "../controllers/invoiceController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Salesperson can add, view, and update customers, but only admin can delete customers
router.get("/", protect, getCustomers);
// Admin panel calls /customers/:id/history; the controller reads params.customerId
router.get("/:id/history", protect, (req, res, next) => {
  req.params.customerId = req.params.id;
  return getCustomerHistory(req, res, next);
});
router.get("/:id", protect, getCustomerById);
router.post("/", protect, addCustomer);
router.put("/:id", protect, updateCustomer);
router.delete("/:id", protect, authorize("admin"), deleteCustomer);

export default router;