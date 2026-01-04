import express from "express";
// Imports des dépendances locales (extensions .js requises)
import handleValidationErrors from "../middlewares/handleValidationErrors.js";
import fileUpload from "../middlewares/fileUpload.js";
import HikeController from "../controllers/hikeController.js";
import { validateHikeHikeCreation } from "../validators/hikeValidator.js";

const router = express.Router();

router.get("/", HikeController.getAllHikes);

router.post(
  "/",
  fileUpload.single("image"), // Gestion du fichier avant la validation
  validateHikeHikeCreation, // Validation des champs textes
  handleValidationErrors, // Renvoi d'erreurs 400 si validation échoue
  HikeController.createHike
);
router.delete("/:id", HikeController.deleteHike);

export default router;
