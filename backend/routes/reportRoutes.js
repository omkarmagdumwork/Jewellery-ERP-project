import express from "express";
import {
  getDashboard,
  getSalesReport,
  getStockReport,
  getProfitReport,
  getTopProducts,
  getTopCustomers,
} from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Reports are for admin / manager only
router.use(protect, authorize("admin", "manager"));

router.get("/dashboard", getDashboard);
router.get("/sales", getSalesReport);
router.get("/stock", getStockReport);
router.get("/profit", getProfitReport);
router.get("/top-products", getTopProducts);
router.get("/top-customers", getTopCustomers);

export default router;