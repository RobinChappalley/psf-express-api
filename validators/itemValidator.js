import { body } from "express-validator";
import validateObjectId from "./commonValidator.js";

export const validateCreateItem = [
  body("slug")
    .notEmpty()
    .withMessage("Slug is required")
    .trim()
    .isString()
    .withMessage("Slug must be a string"),

  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .trim()
    .isString()
    .withMessage("Name must be a string"),

  body("description")
    .optional()
    .trim()
    .isString()
    .withMessage("Description must be a string"),
];

export const validateUpdateItem = [
  ...validateObjectId(),
  body("slug")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Slug cannot be empty")
    .isString()
    .withMessage("Slug must be a string"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isString()
    .withMessage("Name must be a string"),

  body("description")
    .optional()
    .trim()
    .isString()
    .withMessage("Description must be a string"),
];
