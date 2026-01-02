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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Camp not found" });
    }

    const camp = await CampModel.findById(req.params.id);
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json(camp);
  }

  async updateCamp(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Camp not found" });
    }

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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Camp not found" });
    }

    const deletedCamp = await CampModel.findByIdAndDelete(req.params.id);
    if (!deletedCamp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    res.status(200).json({ message: "Camp deleted" });
  }
}

export default new CampController();
