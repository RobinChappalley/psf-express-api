import express from "express";
import UserController from "../controllers/userController.js";

const router = express.Router();

router.get("/", function (req, res, next) {
  res.send("Got a response from the users route");
});

router.post("/", UserController.createUser);

export default router;
