import { body } from "express-validator";

// Email regex: must contain @ and . at the end
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//Phone regex
const phoneRegex = /^(\+|00)[1-9]\d{1,3}[\d\s\-]{6,14}$/;

export const validateCreateUser = [
  //Role validation

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
    .isString()
    .matches(emailRegex)
    .withMessage("User email must contain @ and a domain with ."),

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
    .withMessage("Address must be an object"),

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
    .withMessage("Parent reference must be a valid MongoDB ObjectId"),

  body("children")
    .optional()
    .isArray()
    .withMessage("Children must be an array."),

  body("children.*")
    .optional()
    .isMongoId()
    .withMessage("A child reference must be a valid MongoDB ObjectId"),

  //Participation Info validation
  body("participationInfo")
    .optional()
    .isObject()
    .withMessage("Address must be an object"),

  body("participationInfo.birthDate")
    .optional()
    .isISO8601()
    .withMessage("Birthdate must be a valid ISO8601 date"),

  body("participationInfo.tshirtInfo")
    .optional()
    .isObject()
    .withMessage("T-shirt info must be an object"),

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
    .withMessage("Allergies must be an array of strings"),

  body("participationInfo.allergies.*")
    .optional()
    .isString()
    .withMessage("Each allergy must be a string"),

  body("participationInfo.medication")
    .optional()
    .isArray()
    .withMessage("Medication must be an array of strings"),

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
    .withMessage("isCASMember must be a boolean"),

  body("participationInfo.isHelicopterInsured")
    .optional()
    .isBoolean()
    .withMessage("isHelicopterInsured must be a boolean"),

  body("participationInfo.hasPhotoConsent")
    .optional()
    .isBoolean()
    .withMessage("hasPhotoConsent must be a boolean"),

  body("participationInfo.hasPaid")
    .optional()
    .isBoolean()
    .withMessage("hasPaid must be a boolean"),
];
