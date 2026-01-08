import express from "express";
import {
  validateCreateItem,
  validateUpdateItem,
} from "../validators/itemValidator.js";
import validateObjectId from "../validators/commonValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import ItemController from "../controllers/itemController.js";
import { authenticate, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

//ici on est donc à http://{{APP_HOST}}:{{APP_PORT}}/items

router.get("/", authenticate, restrictTo("admin"), ItemController.getAllItems);
router.get(
  "/:id",
  authenticate,
  restrictTo("admin"),
  validateObjectId(),
  validateRequest,
  ItemController.getItemById
);

router.post(
  "/",
  authenticate,
  restrictTo("admin"),
  validateCreateItem,
  validateRequest,
  ItemController.createItem
);

router.put(
  "/:id",
  authenticate,
  restrictTo("admin"),
  validateUpdateItem,
  validateRequest,
  ItemController.updateItem
);

router.delete(
  "/:id",
  authenticate,
  restrictTo("admin"),
  validateObjectId(),
  validateRequest,
  ItemController.deleteItem
);

export default router;
