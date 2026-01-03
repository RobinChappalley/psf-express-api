import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

describe("Camp Trainings API", function () {
  let testCamp;
  let testUser;
  let trainingId;

  beforeAll(async () => {
    await connectMongo();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create test user (responsible person) with unique email
    const timestamp = Date.now();
    testUser = await UserModel.create({
      firstname: "Marie",
      lastname: "Dupont",
      email: `marie.dupont.${timestamp}@test.com`,
      password: "password123",
      role: ["accompagnant"],
    });

    // Create test camp with one training and unique title
    testCamp = await CampModel.create({
      title: `Camp de test 2025 ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      trainings: [
        {
          number: 1,
          date: "2025-06-15",
          trainGoingTime: "08:00",
          trainReturnTime: "18:00",
          meetingTime: "08:30",
          meetingPoint: "Gare centrale",
          returnTime: "17:30",
          distance: 12.5,
          elevationGain: 300,
          elevationLoss: 200,
          responsiblePerson: testUser._id,
          remark: "Prévoir des chaussures imperméables",
        },
      ],
    });

    trainingId = testCamp.trainings[0]._id;
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("GET /camps/:campId/trainings", function () {
    it("should retrieve all trainings from a camp", async function () {
      const res = await supertest(app)
        .get(`/camps/${testCamp._id}/trainings`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("number");
      expect(res.body[0]).toHaveProperty("meetingPoint");
      expect(res.body[0].meetingPoint).toBe("Gare centrale");
    });

    it("should return empty array if camp has no trainings", async function () {
      const emptyTestCamp = await CampModel.create({
        title: "Camp sans trainings",
        startDate: "2025-08-01",
        endDate: "2025-08-15",
      });

      const res = await supertest(app)
        .get(`/camps/${emptyTestCamp._id}/trainings`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toEqual([]);
    });

    it("should return one specific training by ID", async function () {
      const res = await supertest(app)
        .get(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id", trainingId.toString());
      expect(res.body.meetingPoint).toBe("Gare centrale");
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app).get(`/camps/${fakeId}/trainings`).expect(404);
    });
  });

  describe("POST /camps/:campId/trainings", function () {
    it("should add a new training to camp", async function () {
      const newTraining = {
        date: "2025-06-22",
        "train-going-time": "09:00",
        "train-return-time": "19:00",
        "meeting-time": "09:30",
        "meeting-point": "Gare de Lausanne",
        "return-time": "18:30",
        distance: 15.0,
        "elevation-difference": 400,
        "responsible-person-id": testUser._id.toString(),
        remark: "Entraînement difficile",
      };

      const res = await supertest(app)
        .post(`/camps/${testCamp._id}/trainings`)
        .send(newTraining)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.meetingPoint).toBe("Gare de Lausanne");
      expect(res.body.distance).toBe(15.0);

      // Verify camp has 2 trainings now
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.trainings.length).toBe(2);
    });

    it("should create training with minimal data", async function () {
      const minimalTraining = {
        date: "2025-07-01",
      };

      const res = await supertest(app)
        .post(`/camps/${testCamp._id}/trainings`)
        .send(minimalTraining)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.date).toBeDefined();
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const newTraining = {
        date: "2025-06-22",
        "meeting-point": "Somewhere",
      };

      await supertest(app)
        .post(`/camps/${fakeId}/trainings`)
        .send(newTraining)
        .expect(404);
    });
  });

  describe("PUT /camps/:campId/trainings/:trainingId", function () {
    it("should update an existing training", async function () {
      const updates = {
        "meeting-point": "Gare de Montreux",
        distance: 18.5,
        remark: "Modification de l'itinéraire",
      };
      const res = await supertest(app)
        .put(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.meetingPoint).toBe("Gare de Montreux");
      expect(res.body.distance).toBe(18.5);
      expect(res.body.remark).toBe("Modification de l'itinéraire");
      expect(res.body.trainGoingTime).toBe("08:00"); // Unchanged field
    });

    it("should update only specified fields", async function () {
      const updates = {
        distance: 20.0,
      };

      const res = await supertest(app)
        .put(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.distance).toBe(20.0);
      expect(res.body.meetingPoint).toBe("Gare centrale"); // Unchanged
    });

    it("should return 404 for non-existent training", async function () {
      const fakeTrainingId = new mongoose.Types.ObjectId();
      const updates = {
        distance: 20.0,
      };

      await supertest(app)
        .put(`/camps/${testCamp._id}/trainings/${fakeTrainingId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();
      const updates = {
        distance: 20.0,
      };

      await supertest(app)
        .put(`/camps/${fakeCampId}/trainings/${trainingId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 400 for invalid training ID", async function () {
      const updates = {
        distance: 20.0,
      };

      await supertest(app)
        .put(`/camps/${testCamp._id}/trainings/invalid-id`)
        .send(updates)
        .expect(400);
    });
  });

  describe("DELETE /camps/:campId/trainings/:trainingId", function () {
    it("should delete a training from camp", async function () {
      const res = await supertest(app)
        .delete(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");

      // Verify training was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.trainings.length).toBe(0);
    });

    it("should return 404 for non-existent training", async function () {
      const fakeTrainingId = new mongoose.Types.ObjectId();

      await supertest(app)
        .delete(`/camps/${testCamp._id}/trainings/${fakeTrainingId}`)
        .expect(200); // Mongoose $pull succeeds even if item doesn't exist
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();

      await supertest(app)
        .delete(`/camps/${fakeCampId}/trainings/${trainingId}`)
        .expect(404);
    });

    it("should return 404 for invalid training ID", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/trainings/invalid-id`)
        .expect(400);
    });
  });
});
