import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

describe("Camp Info Evening API - TDD (Singleton)", function () {
  let testCamp;
  let campWithoutInfoEvening;

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
      firstname: "InfoEvening",
      email: "admin.ie@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 80",
    });

    // Create a user with role PARENT
    await UserModel.create({
      role: ["parent"],
      lastname: "Parent",
      firstname: "InfoEvening",
      email: "parent.ie@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 81",
    });

    // Create a user with role ACCOMPAGNANT
    await UserModel.create({
      role: ["accompagnant"],
      lastname: "Accompagnant",
      firstname: "InfoEvening",
      email: "accompagnant.ie@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 82",
    });

    // Login admin with agent
    agentAdmin = supertest.agent(app);
    await agentAdmin
      .post("/login")
      .send({ email: "admin.ie@email.com", password: "123456" });

    // Login parent with agent
    agentParent = supertest.agent(app);
    await agentParent
      .post("/login")
      .send({ email: "parent.ie@email.com", password: "123456" });

    // Login accompagnant with agent
    agentAccompagnant = supertest.agent(app);
    await agentAccompagnant
      .post("/login")
      .send({ email: "accompagnant.ie@email.com", password: "123456" });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    const timestamp = Date.now();

    // Create test camp WITH an info evening
    testCamp = await CampModel.create({
      title: `Camp Info Evening Test ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      infoEvening: {
        dateTime: "2025-04-10T19:30:00.000Z",
        location: "Aula du collège de Montreux",
        participants: [
          {
            email: "interested1@example.com",
            nbOfParticipants: 3,
          },
          {
            email: "interested2@example.com",
            nbOfParticipants: 2,
          },
        ],
      },
    });

    // Create test camp WITHOUT an info evening
    campWithoutInfoEvening = await CampModel.create({
      title: `Camp Sans Soirée Info ${timestamp}`,
      startDate: "2025-08-01",
      endDate: "2025-08-15",
    });
  });

  // ==================== GET INFO EVENING ====================
  describe("GET /camps/:campId/info-evening", function () {
    it("should retrieve the info evening from a camp", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/info-evening`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("dateTime");
      expect(res.body.location).toBe("Aula du collège de Montreux");
      expect(res.body.participants).toBeInstanceOf(Array);
      expect(res.body.participants.length).toBe(2);
    });

    it("should return 404 if camp has no info evening", async function () {
      await agentAdmin
        .get(`/camps/${campWithoutInfoEvening._id}/info-evening`)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin.get(`/camps/${fakeId}/info-evening`).expect(404);
    });

    it("should allow parent to view info evening", async function () {
      const res = await agentParent
        .get(`/camps/${testCamp._id}/info-evening`)
        .expect(200);

      expect(res.body).toHaveProperty("location");
    });

    it("should allow accompagnant to view info evening", async function () {
      const res = await agentAccompagnant
        .get(`/camps/${testCamp._id}/info-evening`)
        .expect(200);

      expect(res.body).toHaveProperty("location");
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .get(`/camps/${testCamp._id}/info-evening`)
        .expect(401);
    });

    it("should return participants with email and nbOfParticipants", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/info-evening`)
        .expect(200);

      expect(res.body.participants[0]).toHaveProperty("email");
      expect(res.body.participants[0]).toHaveProperty("nbOfParticipants");
      expect(res.body.participants[0].email).toBe("interested1@example.com");
      expect(res.body.participants[0].nbOfParticipants).toBe(3);
    });
  });

  // ==================== PUT (CREATE/UPDATE) INFO EVENING ====================
  describe("PUT /camps/:campId/info-evening", function () {
    it("should create an info evening on a camp without one", async function () {
      const newInfoEvening = {
        dateTime: "2025-04-15T18:30:00.000Z",
        location: "Salle polyvalente",
        participants: [
          {
            email: "new.interested@example.com",
            nbOfParticipants: 4,
          },
        ],
      };

      const res = await agentAdmin
        .put(`/camps/${campWithoutInfoEvening._id}/info-evening`)
        .send(newInfoEvening)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.location).toBe("Salle polyvalente");
      expect(res.body.participants.length).toBe(1);

      // Verify in database
      const updatedCamp = await CampModel.findById(campWithoutInfoEvening._id);
      expect(updatedCamp.infoEvening).toBeDefined();
      expect(updatedCamp.infoEvening.location).toBe("Salle polyvalente");
    });

    it("should update an existing info evening", async function () {
      const updates = {
        location: "Nouveau lieu",
        dateTime: "2025-04-12T20:00:00.000Z",
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/info-evening`)
        .send(updates)
        .expect(200);

      expect(res.body.location).toBe("Nouveau lieu");
    });

    it("should update only specified fields", async function () {
      const updates = {
        location: "Lieu modifié",
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/info-evening`)
        .send(updates)
        .expect(200);

      expect(res.body.location).toBe("Lieu modifié");
      // dateTime should remain unchanged
      expect(res.body.dateTime).toBeDefined();
    });

    it("should update participants list", async function () {
      const updates = {
        participants: [
          {
            email: "updated@example.com",
            nbOfParticipants: 6,
          },
        ],
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/info-evening`)
        .send(updates)
        .expect(200);

      expect(res.body.participants.length).toBe(1);
      expect(res.body.participants[0].email).toBe("updated@example.com");
    });

    it("should return 400 for invalid dateTime format", async function () {
      const invalidInfoEvening = {
        dateTime: "not-a-date",
        location: "Somewhere",
      };

      await agentAdmin
        .put(`/camps/${campWithoutInfoEvening._id}/info-evening`)
        .send(invalidInfoEvening)
        .expect(400);
    });

    it("should return 400 for invalid email in participants", async function () {
      const invalidInfoEvening = {
        dateTime: "2025-04-15T18:00:00.000Z",
        participants: [
          {
            email: "not-an-email",
            nbOfParticipants: 2,
          },
        ],
      };

      await agentAdmin
        .put(`/camps/${campWithoutInfoEvening._id}/info-evening`)
        .send(invalidInfoEvening)
        .expect(400);
    });

    it("should return 400 for negative nbOfParticipants", async function () {
      const invalidInfoEvening = {
        dateTime: "2025-04-15T18:00:00.000Z",
        participants: [
          {
            email: "valid@example.com",
            nbOfParticipants: -1,
          },
        ],
      };

      await agentAdmin
        .put(`/camps/${campWithoutInfoEvening._id}/info-evening`)
        .send(invalidInfoEvening)
        .expect(400);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const newInfoEvening = {
        dateTime: "2025-04-15T18:00:00.000Z",
        location: "Somewhere",
      };

      await agentAdmin
        .put(`/camps/${fakeId}/info-evening`)
        .send(newInfoEvening)
        .expect(404);
    });

    it("should return 403 when parent tries to update info evening", async function () {
      const updates = { location: "Unauthorized" };

      await agentParent
        .put(`/camps/${testCamp._id}/info-evening`)
        .send(updates)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to update info evening", async function () {
      const updates = { location: "Unauthorized" };

      await agentAccompagnant
        .put(`/camps/${testCamp._id}/info-evening`)
        .send(updates)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      const updates = { location: "No auth" };

      await supertest(app)
        .put(`/camps/${testCamp._id}/info-evening`)
        .send(updates)
        .expect(401);
    });
  });

  // ==================== DELETE INFO EVENING ====================
  describe("DELETE /camps/:campId/info-evening", function () {
    it("should delete the info evening from camp", async function () {
      const res = await agentAdmin
        .delete(`/camps/${testCamp._id}/info-evening`)
        .expect(200);

      expect(res.body).toHaveProperty("message");

      // Verify info evening was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.infoEvening).toBeUndefined();
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();

      await agentAdmin
        .delete(`/camps/${fakeCampId}/info-evening`)
        .expect(404);
    });

    it("should return 404 if camp has no info evening", async function () {
      await agentAdmin
        .delete(`/camps/${campWithoutInfoEvening._id}/info-evening`)
        .expect(404);
    });

    it("should return 403 when parent tries to delete info evening", async function () {
      await agentParent
        .delete(`/camps/${testCamp._id}/info-evening`)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to delete info evening", async function () {
      await agentAccompagnant
        .delete(`/camps/${testCamp._id}/info-evening`)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/info-evening`)
        .expect(401);
    });
  });
});
