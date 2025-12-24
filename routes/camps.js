import express from "express";
import fs from "fs";

const router = express.Router();

/**
 * POST /camp
 * Ajouter un camp
 */
router.post("/", function (req, res, next) {
  console.log(req.body);
  const newCamp = {
    id: Date.now().toString(),
    ...req.body,
  };
  //camps.push(newCamp);
  res.status(201).json(newCamp);
});

/* GET /camps
 * Récupérer la liste de tous les camps
 */
router.get("/", function (req, res, next) {
  res.json(camps);
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

/**
 * GET /camps/:id/items
 * Récupérer tous les objets d'un camp
 */
router.get("/:id/items", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp) {
    return res.status(404).json({ error: "Camp not found" });
  }
  res.json(camp["items-list"] || []);
});

/**
 * POST /camps/:id/item
 * Ajouter un objet à un camp
 */
router.post("/:id/items", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp) {
    return res.status(404).json({ error: "Camp not found" });
  }
  if (!camp["items-list"]) {
    camp["items-list"] = [];
  }
  const newItem = { ...req.body };
  camp["items-list"].push(newItem);
  res.status(201).json(newItem);
});

/**
 * PUT /camps/:id/item/:itemId
 * Mettre à jour un objet d'un camp
 */
router.put("/:id/item/:itemId", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp || !camp["items-list"]) {
    return res.status(404).json({ error: "Camp or item not found" });
  }
  const item = camp["items-list"].find((i) => i.item_id === req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: "Item not found" });
  }
  Object.assign(item, req.body);
  res.json(item);
});

/**
 * DELETE /camps/:id/item/:itemId
 * Supprimer un objet d'un camp
 */
router.delete("/:id/item/:itemId", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp || !camp["items-list"]) {
    return res.status(404).json({ error: "Camp or item not found" });
  }
  const index = camp["items-list"].findIndex(
    (i) => i.item_id === req.params.itemId
  );
  if (index === -1) {
    return res.status(404).json({ error: "Item not found" });
  }
  camp["items-list"].splice(index, 1);
  res.json({ message: "Item deleted" });
});

/**
 * GET /camps/:id/trainings
 * Récupérer les entraînements d'un camp
 */
router.get("/:id/trainings", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp) {
    return res.status(404).json({ error: "Camp not found" });
  }
  res.json(camp.trainings || []);
});

/**
 * POST /camps/:id/training
 * Ajouter un entraînement
 */
router.post("/:id/trainings", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp) {
    return res.status(404).json({ error: "Camp not found" });
  }
  if (!camp.trainings) {
    camp.trainings = [];
  }
  const newTraining = {
    id: Date.now().toString(),
    ...req.body,
  };
  camp.trainings.push(newTraining);
  res.status(201).json(newTraining);
});

/**
 * PUT /camps/:id/trainings/:trainingId
 * Modifier un entraînement
 */
router.put("/:id/trainings/:trainingId", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp || !camp.trainings) {
    return res.status(404).json({ error: "Camp or training not found" });
  }
  const training = camp.trainings.find((t) => t.id === req.params.trainingId);
  if (!training) {
    return res.status(404).json({ error: "Training not found" });
  }
  Object.assign(training, req.body);
  res.json(training);
});

/**
 * DELETE /camps/:id/trainings/:trainingId
 * Supprimer un entraînement
 */
router.delete("/:id/trainings/:trainingId", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp || !camp.trainings) {
    return res.status(404).json({ error: "Camp or training not found" });
  }
  const index = camp.trainings.findIndex((t) => t.id === req.params.trainingId);
  if (index === -1) {
    return res.status(404).json({ error: "Training not found" });
  }
  camp.trainings.splice(index, 1);
  res.json({ message: "Training deleted" });
});

/**
 * GET /camps/:id/trainings/:trainingId/items
 * Récupérer les objets d'un entraînement
 */
router.get("/:id/trainings/:trainingId/items", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp || !camp.trainings) {
    return res.status(404).json({ error: "Camp or training not found" });
  }
  const training = camp.trainings.find((t) => t.id === req.params.trainingId);
  if (!training) {
    return res.status(404).json({ error: "Training not found" });
  }
  res.json(training["items-list"] || []);
});

/**
 * POST /camps/:id/trainings/:trainingId/item
 * Ajouter un objet d'entraînement
 */
router.post("/:id/trainings/:trainingId/items", function (req, res, next) {
  const camp = camps.find((c) => c.id === req.params.id);
  if (!camp || !camp.trainings) {
    return res.status(404).json({ error: "Camp or training not found" });
  }
  const training = camp.trainings.find((t) => t.id === req.params.trainingId);
  if (!training) {
    return res.status(404).json({ error: "Training not found" });
  }
  if (!training["items-list"]) {
    training["items-list"] = [];
  }
  const newItem = { ...req.body };
  training["items-list"].push(newItem);
  res.status(201).json(newItem);
});

/**
 * PUT /camps/:id/trainings/:trainingId/items/:itemId
 * Modifier un objet d'entraînement
 */
router.put(
  "/:id/trainings/:trainingId/items/:itemId",
  function (req, res, next) {
    const camp = camps.find((c) => c.id === req.params.id);
    if (!camp || !camp.trainings) {
      return res.status(404).json({ error: "Camp or training not found" });
    }
    const training = camp.trainings.find((t) => t.id === req.params.trainingId);
    if (!training || !training["items-list"]) {
      return res.status(404).json({ error: "Training or item not found" });
    }
    const item = training["items-list"].find(
      (i) => i.item_id === req.params.itemId
    );
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    Object.assign(item, req.body);
    res.json(item);
  }
);

/**
 * DELETE /camps/:id/trainings/:trainingId/items/:itemId
 * Supprimer un objet d'entraînement
 */
router.delete(
  "/:id/trainings/:trainingId/items/:itemId",
  function (req, res, next) {
    const camp = camps.find((c) => c.id === req.params.id);
    if (!camp || !camp.trainings) {
      return res.status(404).json({ error: "Camp or training not found" });
    }
    const training = camp.trainings.find((t) => t.id === req.params.trainingId);
    if (!training || !training["items-list"]) {
      return res.status(404).json({ error: "Training or item not found" });
    }
    const index = training["items-list"].findIndex(
      (i) => i.item_id === req.params.itemId
    );
    if (index === -1) {
      return res.status(404).json({ error: "Item not found" });
    }
    training["items-list"].splice(index, 1);
    res.json({ message: "Item deleted" });
  }
);

export default router;
