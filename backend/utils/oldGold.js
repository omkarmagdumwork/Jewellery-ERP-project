import Rate from "../models/Rate.js";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const round3 = (n) => Math.round((n + Number.EPSILON) * 1000) / 1000;

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/*
Validates old gold input and calculates everything on the server.

Input item:
{ metal: "gold", purity: "22K", grossWeight: 3, stoneWeight: 0, deductionPercent: 5 }
*/
export const buildOldGoldItems = async (oldGold = [], session = null) => {
  if (!Array.isArray(oldGold)) {
    throw new AppError("oldGold must be an array");
  }

  const items = [];

  for (const og of oldGold) {
    const { metal, purity } = og;
    const grossWeight = Number(og.grossWeight);
    const stoneWeight = Number(og.stoneWeight) || 0;
    const deductionPercent = Number(og.deductionPercent) || 0;

    if (!["gold", "silver"].includes(metal)) {
      throw new AppError("Old gold metal must be gold or silver");
    }
    if (!purity) {
      throw new AppError("Old gold purity is required");
    }
    if (!(grossWeight > 0)) {
      throw new AppError("Old gold gross weight must be greater than 0");
    }
    if (stoneWeight < 0 || stoneWeight >= grossWeight) {
      throw new AppError("Stone weight must be less than gross weight");
    }
    if (deductionPercent < 0 || deductionPercent > 100) {
      throw new AppError("Deduction percent must be between 0 and 100");
    }

    // Today's rate for the same metal + purity
    const rateDoc = await Rate.findOne({ metal, purity })
      .sort({ createdAt: -1 })
      .session(session);
    if (!rateDoc) {
      throw new AppError(`No rate set for ${metal} ${purity}`);
    }

    const netWeight = round3(grossWeight - stoneWeight);
    const payableWeight = round3(netWeight * (1 - deductionPercent / 100));
    const value = round2(payableWeight * rateDoc.ratePerGram);

    items.push({
      metal,
      purity,
      grossWeight,
      stoneWeight,
      netWeight,
      deductionPercent,
      payableWeight,
      rate: rateDoc.ratePerGram,
      value,
    });
  }

  return items;
};

export const sumOldGold = (items) => round2(items.reduce((sum, i) => sum + i.value, 0));