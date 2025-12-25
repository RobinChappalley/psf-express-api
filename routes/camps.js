import express from "express";
import {
  validateCreateCamp,
  validateUpdateCamp,
  handleValidationErrors,
} from "../validators/campValidator.js";
import CampController from "../controllers/campController.js";

const router = express.Router();

/**
 * POST /camp
 * Ajouter un camp
 */
router.post(
  "/",
  validateCreateCamp,
  handleValidationErrors,
  function (req, res, next) {
    CampController.createCamp(req, res);
  }
);

/* GET /camps
 * Récupérer la liste de tous les camps
 */
router.get("/", function (req, res, next) {
  CampController.getAllCamps(req, res);
});

/**
 * GET /camps/:id
 * Récupérer un camp
 */
router.get("/:id", function (req, res, next) {
  CampController.getCampById(req, res);
});

/**
 * PUT /camps/:id
 * Mettre à jour un camp
 */
router.put(
  "/:id",
  validateUpdateCamp,
  handleValidationErrors,
  function (req, res, next) {
    CampController.updateCamp(req, res);
  }
);

/**
 * DELETE /camps/:id
 * Supprimer un camp
 */
router.delete("/:id", function (req, res, next) {
  CampController.deleteCamp(req, res);
});
export default router;
