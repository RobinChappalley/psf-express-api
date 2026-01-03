import express from "express";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../validators/userValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import validateObjectId from "../validators/commonValidator.js";
import UserController from "../controllers/userController.js";

const router = express.Router();

router.get("/", UserController.getAllUsers);

router.get(
  "/:id",
  validateObjectId(),
  validateRequest,
  UserController.getOneUser
);

router.post(
  "/",
  validateCreateUser,
  validateRequest,
  UserController.createUser
);

router.put(
  "/:id",
  validateObjectId(),
  validateUpdateUser,
  validateRequest,
  UserController.updateUser
);

router.delete(
  "/:id",
  validateObjectId(),
  validateRequest,
  UserController.deleteUser
);

export default router;
