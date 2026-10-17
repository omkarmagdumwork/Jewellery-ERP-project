import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import rateRoutes from "./routes/rateRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import oldGoldRoutes from "./routes/oldGoldRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import { apiLimiter, loginLimiter } from "./middleware/rateLimiters.js";

const app = express();

// Render sits behind a proxy: needed for correct client IPs and rate limiting
app.set("trust proxy", 1);

// CLIENT_URLS = comma separated list, e.g.
// https://my-admin.vercel.app,https://my-store.vercel.app
const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: (origin, cb) => {
      // No Origin header = curl, Postman, server-to-server: allow
      if (!origin) return cb(null, true);
      // CLIENT_URLS not set (local development): allow everything
      if (allowedOrigins.length === 0) return cb(null, true);
      return cb(null, allowedOrigins.includes(origin));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

// Health check (used by scripts/check-connection.mjs and Render)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/", (req, res) => {
  res.send("Jewellery ERP API is running...");
});

// Rate limiting
app.use("/api", apiLimiter);
app.use("/api/auth/login", loginLimiter);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/old-gold", oldGoldRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/cms", cmsRoutes);

// Unknown API route -> JSON 404
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler (AppError, multer, mongoose, bad JSON)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message;

  if (err.name === "MulterError") {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image must be under 5 MB" : err.message;
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors || {}).map((e) => e.message).join(", ") || err.message;
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid id";
  } else if (err.code === 11000) {
    status = 409;
    message = "Duplicate value: this record already exists";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body";
  }

  if (status >= 500) {
    console.error("SERVER ERROR:", err);
    if (!err.isOperational) message = "Server error";
  }

  res.status(status).json({ success: false, message });
});

export default app;