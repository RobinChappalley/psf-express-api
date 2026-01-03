import express from "express";
import {
  validateCreateCamp,
  validateUpdateCamp,
} from "../validators/campValidator.js";
import {
  validateCampItem,
  validateTraining,
} from "../validators/campSubdocValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import CampController from "../controllers/campController.js";
import validateIdParam from "../validators/commonValidator.js";

const router = express.Router();

router.get("/", CampController.getAllCamps);

router.get(
  "/:id",
  validateIdParam,
  validateRequest,
  CampController.getCampById
);
router.post(
  "/",
  validateCreateCamp,
  validateRequest,
  CampController.createCamp
);
router.put(
  "/:id",
  validateUpdateCamp,
  validateRequest,
  CampController.updateCamp
);

router.delete(
  "/:id",
  validateIdParam,
  validateRequest,
  CampController.deleteCamp
);

// Camp Items Routes
router.get(
  "/:id/items",
  validateIdParam,
  validateRequest,
  CampController.getCampItems
);

router.post(
  "/:id/items",
  validateCampItem,
  validateRequest,
  CampController.addCampItem
);

router.put(
  "/:id/item/:itemId",
  validateCampItem,
  validateRequest,
  CampController.updateCampItem
);

router.delete(
  "/:id/item/:itemId",
  validateIdParam,
  validateRequest,
  CampController.deleteCampItem
);

// Camp Trainings Routes
router.get(
  "/:id/trainings",
  validateIdParam,
  validateRequest,
  CampController.getCampTrainings
);

router.get(
  "/:id/trainings/:trainingId",
  validateIdParam,
  validateRequest,
  CampController.getCampTrainingById
);

router.post(
  "/:id/trainings",
  validateTraining,
  validateRequest,
  CampController.addCampTraining
);

router.put(
  "/:id/trainings/:trainingId",
  validateTraining,
  validateRequest,
  CampController.updateCampTraining
);

router.delete("/:id/trainings/:trainingId", CampController.deleteCampTraining);

export default router;
