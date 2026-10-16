import express from "express";
// Use your real auth middleware path and export names
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  bannerSchema, updateBannerSchema, settingsSchema, enquiryStatusSchema,
  testimonialSchema, updateTestimonialSchema,
} from "../validators/cmsSchemas.js";
import {
  listBanners, createBanner, updateBanner, deleteBanner,
  getSettings, updateSettings,
  listEnquiries, updateEnquiryStatus, deleteEnquiry,
  addProductImages, deleteProductImage,
  getStats, convertEnquiryToCustomer,
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
} from "../controllers/cmsController.js";

const router = express.Router();

// Everything here is for the admin panel: admin and manager only
router.use(protect, authorize("admin", "manager"));

// multer must run BEFORE validate so the text fields of the form are parsed
router.get("/banners", listBanners);
router.post("/banners", upload.single("image"), validate(bannerSchema), createBanner);
router.put("/banners/:id", upload.single("image"), validate(updateBannerSchema), updateBanner);
router.delete("/banners/:id", deleteBanner);

router.get("/settings", getSettings);
router.put("/settings", validate(settingsSchema), updateSettings);

router.get("/enquiries", listEnquiries);
router.put("/enquiries/:id", validate(enquiryStatusSchema), updateEnquiryStatus);
router.delete("/enquiries/:id", deleteEnquiry);
router.post("/enquiries/:id/convert", convertEnquiryToCustomer);

router.get("/stats", getStats);

router.get("/testimonials", listTestimonials);
router.post("/testimonials", validate(testimonialSchema), createTestimonial);
router.put("/testimonials/:id", validate(updateTestimonialSchema), updateTestimonial);
router.delete("/testimonials/:id", deleteTestimonial);

router.post("/products/:id/images", upload.array("images", 6), addProductImages);
router.delete("/products/:id/images/:imageId", deleteProductImage);

export default router;
