import express from "express";
import { setRate, getLatestRates } from "../controllers/rateController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getLatestRates);
router.get("/latest", protect, getLatestRates); // admin panel calls /rates/latest
router.post("/", protect, authorize("admin"), setRate);

export default router;