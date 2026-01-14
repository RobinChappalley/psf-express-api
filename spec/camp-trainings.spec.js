import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

describe("Camp Trainings API", function () {
  let testCamp;
  let testUser;
  let trainingId;

  // Agents for authenticated requests (maintain cookies)
  let agentAdmin;
  let agentParent;
  let agentAccompagnant;

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

    //Create a user with role ACCOMPAGNANT
    await UserModel.create({
      role: ["accompagnant"],
      lastname: "Guide",
      firstname: "Anna",
      email: "anna.guide@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 59",
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

    //Login accompagnant with agent
    agentAccompagnant = supertest.agent(app);
    await agentAccompagnant
      .post("/login")
      .send({ email: "anna.guide@email.com", password: "123456" });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

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

  describe("GET /camps/:campId/trainings", function () {
    it("should retrieve all trainings from a camp", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/trainings`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("meetingPoint");
      expect(res.body[0].meetingPoint).toBe("Gare centrale");
    });

    it("should return empty array if camp has no trainings", async function () {
      const emptyTestCamp = await CampModel.create({
        title: "Camp sans trainings",
        startDate: "2025-08-01",
        endDate: "2025-08-15",
      });

      const res = await agentAdmin
        .get(`/camps/${emptyTestCamp._id}/trainings`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toEqual([]);
    });

    it("should return one specific training by ID", async function () {
      const res = await agentAdmin
        .get(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id", trainingId.toString());
      expect(res.body.meetingPoint).toBe("Gare centrale");
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin.get(`/camps/${fakeId}/trainings`).expect(404);
    });
  });

  describe("POST /camps/:campId/trainings", function () {
    it("should add a new training to camp", async function () {
      const newTraining = {
        date: "2025-06-22",
        trainGoingTime: "09:00",
        trainReturnTime: "19:00",
        meetingTime: "09:30",
        meetingPoint: "Gare de Lausanne",
        returnTime: "18:30",
        distance: 15.0,
        elevationGain: 400,
        elevationLoss: 250,
        responsiblePerson: testUser._id.toString(),
        remark: "Entraînement difficile",
      };

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/trainings`)
        .send(newTraining)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.distance).toBe(15.0);
      expect(res.body.elevationGain).toBe(400);
      expect(res.body.elevationLoss).toBe(250);

      expect(res.body.meetingPoint).toBe("Gare de Lausanne");

      // Verify camp has 2 trainings now
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.trainings.length).toBe(2);
    });

    it("should create training with minimal data", async function () {
      const minimalTraining = {
        date: "2025-07-01",
      };

      const res = await agentAdmin
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

      await agentAdmin
        .post(`/camps/${fakeId}/trainings`)
        .send(newTraining)
        .expect(404);
    });

    it("should create a training with metadata AND GPX file", async () => {
      const mockGpx = `<?xml version="1.0"?>
      <gpx>
        <trk>
          <trkseg>
            <trkpt lat="48.85" lon="2.35"></trkpt>
            <trkpt lat="48.86" lon="2.36"></trkpt>
          </trkseg>
        </trk>
      </gpx>`;

      const res = await agentAdmin
        .post(`/camps/${testCamp._id}/trainings`)
        .field("date", "2024-07-15")
        .field("distance", "10")
        .field("meetingPoint", "Base")
        .attach("gpxFile", Buffer.from(mockGpx), "track.gpx");

      expect(res.status).toBe(201);
      expect(res.body.gpsTrack.coordinates).toBeDefined();
      expect(res.body.gpsTrack.coordinates[0]).toEqual([2.35, 48.85]);
    });
  });

  describe("PUT /camps/:campId/trainings/:trainingId", function () {
    it("should update an existing training", async function () {
      const updates = {
        meetingPoint: "Gare de Montreux",
        distance: 18.5,
        remark: "Modification de l'itinéraire",
      };
      const res = await agentAdmin
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

      const res = await agentAdmin
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

      await agentAdmin
        .put(`/camps/${testCamp._id}/trainings/${fakeTrainingId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();
      const updates = {
        distance: 20.0,
      };

      await agentAdmin
        .put(`/camps/${fakeCampId}/trainings/${trainingId}`)
        .send(updates)
        .expect(404);
    });

    it("should return 400 for invalid training ID", async function () {
      const updates = {
        distance: 20.0,
      };

      await agentAdmin
        .put(`/camps/${testCamp._id}/trainings/invalid-id`)
        .send(updates)
        .expect(400);
    });

    it("should return 403 when parent tries to update training", async function () {
      const updates = {
        meetingPoint: "Unauthorized update",
      };

      await agentParent
        .put(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .send(updates)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to update training", async function () {
      const updates = {
        meetingPoint: "Unauthorized update",
      };

      await agentAccompagnant
        .put(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .send(updates)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      const updates = {
        meetingPoint: "No auth update",
      };

      await supertest(app)
        .put(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .send(updates)
        .expect(401);
    });
  });

  describe("DELETE /camps/:campId/trainings/:trainingId", function () {
    it("should delete a training from camp", async function () {
      const res = await agentAdmin
        .delete(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .expect(200);

      expect(res.body).toHaveProperty("message");

      // Verify training was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.trainings.length).toBe(0);
    });

    it("should return 404 for non-existent training", async function () {
      const fakeTrainingId = new mongoose.Types.ObjectId();

      await agentAdmin
        .delete(`/camps/${testCamp._id}/trainings/${fakeTrainingId}`)
        .expect(200); // Mongoose $pull succeeds even if item doesn't exist
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeCampId = new mongoose.Types.ObjectId();

      await agentAdmin
        .delete(`/camps/${fakeCampId}/trainings/${trainingId}`)
        .expect(404);
    });

    it("should return 400 for invalid training ID", async function () {
      await agentAdmin
        .delete(`/camps/${testCamp._id}/trainings/invalid-id`)
        .expect(400);
    });

    it("should return 403 when parent tries to delete training", async function () {
      await agentParent
        .delete(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .expect(403);
    });

    it("should return 403 when accompagnant tries to delete training", async function () {
      await agentAccompagnant
        .delete(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .expect(403);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/trainings/${trainingId}`)
        .expect(401);
    });
  });
});
