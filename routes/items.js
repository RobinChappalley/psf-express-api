import express from "express";
import {
  validateCreateItem,
  validateUpdateItem,
} from "../validators/itemValidator.js";
import validateIdParam from "../validators/commonValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import ItemController from "../controllers/itemController.js";

const router = express.Router();

router.get("/items", ItemController.getAllItems);

router.post(
  "/items",
  validateCreateItem,
  validateRequest,
  ItemController.createItem
);

router.put(
  "/item/:id",
  validateUpdateItem,
  validateRequest,
  ItemController.updateItem
);

router.delete(
  "/item/:id",
  validateIdParam,
  validateRequest,
  ItemController.deleteItem
);

export default router;
