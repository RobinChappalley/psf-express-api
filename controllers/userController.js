import { matchedData } from "express-validator";
import UserModel from "../models/User.model.js";

class UserController {
  async getAllUsers(req, res) {
    const users = await UserModel.find();
    res.status(200).json(users);
  }

  async createUser(req, res) {
    const data = matchedData(req);
    const newUser = await UserModel.create(data);
    res.status(201).json(newUser);
  }
}

export default new UserController();
