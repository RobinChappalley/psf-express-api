import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { connectMongo } from "../db/db.js";

// Nécessaire pour __dirname en ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. DÉFINITION DU MOCK (Avant l'import de l'app)
// On utilise unstable_mockModule qui est compatible ESM
jest.unstable_mockModule("../middlewares/fileUpload.js", () => ({
  default: {
    single: () => (req, res, next) => {
      // Simulation : Si un fichier est reçu (Multipart), on injecte le fake path
      // Cela permet de valider que multer a bien reçu le flux du vrai fichier
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        req.file = {
          path: "https://res.cloudinary.com/demo/image/upload/real-file-simulated.jpg",
          originalname: "test-img.jpg",
        };
      }
      next();
    },
  },
}));

// 2. IMPORT DYNAMIQUE DE L'APP (Après le mock)
// C'est la clé : on attend que le mock soit prêt avant de charger app.js
const { default: app } = await import("../app.js");
const { default: User } = await import("../models/User.model.js");
const { default: Hike } = await import("../models/Hike.model.js");

describe("POST /api/hikes", () => {
  let user;

  beforeAll(async () => {
    await connectMongo();

    user = await User.create({
      firstname: `TestLocal${Date.now()}`,
      lastname: `User${Date.now()}`,
      email: `testlocal${Date.now()}@test.com`,
      password: "password123",
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create a hike using a real local image file", async () => {
    // Chemin absolu vers ton image de test située à côté de ce fichier
    let imagePath = path.resolve(__dirname, "test-img.jpeg");
    // Enlever /app du début si présent
    if (imagePath.startsWith("/app")) {
      imagePath = imagePath.slice(4);
    }

    const hikeData = {
      content: "Rando avec vraie image locale",
      userId: user._id.toString(),
    };

    console.log("📝 Données envoyées:", hikeData);
    console.log("📁 Chemin image:", imagePath);

    const res = await request(app).post("/hikes").send(hikeData);
    //.expect("Content-Type", "multipart/form-data");
    // Le vrai fichier physique

    console.log("📊 Statut réponse:", res.statusCode);
    console.log("📦 Réponse body:", JSON.stringify(res.body, null, 2));
    if (res.error) {
      console.log("❌ Erreur supertest:", res.error);
    }

    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe(hikeData.content);
    // Vérifie que le contrôleur a bien reçu l'URL mockée -> preuve que le middleware est passé
    expect(res.body.imageUrl).toBe(
      "https://res.cloudinary.com/demo/image/upload/real-file-simulated.jpg"
    );
  });
});
