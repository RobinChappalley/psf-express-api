import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import UserModel from "../models/User.model.js";
import HikeModel from "../models/Hike.model.js";

describe("Hikes API", function () {
  let testUser;
  let testHike;

  beforeAll(async () => {
    await connectMongo();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create a test user with unique email
    const timestamp = Date.now();
    testUser = await UserModel.create({
      firstname: "John",
      lastname: "Doe",
      email: `john.doe.${timestamp}@test.com`,
      password: "password123",
      role: ["accompagnant"],
    });

    // Create a test hike
    testHike = await HikeModel.create({
      user: testUser._id,
      date: "2025-07-15",
      startPoint: "Col de Jaman",
      endPoint: "Château-d'Oex",
      distance: 15.2,
      elevationGain: 500,
      elevationLoss: 300,
      routeDescription: "Par le sentier des alpages",
    });
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("POST /hikes", function () {
    it("should create a new hike", async function () {
      const newHike = {
        user: testUser._id.toString(),
        date: "2025-08-20",
        startPoint: "Montreux",
        endPoint: "Rochers-de-Naye",
        distance: 12.5,
        elevationGain: 800,
        elevationLoss: 100,
        routeDescription: "Montée directe",
      };

      const res = await supertest(app)
        .post("/hikes")
        .send(newHike)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id");
      expect(res.body.startPoint).toBe("Montreux");
      expect(res.body.distance).toBe(12.5);
    });

    it("should fail without required user field", async function () {
      const invalidHike = {
        date: "2025-08-20",
        startPoint: "Montreux",
        endPoint: "Rochers-de-Naye",
      };

      await supertest(app).post("/hikes").send(invalidHike).expect(400);
    });
  });

  describe("GET /hikes", function () {
    it("should retrieve the list of all hikes", async function () {
      const res = await supertest(app)
        .get("/hikes")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("user");
      expect(res.body[0]).toHaveProperty("startPoint");
    });
  });

  describe("GET /hikes/:id", function () {
    it("should retrieve a specific hike", async function () {
      const res = await supertest(app)
        .get(`/hikes/${testHike._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body._id).toBe(testHike._id.toString());
      expect(res.body.startPoint).toBe("Col de Jaman");
    });

    it("should return 404 for non-existent hike", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app).get(`/hikes/${fakeId}`).expect(404);
    });

    it("should return 404 for invalid ObjectId", async function () {
      await supertest(app).get("/hikes/invalid-id").expect(404);
    });
  });

  describe("PUT /hikes/:id", function () {
    it("should update an existing hike", async function () {
      const updates = {
        distance: 18.5,
        elevationGain: 600,
        routeDescription: "Par le sentier modifié",
      };

      const res = await supertest(app)
        .put(`/hikes/${testHike._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.distance).toBe(18.5);
      expect(res.body.elevationGain).toBe(600);
      expect(res.body.routeDescription).toBe("Par le sentier modifié");
    });

    it("should return 404 for non-existent hike", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app)
        .put(`/hikes/${fakeId}`)
        .send({ distance: 20 })
        .expect(404);
    });
  });

  describe("DELETE /hikes/:id", function () {
    it("should delete an existing hike", async function () {
      const res = await supertest(app)
        .delete(`/hikes/${testHike._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");

      // Verify it's actually deleted
      const deletedHike = await HikeModel.findById(testHike._id);
      expect(deletedHike).toBeNull();
    });

    it("should return 404 for non-existent hike", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app).delete(`/hikes/${fakeId}`).expect(404);
    });
  });
});
