import express from "express";
import { validateLogin } from "../validators/authValidator.js";
import { handleValidationErrors } from "../middlewares/handleValidationErrors.js";
import AuthController from "../controllers/authController.js";

const router = express.Router();

router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  function (req, res) {
    AuthController.login(req, res);
  }
);

router.post("/logout", function (req, res) {
  AuthController.logout(req, res);
});

export default router;
