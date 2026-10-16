import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: "" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, trim: true, default: "" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" }, // set when converted
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new", index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Enquiry", enquirySchema);
