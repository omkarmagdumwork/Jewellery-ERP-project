import rateLimit from "express-rate-limit";

// Counts only FAILED logins: 10 wrong attempts in 15 minutes = 429
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Try again in 15 minutes.",
    }),
});

// General protection for the whole API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ success: false, message: "Too many requests. Please slow down." }),
});