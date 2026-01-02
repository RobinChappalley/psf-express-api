import jwt from "jsonwebtoken";
import UserModel from "../models/User.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await UserModel.findById(decoded.id);

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = user;
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.some((role) => req.user.role.includes(role))) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
