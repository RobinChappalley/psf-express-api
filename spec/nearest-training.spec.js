import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import UserModel from "../models/User.model.js";

describe("GET /camps/trainings/nearest - Nearest Training API", function () {
  let testUser;
  let campWithTrainings;

  beforeAll(async () => {
    await connectMongo();
    await cleanDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create test user
    const timestamp = Date.now();
    testUser = await UserModel.create({
      firstname: "Jean",
      lastname: "Martin",
      email: `jean.martin.${timestamp}@test.com`,
      password: "password123",
      role: ["accompagnant"],
    });

    // Create camps with trainings at different locations
    // Location 1: Near Lausanne (46.5197, 6.6323)
    // Location 2: Near Geneva (46.2044, 6.1432)
    // Location 3: Near Bern (46.9480, 7.4474)

    campWithTrainings = await CampModel.create({
      title: `Camp Vaud ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      trainings: [
        {
          number: 1,
          date: "2025-06-15",
          meetingPoint: "Gare de Lausanne",
          distance: 15,
          elevationGain: 400,
          responsiblePerson: testUser._id,
          gpsTrack: {
            type: "LineString",
            // Points around Lausanne
            coordinates: [
              [6.63, 46.52], // Point 1: ~0.13 km from Lausanne center
              [6.64, 46.53], // Point 2
              [6.65, 46.54], // Point 3
            ],
          },
        },
        {
          number: 2,
          date: "2025-06-20",
          meetingPoint: "Gare de Genève",
          distance: 20,
          elevationGain: 500,
          responsiblePerson: testUser._id,
          gpsTrack: {
            type: "LineString",
            // Points around Geneva (~38 km from Lausanne)
            coordinates: [
              [6.14, 46.2],
              [6.15, 46.21],
              [6.16, 46.22],
            ],
          },
        },
        {
          number: 3,
          date: "2025-06-25",
          meetingPoint: "Gare de Berne",
          distance: 25,
          elevationGain: 600,
          responsiblePerson: testUser._id,
          gpsTrack: {
            type: "LineString",
            // Points around Bern (~94 km from Lausanne)
            coordinates: [
              [7.44, 46.94],
              [7.45, 46.95],
              [7.46, 46.96],
            ],
          },
        },
      ],
    });

    // Create a camp with a training WITHOUT gpsTrack
    await CampModel.create({
      title: `Camp without GPS ${timestamp}`,
      startDate: "2024-08-01",
      endDate: "2024-08-15",
      trainings: [
        {
          number: 1,
          date: "2024-07-15",
          meetingPoint: "Location inconnue",
          distance: 10,
          responsiblePerson: testUser._id,
          // Pas de gpsTrack
        },
      ],
    });
  });

  describe("Success cases", () => {
    it("should return the nearest training when it exists", async () => {
      // User position: Lausanne center (46.5197, 6.6323)
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323"
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("meetingPoint", "Gare de Lausanne");
      expect(res.body).toHaveProperty("_campId");
      expect(res.body).toHaveProperty("_distanceKm");
      expect(res.body._distanceKm).toBeLessThan(5); // Should be very close
    });

    it("should populate the responsiblePerson", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323"
      );

      expect(res.status).toBe(200);
      expect(res.body.responsiblePerson).toBeDefined();
      expect(res.body.responsiblePerson.firstname).toBe("Jean");
      expect(res.body.responsiblePerson.lastname).toBe("Martin");
    });

    it("should include _campId in the response", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323"
      );

      expect(res.status).toBe(200);
      expect(res.body._campId).toBe(campWithTrainings._id.toString());
    });

    it("should respect custom maxDistance parameter", async () => {
      // User position: Lausanne, maxDistance = 50km
      // Should find Lausanne and Geneva trainings, but return Lausanne (closer)
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323&maxDistance=50"
      );

      expect(res.status).toBe(200);
      expect(res.body.meetingPoint).toBe("Gare de Lausanne");
    });

    it("should use default maxDistance of 50km if not specified", async () => {
      // User position: Lausanne (no maxDistance param)
      // Should find training within default 50km
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323"
      );

      expect(res.status).toBe(200);
      expect(res.body.meetingPoint).toBe("Gare de Lausanne");
    });

    it("should find the closest point of the entire GPS track, not just the first point", async () => {
      // Create a training with a track that starts far but comes close
      const timestamp = Date.now();
      await CampModel.create({
        title: `Camp with distant start ${timestamp}`,
        startDate: "2025-09-01",
        endDate: "2025-09-15",
        trainings: [
          {
            number: 10, // Different number to avoid unique index conflict
            year: 2025,
            date: "2025-08-15",
            meetingPoint: "Point distant mais proche ensuite",
            distance: 30,
            responsiblePerson: testUser._id,
            gpsTrack: {
              type: "LineString",
              coordinates: [
                [7.0, 47.0], // First point: far from Lausanne (~80km)
                [6.632, 46.52], // Second point: very close to Lausanne (~0.13km)
                [7.0, 47.0], // Third point: far again
              ],
            },
          },
        ],
      });

      // User position: Lausanne
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323&maxDistance=100"
      );

      expect(res.status).toBe(200);
      // Should find this training because the 2nd point is very close
      expect(res.body.meetingPoint).toBe("Point distant mais proche ensuite");
      expect(res.body._distanceKm).toBeLessThan(5);
    });

    it("should handle trainings with many GPS points correctly", async () => {
      // User position: Lausanne
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323"
      );

      expect(res.status).toBe(200);
      expect(res.body.gpsTrack.coordinates).toBeInstanceOf(Array);
      expect(res.body.gpsTrack.coordinates.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Error cases - 404", () => {
    it("should return 404 if no training within maxDistance", async () => {
      // User position: Far from all trainings (near Zurich: 47.3769, 8.5417)
      // All trainings are in Vaud region, ~100km+ from Zurich
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=47.3769&longitude=8.5417&maxDistance=50"
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("No training found within");
      expect(res.body.error).toContain("50km");
    });

    it("should return 404 if no trainings have gpsTrack", async () => {
      // Delete all camps with gpsTrack
      await CampModel.deleteMany({
        "trainings.gpsTrack.coordinates": { $exists: true },
      });

      // User position: Lausanne
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323"
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("No training found");
    });
  });

  describe("Error cases - 400 Validation", () => {
    it("should return 400 if latitude is missing", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?longitude=6.6323"
      );

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.some((e) => e.msg.includes("Latitude"))).toBe(
        true
      );
    });

    it("should return 400 if longitude is missing", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197"
      );

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.some((e) => e.msg.includes("Longitude"))).toBe(
        true
      );
    });

    it("should return 400 if latitude is invalid (> 90)", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=91&longitude=6.6323"
      );

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(
        res.body.errors.some((e) => e.msg.includes("between -90 and 90"))
      ).toBe(true);
    });

    it("should return 400 if longitude is invalid (> 180)", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=181"
      );

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(
        res.body.errors.some((e) => e.msg.includes("between -180 and 180"))
      ).toBe(true);
    });

    it("should return 400 if maxDistance is negative", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323&maxDistance=-10"
      );

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(
        res.body.errors.some((e) => e.msg.includes("positive number"))
      ).toBe(true);
    });

    it("should return 400 if maxDistance is too small (< 0.1)", async () => {
      const res = await supertest(app).get(
        "/camps/trainings/nearest?latitude=46.5197&longitude=6.6323&maxDistance=0.05"
      );

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(
        res.body.errors.some((e) => e.msg.includes("positive number"))
      ).toBe(true);
    });
  });
});
