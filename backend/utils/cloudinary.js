import { v2 as cloudinary } from "cloudinary";
import AppError from "./AppError.js";

let configured = false;

// Configured lazily so .env is already loaded when this runs
function ensureConfigured() {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new AppError("Image upload is not configured on the server", 500);
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

// Upload an in-memory file buffer. Returns { url, publicId }
export function uploadBuffer(buffer, folder) {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `jewellery-erp/${folder}`, resource_type: "image" },
      (err, result) => {
        if (err) return reject(new AppError("Image upload failed. Please try again.", 502));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

// Never throws: a failed cleanup must not break the real request
export async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
}
