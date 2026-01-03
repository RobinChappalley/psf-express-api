import express from "express";
import {
  validateCreateItem,
  validateUpdateItem,
} from "../validators/itemValidator.js";
import validateIdParam from "../validators/commonValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import ItemController from "../controllers/itemController.js";

const router = express.Router();

router.get("/", ItemController.getAllItems);

router.post(
  "/",
  validateCreateItem,
  validateRequest,
  ItemController.createItem
);

router.put(
  "/:id",
  validateUpdateItem,
  validateRequest,
  ItemController.updateItem
);

router.delete(
  "/:id",
  validateIdParam,
  validateRequest,
  ItemController.deleteItem
);

export default router;
