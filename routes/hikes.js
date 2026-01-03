import express from "express";
import {
  validateCreateHike,
  validateUpdateHike,
} from "../validators/hikeValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import HikeController from "../controllers/hikeController.js";
import validateIdParam from "../validators/commonValidator.js";
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
  validateIdParam,
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
  validateIdParam,
  validateRequest,
  HikeController.deleteHike
);

export default router;
