import jwt from "jsonwebtoken";
import { matchedData } from "express-validator";
import UserModel from "../models/User.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

class AuthController {
  async signup(req, res) {
    const data = matchedData(req);

    const user = await UserModel.create({
      ...data,
      role: ["parent"],
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });
  }

  async login(req, res) {
    const data = matchedData(req);

    const user = await UserModel.findOne({ email: data.email }).select(
      "+password"
    );
    if (!user || !(await user.comparePassword(data.password))) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });
  }

  async logout(req, res) {
    res.status(200).json({ message: "Déconnexion réussie" });
  }

  async changePassword(req, res) {
    const { currentPassword, newPassword } = matchedData(req);

    const user = await UserModel.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Mot de passe modifié avec succès" });
  }
}

export default new AuthController();
