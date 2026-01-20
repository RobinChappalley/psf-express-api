import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

/**
 * Tests d'intégration pour vérifier que la création d'un training
 * fonctionne correctement avec des utilisateurs inscrits au camp.
 *
 * Note: En mode test, le service mail retourne des résultats mockés
 * (voir mailService.js - sendMail en mode test).
 */
describe("Training Creation with Email Recipients", function () {
  let testCamp;
  let agentAdmin;

  beforeAll(async () => {
    await connectMongo();
    await cleanDatabase();

    // Create admin user
    await UserModel.create({
      role: ["admin"],
      lastname: "Admin",
      firstname: "Person",
      email: "admin.email@test.com",
      password: "123456",
    });

    // Login admin
    agentAdmin = supertest.agent(app);
    await agentAdmin
      .post("/login")
      .send({ email: "admin.email@test.com", password: "123456" });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();
  });

  describe("POST /camps/:campId/trainings", () => {
    it("should create training successfully when users are registered to camp", async () => {
      // Create camp
      testCamp = await CampModel.create({
        title: `Camp Email Test ${Date.now()}`,
        startDate: "2025-07-01",
        endDate: "2025-07-15",
      });

      // Create a parent registered to the camp
      await UserModel.create({
        role: ["parent"],
        lastname: "Parent",
        firstname: "Test",
        email: `parent.test.${Date.now()}@email.com`,
        password: "123456",
        camps: [testCamp._id],
      });

      // Create training - should succeed and trigger email notification (mocked in test)
      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/trainings`)
        .send({
          date: "2025-06-15",
          meetingPoint: "Gare de Lausanne",
          meetingTime: "08:30",
        });

      expect(res.status).toBe(201);
      expect(res.body.meetingPoint).toBe("Gare de Lausanne");
      expect(res.body.meetingTime).toBe("08:30");
    });

    it("should create training when parent has child registered to camp", async () => {
      testCamp = await CampModel.create({
        title: `Camp Children Test ${Date.now()}`,
        startDate: "2025-07-01",
        endDate: "2025-07-15",
      });

      // Create parent (not directly registered to camp)
      const parent = await UserModel.create({
        role: ["parent"],
        lastname: "Parent",
        firstname: "WithChild",
        email: `parent.withchild.${Date.now()}@email.com`,
        password: "123456",
      });

      // Create child registered to the camp
      await UserModel.create({
        role: ["enfant"],
        lastname: "Child",
        firstname: "Test",
        parent: parent._id,
        camps: [testCamp._id],
      });

      // Create training
      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/trainings`)
        .send({
          date: "2025-06-20",
          meetingPoint: "Gare de Genève",
          meetingTime: "09:00",
        });

      expect(res.status).toBe(201);
      expect(res.body.meetingPoint).toBe("Gare de Genève");
    });

    it("should create training when no users are registered (no emails sent)", async () => {
      testCamp = await CampModel.create({
        title: `Camp No Users ${Date.now()}`,
        startDate: "2025-07-01",
        endDate: "2025-07-15",
      });

      // Create training (no users registered to this camp)
      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/trainings`)
        .send({
          date: "2025-06-30",
          meetingPoint: "Gare de Zurich",
          meetingTime: "10:00",
        });

      expect(res.status).toBe(201);
      expect(res.body.meetingPoint).toBe("Gare de Zurich");
    });

    it("should create training with multiple registered users", async () => {
      testCamp = await CampModel.create({
        title: `Camp Multiple Users ${Date.now()}`,
        startDate: "2025-07-01",
        endDate: "2025-07-15",
      });

      const timestamp = Date.now();

      // Create multiple parents registered to the camp
      await UserModel.create({
        role: ["parent"],
        lastname: "Parent1",
        firstname: "First",
        email: `parent1.${timestamp}@email.com`,
        password: "123456",
        camps: [testCamp._id],
      });

      await UserModel.create({
        role: ["parent"],
        lastname: "Parent2",
        firstname: "Second",
        email: `parent2.${timestamp}@email.com`,
        password: "123456",
        camps: [testCamp._id],
      });

      await UserModel.create({
        role: ["parent"],
        lastname: "Parent3",
        firstname: "Third",
        email: `parent3.${timestamp}@email.com`,
        password: "123456",
        camps: [testCamp._id],
      });

      // Create training
      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/trainings`)
        .send({
          date: "2025-07-01",
          meetingPoint: "Gare de Bâle",
          meetingTime: "07:00",
        });

      expect(res.status).toBe(201);
      expect(res.body.meetingPoint).toBe("Gare de Bâle");
    });
  });
});
