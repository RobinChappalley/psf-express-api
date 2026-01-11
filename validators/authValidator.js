import { body } from "express-validator";
import UserModel from "../models/User.model.js";

export const validateSignup = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email must contain @ and a domain with .")
    .bail()
    .custom(async (email) => {
      const user = await UserModel.findOne({ email });
      if (user) {
        throw new Error("This email is already used");
      }
      return true;
    }),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("firstname")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Firstname is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Firstname must contain between 1 and 20 characters"),

  body("lastname")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Lastname is required")
    .isLength({ min: 1, max: 20 })
    .withMessage("Lastname must contain between 1 and 20 characters"),
];

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email must contain @ and a domain with ."),

  body("password").notEmpty().withMessage("Password is required"),
];
