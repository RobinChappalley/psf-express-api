import UserModel from "../models/User.model.js";
class UserController {
  // Create new user
  async createUser(req, res) {
    //attention Phone number -> unifier format
    try {
      const newUser = new UserModel(req.body);
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await UserModel.find();
      res.status(200).json(users);
      if (!users) {
        return res.status(404).json({ error: "No users found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
export default new UserController();
