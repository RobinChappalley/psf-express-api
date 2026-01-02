import jwt from "jsonwebtoken";
import { matchedData } from "express-validator";
import UserModel from "../models/User.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

class AuthController {
  async login(req, res) {
    const data = matchedData(req);

    const user = await UserModel.findOne({ email: data.email }).select("+password");
    if (!user || !(await user.comparePassword(data.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
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
    res.status(200).json({ message: "Logout successful" });
  }
}

export default new AuthController();
