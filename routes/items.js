import express from "express";
import {
  validateCreateItem,
  validateUpdateItem,
} from "../validators/itemValidator.js";
import validateIdParam from "../validators/commonValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import ItemController from "../controllers/itemController.js";

const router = express.Router();

//ici on est donc à http://{{APP_HOST}}:{{APP_PORT}}/items

router.get("/", ItemController.getAllItems);
router.get(
  "/:id",
  validateIdParam,
  validateRequest,
  ItemController.getItemById
);

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
