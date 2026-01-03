import express from "express";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../validators/userValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import validateIdParam from "../validators/commonValidator.js";
import UserController from "../controllers/userController.js";

const router = express.Router();

router.get("/", UserController.getAllUsers);

router.get("/:id", validateIdParam, validateRequest, UserController.getOneUser);

router.post(
  "/",
  validateCreateUser,
  validateRequest,
  UserController.createUser
);

router.put(
  "/:id",
  validateIdParam,
  validateUpdateUser,
  validateRequest,
  UserController.updateUser
);

router.delete(
  "/:id",
  validateIdParam,
  validateRequest,
  UserController.deleteUser
);

export default router;
