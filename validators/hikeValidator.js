import { body } from "express-validator";
import validateObjectId from "./commonValidator.js";

export const validateHikeHikeCreation = [
  body("userId").isMongoId().withMessage("User ID must be a valid Mongo ID"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 2000 })
    .withMessage("Content is too long (max 2000 chars)"),
];
