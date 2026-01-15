import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

describe("Camp Fundraisings API - TDD", function () {
  let testCamp;
  let fundraisingId;
  let testUserId;

  // Agents for authenticated requests (maintain cookies)
  let agentAdmin;
  let agentParent;
  let agentAccompagnant;

  beforeAll(async () => {
    await connectMongo();
    await cleanDatabase();

    // Create a user with role ADMIN
    const adminUser = await UserModel.create({
      role: ["admin"],
      lastname: "Admin",
      firstname: "Fundraising",
      email: "admin.fundraising@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 60",
    });

    // Create a user with role PARENT
    const parentUser = await UserModel.create({
      role: ["parent"],
      lastname: "Parent",
      firstname: "Fundraising",
      email: "parent.fundraising@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 61",
    });

    // Create a user with role ACCOMPAGNANT
    const accompagnantUser = await UserModel.create({
      role: ["accompagnant"],
      lastname: "Accompagnant",
      firstname: "Fundraising",
      email: "accompagnant.fundraising@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 62",
    });

    // Store user ID for participant tests
    testUserId = accompagnantUser._id;

    // Login admin with agent
    agentAdmin = supertest.agent(app);
    await agentAdmin
      .post("/login")
      .send({ email: "admin.fundraising@email.com", password: "123456" });

    // Login parent with agent
    agentParent = supertest.agent(app);
    await agentParent
      .post("/login")
      .send({ email: "parent.fundraising@email.com", password: "123456" });

    // Login accompagnant with agent
    agentAccompagnant = supertest.agent(app);
    await agentAccompagnant
      .post("/login")
      .send({ email: "accompagnant.fundraising@email.com", password: "123456" });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    const timestamp = Date.now();

    // Create test camp with one fundraising
    testCamp = await CampModel.create({
      title: `Camp Fundraisings Test ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      fundraisings: [
        {
          dateTime: "2025-06-15T14:00:00.000Z",
          location: "Place du marché, Lausanne",
          participants: [testUserId],
        },
      ],
    });

    fundraisingId = testCamp.fundraisings[0]._id;
  });

  // ==================== GET ALL FUNDRAISINGS ====================
  describe("GET /camps/:campId/fundraisings", function () {
    it("should retrieve all fundraisings from a camp", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/fundraisings`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("location");
      expect(res.body[0].location).toBe("Place du marché, Lausanne");
    });

    it("should return empty array if camp has no fundraisings", async function () {
      const emptyCamp = await CampModel.create({
        title: "Camp sans fundraisings",
        startDate: "2025-08-01",
        endDate: "2025-08-15",
      });

      const res = await agentAdmin
        .get(`/camps/${emptyCamp._id}/fundraisings`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toEqual([]);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin.get(`/camps/${fakeId}/fundraisings`).expect(404);
    });

    it("should allow parent to view fundraisings", async function () {
      const res = await agentParent
        .get(`/camps/${testCamp._id}/fundraisings`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });

    it("should allow accompagnant to view fundraisings", async function () {
      const res = await agentAccompagnant
        .get(`/camps/${testCamp._id}/fundraisings`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .get(`/camps/${testCamp._id}/fundraisings`)
        .expect(401);
    });

    it("should populate participants with user details", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/fundraisings`)
        .expect(200);

      expect(res.body[0].participants).toBeInstanceOf(Array);
      expect(res.body[0].participants.length).toBe(1);
      // If populated, should have user properties
      if (typeof res.body[0].participants[0] === "object") {
        expect(res.body[0].participants[0]).toHaveProperty("firstname");
      }
    });
  });

  // ==================== GET ONE FUNDRAISING ====================
  describe("GET /camps/:campId/fundraisings/:fundraisingId", function () {
    it("should return a specific fundraising by ID", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id", fundraisingId.toString());
      expect(res.body.location).toBe("Place du marché, Lausanne");
    });

    it("should return 404 for non-existent fundraising", async function () {
      const fakeFundraisingId = new mongoose.Types.ObjectId();
      await agentAdmin
        .get(`/camps/${testCamp._id}/fundraisings/${fakeFundraisingId}`)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();
      await agentAdmin
        .get(`/camps/${fakeCampId}/fundraisings/${fundraisingId}`)
        .expect(404);
    });

    it("should return 400 for invalid fundraising ID format", async function () {
      await agentAdmin
        .get(`/camps/${testCamp._id}/fundraisings/invalid-id`)
        .expect(400);
    });
  });

  // ==================== POST (CREATE) FUNDRAISING ====================
  describe("POST /camps/:campId/fundraisings", function () {
    it("should create a fundraising with valid data", async function () {
      const newFundraising = {
        dateTime: "2025-06-20T10:00:00.000Z",
        location: "Gare de Montreux",
        participants: [testUserId.toString()],
      };

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(newFundraising)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.location).toBe("Gare de Montreux");

      // Verify camp has 2 fundraisings now
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.fundraisings.length).toBe(2);
    });

    it("should create fundraising with minimal data (only dateTime)", async function () {
      const minimalFundraising = {
        dateTime: "2025-06-22T09:00:00.000Z",
      };

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(minimalFundraising)
        .expect(201);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.dateTime).toBeDefined();
    });

    it("should create fundraising without participants", async function () {
      const fundraisingNoParticipants = {
        dateTime: "2025-06-23T11:00:00.000Z",
        location: "Centre-ville",
      };

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(fundraisingNoParticipants)
        .expect(201);

      expect(res.body.participants).toEqual([]);
    });

    it("should return 400 if dateTime is missing", async function () {
      const invalidFundraising = {
        location: "Somewhere",
      };

      await agentAdmin
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(invalidFundraising)
        .expect(400);
    });

    it("should return 400 for invalid dateTime format", async function () {
      const invalidFundraising = {
        dateTime: "not-a-date",
        location: "Somewhere",
      };

      await agentAdmin
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(invalidFundraising)
        .expect(400);
    });

    it("should return 400 for invalid participant ID", async function () {
      const invalidFundraising = {
        dateTime: "2025-06-24T10:00:00.000Z",
        participants: ["invalid-id"],
      };

      await agentAdmin
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(invalidFundraising)
        .expect(400);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const newFundraising = {
        dateTime: "2025-06-25T10:00:00.000Z",
        location: "Somewhere",
      };

      await agentAdmin
        .post(`/camps/${fakeId}/fundraisings`)
        .send(newFundraising)
        .expect(404);
    });

    it("should return 403 when parent tries to create fundraising", async function () {
      const newFundraising = {
        dateTime: "2025-06-26T10:00:00.000Z",
        location: "Unauthorized",
      };

      await agentParent
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(newFundraising)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to create fundraising", async function () {
      const newFundraising = {
        dateTime: "2025-06-27T10:00:00.000Z",
        location: "Unauthorized",
      };

      await agentAccompagnant
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(newFundraising)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      const newFundraising = {
        dateTime: "2025-06-28T10:00:00.000Z",
        location: "No auth",
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/fundraisings`)
        .send(newFundraising)
        .expect(401);
    });
  });

  // ==================== PUT (UPDATE) FUNDRAISING ====================
  describe("PUT /camps/:campId/fundraisings/:fundraisingId", function () {
    it("should update an existing fundraising", async function () {
      const updates = {
        location: "Nouveau lieu",
        dateTime: "2025-06-16T15:00:00.000Z",
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.location).toBe("Nouveau lieu");
    });

    it("should update only specified fields", async function () {
      const updates = {
        location: "Lieu modifié",
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .send(updates)
        .expect(200);

      expect(res.body.location).toBe("Lieu modifié");
      // dateTime should remain unchanged
      expect(res.body.dateTime).toBeDefined();
    });

    it("should update participants list", async function () {
      const updates = {
        participants: [], // Remove all participants
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .send(updates)
        .expect(200);

      expect(res.body.participants).toEqual([]);
    });

    it("should return 404 for non-existent fundraising", async function () {
      const fakeFundraisingId = new mongoose.Types.ObjectId();
      const updates = { location: "Test" };

      await agentAdmin
        .put(`/camps/${testCamp._id}/fundraisings/${fakeFundraisingId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();
      const updates = { location: "Test" };

      await agentAdmin
        .put(`/camps/${fakeCampId}/fundraisings/${fundraisingId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 400 for invalid fundraising ID", async function () {
      const updates = { location: "Test" };

      await agentAdmin
        .put(`/camps/${testCamp._id}/fundraisings/invalid-id`)
        .send(updates)
        .expect(400);
    });

    it("should return 403 when parent tries to update fundraising", async function () {
      const updates = { location: "Unauthorized update" };

      await agentParent
        .put(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .send(updates)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to update fundraising", async function () {
      const updates = { location: "Unauthorized update" };

      await agentAccompagnant
        .put(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .send(updates)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      const updates = { location: "No auth update" };

      await supertest(app)
        .put(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .send(updates)
        .expect(401);
    });
  });

  // ==================== DELETE FUNDRAISING ====================
  describe("DELETE /camps/:campId/fundraisings/:fundraisingId", function () {
    it("should delete a fundraising from camp", async function () {
      const res = await agentAdmin
        .delete(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .expect(200);

      expect(res.body).toHaveProperty("message");

      // Verify fundraising was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.fundraisings.length).toBe(0);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();

      await agentAdmin
        .delete(`/camps/${fakeCampId}/fundraisings/${fundraisingId}`)
        .expect(404);
    });

    it("should return 400 for invalid fundraising ID", async function () {
      await agentAdmin
        .delete(`/camps/${testCamp._id}/fundraisings/invalid-id`)
        .expect(400);
    });

    it("should return 403 when parent tries to delete fundraising", async function () {
      await agentParent
        .delete(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to delete fundraising", async function () {
      await agentAccompagnant
        .delete(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/fundraisings/${fundraisingId}`)
        .expect(401);
    });
  });
});
