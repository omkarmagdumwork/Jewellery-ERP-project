export const CATEGORIES = ["Ring", "Chain", "Bangle", "Earring", "Necklace"];

export const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const ratePerGram = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// "22K gold", "999 silver"
export const purityLabel = (p) => `${p.purity} ${p.metal.toLowerCase()}`;

export const isInternal = (link) => typeof link === "string" && link.startsWith("/");

// Cloudinary can resize and compress on the fly. Other URLs are returned unchanged.
export function optimizeImage(url, width = 800) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
}
