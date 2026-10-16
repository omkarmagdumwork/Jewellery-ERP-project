import Rate from "../models/Rate.js";

// Admin: set rate for a specific metal and purity
export const setRate = async (req, res, next) => {
  try {
    const { metal, purity, ratePerGram } = req.body;

    if (!metal || !purity || ratePerGram == null) {
      return res.status(400).json({ message: "metal, purity and ratePerGram are required" });
    }

    const rate = await Rate.create({
      metal,
      purity,
      ratePerGram,
      updatedBy: req.user._id,
    });
    res.status(201).json(rate);
  } catch (err) {
    next(err);
  }
};

// All: get latest rates for all metals and purities
export const getLatestRates = async (req, res, next) => {
  try {
    const rates = await Rate.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { metal: "$metal", purity: "$purity" },
          ratePerGram: { $first: "$ratePerGram" },
          updatedAt: { $first: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          metal: "$_id.metal",
          purity: "$_id.purity",
          ratePerGram: 1,
          updatedAt: 1,
        },
      },
    ]);
    res.json(rates);
  } catch (err) {
    next(err);
  }
};