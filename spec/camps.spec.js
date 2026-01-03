import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import CampModel from "../models/Camp.model.js";

// --- CONFIGURATION GLOBALE ---
beforeAll(async () => {
  await connectMongo();
  await cleanDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});

const BASE_URL = "/camps";

describe("Camp API Basic Integration Tests", () => {
  // Données de test basiques (sans les objets imbriqués)
  const campData1 = {
    title: "Camp d'été 2024",
    startDate: "2024-07-01T00:00:00.000Z",
    endDate: "2024-07-15T00:00:00.000Z",
  };

  const campData2 = {
    title: "Stage Hiver 2024",
    startDate: "2024-12-20T00:00:00.000Z",
    endDate: "2024-12-27T00:00:00.000Z",
  };

  // --- TEST DU POST (Création) ---
  describe(`POST ${BASE_URL}`, function () {
    it("should create a new camp with basic info", async function () {
      const res = await supertest(app)
        .post(BASE_URL)
        .send(campData1)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.title).toBe(campData1.title);
      // Vérification que les dates sont bien stockées
      expect(new Date(res.body.startDate).toISOString()).toBe(
        campData1.startDate
      );
    });

    it("should create a second camp", async function () {
      const res = await supertest(app)
        .post(BASE_URL)
        .send(campData2)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body.title).toBe(campData2.title);
    });

    it("should fail validation if title is missing", async function () {
      const invalidCamp = {
        startDate: "2024-07-01",
      };
      await supertest(app).post(BASE_URL).send(invalidCamp).expect(400);
    });

    it("should fail if title is not unique", async function () {
      // On essaie de recréer campData1 qui existe déjà
      const duplicateCamp = {
        title: campData1.title, // Titre identique
        startDate: "2025-01-01",
      };

      // Le code dépend de ton gestionnaire d'erreur global (souvent 409 ou 500 pour E11000)
      // Ajuste le code ici (409 ou 500) selon ton middleware d'erreur
      await supertest(app).post(BASE_URL).send(duplicateCamp).expect(409);
    });
  });

  // --- TEST DU GET (Liste) ---
  describe(`GET ${BASE_URL}`, function () {
    it("should retrieve all camps", async function () {
      const res = await supertest(app)
        .get(BASE_URL)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // On a créé 2 camps juste avant
      expect(res.body[0]).toHaveProperty("title");
    });
  });

  // --- TEST DU GET BY ID ---
  describe(`GET ${BASE_URL}/:id`, function () {
    let testCamp;

    beforeEach(async () => {
      await cleanDatabase();
      // On crée un camp spécifique pour ce test afin d'avoir un ID valide
      testCamp = await CampModel.create({
        title: "Camp Test GetID",
        startDate: "2024-09-01",
        endDate: "2024-09-05",
      });
    });

    it("should retrieve a camp by id", async function () {
      const res = await supertest(app)
        .get(`${BASE_URL}/${testCamp._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id", testCamp._id.toString());
      expect(res.body.title).toBe(testCamp.title);
    });
  });

  // --- TEST DU PUT (Mise à jour) ---
  describe(`PUT ${BASE_URL}/:id`, function () {
    let testCampToUpdate;

    beforeEach(async () => {
      await cleanDatabase();
      testCampToUpdate = await CampModel.create({
        title: "Camp Test Update",
        startDate: "2024-01-01",
      });
    });

    it("should update camp title", async function () {
      const updates = {
        title: "Camp Test Update MODIFIÉ",
      };

      const res = await supertest(app)
        .put(`${BASE_URL}/${testCampToUpdate._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body._id).toBe(testCampToUpdate._id.toString());
      expect(res.body.title).toBe(updates.title);
      // La date n'a pas changé
      expect(new Date(res.body.startDate).toISOString()).toBe(
        testCampToUpdate.startDate.toISOString()
      );
    });

    it("should return 404 for non-existent camp ID", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app)
        .put(`${BASE_URL}/${fakeId}`)
        .send({ title: "New Title" })
        .expect(404);
    });
  });

  // --- TEST DU DELETE (Suppression) ---
  describe(`DELETE ${BASE_URL}/:id`, function () {
    let testCampToDelete;

    beforeEach(async () => {
      await cleanDatabase();
      testCampToDelete = await CampModel.create({
        title: "Camp Test Delete",
      });
    });

    it("should delete a camp", async function () {
      const res = await supertest(app)
        .delete(`${BASE_URL}/${testCampToDelete._id}`)
        .expect(200);

      expect(res.body).toHaveProperty("message");

      // Vérification en base de données
      const deletedCamp = await CampModel.findById(testCampToDelete._id);
      expect(deletedCamp).toBeNull();
    });

    it("should return 404 if camp not found", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app).delete(`${BASE_URL}/${fakeId}`).expect(404);
    });
  });
});
