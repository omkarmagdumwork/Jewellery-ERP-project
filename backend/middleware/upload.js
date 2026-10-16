import multer from "multer";
import AppError from "../utils/AppError.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Files stay in memory and go straight to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new AppError("Only JPG, PNG or WebP images are allowed", 400));
  },
});