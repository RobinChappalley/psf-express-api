import { body, validationResult } from "express-validator";
import UserModel from "../models/User.model.js";
import CampModel from "../models/Camp.model.js";
import validateObjectId from "./commonValidator.js";

//Phone regex
const phoneRegex = /^(\+|00)[1-9]\d{1,3}[\d\s\-]{6,14}$/;

export const validateCreateUser = [
  //Role validation
  body("role")
    .optional() //If no role sent, mongoose applies default ("enfant")
    .isArray()
    .withMessage("Role must be an array."),

  body("role.*")
    .isIn(["admin", "accompagnant", "parent", "enfant"])
    .withMessage("Roles must be one of: admin, accompagnant, parent, enfant"),

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
    .if((value, { req }) => req.body.email)
    .notEmpty()
    .withMessage("Password is required when email is provided")
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
    .custom(async (parentId) => {
      const user = await UserModel.findById(parentId);
      if (!user) {
        throw new Error("This user doesn't exist");
      }
      if (user.role.includes("enfant")) {
        throw new Error("A user with the role ENFANT can not be a parent");
      }
      return true;
    }),

  body("children")
    .optional()
    .isArray()
    .withMessage("Children must be an array.")
    .bail()
    .custom(async (childrenIds) => {
      if (!childrenIds.length) return true;
      const children = await UserModel.find({ _id: { $in: childrenIds } });
      if (children.length !== childrenIds.length)
        throw new Error("At least one child does not exist");
      const invalidChildren = children.filter(
        (child) => !child.role.includes("enfant")
      );
      if (invalidChildren.length > 0)
        throw new Error("Some children do not have the role ENFANT");
      return true;
    }),

  body("camps")
    .optional()
    .isArray()
    .withMessage("Camps must be an array")
    .bail()
    .custom(async (campsIds) => {
      if (!campsIds.length) return true;
      const camps = await CampModel.find({ _id: { $in: campsIds } });
      if (camps.length !== campsIds.length)
        throw new Error("At least one camp does not exist");
      return true;
    }),

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

export const validateUpdateUser = [
  //Same validations as create, but all optional, and email must be unique except for the current user
  ...validateObjectId(),
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

  //Password validation
  body("password")
    .optional()
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
    .custom(async (parentId) => {
      const user = await UserModel.findById(parentId);
      if (!user) {
        throw new Error("This user doesn't exist");
      }
      if (user.role.includes("enfant")) {
        throw new Error("A user with the role ENFANT can not be a parent");
      }
      return true;
    }),

  body("children")
    .optional()
    .isArray()
    .withMessage("Children must be an array.")
    .bail()
    .custom(async (childrenIds) => {
      if (!childrenIds.length) return true;
      const children = await UserModel.find({ _id: { $in: childrenIds } });
      if (children.length !== childrenIds.length)
        throw new Error("At least one child does not exist");
      const invalidChildren = children.filter(
        (child) => !child.role.includes("enfant")
      );
      if (invalidChildren.length > 0)
        throw new Error("Some children do not have the role ENFANT");
      return true;
    }),

  body("camps")
    .optional()
    .isArray()
    .withMessage("Camps must be an array")
    .bail()
    .custom(async (campsIds) => {
      if (!campsIds.length) return true;
      const camps = await CampModel.find({ _id: { $in: campsIds } });
      if (camps.length !== campsIds.length)
        throw new Error("At least one camp does not exist");
      return true;
    }),

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
