import mongoose from "mongoose";
import { matchedData } from "express-validator";
import CampModel from "../models/Camp.model.js";

class CampController {
  async getAllCamps(req, res) {
    const camps = await CampModel.find();
    res.status(200).json(camps);
  }

  async createCamp(req, res) {
    const data = matchedData(req);
    const newCamp = await CampModel.create(data);
    res.status(201).json(newCamp);
  }

  async getCampById(req, res) {
    const camp = await CampModel.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json(camp);
  }

  async updateCamp(req, res) {
    const data = matchedData(req);
    const updatedCamp = await CampModel.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    if (!updatedCamp) {
      return res.status(404).json({ error: "Camp not found" });
    }

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

  // Camp Trainings Methods
  async getCampTrainings(req, res) {
    const camp = await CampModel.findById(req.params.id).populate(
      "trainings.responsiblePerson"
    );
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json(camp.trainings);
  }

  async addCampTraining(req, res) {
    const data = matchedData(req);
    const trainingData = {
      date: data.date,
      trainGoingTime: data["train-going-time"],
      trainReturnTime: data["train-return-time"],
      meetingTime: data["meeting-time"],
      meetingPoint: data["meeting-point"],
      returnTime: data["return-time"],
      distance: data.distance,
      elevationGain: data["elevation-difference"],
      elevationLoss: data["elevation-difference"],
      responsiblePerson: data["responsible-person-id"],
      remark: data.remark,
    };

    const camp = await CampModel.findByIdAndUpdate(
      req.params.id,
      { $push: { trainings: trainingData } },
      { new: true }
    ).populate("trainings.responsiblePerson");

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(201).json(camp.trainings[camp.trainings.length - 1]);
  }

  async updateCampTraining(req, res) {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(req.params.id2)
    ) {
      return res.status(404).json({ error: "Camp or training not found" });
    }

    const data = matchedData(req);
    const trainingData = {};
    if (data.date) trainingData["trainings.$.date"] = data.date;
    if (data["train-going-time"])
      trainingData["trainings.$.trainGoingTime"] = data["train-going-time"];
    if (data["train-return-time"])
      trainingData["trainings.$.trainReturnTime"] = data["train-return-time"];
    if (data["meeting-time"])
      trainingData["trainings.$.meetingTime"] = data["meeting-time"];
    if (data["meeting-point"])
      trainingData["trainings.$.meetingPoint"] = data["meeting-point"];
    if (data["return-time"])
      trainingData["trainings.$.returnTime"] = data["return-time"];
    if (data.distance) trainingData["trainings.$.distance"] = data.distance;
    if (data["elevation-difference"]) {
      trainingData["trainings.$.elevationGain"] = data["elevation-difference"];
      trainingData["trainings.$.elevationLoss"] = data["elevation-difference"];
    }
    if (data["responsible-person-id"])
      trainingData["trainings.$.responsiblePerson"] =
        data["responsible-person-id"];
    if (data.remark) trainingData["trainings.$.remark"] = data.remark;

    const camp = await CampModel.findOneAndUpdate(
      { _id: req.params.id, "trainings._id": req.params.id2 },
      { $set: trainingData },
      { new: true }
    ).populate("trainings.responsiblePerson");

    if (!camp) {
      return res.status(404).json({ error: "Camp or training not found" });
    }

    const training = camp.trainings.find(
      (t) => t._id.toString() === req.params.id2
    );
    res.status(200).json(training);
  }

  async deleteCampTraining(req, res) {
    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !mongoose.isValidObjectId(req.params.id2)
    ) {
      return res.status(404).json({ error: "Camp or training not found" });
    }

    const camp = await CampModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { trainings: { _id: req.params.id2 } } },
      { new: true }
    );

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json({ message: "Training deleted" });
  }
}

export default new CampController();
