import mongoose from "mongoose";

const rateSchema = new mongoose.Schema(
  {
    metal: {
      type: String,
      required: true,
      // Jar enum thevycha asel tar he sagle options add kara, 
      // kiwa enum line puri kadun takli tari chalel mhanje kontihi string chalel.
      enum: ["Gold", "Silver", "gold", "silver"], 
    },
    purity: {
      type: String,
      required: true,
    },
    ratePerGram: {
      type: Number,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Rate", rateSchema);