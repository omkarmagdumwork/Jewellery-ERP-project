import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
} from "../controllers/purchaseController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("admin", "manager"));

router.post("/", createPurchase);
router.get("/", getPurchases);
router.get("/:id", getPurchaseById);

export default router;