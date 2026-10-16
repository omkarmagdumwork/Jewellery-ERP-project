import express from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { enquirySchema } from "../validators/cmsSchemas.js";
import { getSite, getProducts, getProduct, createEnquiry } from "../controllers/publicController.js";

const router = express.Router();

// Stops enquiry spam: 5 per hour per IP
const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, message: "Too many enquiries. Please call us instead." }),
});

// No login needed for any of these
router.get("/site", getSite);
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/enquiries", enquiryLimiter, validate(enquirySchema), createEnquiry);

export default router;
