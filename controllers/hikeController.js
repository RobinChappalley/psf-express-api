import createError from "http-errors";
import Hike from "../models/Hike.model.js";
import { matchedData } from "express-validator";

class HikeController {
  async getAllHikes(req, res) {
    const hikes = await Hike.find()
      .sort({ createdAt: -1 })
      .populate("user", "username email")
      .lean();

    res.status(200).json(hikes);
  }
  async createHike(req, res) {
    const payload = matchedData(req);

    if (req.file) {
      payload.imageUrl = req.file.path;
    }

    // LOGIQUE HYBRIDE (TEST / PROD)
    // Si on a un token (req.user), on l'utilise
    // Sinon, on prend le userId envoyé manuellement et validé
    if (req.user) {
      payload.user = req.user._id;
    } else if (payload.userId) {
      payload.user = payload.userId; // On mappe le champ validé vers le champ du modèle
    } else {
      // Si ni l'un ni l'autre, ça va planter dans Mongoose, donc on prévient
      throw new Error("Aucun utilisateur identifié pour créer cette randonnée");
    }

    // On nettoie payload.userId car le modèle attend 'user', pas 'userId'
    delete payload.userId;

    const hike = await Hike.create(payload);
    await hike.populate("user", "username email");

    res.status(201).json(hike);
  }

  async deleteHike(req, res) {
    const data = matchedData(req);
    // Suppression sécurisée : on vérifie l'ID du hike ET l'ID de l'auteur
    const result = await Hike.findOneAndDelete({
      _id: data._id,
      user: data.user._id,
    });

    if (!result) {
      throw createError(404, "Hike not found or you are not the author");
    }

    res.status(204).send();
  }
}
export default new HikeController();
