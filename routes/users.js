import express from "express";
import { validateCreateUser } from "../validators/userValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import UserController from "../controllers/userController.js";

const router = express.Router();

/**
 * POST /user
 * Ajouter un utilisateur
 */
router.get("/", UserController.getAllUsers);

router.post(
  "/",
  validateCreateUser,
  validateRequest,
  UserController.createUser
);

export default router;
