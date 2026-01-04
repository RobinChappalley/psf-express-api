import { matchedData } from "express-validator";
import CampModel from "../models/Camp.model.js";
import { parseGpxToCoordinates } from "../utils/gpxHandler.js";
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
    const camp = await CampModel.findById(req.params.id).populate(
      "itemsList.item"
    );
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json(camp.itemsList);
  }

  async getCampItemById(req, res) {
    const camp = await CampModel.findById(req.params.id).populate(
      "itemsList.item"
    );
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    const itemEntry = camp.itemsList.find(
      (entry) => entry.item._id.toString() === req.params.itemId
    );

    if (!itemEntry) {
      return res.status(404).json({ error: "Item not found in camp" });
    }

    res.status(200).json(itemEntry);
  }

  async addCampItem(req, res) {
    const data = matchedData(req);
    const camp = await CampModel.findByIdAndUpdate(
      req.params.id,
      { $push: { itemsList: { item: data.item_id, quantity: data.quantity } } },
      { new: true }
    ).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(201).json(camp.itemsList[camp.itemsList.length - 1]);
  }

  async updateCampItem(req, res) {
    const data = matchedData(req);
    const camp = await CampModel.findOneAndUpdate(
      { _id: req.params.id, "itemsList.item": data.item_id },
      { $set: { "itemsList.$.quantity": data.quantity } },
      { new: true }
    ).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp or item not found" });
    }

    res.status(200).json(camp.itemsList);
  }

  async deleteCampItem(req, res) {
    const data = matchedData(req);
    const camp = await CampModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          itemsList: {
            item: req.params.itemId,
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
    const {
      campId,
      number,
      trainingId,
      "train-going-time": trainGoingTime,
      "train-return-time": trainReturnTime,
      "meeting-time": meetingTime,
      "meeting-point": meetingPoint,
      "return-time": returnTime,
      "elevation-difference": elevationDiff,
      "responsible-person-id": responsiblePerson,
      date,
      distance,
      remark,
    } = matchedData(req);

    const camp = await CampModel.findById(campId);
    if (!camp) return res.status(404).json({ error: "Camp not found" });

    const finalNumber = number || camp.getNextTrainingNumber();

    // Petite sécurité : Vérifier si ce numéro existe déjà pour éviter les doublons ?
    // Ce n'est pas bloquant techniquement pour Mongo, mais ça peut être bizarre fonctionnellement.
    if (camp.trainings.some((t) => t.number === finalNumber)) {
      throw createError(400, `Training number ${finalNumber} already exists`);
    }
    // -----------------------------------

    let gpsTrack = null;
    if (req.file) {
      const coordinates = parseGpxToCoordinates(req.file.buffer);
      gpsTrack = { type: "LineString", coordinates };
    }

    // 3. Construction de l'objet (Clean & Explicit)

    // Trouver l'objet ajouté (celui qui a le bon numéro)
    const added = camp.trainings.find((t) => t.number === finalNumber);
    res.status(201).json(added);
    const newTraining = {
      number: finalNumber, // On utilise le numéro décidé
      year: new Date(date).getFullYear(),
      trainingId,
      trainGoingTime,
      trainReturnTime,
      meetingTime,
      meetingPoint,
      returnTime,
      elevationDiff,
      responsiblePerson,
      date,
      distance,
      remark,
      gpsTrack,
    };

    camp.trainings.push(newTraining);

    // Si tu veux que les entrainements soient triés par numéro dans le tableau directement :
    camp.trainings.sort((a, b) => a.number - b.number);

    await camp.save();

    // Renvoi de la réponse...
    const addedTraining = camp.trainings.find((t) => t.number === finalNumber); // Façon sûre de le retrouver
    res.status(201).json(addedTraining);
  }

  async updateCampTraining(req, res) {
    // 1. Destructuration avec renommage (Aliasing)
    // On extrait les IDs et on renomme les champs kebab-case en camelCase
    const {
      campId,
      trainingId,
      "train-going-time": trainGoingTime,
      "train-return-time": trainReturnTime,
      "meeting-time": meetingTime,
      "meeting-point": meetingPoint,
      "return-time": returnTime,
      "elevation-difference": elevationDiff,
      "responsible-person-id": responsiblePerson,
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
    if (elevationDiff) {
      updates["trainings.$.elevationGain"] = elevationDiff;
      updates["trainings.$.elevationLoss"] = elevationDiff;
    }

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

    res.status(204).json({ message: "Training deleted" });
  }
}

export default new CampController();
