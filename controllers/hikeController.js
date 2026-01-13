import createError from "http-errors";
import Hike from "../models/Hike.model.js";
import { matchedData } from "express-validator";
import { deleteImage } from "../utils/cloudinaryHelper.js";

class HikeController {
  async getAllHikes(req, res) {
    // Pagination parameters
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 6;
    const skip = (page - 1) * limit;

    // Count all for pagination metadata used in response
    const total = await Hike.countDocuments();

    const hikes = await Hike.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username firstname lastname")
      .lean();

    res.status(200).json({
      data: hikes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
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
    await hike.populate("user", "username firstname lastname");

    res.status(201).json(hike);
  }

  async deleteHike(req, res) {
    const hike = await Hike.findById(req.params.hikeId);

    if (!hike) {
      throw createError(404, "Randonnée non trouvée");
    }

    // ÉTAPE 1 : Suppression externe (Point de défaillance possible)
    if (hike.imageUrl) {
      // Si ceci échoue (throw), Express stoppe tout ici -> pas de deleteOne()
      await deleteImage(hike.imageUrl);
    }

    // ÉTAPE 2 : Suppression interne (Seulement si Étape 1 OK)
    await hike.deleteOne();

    res.status(204).send();

    /* const data = matchedData(req);
    console.log("Deleting hike with data:", data);
    // Suppression sécurisée : on vérifie l'ID du hike ET l'ID de l'auteur
    const result = await Hike.findOneAndDelete({
      _id: data.hikeId,
    });

    if (!result) {
      throw createError(404, "Hike not found or you are not the author");
    }

    res.status(204).send(); */
  }
}
export default new HikeController();
