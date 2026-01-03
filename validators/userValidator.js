import { body, validationResult } from "express-validator";
import UserModel from "../models/User.model.js";

//Phone regex
const phoneRegex = /^(\+|00)[1-9]\d{1,3}[\d\s\-]{6,14}$/;

export const validateCreateUser = [
  //Role validation
  body("role")
    .isArray({ min: 1 })
    .withMessage("Role must be an array with at least one entry"),

  body("role.*")
    .isIn(["admin", "accompagnant", "parent", "enfant"])
    .withMessage(
      "Each role must be one of: admin, accompagnant, parent, enfant"
    ),

  body("role")
    .optional() // Permet de ne pas envoyer le rôle (et laisser le défaut mongoose agir)
    .isArray()
    .withMessage("Role must be an array."),

  body("role.*")
    .optional()
    .isString()
    .isIn(["admin", "accompagnant", "parent", "enfant"]) // Optionnel : valide aussi que les valeurs sont correctes
    .withMessage(
      "Rôle not valid. Must be one of: admin, accompagnant, parent, enfant."
    ),

  //Names validation
  body("lastname")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Lastname is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Lastname must contain between 1 and 20 characters"),

  body("firstname")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Firstname is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Firstname must contain between 1 and 20 characters"),

  //Email validation
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("User email must contain @ and a domain with .")
    .bail()
    .custom(async (email) => {
      const user = await UserModel.findOne({ email });
      if (user) {
        throw new Error("This email is already used");
      }
      return true;
    }),

  //Password validation
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  //Phone number validation
  body("phoneNumber")
    .optional()
    .isString()
    .trim()
    .matches(phoneRegex)
    .withMessage(
      "Invalid phone number. Expected : +41794567895 or 0041794567895. Other countries prefixes also accepted."
    ),

  //Address validation
  body("address")
    .optional()
    .isObject()
    .withMessage("Address must be an object")
    .bail(),

  body("address.street")
    .optional()
    .isString()
    .withMessage("Street must be a string"),

  body("address.city")
    .optional()
    .isString()
    .withMessage("City must be a string"),

  body("address.postalCode")
    .optional()
    .isInt()
    .withMessage("Postal code must be an integer number"),

  body("address.country")
    .optional()
    .isString()
    .withMessage("Country must be a string"),

  //Relations validation (parent, children, camps)
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("Parent reference must be a valid MongoDB ObjectId")
    .bail()
    .custom(async (parent) => {
      const user = await UserModel.findById(parent);
      if (!user) {
        throw new Error("This user doesn't exist");
      }
      if (user.role === "enfant") {
        throw new Error("A user with the role ENFANT can not be a parent");
      }
      return true;
    }),

  body("children")
    .optional()
    .isArray()
    .withMessage("Children must be an array.")
    .bail(),

  body("children.*")
    .isMongoId()
    .withMessage("A child reference must be a valid MongoDB ObjectId"),

  //Participation Info validation
  body("participationInfo")
    .optional()
    .isObject()
    .withMessage("ParticipationInfo must be an object")
    .bail(),

  body("participationInfo.birthDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Birthdate must be a valid ISO8601 date"),

  body("participationInfo.tshirtInfo")
    .optional()
    .isObject()
    .withMessage("T-shirt info must be an object")
    .bail(),

  body("participationInfo.tshirtInfo.size")
    .optional()
    .isIn(["xxs", "xs", "s", "m", "l", "xl", "xxl"])
    .withMessage("Tshirt size must be one of: xxs, xs, s, m, l, xl, xxl"),

  body("participationInfo.tshirtInfo.gender")
    .optional()
    .isIn(["m", "f"])
    .withMessage("Tshirt gender must be 'm' or 'f'"),

  body("participationInfo.allergies")
    .optional()
    .isArray()
    .withMessage("Allergies must be an array")
    .bail(),

  body("participationInfo.allergies.*")
    .isString()
    .withMessage("Each allergy must be a string"),

  body("participationInfo.medication")
    .optional()
    .isArray()
    .withMessage("Medication must be an array of strings")
    .bail(),

  body("participationInfo.medication.*")
    .isString()
    .withMessage("Each medication must be a string"),

  body("participationInfo.insuranceNumber")
    .optional()
    .isString()
    .withMessage("Insurance number must be a string"),

  body("participationInfo.insuranceName")
    .optional()
    .isString()
    .withMessage("Insurance name must be a string"),

  body("participationInfo.idExpireDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("ID expire date must be a valid ISO8601 date"),

  body("participationInfo.publicTransportPass")
    .optional()
    .isIn(["AG", "demi-tarif", "aucun"])
    .withMessage("Public transport pass must be one of: AG, demi-tarif, aucun"),

  body("participationInfo.isCASMember")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("isCASMember must be a boolean"),

  body("participationInfo.isHelicopterInsured")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("isHelicopterInsured must be a boolean"),

  body("participationInfo.hasPhotoConsent")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("hasPhotoConsent must be a boolean"),

  body("participationInfo.hasPaid")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("hasPaid must be a boolean"),
];

export const validateUpdateUser = [
  //Same validations as create, but all optional, and email must be unique except for the current user

  //Role validation
  body("role")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Role must be an array with at least one entry"),

  body("role.*")
    .optional()
    .isIn(["admin", "accompagnant", "parent", "enfant"])
    .withMessage(
      "Each role must be one of: admin, accompagnant, parent, enfant"
    ),

  //Names validation
  body("lastname")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Lastname is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Lastname must contain between 1 and 20 characters"),

  body("firstname")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Firstname is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Firstname must contain between 1 and 20 characters"),

  //Email validation
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("User email must contain @ and a domain with .")
    .bail()
    .custom(async (email, { req }) => {
      const user = await UserModel.findOne({ email });
      if (user && user._id.toString() !== req.params.id) {
        throw new Error("This email is already used");
      }
      return true;
    }),

  //Phone number validation
  body("phoneNumber")
    .optional()
    .isString()
    .trim()
    .matches(phoneRegex)
    .withMessage(
      "Invalid phone number. Expected : +41794567895 or 0041794567895. Other countries prefixes also accepted."
    ),

  //Address validation
  body("address")
    .optional()
    .isObject()
    .withMessage("Address must be an object")
    .bail(),

  body("address.street")
    .optional()
    .isString()
    .withMessage("Street must be a string"),

  body("address.city")
    .optional()
    .isString()
    .withMessage("City must be a string"),

  body("address.postalCode")
    .optional()
    .isInt()
    .withMessage("Postal code must be an integer number"),

  body("address.country")
    .optional()
    .isString()
    .withMessage("Country must be a string"),

  //Relations validation (parent, children, camps)
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("Parent reference must be a valid MongoDB ObjectId")
    .bail()
    .custom(async (parent) => {
      const user = await UserModel.findById(parent);
      if (!user) {
        throw new Error("This user doesn't exist");
      }
      if (user.role === "enfant") {
        throw new Error("A user with the role ENFANT can not be a parent");
      }
      return true;
    }),

  body("children")
    .optional()
    .isArray()
    .withMessage("Children must be an array.")
    .bail(),

  body("children.*")
    .optional()
    .isMongoId()
    .withMessage("A child reference must be a valid MongoDB ObjectId"),

  //Participation Info validation
  body("participationInfo")
    .optional()
    .isObject()
    .withMessage("ParticipationInfo must be an object")
    .bail(),

  body("participationInfo.birthDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Birthdate must be a valid ISO8601 date"),

  body("participationInfo.tshirtInfo")
    .optional()
    .isObject()
    .withMessage("T-shirt info must be an object")
    .bail(),

  body("participationInfo.tshirtInfo.size")
    .optional()
    .isIn(["xxs", "xs", "s", "m", "l", "xl", "xxl"])
    .withMessage("Tshirt size must be one of: xxs, xs, s, m, l, xl, xxl"),

  body("participationInfo.tshirtInfo.gender")
    .optional()
    .isIn(["m", "f"])
    .withMessage("Tshirt gender must be 'm' or 'f'"),

  body("participationInfo.allergies")
    .optional()
    .isArray()
    .withMessage("Allergies must be an array")
    .bail(),

  body("participationInfo.allergies.*")
    .optional()
    .isString()
    .withMessage("Each allergy must be a string"),

  body("participationInfo.medication")
    .optional()
    .isArray()
    .withMessage("Medication must be an array of strings")
    .bail(),

  body("participationInfo.medication.*")
    .optional()
    .isString()
    .withMessage("Each medication must be a string"),

  body("participationInfo.insuranceNumber")
    .optional()
    .isString()
    .withMessage("Insurance number must be a string"),

  body("participationInfo.insuranceName")
    .optional()
    .isString()
    .withMessage("Insurance name must be a string"),

  body("participationInfo.idExpireDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("ID expire date must be a valid ISO8601 date"),

  body("participationInfo.publicTransportPass")
    .optional()
    .isIn(["AG", "demi-tarif", "aucun"])
    .withMessage("Public transport pass must be one of: AG, demi-tarif, aucun"),

  body("participationInfo.isCASMember")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("isCASMember must be a boolean"),

  body("participationInfo.isHelicopterInsured")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("isHelicopterInsured must be a boolean"),

  body("participationInfo.hasPhotoConsent")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("hasPhotoConsent must be a boolean"),

  body("participationInfo.hasPaid")
    .optional()
    .isBoolean()
    .toBoolean()
    .withMessage("hasPaid must be a boolean"),
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
