import express from "express";
import {
  validateCreateHike,
  validateUpdateHike,
} from "../validators/hikeValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import HikeController from "../controllers/hikeController.js";
import validateObjectId from "../validators/commonValidator.js";
const router = express.Router();

router.get("/", HikeController.getAllHikes);

router.post(
  "/",
  validateCreateHike,
  validateRequest,
  HikeController.createHike
);

router.get(
  "/:id",
  validateObjectId,
  validateRequest,
  HikeController.getHikeById
);

router.put(
  "/:id",
  validateUpdateHike,
  validateRequest,
  HikeController.updateHike
);

router.delete(
  "/:id",
  validateObjectId,
  validateRequest,
  HikeController.deleteHike
);

export default router;
