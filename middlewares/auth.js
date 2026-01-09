import jwt from "jsonwebtoken";
import { promisify } from "util";
import UserModel from "../models/User.model.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = await promisify(jwt.verify)(token, JWT_SECRET).catch(() => {
    const err = new Error("Invalid or expired token");
    err.status = 401;
    throw err;
  });
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

// Middleware to ensure user can only modify their own profile (unless admin)
export const restrictToSelfOrAdmin = (req, res, next) => {
  const isAdmin = req.user.role.includes("admin");
  const isSelf = req.user._id.toString() === req.params.id;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ message: "You can only modify your own profile" });
  }
  next();
};

// Middleware to force "parent" role when creating a user (for non-admin)
export const forceParentRole = (req, res, next) => {
  const isAdmin = req.user.role.includes("admin");

  if (!isAdmin) {
    req.body.role = ["parent"];
  }
  next();
};
