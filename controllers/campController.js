import { matchedData } from "express-validator";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";
import { parseGpxToCoordinates } from "../utils/gpxHandler.js";
import {
  getBoundingBox,
  getMinDistanceToLineString,
} from "../utils/geoUtils.js";
import createError from "http-errors";
import webPush from "../webpush.js";
import PushSubscriptionModel from "../models/PushSubscription.model.js";
import { sendTrainingNotification } from "../services/mailService.js";

class CampController {
  async getAllCamps(req, res) {
    const { status } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const camps = await CampModel.find(filter).populate("itemsList.item");

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
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // 4. On renvoie
    res.status(200).json(camp);
  }

  async updateCamp(req, res) {
    //Retrieve validated data from param and body
    const data = matchedData(req);
    const { id, ...updateData } = data;

    //Retrieve camp
    const camp = await CampModel.findById(id);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    //Check old status for notifications
    const oldStatus = camp.status;

    //Update camp with new data
    Object.assign(camp, updateData);
    await camp.save();

    //Notification
    if (updateData.status === "published" && oldStatus !== "published") {
      const subs = await PushSubscriptionModel.find();

      const payload = JSON.stringify({
        title: "Nouveau camp publié",
        body: camp.title,
      });

      for (const sub of subs) {
        try {
          await webPush.sendNotification(sub, payload);
        } catch (err) {
          console.error("Push error", err);
        }
      }
    }

    res.status(200).json(camp);
  }

  async deleteCamp(req, res) {
    const deletedCamp = await CampModel.findByIdAndDelete(req.params.id);
    if (!deletedCamp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    res.status(200).json({ message: "Camp supprimé" });
  }

  // Camp Items Methods
  async getCampItems(req, res) {
    const { campId } = matchedData(req);
    const camp = await CampModel.findById(campId).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    res.status(200).json(camp.itemsList);
  }

  async getCampItemById(req, res) {
    const { campId, itemId } = matchedData(req);
    const camp = await CampModel.findById(campId).populate("itemsList.item");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // On cherche par l'ID de l'item référencé (pas l'ID du sous-document)
    const itemEntry = camp.itemsList.find(
      (entry) => entry.item._id.toString() === itemId
    );

    if (!itemEntry) {
      return res.status(404).json({ error: "Objet non trouvé dans le camp" });
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
      return res.status(404).json({ error: "Camp non trouvé" });
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
      return res.status(404).json({ error: "Camp ou objet non trouvé" });
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
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    res.status(200).json({ message: "Objet supprimé du camp" });
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
      return res.status(404).json({ error: "Camp non trouvé" });
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
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // 3. On trouve l'entraînement spécifique dans le tableau
    // ASTUCE MONGOOSE : sur un tableau de sous-documents,
    // la méthode .id() est bien plus propre que .find() !
    const training = camp.trainings.id(trainingId);

    if (!training) {
      return res.status(404).json({ error: "Entraînement non trouvé" });
    }

    res.status(200).json(training);
  }

  async addCampTraining(req, res) {
    // 1. MatchedData retourne maintenant des clés en CamelCase
    const data = matchedData(req);
    const { campId } = req.params;

    const camp = await CampModel.findById(campId);
    if (!camp) throw createError(404, "Camp non trouvé");

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
    await camp.save();

    // 5. Populate responsiblePerson pour retourner l'objet User complet
    await camp.populate("trainings.responsiblePerson");

    // 6. Récupération & Réponse
    const createdTraining = camp.trainings[camp.trainings.length - 1];

    // 7. Envoyer les notifications par email (async, non-bloquant)
    // Récupérer les utilisateurs inscrits au camp (avec email)
    // On cherche les parents qui sont inscrits OU dont les enfants sont inscrits
    const usersWithCamp = await UserModel.find({
      camps: campId,
      email: { $exists: true, $ne: null },
    }).select("email firstname lastname");

    // Récupérer aussi les parents des enfants inscrits
    const childrenWithCamp = await UserModel.find({
      camps: campId,
      parent: { $exists: true },
    }).select("parent");

    const parentIds = childrenWithCamp.map((c) => c.parent).filter(Boolean);

    const parentsOfChildren = await UserModel.find({
      _id: { $in: parentIds },
      email: { $exists: true, $ne: null },
    }).select("email firstname lastname");

    // Combiner et dédupliquer les destinataires
    const allRecipients = [...usersWithCamp, ...parentsOfChildren];
    const uniqueRecipients = Array.from(
      new Map(allRecipients.map((u) => [u.email, u])).values()
    );

    // Envoyer les emails (sans bloquer la réponse)
    sendTrainingNotification({
      training: createdTraining,
      camp,
      recipients: uniqueRecipients,
    }).catch((err) => console.error("Erreur envoi emails training:", err));

    res.status(201).json(createdTraining);
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

    // Parse GPX file if provided
    if (req.file) {
      const coords = await parseGpxToCoordinates(req.file.buffer);
      if (coords && coords.length >= 2) {
        updates["trainings.$.gpsTrack"] = { type: "LineString", coordinates: coords };
      }
    }

    // 3. Exécution de la mise à jour
    const camp = await CampModel.findOneAndUpdate(
      { _id: campId, "trainings._id": trainingId },
      { $set: updates },
      { new: true } // Renvoie le doc mis à jour
    ).populate("trainings.responsiblePerson");

    if (!camp) {
      return res.status(404).json({ error: "Camp ou entraînement non trouvé" });
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
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // Si l'ID du training n'existait pas, mongo renvoie quand même le camp
    // (juste sans modif). Pour une suppression, c'est souvent le comportement
    // désiré (Idempotence : "Assure-toi que c'est parti").

    res.status(200).json({ message: "Entraînement supprimé" });
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
        error: `Aucun entraînement trouvé dans un rayon de ${maxDistance} km`,
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

  // ==================== STAGES METHODS ====================

  async getCampStages(req, res) {
    const { campId } = matchedData(req);
    const camp = await CampModel.findById(campId).select("stages");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    res.status(200).json(camp.stages);
  }

  async getCampStageById(req, res) {
    const { campId, stageId } = matchedData(req);
    const camp = await CampModel.findById(campId).select("stages");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    const stage = camp.stages.id(stageId);

    if (!stage) {
      return res.status(404).json({ error: "Étape non trouvée" });
    }

    res.status(200).json(stage);
  }

  async addCampStage(req, res) {
    const data = matchedData(req);
    const { campId, ...stageData } = data;

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // Auto-generate year from date
    if (stageData.date) {
      stageData.year = new Date(stageData.date).getFullYear();
    }

    // Parse GPX file if provided
    if (req.file) {
      const coords = await parseGpxToCoordinates(req.file.buffer);
      if (coords && coords.length >= 2) {
        stageData.gpsTrack = { type: "LineString", coordinates: coords };
      }
    }

    camp.stages.push(stageData);
    await camp.save();

    const createdStage = camp.stages[camp.stages.length - 1];
    res.status(201).json(createdStage);
  }

  async updateCampStage(req, res) {
    const data = matchedData(req);
    const { campId, stageId, ...updateData } = data;

    // Build the $set object dynamically
    const updates = {};
    if (updateData.date !== undefined) {
      updates["stages.$.date"] = updateData.date;
      updates["stages.$.year"] = new Date(updateData.date).getFullYear();
    }
    if (updateData.startPoint !== undefined) updates["stages.$.startPoint"] = updateData.startPoint;
    if (updateData.endPoint !== undefined) updates["stages.$.endPoint"] = updateData.endPoint;
    if (updateData.distance !== undefined) updates["stages.$.distance"] = updateData.distance;
    if (updateData.elevationGain !== undefined) updates["stages.$.elevationGain"] = updateData.elevationGain;
    if (updateData.elevationLoss !== undefined) updates["stages.$.elevationLoss"] = updateData.elevationLoss;
    if (updateData.routeDescription !== undefined) updates["stages.$.routeDescription"] = updateData.routeDescription;

    // Parse GPX file if provided
    if (req.file) {
      const coords = await parseGpxToCoordinates(req.file.buffer);
      if (coords && coords.length >= 2) {
        updates["stages.$.gpsTrack"] = { type: "LineString", coordinates: coords };
      }
    }

    const camp = await CampModel.findOneAndUpdate(
      { _id: campId, "stages._id": stageId },
      { $set: updates },
      { new: true }
    );

    if (!camp) {
      return res.status(404).json({ error: "Camp ou étape non trouvé" });
    }

    const stage = camp.stages.id(stageId);
    res.status(200).json(stage);
  }

  async deleteCampStage(req, res) {
    const { campId, stageId } = matchedData(req);

    const camp = await CampModel.findByIdAndUpdate(
      campId,
      { $pull: { stages: { _id: stageId } } },
      { new: true }
    );

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    res.status(200).json({ message: "Étape supprimée" });
  }

  // ==================== FUNDRAISINGS METHODS ====================

  async getCampFundraisings(req, res) {
    const { campId } = matchedData(req);
    const camp = await CampModel.findById(campId)
      .select("fundraisings")
      .populate("fundraisings.participants");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    res.status(200).json(camp.fundraisings);
  }

  async getCampFundraisingById(req, res) {
    const { campId, fundraisingId } = matchedData(req);
    const camp = await CampModel.findById(campId)
      .select("fundraisings")
      .populate("fundraisings.participants");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    const fundraising = camp.fundraisings.id(fundraisingId);

    if (!fundraising) {
      return res.status(404).json({ error: "Collecte de fonds non trouvée" });
    }

    res.status(200).json(fundraising);
  }

  async addCampFundraising(req, res) {
    const data = matchedData(req);
    const { campId, ...fundraisingData } = data;

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // Ensure participants is an array (even if empty)
    if (!fundraisingData.participants) {
      fundraisingData.participants = [];
    }

    camp.fundraisings.push(fundraisingData);
    await camp.save();

    // Populate participants for the response
    await camp.populate("fundraisings.participants");

    const createdFundraising = camp.fundraisings[camp.fundraisings.length - 1];
    res.status(201).json(createdFundraising);
  }

  async updateCampFundraising(req, res) {
    const data = matchedData(req);
    const { campId, fundraisingId, ...updateData } = data;

    // Build the $set object dynamically
    const updates = {};
    if (updateData.dateTime !== undefined) updates["fundraisings.$.dateTime"] = updateData.dateTime;
    if (updateData.location !== undefined) updates["fundraisings.$.location"] = updateData.location;
    if (updateData.participants !== undefined) updates["fundraisings.$.participants"] = updateData.participants;

    const camp = await CampModel.findOneAndUpdate(
      { _id: campId, "fundraisings._id": fundraisingId },
      { $set: updates },
      { new: true }
    ).populate("fundraisings.participants");

    if (!camp) {
      return res.status(404).json({ error: "Camp ou collecte de fonds non trouvé" });
    }

    const fundraising = camp.fundraisings.id(fundraisingId);
    res.status(200).json(fundraising);
  }

  async deleteCampFundraising(req, res) {
    const { campId, fundraisingId } = matchedData(req);

    const camp = await CampModel.findByIdAndUpdate(
      campId,
      { $pull: { fundraisings: { _id: fundraisingId } } },
      { new: true }
    );

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    res.status(200).json({ message: "Collecte de fonds supprimée" });
  }

  // ==================== GENERAL MEETING METHODS (Singleton) ====================

  async getGeneralMeeting(req, res) {
    const { campId } = matchedData(req);
    const camp = await CampModel.findById(campId).select("generalMeeting");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    if (!camp.generalMeeting || !camp.generalMeeting.dateTime) {
      return res.status(404).json({ error: "Assemblée générale non trouvée" });
    }

    res.status(200).json(camp.generalMeeting);
  }

  async updateGeneralMeeting(req, res) {
    const data = matchedData(req);
    const { campId, ...meetingData } = data;

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // If no existing generalMeeting, create it
    if (!camp.generalMeeting) {
      camp.generalMeeting = meetingData;
    } else {
      // Update only provided fields
      if (meetingData.dateTime !== undefined) {
        camp.generalMeeting.dateTime = meetingData.dateTime;
      }
      if (meetingData.location !== undefined) {
        camp.generalMeeting.location = meetingData.location;
      }
      if (meetingData.participants !== undefined) {
        camp.generalMeeting.participants = meetingData.participants;
      }
    }

    await camp.save();
    res.status(200).json(camp.generalMeeting);
  }

  async deleteGeneralMeeting(req, res) {
    const { campId } = matchedData(req);

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    if (!camp.generalMeeting || !camp.generalMeeting.dateTime) {
      return res.status(404).json({ error: "Assemblée générale non trouvée" });
    }

    camp.generalMeeting = undefined;
    await camp.save();

    res.status(200).json({ message: "Assemblée générale supprimée" });
  }

  // ==================== INFO EVENING METHODS (Singleton) ====================

  async getInfoEvening(req, res) {
    const { campId } = matchedData(req);
    const camp = await CampModel.findById(campId).select("infoEvening");

    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    if (!camp.infoEvening || !camp.infoEvening.dateTime) {
      return res.status(404).json({ error: "Soirée d'information non trouvée" });
    }

    res.status(200).json(camp.infoEvening);
  }

  async updateInfoEvening(req, res) {
    const data = matchedData(req);
    const { campId, ...infoEveningData } = data;

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    // If no existing infoEvening, create it
    if (!camp.infoEvening) {
      camp.infoEvening = infoEveningData;
    } else {
      // Update only provided fields
      if (infoEveningData.dateTime !== undefined) {
        camp.infoEvening.dateTime = infoEveningData.dateTime;
      }
      if (infoEveningData.location !== undefined) {
        camp.infoEvening.location = infoEveningData.location;
      }
      if (infoEveningData.participants !== undefined) {
        camp.infoEvening.participants = infoEveningData.participants;
      }
    }

    await camp.save();
    res.status(200).json(camp.infoEvening);
  }

  async deleteInfoEvening(req, res) {
    const { campId } = matchedData(req);

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    if (!camp.infoEvening || !camp.infoEvening.dateTime) {
      return res.status(404).json({ error: "Soirée d'information non trouvée" });
    }

    camp.infoEvening = undefined;
    await camp.save();

    res.status(200).json({ message: "Soirée d'information supprimée" });
  }

  // ==================== PUBLIC REGISTRATION METHODS ====================

  async registerToGeneralMeeting(req, res) {
    const { campId, email, nbOfParticipants } = matchedData(req);

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    if (!camp.generalMeeting || !camp.generalMeeting.dateTime) {
      return res.status(404).json({ error: "Assemblée générale non trouvée" });
    }

    // Always add a new entry (no upsert)
    camp.generalMeeting.participants.push({ email, nbOfParticipants });
    await camp.save();

    res.status(201).json({
      message: "Inscription enregistrée",
      email,
      nbOfParticipants,
    });
  }

  async registerToInfoEvening(req, res) {
    const { campId, email, nbOfParticipants } = matchedData(req);

    const camp = await CampModel.findById(campId);
    if (!camp) {
      return res.status(404).json({ error: "Camp non trouvé" });
    }

    if (!camp.infoEvening || !camp.infoEvening.dateTime) {
      return res.status(404).json({ error: "Soirée d'information non trouvée" });
    }

    // Always add a new entry (no upsert)
    camp.infoEvening.participants.push({ email, nbOfParticipants });
    await camp.save();

    res.status(201).json({
      message: "Inscription enregistrée",
      email,
      nbOfParticipants,
    });
  }
}

export default new CampController();
