import { body, param } from "express-validator";
import validateObjectId from "./commonValidator.js";

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

export const validateTrainingBody = [
  // 1. Validation de l'ID Camp dans l'URL
  param("campId")
    .isMongoId()
    .withMessage("Item reference must be a valid MongoDB ObjectId"),

  // 2. Champs Obligatoires & Dates
  body("date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("Training date must be a valid ISO8601 date")
    .toDate(), // Important: convertit la string en Date

  // 3. Champs Numériques (Conversion impérative avec form-data)
  body("number")
    .optional({ checkFalsy: true }) // "checkFalsy" gère le cas où le champ est envoyé vide ""
    .isInt({ min: 1 })
    .withMessage("Training number must be a positive integer")
    .toInt(), // Conversion string -> int

  body("distance")
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage("Distance must be a non-negative number")
    .toFloat(),

  body("elevationGain")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage("Elevation gain must be a non-negative integer")
    .toInt(),

  body("elevationLoss")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage("Elevation loss must be a non-negative integer")
    .toInt(),

  // 4. Champs Textes Simples (Nettoyage)
  // J'ai repris tes noms de variables en camelCase pour correspondre à ton validateur d'origine
  body("trainGoingTime").optional().trim().isString(),
  body("trainReturnTime").optional().trim().isString(),
  body("meetingTime").optional().trim().isString(),
  body("meetingPoint").optional().trim().isString(),
  body("returnTime").optional().trim().isString(),
  body("routeDescription").optional().trim().isString(), // J'ai vu ça dans 'stages', utile ici ?
  body("remark").optional().trim().isString(),

  // 5. Références MongoDB
  body("responsiblePerson")
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage("Responsible person must be a valid MongoDB ObjectId"),

  // 6. Cas complexe : itemsList (Tableau d'objets)
  // En form-data, le front doit envoyer JSON.stringify([{itemId: "...", quantity: 2}])
  body("itemsList")
    .optional({ checkFalsy: true })
    .custom((value) => {
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) throw new Error("Must be an array");
        return true;
      } catch (e) {
        throw new Error("Items list must be a valid JSON stringified array");
      }
    })
    .customSanitizer((value) => JSON.parse(value)), // On le transforme en vrai objet JS
];

export const validateCreateTraining = [
  ...validateObjectId("campId"), // On déverse les règles de l'ID
  ...validateTrainingBody, // On déverse les règles du Body
];

export const validateUpdateTraining = [
  ...validateObjectId("campId"),
  ...validateObjectId("trainingId"),
  ...validateTrainingBody,
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

  body("time").optional().isString().withMessage("Time must be a string"),

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

  body("time").optional().isString().withMessage("Time must be a string"),

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
