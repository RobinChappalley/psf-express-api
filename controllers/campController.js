import { matchedData } from "express-validator";
import CampModel from "../models/Camp.model.js";
import { parseGpxToCoordinates } from "../utils/gpxHandler.js";
import {
  getBoundingBox,
  getMinDistanceToLineString,
} from "../utils/geoUtils.js";
import createError from "http-errors";

class CampController {
  async getAllCamps(req, res) {
    const camps = await CampModel.find();
    if (!camps) {
      return res.status(404).json({ error: "No camps found" });
    }

    res.status(200).json(camps);
  }

  async createCamp(req, res) {
    const data = matchedData(req);
    const newCamp = await CampModel.create(data);
    res.status(201).json(newCamp);
  }

  async getCampById(req, res) {
    // 1. On récupère l'ID validé
    const { id } = matchedData(req);

    // 2. On cherche
    const camp = await CampModel.findById(id);

    // 3. On vérifie l'existence (C'est le job du contrôleur !)
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    // 4. On renvoie
    res.status(200).json(camp);
  }

  async updateCamp(req, res) {
    // 1. On récupère tout ce qui est validé (params et body mélangés souvent)
    const data = matchedData(req);
    // On extrait l'ID pour la recherche, et le reste pour la mise à jour
    const { id, ...updateData } = data;

    // 2. On cherche et update
    const updatedCamp = await CampModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // 3. On vérifie l'existence
    if (!updatedCamp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    // 4. On renvoie
    res.status(200).json(updatedCamp);
  }

  async deleteCamp(req, res) {
    const deletedCamp = await CampModel.findByIdAndDelete(req.params.id);
    if (!deletedCamp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json({ message: "Camp deleted" });
  }

  // Camp Items Methods
  async getCampItems(req, res) {
    const { campId } = matchedData(req);
    const camp = await CampModel.findById(campId).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json(camp.itemsList);
  }

  async getCampItemById(req, res) {
    const { campId, itemId } = matchedData(req);
    const camp = await CampModel.findById(campId).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    // On cherche par l'ID de l'item référencé (pas l'ID du sous-document)
    const itemEntry = camp.itemsList.find(
      (entry) => entry.item._id.toString() === itemId
    );

    if (!itemEntry) {
      return res.status(404).json({ error: "Item not found in camp" });
    }

    res.status(200).json(itemEntry);
  }

  async addCampItem(req, res) {
    const data = matchedData(req);
    const { campId, item_id, quantity } = data;

    const camp = await CampModel.findByIdAndUpdate(
      campId,
      { $push: { itemsList: { item: item_id, quantity: quantity } } },
      { new: true }
    ).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    // Retourner le dernier item ajouté
    res.status(201).json(camp.itemsList[camp.itemsList.length - 1]);
  }

  async updateCampItem(req, res) {
    const data = matchedData(req);
    const { campId, itemId, quantity } = data;

    // On met à jour en utilisant l'ID de l'item référencé
    const camp = await CampModel.findOneAndUpdate(
      { _id: campId, "itemsList.item": itemId },
      {
        $set: {
          "itemsList.$.quantity": quantity,
        },
      },
      { new: true }
    ).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp or item not found" });
    }

    // Retourner toute la liste des items (comme attendu par les tests)
    res.status(200).json(camp.itemsList);
  }

  async deleteCampItem(req, res) {
    const { campId, itemId } = matchedData(req);

    const camp = await CampModel.findByIdAndUpdate(
      campId,
      {
        $pull: {
          itemsList: {
            item: itemId,
          },
        },
      },
      { new: true }
    );

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json({ message: "Item deleted from camp" });
  }

  //Pourquoi est-ce qu'on doit destructurer ici ? Parce que matchedData nous renvoie un objet contenant tous les champs validés,
  // params et body mélangés. On veut juste l'ID pour la recherche, et le reste pour la mise à jour.

  // Camp Trainings Methods
  async getCampTrainings(req, res) {
    const { campId } = matchedData(req);
    const camp = await CampModel.findById(campId)
      .select("trainings")
      .populate("trainings.responsiblePerson");
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json(camp.trainings);
  }

  async getCampTrainingById(req, res) {
    // 1. On récupère les deux IDs validés via matchedData
    const { campId, trainingId } = matchedData(req);

    // 2. On cherche le camp
    const camp = await CampModel.findById(campId)
      .select("trainings") // On ne charge que la liste des entrainements
      .populate("trainings.responsiblePerson");

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    // 3. On trouve l'entraînement spécifique dans le tableau
    // ASTUCE MONGOOSE : sur un tableau de sous-documents,
    // la méthode .id() est bien plus propre que .find() !
    const training = camp.trainings.id(trainingId);

    if (!training) {
      return res.status(404).json({ error: "Training not found" });
    }

    res.status(200).json(training);
  }

  async addCampTraining(req, res) {
    // 1. MatchedData retourne maintenant des clés en CamelCase
    const data = matchedData(req);
    const { campId } = req.params;

    const camp = await CampModel.findById(campId);
    if (!camp) throw createError(404, "Camp not found");

    // 2. Logique numéro
    const number = data.number || camp.getNextTrainingNumber(); // Supposons que cette méthode existe
    if (camp.trainings.some((t) => t.number === number)) {
      throw createError(409, `Training number ${number} already exists`);
    }

    let gpsTrack = undefined;
    if (req.file) {
      const coords = await parseGpxToCoordinates(req.file.buffer);
      if (coords && coords.length >= 2) {
        gpsTrack = { type: "LineString", coordinates: coords };
      }
    }

    // 3. Construction de l'objet (Mapping Input -> Mongoose Schema)
    const newTrainingPayload = {
      // Champs directs (noms identiques Input/Schema)
      number,
      date: data.date,
      year: new Date(data.date).getFullYear(),
      distance: data.distance,
      remark: data.remark,

      // Champs CamelCase (directement accessibles via data)
      trainGoingTime: data.trainGoingTime,
      trainReturnTime: data.trainReturnTime,
      meetingTime: data.meetingTime,
      meetingPoint: data.meetingPoint,
      returnTime: data.returnTime,
      elevationGain: data.elevationGain,
      elevationLoss: data.elevationLoss,

      // Input: responsiblePersonId -> Schema: responsiblePerson
      responsiblePerson: data.responsiblePersonId,

      // GPX (ton code existant)
      gpsTrack: gpsTrack,
    };

    // 4. Push & Save
    camp.trainings.push(newTrainingPayload);
    camp.trainings.sort((a, b) => a.number - b.number);

    await camp.save();

    // 5. Récupération & Réponse
    const savedTraining = camp.trainings.find((t) => t.number === number);

    // Debug pour te rassurer

    res.status(201).json(savedTraining);
  }

  async updateCampTraining(req, res) {
    // 1. Destructuration avec renommage (Aliasing)
    // On extrait les IDs et on renomme les champs kebab-case en camelCase
    const {
      campId,
      trainingId,
      trainGoingTime,
      trainReturnTime,
      meetingTime,
      meetingPoint,
      returnTime,
      elevationGain,
      elevationLoss,
      responsiblePerson,
      date,
      distance,
      remark,
    } = matchedData(req);
    // 2. Construction dynamique de l'objet de mise à jour ($set)
    // On utilise les variables camelCase propres.
    const updates = {};

    // On n'ajoute au $set que si la valeur existe (n'est pas undefined)
    if (date) updates["trainings.$.date"] = date;
    if (trainGoingTime) updates["trainings.$.trainGoingTime"] = trainGoingTime;
    if (trainReturnTime)
      updates["trainings.$.trainReturnTime"] = trainReturnTime;
    if (meetingTime) updates["trainings.$.meetingTime"] = meetingTime;
    if (meetingPoint) updates["trainings.$.meetingPoint"] = meetingPoint;
    if (returnTime) updates["trainings.$.returnTime"] = returnTime;
    if (distance) updates["trainings.$.distance"] = distance;
    if (responsiblePerson)
      updates["trainings.$.responsiblePerson"] = responsiblePerson;
    if (remark) updates["trainings.$.remark"] = remark;

    // Cas particulier : elevation-difference met à jour deux champs
    if (elevationGain) updates["trainings.$.elevationGain"] = elevationGain;
    if (elevationLoss) updates["trainings.$.elevationLoss"] = elevationLoss;

    // 3. Exécution de la mise à jour
    const camp = await CampModel.findOneAndUpdate(
      { _id: campId, "trainings._id": trainingId },
      { $set: updates },
      { new: true } // Renvoie le doc mis à jour
    ).populate("trainings.responsiblePerson");

    if (!camp) {
      return res.status(404).json({ error: "Camp or training not found" });
    }

    // 4. Extraction propre avec .id()
    const training = camp.trainings.id(trainingId);

    res.status(200).json(training);
  }

  async deleteCampTraining(req, res) {
    const { campId, trainingId } = matchedData(req);

    const camp = await CampModel.findByIdAndUpdate(
      campId,
      { $pull: { trainings: { _id: trainingId } } },
      { new: true }
    );

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    // Si l'ID du training n'existait pas, mongo renvoie quand même le camp
    // (juste sans modif). Pour une suppression, c'est souvent le comportement
    // désiré (Idempotence : "Assure-toi que c'est parti").

    res.status(200).json({ message: "Training deleted" });
  }

  async getNearestTraining(req, res) {
    const { latitude, longitude, maxDistance = 50 } = matchedData(req);

    // 1. Générer une bounding box pour le pré-filtrage
    const bbox = getBoundingBox(latitude, longitude, maxDistance);

    // 2. Requête MongoDB : récupérer tous les camps avec trainings qui ont un gpsTrack
    // On utilise l'index 2dsphere pour optimiser
    const camps = await CampModel.find({
      "trainings.gpsTrack.coordinates": { $exists: true, $ne: [] },
    })
      .select("title startDate endDate trainings")
      .populate("trainings.responsiblePerson");

    // 3. Parcourir tous les trainings et calculer la distance minimale
    let nearestTraining = null;
    let minDistance = Infinity;
    let nearestCampId = null;

    for (const camp of camps) {
      for (const training of camp.trainings) {
        // Ignorer les trainings sans gpsTrack
        if (!training.gpsTrack || !training.gpsTrack.coordinates) {
          continue;
        }

        // Calculer la distance minimale au tracé
        const distance = getMinDistanceToLineString(
          latitude,
          longitude,
          training.gpsTrack.coordinates
        );

        // Vérifier si c'est le plus proche et dans la limite maxDistance
        if (distance < minDistance && distance <= maxDistance) {
          minDistance = distance;
          nearestTraining = training;
          nearestCampId = camp._id;
        }
      }
    }

    // 4. Si aucun entraînement trouvé
    if (!nearestTraining) {
      return res.status(404).json({
        error: `No training found within ${maxDistance}km of the given location`,
      });
    }

    // 5. Construire la réponse (format identique à getCampTrainingById + infos supplémentaires)
    const response = {
      ...nearestTraining.toObject(),
      _campId: nearestCampId,
      _distanceKm: Math.round(minDistance * 100) / 100, // Arrondi à 2 décimales
    };

    res.status(200).json(response);
  }
}

export default new CampController();
