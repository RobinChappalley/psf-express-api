import express from "express";
import {
  validateCreateCamp,
  validateUpdateCamp,
} from "../validators/campValidator.js";
import {
  validateCampItem,
  validateCreateTraining,
  validateUpdateTraining,
  validateNearestTraining,
} from "../validators/campSubdocValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import CampController from "../controllers/campController.js";
import validateObjectId from "../validators/commonValidator.js";
import multer from "multer";
import { authenticate, restrictTo } from "../middlewares/auth.js";
import { validateFilterStatus } from "../validators/filtersValidator.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get(
  "/",
  validateFilterStatus,
  validateRequest,
  CampController.getAllCamps
);

router.get(
  "/:id",
  validateObjectId(),
  validateRequest,
  CampController.getCampById
);
router.post(
  "/",
  authenticate,
  restrictTo("admin"),
  validateCreateCamp,
  validateRequest,
  CampController.createCamp
);
router.put(
  "/:id",
  authenticate,
  restrictTo("admin"),
  validateUpdateCamp,
  validateRequest,
  CampController.updateCamp
);

router.delete(
  "/:id",
  authenticate,
  restrictTo("admin"),
  validateObjectId(),
  validateRequest,
  CampController.deleteCamp
);

// Camp Items Routes
router.get(
  "/:campId/items",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.getCampItems
);

router.get(
  "/:campId/item/:itemId",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  [...validateObjectId("campId"), ...validateObjectId("itemId")],
  validateRequest,
  CampController.getCampItemById
);

router.post(
  "/:campId/items",
  authenticate,
  restrictTo("admin"),
  [...validateObjectId("campId"), ...validateCampItem],
  validateRequest,
  CampController.addCampItem
);

router.put(
  "/:campId/item/:itemId",
  authenticate,
  restrictTo("admin"),
  [
    ...validateObjectId("campId"),
    ...validateObjectId("itemId"),
    ...validateCampItem,
  ],
  validateRequest,
  CampController.updateCampItem
);

router.delete(
  "/:campId/item/:itemId",
  authenticate,
  restrictTo("admin"),
  [...validateObjectId("campId"), ...validateObjectId("itemId")],
  validateRequest,
  CampController.deleteCampItem
);

// Recherche de l'entraînement le plus proche (DOIT être avant /:campId/trainings)
router.get(
  "/trainings/nearest",
  validateNearestTraining,
  validateRequest,
  CampController.getNearestTraining
);

// Camp Trainings Routes
router.get(
  "/:campId/trainings",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.getCampTrainings
);

router.get(
  "/:campId/trainings/:trainingId",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  [...validateObjectId("campId"), validateObjectId("trainingId")],
  validateRequest,
  CampController.getCampTrainingById
);

router.post(
  "/:campId/trainings",
  authenticate,
  restrictTo("admin"),
  upload.single("gpxFile"), // 1. On extrait le fichier
  validateCreateTraining, // 2. On valide les champs (y compris req.body peuplé par multer)
  validateRequest, // 3. On check les erreurs de validation
  CampController.addCampTraining // 4. On exécute la logique
);

router.put(
  "/:campId/trainings/:trainingId",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  validateUpdateTraining,
  validateRequest,
  CampController.updateCampTraining
);

router.delete(
  "/:campId/trainings/:trainingId",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  [...validateObjectId("campId"), validateObjectId("trainingId")],
  validateRequest,
  CampController.deleteCampTraining
);

export default router;
