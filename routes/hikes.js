import express from "express";
// Imports des dépendances locales (extensions .js requises)
import handleValidationErrors from "../middlewares/handleValidationErrors.js";
import fileUpload from "../middlewares/fileUpload.js";
import HikeController from "../controllers/hikeController.js";
import { validateHikeHikeCreation } from "../validators/hikeValidator.js";
import validateObjectId from "../validators/commonValidator.js";
import { authenticate, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  restrictTo("accompagnant", "admin"),
  HikeController.getAllHikes
);

router.post(
  "/",
  authenticate,
  restrictTo("accompagnant", "admin"),
  fileUpload.single("image"), // Gestion du fichier avant la validation
  validateHikeHikeCreation, // Validation des champs textes
  handleValidationErrors, // Renvoi d'erreurs 400 si validation échoue
  HikeController.createHike
);
router.delete(
  "/:hikeId",
  authenticate,
  restrictTo("accompagnant", "admin"),
  validateObjectId("hikeId"),
  handleValidationErrors,
  HikeController.deleteHike
);

export default router;
