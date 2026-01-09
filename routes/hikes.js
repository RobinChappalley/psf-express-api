import express from "express";
// Imports des dépendances locales (extensions .js requises)
import validateRequest from "../middlewares/handleValidationErrors.js";
import fileUpload from "../middlewares/fileUpload.js";
import HikeController from "../controllers/hikeController.js";
import { validateHikeHikeCreation } from "../validators/hikeValidator.js";
import validateObjectId from "../validators/commonValidator.js";
import { authenticate, restrictTo } from "../middlewares/auth.js";
import { validatePagination } from "../validators/filtersValidator.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  restrictTo("accompagnant", "admin"),
  ...validatePagination,
  validateRequest,
  HikeController.getAllHikes
);

router.post(
  "/",
  authenticate,
  restrictTo("accompagnant", "admin"),
  fileUpload.single("image"), // Gestion du fichier avant la validation
  validateHikeHikeCreation, // Validation des champs textes
  validateRequest, // Renvoi d'erreurs 400 si validation échoue
  HikeController.createHike
);
router.delete(
  "/:hikeId",
  authenticate,
  restrictTo("accompagnant", "admin"),
  validateObjectId("hikeId"),
  validateRequest,
  HikeController.deleteHike
);

export default router;
