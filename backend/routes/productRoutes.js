import express from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js"; // <-- इथे बरोबर आहे

const router = express.Router();

router.get("/", protect, getProducts);
router.get("/:id", protect, getProductById);
router.post("/", protect, authorize("admin", "manager"), upload.single("image"), addProduct);
router.put("/:id", protect, authorize("admin", "manager"), upload.single("image"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;