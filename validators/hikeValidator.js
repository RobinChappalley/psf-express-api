import { body } from "express-validator";
import validateObjectId from "./commonValidator.js";

export const validateCreateHike = [
  body("user")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date"),

  body("gpsTrack")
    .optional()
    .isObject()
    .withMessage("GPS track must be an object"),

  body("startPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("Start point must be a string"),

  body("endPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("End point must be a string"),

  body("distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("elevationGain")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer"),

  body("elevationLoss")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer"),

  body("routeDescription")
    .optional()
    .trim()
    .isString()
    .withMessage("Route description must be a string"),
];

export const validateUpdateHike = [
  ...validateObjectId(),
  body("user")
    .optional()
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date"),

  body("gpsTrack")
    .optional()
    .isObject()
    .withMessage("GPS track must be an object"),

  body("startPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("Start point must be a string"),

  body("endPoint")
    .optional()
    .trim()
    .isString()
    .withMessage("End point must be a string"),

  body("distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("elevationGain")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer"),

  body("elevationLoss")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer"),

  body("routeDescription")
    .optional()
    .trim()
    .isString()
    .withMessage("Route description must be a string"),
];
