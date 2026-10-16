import express from "express";
import {
  addSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Supplier ani purchase fakt admin/manager sathi (salesman la nahi)
router.use(protect, authorize("admin", "manager"));

router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.post("/", addSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", authorize("admin"), deleteSupplier);

export default router;