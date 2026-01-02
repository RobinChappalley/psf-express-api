import UserModel from "../models/User.model.js";
class UserController {
  // Create new user
  async createUser(req, res) {
    //attention Phone number -> unifier format
    console.log("va créer l'utilisateur");
    try {
      //if (req.body.phoneNumber) {
      //req.body.phoneNumber = req.body.phoneNumber.replace(/^00/, "+");
      //.replace(/[>s>-()]/g, "");
      //}
      const newUser = new UserModel(req.body);
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    } catch (error) {
      console.log("Erreur Mongoose: ", error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await UserModel.find();
      if (users.length === 0) {
        return res.status(404).json({ error: "No users found" });
      }
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
export default new UserController();
