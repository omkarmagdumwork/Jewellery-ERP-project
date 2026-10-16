import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  getCustomerHistory,
   downloadInvoicePdf,
} from "../controllers/invoiceController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createInvoice);
router.get("/", protect, getInvoices);
router.get("/customer/:customerId", protect, getCustomerHistory); // /:id chya adhi
router.get("/:id", protect, getInvoiceById);
router.get("/customer/:customerId", protect, getCustomerHistory);
router.get("/:id/pdf", protect, downloadInvoicePdf);
router.get("/:id", protect, getInvoiceById);

export default router;