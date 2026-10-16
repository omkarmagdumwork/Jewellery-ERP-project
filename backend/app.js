import express from "express";
import cors from "cors";

// सर्व राऊट्स इथे इम्पोर्ट करा
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import rateRoutes from "./routes/rateRoutes.js"; // <-- आजच्या दरांसाठी ही राऊत अत्यंत महत्त्वाची आहे
import publicRoutes from "./routes/publicRoutes.js";
import cmsRoutes from "./routes/cmsRoutes.js";

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",") : "*",
  credentials: true,
}));
app.use(express.json());

// API Routes रजिस्टर करा
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/rates", rateRoutes);       // <-- इथे rates ची राऊत जोडली
app.use("/api/public", publicRoutes);
app.use("/api/cms", cmsRoutes);

// Root Route
app.get("/", (req, res) => {
  res.send("Jewellery ERP API is running...");
});

export default app;