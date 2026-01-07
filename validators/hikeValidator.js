import { body } from "express-validator";

export const validateHikeHikeCreation = [
  body("user").isMongoId().withMessage("User must be a valid Mongo ID"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 2000 })
    .withMessage("Content is too long (max 2000 chars)"),
];
