import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token is missing. Please log in.",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "User not found or account is inactive.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Access denied. You do not have permission to perform this action.",
    });
  }

  next();
};