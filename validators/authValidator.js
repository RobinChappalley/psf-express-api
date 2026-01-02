import { body } from "express-validator";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .matches(emailRegex)
    .withMessage("Email must contain @ and a domain with ."),

  body("password").notEmpty().withMessage("Password is required"),
];
