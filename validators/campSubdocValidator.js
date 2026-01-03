import { body } from "express-validator";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Camp Items validation
export const validateCampItem = [
  body("item_id")
    .notEmpty()
    .withMessage("Item ID is required")
    .isMongoId()
    .withMessage("Item ID must be a valid MongoDB ObjectId"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),
];

// Training validation
export const validateTraining = [
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date"),

  body("train-going-time")
    .optional()
    .isString()
    .withMessage("Train going time must be a string"),

  body("meeting-time")
    .optional()
    .isString()
    .withMessage("Meeting time must be a string"),

  body("meeting-point")
    .optional()
    .trim()
    .isString()
    .withMessage("Meeting point must be a string"),

  body("return-time")
    .optional()
    .isString()
    .withMessage("Return time must be a string"),

  body("train-return-time")
    .optional()
    .isString()
    .withMessage("Train return time must be a string"),

  body("distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("elevation-difference")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation difference must be a non-negative integer"),

  body("remark")
    .optional()
    .trim()
    .isString()
    .withMessage("Remark must be a string"),

  body("responsible-person-id")
    .optional()
    .isMongoId()
    .withMessage("Responsible person ID must be a valid MongoDB ObjectId"),
];

// Fundraising validation
export const validateFundraising = [
  body("datetime")
    .optional()
    .isISO8601()
    .withMessage("Datetime must be a valid ISO8601 date"),

  body("location")
    .optional()
    .trim()
    .isString()
    .withMessage("Location must be a string"),

  body("users-id")
    .optional()
    .isArray()
    .withMessage("Users ID must be an array"),

  body("users-id.*")
    .optional()
    .isMongoId()
    .withMessage("Each user ID must be a valid MongoDB ObjectId"),
];

// Stage validation
export const validateStage = [
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date"),

  body("number")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number must be a positive integer"),

  body("start-point")
    .optional()
    .trim()
    .isString()
    .withMessage("Start point must be a string"),

  body("end-point")
    .optional()
    .trim()
    .isString()
    .withMessage("End point must be a string"),

  body("distance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number"),

  body("elevation-gain")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer"),

  body("elevation-loss")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer"),

  body("route-description")
    .optional()
    .trim()
    .isString()
    .withMessage("Route description must be a string"),
];

// AG (General Meeting) validation
export const validateAG = [
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date"),

  body("time")
    .optional()
    .isString()
    .withMessage("Time must be a string"),

  body("location")
    .optional()
    .trim()
    .isString()
    .withMessage("Location must be a string"),

  body("participants")
    .optional()
    .isArray()
    .withMessage("Participants must be an array"),

  body("participants.*.email")
    .optional()
    .matches(emailRegex)
    .withMessage("Email must be valid"),

  body("participants.*.nbOfParticipants")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of participants must be a non-negative integer"),
];

// Information Evening validation
export const validateInformationEvening = [
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date"),

  body("time")
    .optional()
    .isString()
    .withMessage("Time must be a string"),

  body("location")
    .optional()
    .trim()
    .isString()
    .withMessage("Location must be a string"),

  body("participants")
    .optional()
    .isArray()
    .withMessage("Participants must be an array"),

  body("participants.*.email")
    .optional()
    .matches(emailRegex)
    .withMessage("Email must be valid"),

  body("participants.*.nbOfParticipants")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of participants must be a non-negative integer"),
];
