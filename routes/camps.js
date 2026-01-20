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
  validateCreateStage,
  validateUpdateStage,
  validateCreateFundraising,
  validateUpdateFundraising,
  validateGeneralMeeting,
  validateInfoEvening,
  validatePublicRegistration,
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
  restrictTo("admin"),
  validateUpdateTraining,
  validateRequest,
  CampController.updateCampTraining
);

router.delete(
  "/:campId/trainings/:trainingId",
  authenticate,
  restrictTo("admin"),
  [...validateObjectId("campId"), validateObjectId("trainingId")],
  validateRequest,
  CampController.deleteCampTraining
);

// ==================== STAGES ROUTES ====================

router.get(
  "/:campId/stages",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.getCampStages
);

router.get(
  "/:campId/stages/:stageId",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  [...validateObjectId("campId"), ...validateObjectId("stageId")],
  validateRequest,
  CampController.getCampStageById
);

router.post(
  "/:campId/stages",
  authenticate,
  restrictTo("admin"),
  upload.single("gpxFile"),
  validateCreateStage,
  validateRequest,
  CampController.addCampStage
);

router.put(
  "/:campId/stages/:stageId",
  authenticate,
  restrictTo("admin"),
  validateUpdateStage,
  validateRequest,
  CampController.updateCampStage
);

router.delete(
  "/:campId/stages/:stageId",
  authenticate,
  restrictTo("admin"),
  [...validateObjectId("campId"), ...validateObjectId("stageId")],
  validateRequest,
  CampController.deleteCampStage
);

// ==================== FUNDRAISINGS ROUTES ====================

router.get(
  "/:campId/fundraisings",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.getCampFundraisings
);

router.get(
  "/:campId/fundraisings/:fundraisingId",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  [...validateObjectId("campId"), ...validateObjectId("fundraisingId")],
  validateRequest,
  CampController.getCampFundraisingById
);

router.post(
  "/:campId/fundraisings",
  authenticate,
  restrictTo("admin"),
  validateCreateFundraising,
  validateRequest,
  CampController.addCampFundraising
);

router.put(
  "/:campId/fundraisings/:fundraisingId",
  authenticate,
  restrictTo("admin"),
  validateUpdateFundraising,
  validateRequest,
  CampController.updateCampFundraising
);

router.delete(
  "/:campId/fundraisings/:fundraisingId",
  authenticate,
  restrictTo("admin"),
  [...validateObjectId("campId"), ...validateObjectId("fundraisingId")],
  validateRequest,
  CampController.deleteCampFundraising
);

// ==================== GENERAL MEETING ROUTES (Singleton) ====================

router.get(
  "/:campId/ag",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.getGeneralMeeting
);

router.put(
  "/:campId/ag",
  authenticate,
  restrictTo("admin"),
  validateGeneralMeeting,
  validateRequest,
  CampController.updateGeneralMeeting
);

router.delete(
  "/:campId/ag",
  authenticate,
  restrictTo("admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.deleteGeneralMeeting
);

// ==================== INFO EVENING ROUTES (Singleton) ====================

router.get(
  "/:campId/info-evening",
  authenticate,
  restrictTo("parent", "accompagnant", "admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.getInfoEvening
);

router.put(
  "/:campId/info-evening",
  authenticate,
  restrictTo("admin"),
  validateInfoEvening,
  validateRequest,
  CampController.updateInfoEvening
);

router.delete(
  "/:campId/info-evening",
  authenticate,
  restrictTo("admin"),
  validateObjectId("campId"),
  validateRequest,
  CampController.deleteInfoEvening
);

// ==================== PUBLIC REGISTRATION ROUTES (No Auth) ====================

router.post(
  "/:campId/ag/register",
  validatePublicRegistration,
  validateRequest,
  CampController.registerToGeneralMeeting
);

router.post(
  "/:campId/info-evening/register",
  validatePublicRegistration,
  validateRequest,
  CampController.registerToInfoEvening
);

export default router;
