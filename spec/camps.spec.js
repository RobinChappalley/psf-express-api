import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

// Agents for authenticated requests (maintain cookies)
let agentAdmin;
let agentParent;

// --- CONFIGURATION GLOBALE ---
beforeAll(async () => {
  await connectMongo();
  await cleanDatabase();

  //Create a user with role ADMIN
  await UserModel.create({
    role: ["admin"],
    lastname: "Admin",
    firstname: "Person",
    email: "person.admin@email.com",
    password: "123456",
    phoneNumber: "+41 79 123 34 57",
  });

  //Create a user with role PARENT
  await UserModel.create({
    role: ["parent"],
    lastname: "Doe",
    firstname: "John",
    email: "john.doe@email.com",
    password: "123456",
    phoneNumber: "+41 79 123 34 57",
  });

  //Login admin with agent
  agentAdmin = supertest.agent(app);
  await agentAdmin
    .post("/login")
    .send({ email: "person.admin@email.com", password: "123456" });

  //Login parent with agent
  agentParent = supertest.agent(app);
  await agentParent
    .post("/login")
    .send({ email: "john.doe@email.com", password: "123456" });
});

afterAll(async () => {
  await mongoose.connection.close();
});

const BASE_URL = "/camps";

describe("Camp API Basic Integration Tests", () => {
  // Basic data for creating a camp
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
    beforeEach(async () => {
      await cleanDatabaseExceptUsers();
    });

    it("should create a new camp with basic info", async function () {
      const res = await agentAdmin
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

    it("should fail to create camp because user is forbidden", async function () {
      await agentParent.post(BASE_URL).send(campData1).expect(403);
    });

    it("should fail to create a camp because token is missing", async function () {
      await supertest(app).post(BASE_URL).send(campData1).expect(401);
    });

    it("should create a second camp successfully", async function () {
      const res = await agentAdmin
        .post(BASE_URL)
        .send(campData2)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body.title).toBe(campData2.title);
    });

    it("should fail validation because title is missing", async function () {
      const invalidCamp = {
        startDate: "2024-07-01",
      };
      await agentAdmin.post(BASE_URL).send(invalidCamp).expect(400);
    });

    it("should fail because title is not unique", async function () {
      //Create a first camp
      const res = await agentAdmin
        .post(BASE_URL)
        .send(campData1)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.title).toBe(campData1.title);
      // Check dates
      expect(new Date(res.body.startDate).toISOString()).toBe(
        campData1.startDate
      );

      //Create a second camp with same data
      await agentAdmin.post(BASE_URL).send(campData1).expect(409);
    });
  });

  // --- TEST DU GET (Liste) ---
  describe(`GET ${BASE_URL}`, function () {
    beforeEach(async () => {
      await cleanDatabaseExceptUsers();
    });

    it("should retrieve all camps", async function () {
      //Create a first camp
      const camp1 = await agentAdmin
        .post(BASE_URL)
        .send(campData1)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(camp1.body).toHaveProperty("_id");
      expect(camp1.body.title).toBe(campData1.title);
      // Check dates
      expect(new Date(camp1.body.startDate).toISOString()).toBe(
        campData1.startDate
      );

      //Create a second camp
      const camp2 = await agentAdmin
        .post(BASE_URL)
        .send(campData2)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(camp2.body).toHaveProperty("_id");
      expect(camp2.body.title).toBe(campData2.title);
      // Check dates
      expect(new Date(camp2.body.startDate).toISOString()).toBe(
        campData2.startDate
      );

      //List all camps
      const res = await supertest(app)
        .get(BASE_URL)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // we just created 2 camps
      expect(res.body[0]).toHaveProperty("title");
    });
  });

  // --- TEST DU GET BY ID ---
  describe(`GET ${BASE_URL}/:id`, function () {
    let testCamp;

    beforeEach(async () => {
      await cleanDatabaseExceptUsers();
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
      await cleanDatabaseExceptUsers();
      testCampToUpdate = await CampModel.create({
        title: "Camp Test Update",
        startDate: "2024-01-01",
      });
    });

    it("should update camp title", async function () {
      const updates = {
        title: "Camp Test Update MODIFIÉ",
      };

      const res = await agentAdmin
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
      await agentAdmin
        .put(`${BASE_URL}/${fakeId}`)
        .send({ title: "New Title" })
        .expect(404);
    });
  });

  // --- TEST DU DELETE (Suppression) ---
  describe(`DELETE ${BASE_URL}/:id`, function () {
    let testCampToDelete;

    beforeEach(async () => {
      await cleanDatabaseExceptUsers();
      testCampToDelete = await CampModel.create({
        title: "Camp Test Delete",
      });
    });

    it("should delete a camp", async function () {
      const res = await agentAdmin
        .delete(`${BASE_URL}/${testCampToDelete._id}`)
        .expect(200);

      expect(res.body).toHaveProperty("message");

      // Vérification en base de données
      const deletedCamp = await CampModel.findById(testCampToDelete._id);
      expect(deletedCamp).toBeNull();
    });

    it("should return 404 if camp not found", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin.delete(`${BASE_URL}/${fakeId}`).expect(404);
    });
  });
});
