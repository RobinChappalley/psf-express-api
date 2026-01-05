import { matchedData } from "express-validator";
import ItemModel from "../models/Item.model.js";

class ItemController {
  async getAllItems(req, res) {
    const items = await ItemModel.find();
    res.status(200).json(items);
  }

  async getItemById(req, res) {
    const data = matchedData(req);
    const item = await ItemModel.findById(data.id);
    res.status(200).json(item);
  }
  async createItem(req, res) {
    const data = matchedData(req);
    const newItem = await ItemModel.create(data);
    res.status(201).json(newItem);
  }

  async updateItem(req, res) {
    const data = matchedData(req);
    const updatedItem = await ItemModel.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json(updatedItem);
  }

  async deleteItem(req, res) {
    const deletedItem = await ItemModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted" });
  }
}

export default new ItemController();
