import { body } from "express-validator";

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email must contain @ and a domain with ."),

  body("password").notEmpty().withMessage("Password is required"),
];
