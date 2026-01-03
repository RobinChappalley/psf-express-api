import express from "express";
import { validateLogin } from "../validators/authValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import AuthController from "../controllers/authController.js";

const router = express.Router();

router.post("/login", validateLogin, validateRequest, AuthController.login);

router.post("/logout", AuthController.logout);

export default router;
