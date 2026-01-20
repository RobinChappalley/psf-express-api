import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

describe("Camp Stages API - TDD", function () {
  let testCamp;
  let stageId;

  // Agents for authenticated requests (maintain cookies)
  let agentAdmin;
  let agentParent;
  let agentAccompagnant;

  beforeAll(async () => {
    await connectMongo();
    await cleanDatabase();

    // Create a user with role ADMIN
    await UserModel.create({
      role: ["admin"],
      lastname: "Admin",
      firstname: "Stage",
      email: "admin.stage@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 57",
    });

    // Create a user with role PARENT
    await UserModel.create({
      role: ["parent"],
      lastname: "Parent",
      firstname: "Stage",
      email: "parent.stage@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 58",
    });

    // Create a user with role ACCOMPAGNANT
    await UserModel.create({
      role: ["accompagnant"],
      lastname: "Accompagnant",
      firstname: "Stage",
      email: "accompagnant.stage@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 59",
    });

    // Login admin with agent
    agentAdmin = supertest.agent(app);
    await agentAdmin
      .post("/login")
      .send({ email: "admin.stage@email.com", password: "123456" });

    // Login parent with agent
    agentParent = supertest.agent(app);
    await agentParent
      .post("/login")
      .send({ email: "parent.stage@email.com", password: "123456" });

    // Login accompagnant with agent
    agentAccompagnant = supertest.agent(app);
    await agentAccompagnant
      .post("/login")
      .send({ email: "accompagnant.stage@email.com", password: "123456" });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    const timestamp = Date.now();

    // Create test camp with one stage
    testCamp = await CampModel.create({
      title: `Camp Stages Test ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      stages: [
        {
          date: "2025-07-02",
          startPoint: "Col de Jaman",
          endPoint: "Château-d'Oex",
          distance: 15.2,
          elevationGain: 500,
          elevationLoss: 800,
          routeDescription: "Par le sentier des alpages",
        },
      ],
    });

    stageId = testCamp.stages[0]._id;
  });

  // ==================== GET ALL STAGES ====================
  describe("GET /camps/:campId/stages", function () {
    it("should retrieve all stages from a camp", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/stages`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("startPoint");
      expect(res.body[0].startPoint).toBe("Col de Jaman");
    });

    it("should return empty array if camp has no stages", async function () {
      const emptyCamp = await CampModel.create({
        title: "Camp sans stages",
        startDate: "2025-08-01",
        endDate: "2025-08-15",
      });

      const res = await agentAdmin
        .get(`/camps/${emptyCamp._id}/stages`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toEqual([]);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin.get(`/camps/${fakeId}/stages`).expect(404);
    });

    it("should allow parent to view stages", async function () {
      const res = await agentParent
        .get(`/camps/${testCamp._id}/stages`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .get(`/camps/${testCamp._id}/stages`)
        .expect(401);
    });
  });

  // ==================== GET ONE STAGE ====================
  describe("GET /camps/:campId/stages/:stageId", function () {
    it("should return a specific stage by ID", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/stages/${stageId}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id", stageId.toString());
      expect(res.body.startPoint).toBe("Col de Jaman");
      expect(res.body.endPoint).toBe("Château-d'Oex");
    });

    it("should return 404 for non-existent stage", async function () {
      const fakeStageId = new mongoose.Types.ObjectId();
      await agentAdmin
        .get(`/camps/${testCamp._id}/stages/${fakeStageId}`)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();
      await agentAdmin
        .get(`/camps/${fakeCampId}/stages/${stageId}`)
        .expect(404);
    });

    it("should return 400 for invalid stage ID format", async function () {
      await agentAdmin
        .get(`/camps/${testCamp._id}/stages/invalid-id`)
        .expect(400);
    });
  });

  // ==================== POST (CREATE) STAGE ====================
  describe("POST /camps/:campId/stages", function () {
    it("should create a stage with valid data", async function () {
      const newStage = {
        date: "2025-07-03",
        startPoint: "Château-d'Oex",
        endPoint: "Gstaad",
        distance: 18.5,
        elevationGain: 600,
        elevationLoss: 400,
        routeDescription: "Traversée par les pâturages",
      };

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/stages`)
        .send(newStage)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.startPoint).toBe("Château-d'Oex");
      expect(res.body.endPoint).toBe("Gstaad");
      expect(res.body.distance).toBe(18.5);

      // Verify camp has 2 stages now
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.stages.length).toBe(2);
    });

    it("should auto-generate year from date", async function () {
      const newStage = {
        date: "2025-07-04",
        startPoint: "Départ",
        endPoint: "Arrivée",
      };

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/stages`)
        .send(newStage)
        .expect(201);

      expect(res.body.year).toBe(2025);
    });

    it("should create stage with minimal data (only date)", async function () {
      const minimalStage = {
        date: "2025-07-05",
      };

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/stages`)
        .send(minimalStage)
        .expect(201);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.date).toBeDefined();
    });

    it("should return 400 if date is missing", async function () {
      const invalidStage = {
        startPoint: "Col de Jaman",
        endPoint: "Château-d'Oex",
      };

      await agentAdmin
        .post(`/camps/${testCamp._id}/stages`)
        .send(invalidStage)
        .expect(400);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const newStage = {
        date: "2025-07-03",
        startPoint: "Somewhere",
      };

      await agentAdmin
        .post(`/camps/${fakeId}/stages`)
        .send(newStage)
        .expect(404);
    });

    it("should return 403 when parent tries to create stage", async function () {
      const newStage = {
        date: "2025-07-03",
        startPoint: "Unauthorized",
      };

      await agentParent
        .post(`/camps/${testCamp._id}/stages`)
        .send(newStage)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to create stage", async function () {
      const newStage = {
        date: "2025-07-03",
        startPoint: "Unauthorized",
      };

      await agentAccompagnant
        .post(`/camps/${testCamp._id}/stages`)
        .send(newStage)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      const newStage = {
        date: "2025-07-03",
        startPoint: "No auth",
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/stages`)
        .send(newStage)
        .expect(401);
    });
  });

  // ==================== PUT (UPDATE) STAGE ====================
  describe("PUT /camps/:campId/stages/:stageId", function () {
    it("should update an existing stage", async function () {
      const updates = {
        startPoint: "Nouveau départ",
        distance: 20.0,
        routeDescription: "Itinéraire modifié",
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/stages/${stageId}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.startPoint).toBe("Nouveau départ");
      expect(res.body.distance).toBe(20.0);
      expect(res.body.routeDescription).toBe("Itinéraire modifié");
      expect(res.body.endPoint).toBe("Château-d'Oex"); // Unchanged
    });

    it("should update only specified fields", async function () {
      const updates = {
        distance: 25.0,
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/stages/${stageId}`)
        .send(updates)
        .expect(200);

      expect(res.body.distance).toBe(25.0);
      expect(res.body.startPoint).toBe("Col de Jaman"); // Unchanged
    });

    it("should return 404 for non-existent stage", async function () {
      const fakeStageId = new mongoose.Types.ObjectId();
      const updates = { distance: 20.0 };

      await agentAdmin
        .put(`/camps/${testCamp._id}/stages/${fakeStageId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();
      const updates = { distance: 20.0 };

      await agentAdmin
        .put(`/camps/${fakeCampId}/stages/${stageId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 400 for invalid stage ID", async function () {
      const updates = { distance: 20.0 };

      await agentAdmin
        .put(`/camps/${testCamp._id}/stages/invalid-id`)
        .send(updates)
        .expect(400);
    });

    it("should return 403 when parent tries to update stage", async function () {
      const updates = { startPoint: "Unauthorized update" };

      await agentParent
        .put(`/camps/${testCamp._id}/stages/${stageId}`)
        .send(updates)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to update stage", async function () {
      const updates = { startPoint: "Unauthorized update" };

      await agentAccompagnant
        .put(`/camps/${testCamp._id}/stages/${stageId}`)
        .send(updates)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      const updates = { startPoint: "No auth update" };

      await supertest(app)
        .put(`/camps/${testCamp._id}/stages/${stageId}`)
        .send(updates)
        .expect(401);
    });
  });

  // ==================== DELETE STAGE ====================
  describe("DELETE /camps/:campId/stages/:stageId", function () {
    it("should delete a stage from camp", async function () {
      const res = await agentAdmin
        .delete(`/camps/${testCamp._id}/stages/${stageId}`)
        .expect(200);

      expect(res.body).toHaveProperty("message");

      // Verify stage was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.stages.length).toBe(0);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();

      await agentAdmin
        .delete(`/camps/${fakeCampId}/stages/${stageId}`)
        .expect(404);
    });

    it("should return 400 for invalid stage ID", async function () {
      await agentAdmin
        .delete(`/camps/${testCamp._id}/stages/invalid-id`)
        .expect(400);
    });

    it("should return 403 when parent tries to delete stage", async function () {
      await agentParent
        .delete(`/camps/${testCamp._id}/stages/${stageId}`)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to delete stage", async function () {
      await agentAccompagnant
        .delete(`/camps/${testCamp._id}/stages/${stageId}`)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/stages/${stageId}`)
        .expect(401);
    });
  });
});
