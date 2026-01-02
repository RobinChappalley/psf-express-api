import express from "express";
import { validateCreateUser } from "../validators/userValidator.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";
import UserController from "../controllers/userController.js";

const router = express.Router();

/**
 * POST /user
 * Ajouter un utilisateur
 */
router.get("/", function (req, res) {
  UserController.getAllUsers(req, res);
});

router.post(
  "/",
  validateCreateUser,
  handleValidationErrors,
  function (req, res) {
    UserController.createUser(req, res);
  }
);

export default router;
