import mongoose from "mongoose";
import CampModel from "../models/Camp.model.js";
class CampController {
  // Create a new camp
  async createCamp(req, res) {
    try {
      const newCamp = new CampModel(req.body);
      const savedCamp = await newCamp.save();
      res.status(201).json(savedCamp);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
  async getAllCamps(req, res) {
    try {
      const camps = await CampModel.find();
      res.status(200).json(camps);
      if (!camps) {
        return res.status(404).json({ error: "No camps found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async getCampById(req, res) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: "Camp not found" });
      }
      const camp = await CampModel.findById(req.params.id);
      res.status(200).json(camp);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateCamp(req, res) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: "Camp not found" });
      }
      const updatedCamp = await CampModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      res.status(200).json(updatedCamp);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteCamp(req, res) {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: "Camp not found" });
      }
      const deletedCamp = await CampModel.findByIdAndDelete(req.params.id);
      if (!deletedCamp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      res.status(200).json({ message: "Camp deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
export default new CampController();
