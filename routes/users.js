import express from "express";
import UserController from "../controllers/userController.js";
import {
  validateCreateUser,
  handleValidationErrors,
} from "../validators/userValidator.js";

const router = express.Router();

/**
 * POST /user
 * Ajouter un utilisateur
 */
router.post(
  "/",
  validateCreateUser,
  handleValidationErrors,
  UserController.createUser
);

router.get("/", UserController.getAllUsers);

export default router;
