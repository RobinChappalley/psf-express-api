import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

describe("Camp General Meeting API - TDD (Singleton)", function () {
  let testCamp;
  let campWithoutMeeting;

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
      firstname: "GeneralMeeting",
      email: "admin.gm@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 70",
    });

    // Create a user with role PARENT
    await UserModel.create({
      role: ["parent"],
      lastname: "Parent",
      firstname: "GeneralMeeting",
      email: "parent.gm@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 71",
    });

    // Create a user with role ACCOMPAGNANT
    await UserModel.create({
      role: ["accompagnant"],
      lastname: "Accompagnant",
      firstname: "GeneralMeeting",
      email: "accompagnant.gm@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 72",
    });

    // Login admin with agent
    agentAdmin = supertest.agent(app);
    await agentAdmin
      .post("/login")
      .send({ email: "admin.gm@email.com", password: "123456" });

    // Login parent with agent
    agentParent = supertest.agent(app);
    await agentParent
      .post("/login")
      .send({ email: "parent.gm@email.com", password: "123456" });

    // Login accompagnant with agent
    agentAccompagnant = supertest.agent(app);
    await agentAccompagnant
      .post("/login")
      .send({ email: "accompagnant.gm@email.com", password: "123456" });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    const timestamp = Date.now();

    // Create test camp WITH a general meeting
    testCamp = await CampModel.create({
      title: `Camp GM Test ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      generalMeeting: {
        dateTime: "2025-05-15T19:00:00.000Z",
        location: "Salle communale de Lausanne",
        participants: [
          {
            email: "parent1@example.com",
            nbOfParticipants: 2,
          },
          {
            email: "parent2@example.com",
            nbOfParticipants: 1,
          },
        ],
      },
    });

    // Create test camp WITHOUT a general meeting
    campWithoutMeeting = await CampModel.create({
      title: `Camp Sans AG ${timestamp}`,
      startDate: "2025-08-01",
      endDate: "2025-08-15",
    });
  });

  // ==================== GET GENERAL MEETING ====================
  describe("GET /camps/:campId/ag", function () {
    it("should retrieve the general meeting from a camp", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/ag`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("dateTime");
      expect(res.body.location).toBe("Salle communale de Lausanne");
      expect(res.body.participants).toBeInstanceOf(Array);
      expect(res.body.participants.length).toBe(2);
    });

    it("should return 404 if camp has no general meeting", async function () {
      await agentAdmin
        .get(`/camps/${campWithoutMeeting._id}/ag`)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin.get(`/camps/${fakeId}/ag`).expect(404);
    });

    it("should allow parent to view general meeting", async function () {
      const res = await agentParent
        .get(`/camps/${testCamp._id}/ag`)
        .expect(200);

      expect(res.body).toHaveProperty("location");
    });

    it("should allow accompagnant to view general meeting", async function () {
      const res = await agentAccompagnant
        .get(`/camps/${testCamp._id}/ag`)
        .expect(200);

      expect(res.body).toHaveProperty("location");
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .get(`/camps/${testCamp._id}/ag`)
        .expect(401);
    });

    it("should return participants with email and nbOfParticipants", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/ag`)
        .expect(200);

      expect(res.body.participants[0]).toHaveProperty("email");
      expect(res.body.participants[0]).toHaveProperty("nbOfParticipants");
      expect(res.body.participants[0].email).toBe("parent1@example.com");
      expect(res.body.participants[0].nbOfParticipants).toBe(2);
    });
  });

  // ==================== PUT (CREATE/UPDATE) GENERAL MEETING ====================
  describe("PUT /camps/:campId/ag", function () {
    it("should create a general meeting on a camp without one", async function () {
      const newMeeting = {
        dateTime: "2025-06-01T18:00:00.000Z",
        location: "Centre paroissial",
        participants: [
          {
            email: "new.parent@example.com",
            nbOfParticipants: 3,
          },
        ],
      };

      const res = await agentAdmin
        .put(`/camps/${campWithoutMeeting._id}/ag`)
        .send(newMeeting)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.location).toBe("Centre paroissial");
      expect(res.body.participants.length).toBe(1);

      // Verify in database
      const updatedCamp = await CampModel.findById(campWithoutMeeting._id);
      expect(updatedCamp.generalMeeting).toBeDefined();
      expect(updatedCamp.generalMeeting.location).toBe("Centre paroissial");
    });

    it("should update an existing general meeting", async function () {
      const updates = {
        location: "Nouveau lieu",
        dateTime: "2025-05-20T20:00:00.000Z",
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/ag`)
        .send(updates)
        .expect(200);

      expect(res.body.location).toBe("Nouveau lieu");
    });

    it("should update only specified fields", async function () {
      const updates = {
        location: "Lieu modifié",
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/ag`)
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
            nbOfParticipants: 5,
          },
        ],
      };

      const res = await agentAdmin
        .put(`/camps/${testCamp._id}/ag`)
        .send(updates)
        .expect(200);

      expect(res.body.participants.length).toBe(1);
      expect(res.body.participants[0].email).toBe("updated@example.com");
    });

    it("should return 400 for invalid dateTime format", async function () {
      const invalidMeeting = {
        dateTime: "not-a-date",
        location: "Somewhere",
      };

      await agentAdmin
        .put(`/camps/${campWithoutMeeting._id}/ag`)
        .send(invalidMeeting)
        .expect(400);
    });

    it("should return 400 for invalid email in participants", async function () {
      const invalidMeeting = {
        dateTime: "2025-06-01T18:00:00.000Z",
        participants: [
          {
            email: "not-an-email",
            nbOfParticipants: 2,
          },
        ],
      };

      await agentAdmin
        .put(`/camps/${campWithoutMeeting._id}/ag`)
        .send(invalidMeeting)
        .expect(400);
    });

    it("should return 400 for negative nbOfParticipants", async function () {
      const invalidMeeting = {
        dateTime: "2025-06-01T18:00:00.000Z",
        participants: [
          {
            email: "valid@example.com",
            nbOfParticipants: -1,
          },
        ],
      };

      await agentAdmin
        .put(`/camps/${campWithoutMeeting._id}/ag`)
        .send(invalidMeeting)
        .expect(400);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const newMeeting = {
        dateTime: "2025-06-01T18:00:00.000Z",
        location: "Somewhere",
      };

      await agentAdmin
        .put(`/camps/${fakeId}/ag`)
        .send(newMeeting)
        .expect(404);
    });

    it("should return 403 when parent tries to update general meeting", async function () {
      const updates = { location: "Unauthorized" };

      await agentParent
        .put(`/camps/${testCamp._id}/ag`)
        .send(updates)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to update general meeting", async function () {
      const updates = { location: "Unauthorized" };

      await agentAccompagnant
        .put(`/camps/${testCamp._id}/ag`)
        .send(updates)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      const updates = { location: "No auth" };

      await supertest(app)
        .put(`/camps/${testCamp._id}/ag`)
        .send(updates)
        .expect(401);
    });
  });

  // ==================== DELETE GENERAL MEETING ====================
  describe("DELETE /camps/:campId/ag", function () {
    it("should delete the general meeting from camp", async function () {
      const res = await agentAdmin
        .delete(`/camps/${testCamp._id}/ag`)
        .expect(200);

      expect(res.body).toHaveProperty("message");

      // Verify general meeting was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.generalMeeting).toBeUndefined();
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();

      await agentAdmin
        .delete(`/camps/${fakeCampId}/ag`)
        .expect(404);
    });

    it("should return 404 if camp has no general meeting", async function () {
      await agentAdmin
        .delete(`/camps/${campWithoutMeeting._id}/ag`)
        .expect(404);
    });

    it("should return 403 when parent tries to delete general meeting", async function () {
      await agentParent
        .delete(`/camps/${testCamp._id}/ag`)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to delete general meeting", async function () {
      await agentAccompagnant
        .delete(`/camps/${testCamp._id}/ag`)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/ag`)
        .expect(401);
    });
  });
});
