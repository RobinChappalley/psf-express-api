import express from "express";
import UserController from "../controllers/userController.js";
import { validateCreateCamp } from "../validators/campValidator.js";

const router = express.Router();

/**
 * POST /user
 * Ajouter un utilisateur
 */
router.post("/user", validateCreateCamp, UserController.createUser);

router.get("/users", UserController.getAllUsers);

export default router;
