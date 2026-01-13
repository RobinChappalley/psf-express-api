import express from "express";
import { validateLogin, validateSignup, validateChangePassword } from "../validators/authValidator.js";
import { authenticate } from "../middlewares/auth.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import AuthController from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", validateSignup, validateRequest, AuthController.signup);

router.post("/login", validateLogin, validateRequest, AuthController.login);

router.post("/logout", AuthController.logout);

router.put(
  "/change-password",
  authenticate,
  validateChangePassword,
  validateRequest,
  AuthController.changePassword
);

export default router;
