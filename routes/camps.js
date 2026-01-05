import express from "express";
import {
  validateCreateCamp,
  validateUpdateCamp,
} from "../validators/campValidator.js";
import {
  validateCampItem,
  validateCreateTraining,
  validateUpdateTraining,
} from "../validators/campSubdocValidator.js";
import validateRequest from "../middlewares/handleValidationErrors.js";
import CampController from "../controllers/campController.js";
import validateObjectId from "../validators/commonValidator.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/", CampController.getAllCamps);

router.get(
  "/:id",
  validateObjectId(),
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
  validateObjectId(),
  validateRequest,
  CampController.deleteCamp
);

// Camp Items Routes
router.get(
  "/:campId/items",
  validateObjectId(),
  validateRequest,
  CampController.getCampItems
);

router.get(
  "/:campId/item/:itemId",
  [...validateObjectId("campId"), validateObjectId("itemId")],
  validateRequest,
  CampController.getCampItemById
);

router.post(
  "/:campId/items",
  validateCampItem,
  validateRequest,
  CampController.addCampItem
);

router.put(
  "/:campId/item/:itemId",
  validateCampItem,
  validateRequest,
  CampController.updateCampItem
);

router.delete(
  "/:campId/item/:itemId",
  [...validateObjectId("campId"), validateObjectId("itemId")],
  validateRequest,
  CampController.deleteCampItem
);

// Camp Trainings Routes
router.get(
  "/:campId/trainings",
  validateObjectId("campId"),
  validateRequest,
  CampController.getCampTrainings
);

router.get(
  "/:campId/trainings/:trainingId",
  [...validateObjectId("campId"), validateObjectId("trainingId")],
  validateRequest,
  CampController.getCampTrainingById
);

router.post(
  "/:campId/trainings",
  upload.single("gpxFile"), // 1. On extrait le fichier
  validateCreateTraining, // 2. On valide les champs (y compris req.body peuplé par multer)
  validateRequest, // 3. On check les erreurs de validation
  CampController.addCampTraining // 4. On exécute la logique
);

router.put(
  "/:campId/trainings/:trainingId",
  validateUpdateTraining,
  validateRequest,
  CampController.updateCampTraining
);

router.delete(
  "/:campId/trainings/:trainingId",
  [...validateObjectId("campId"), validateObjectId("trainingId")],
  validateRequest,
  CampController.deleteCampTraining
);

export default router;
