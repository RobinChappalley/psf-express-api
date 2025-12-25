import express from "express";
import CampController from "../controllers/campController.js";

const router = express.Router();

/**
 * POST /camp
 * Ajouter un camp
 */
router.post("/", function (req, res, next) {
  CampController.createCamp(req, res);
});

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
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp) {
    return res.status(404).json({ error: "Camp not found" });
  }
  res.json(camp);
});

/**
 * PUT /camps/:id
 * Mettre à jour un camp
 */
router.put("/:id", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp) {
    return res.status(404).json({ error: "Camp not found" });
  }
  Object.assign(camp, req.body);
  res.json(camp);
});

/**
 * DELETE /camps/:id
 * Supprimer un camp
 */
router.delete("/:id", function (req, res, next) {
  const index = camps.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Camp not found" });
  }
  camps.splice(index, 1);
  res.json({ message: "Camp deleted" });
});

export default router;
