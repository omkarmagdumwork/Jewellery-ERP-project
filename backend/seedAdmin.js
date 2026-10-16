import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

await mongoose.connect(process.env.MONGO_URI);

const exists = await User.findOne({ email: "admin@shop.com" });

if (exists) {
  console.log("Admin already exists");
} else {
  await User.create({
    name: "Shop Admin",
    email: "admin@shop.com",
    password: "admin123",
    role: "admin", 
  });
  console.log("Admin created");
}

process.exit();