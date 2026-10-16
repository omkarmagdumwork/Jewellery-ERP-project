import express from "express";
import {
  calculateOldGold,
  getOldGold,
  updateOldGoldStatus,
} from "../controllers/oldGoldController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Everyone (including salesman) can preview a calculation
router.post("/calculate", protect, calculateOldGold);

// Stock list and status change: admin / manager only
router.get("/", protect, authorize("admin", "manager"), getOldGold);
router.put("/:id/status", protect, authorize("admin", "manager"), updateOldGoldStatus);

export default router;