import express from "express";
import {
  validateLogin,
  validateSignup,
  validateChangePassword,
} from "../validators/authValidator.js";
import { authenticate } from "../middlewares/auth.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import AuthController from "../controllers/authController.js";
import loginLimiter from "../utils/rateLimiter.js";

const router = express.Router();

// Rate limiter appliqué uniquement sur login et signup
if (process.env.NODE_ENV !== "test") {
  router.post(
    "/signup",
    loginLimiter,
    validateSignup,
    validateRequest,
    AuthController.signup
  );

  router.post(
    "/login",
    loginLimiter,
    validateLogin,
    validateRequest,
    AuthController.login
  );

  router.post("/logout", AuthController.logout);

  router.put(
    "/change-password",
    authenticate,
    validateChangePassword,
    validateRequest,
    AuthController.changePassword
  );
} else {
  // En mode test, on n'applique pas le rate limiter
  router.post(
    "/signup",
    validateSignup,
    validateRequest,
    AuthController.signup
  );

  router.post("/login", validateLogin, validateRequest, AuthController.login);

  router.post("/logout", AuthController.logout);

  router.put(
    "/change-password",
    authenticate,
    validateChangePassword,
    validateRequest,
    AuthController.changePassword
  );
}

export default router;
