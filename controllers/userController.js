import UserModel from "../models/User.model.js";
class UserController {
  // Create a new user
  async createUser(req, res) {
    try {
      const newUser = new UserModel(req.body);
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}
export default new UserController();
//commentaire
