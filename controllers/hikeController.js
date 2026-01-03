import mongoose from "mongoose";
import { matchedData } from "express-validator";
import HikeModel from "../models/Hike.model.js";

class HikeController {
  async getAllHikes(req, res) {
    const hikes = await HikeModel.find().populate("user", "firstname lastname email");
    res.status(200).json(hikes);
  }

  async createHike(req, res) {
    const data = matchedData(req);
    const newHike = await HikeModel.create(data);
    res.status(201).json(newHike);
  }

  async getHikeById(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Hike not found" });
    }

    const hike = await HikeModel.findById(req.params.id).populate("user", "firstname lastname email");
    if (!hike) {
      return res.status(404).json({ error: "Hike not found" });
    }

    res.status(200).json(hike);
  }

  async updateHike(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Hike not found" });
    }

    const data = matchedData(req);
    const updatedHike = await HikeModel.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true }
    ).populate("user", "firstname lastname email");

    if (!updatedHike) {
      return res.status(404).json({ error: "Hike not found" });
    }

    res.status(200).json(updatedHike);
  }

  async deleteHike(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Hike not found" });
    }

    const deletedHike = await HikeModel.findByIdAndDelete(req.params.id);
    if (!deletedHike) {
      return res.status(404).json({ error: "Hike not found" });
    }

    res.status(200).json({ message: "Hike deleted" });
  }
}

export default new HikeController();
