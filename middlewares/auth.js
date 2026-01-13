import jwt from "jsonwebtoken";
import { promisify } from "util";
import UserModel from "../models/User.model.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Hiérarchie des rôles : admin hérite d'accompagnant, accompagnant hérite de parent
const ROLE_HIERARCHY = {
  admin: ["admin", "accompagnant", "parent"],
  accompagnant: ["accompagnant", "parent"],
  parent: ["parent"],
  enfant: ["enfant"],
};

const hasRole = (userRoles, requiredRole) => {
  return userRoles.some((role) => {
    const inheritedRoles = ROLE_HIERARCHY[role] || [];
    return inheritedRoles.includes(requiredRole);
  });
};

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Aucun token fourni" });
  }

  const token = authHeader.split(" ")[1];

  const decoded = await promisify(jwt.verify)(token, JWT_SECRET).catch(() => {
    const err = new Error("Token invalide ou expiré");
    err.status = 401;
    throw err;
  });
  const user = await UserModel.findById(decoded.id);

  if (!user) {
    return res.status(401).json({ message: "Utilisateur non trouvé" });
  }

  req.user = user;
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    const hasPermission = roles.some((role) => hasRole(req.user.role, role));
    if (!hasPermission) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    next();
  };
};

// Middleware to ensure user can only modify their own profile, their children's profiles, or is admin
export const restrictToSelfOrAdmin = async (req, res, next) => {
  const isAdmin = req.user.role.includes("admin");
  const isSelf = req.user._id.toString() === req.params.id;

  if (isAdmin || isSelf) {
    return next();
  }

  // Check if the target user is a child of the current user
  const targetUser = await UserModel.findById(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }

  const isParentOfTarget =
    targetUser.parent?.toString() === req.user._id.toString();
  if (isParentOfTarget) {
    return next();
  }

  return res
    .status(403)
    .json({
      message:
        "Vous ne pouvez modifier que votre propre profil ou celui de vos enfants",
    });
};

// Middleware to set child role and parent reference when a parent creates a user
export const forceParentRole = (req, res, next) => {
  const isAdmin = req.user.role.includes("admin");

  if (!isAdmin) {
    req.body.role = ["enfant"];
    req.body.parent = req.user._id;
  }
  next();
};
