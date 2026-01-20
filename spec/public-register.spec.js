import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import CampModel from "../models/Camp.model.js";

describe("Public Registration API", function () {
  let campWithGM;
  let campWithIE;
  let campWithBoth;

  beforeAll(async () => {
    await connectMongo();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabase();

    const timestamp = Date.now();

    // Camp with General Meeting
    campWithGM = await CampModel.create({
      title: `Camp GM Public ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      generalMeeting: {
        dateTime: new Date(timestamp + 1000),
        location: "Salle communale",
        participants: [],
      },
    });

    // Camp with Info Evening
    campWithIE = await CampModel.create({
      title: `Camp IE Public ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      infoEvening: {
        dateTime: new Date(timestamp + 2000),
        location: "Aula du collège",
        participants: [],
      },
    });

    // Camp with both events
    campWithBoth = await CampModel.create({
      title: `Camp Both Public ${timestamp}`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      generalMeeting: {
        dateTime: new Date(timestamp + 3000),
        location: "Salle communale",
        participants: [
          { email: "existing@example.com", nbOfParticipants: 2 },
        ],
      },
      infoEvening: {
        dateTime: new Date(timestamp + 4000),
        location: "Aula du collège",
        participants: [
          { email: "existing@example.com", nbOfParticipants: 3 },
        ],
      },
    });
  });

  // ==================== GENERAL MEETING PUBLIC REGISTER ====================
  describe("POST /camps/:campId/ag/register", function () {
    it("should register a participant without authentication", async function () {
      const registration = {
        email: "newparent@example.com",
        nbOfParticipants: 3,
      };

      const res = await supertest(app)
        .post(`/camps/${campWithGM._id}/ag/register`)
        .send(registration)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");
      expect(res.body.email).toBe("newparent@example.com");
      expect(res.body.nbOfParticipants).toBe(3);

      // Verify in database
      const updatedCamp = await CampModel.findById(campWithGM._id);
      expect(updatedCamp.generalMeeting.participants.length).toBe(1);
      expect(updatedCamp.generalMeeting.participants[0].email).toBe("newparent@example.com");
    });

    it("should allow duplicate registrations with same email", async function () {
      const registration = {
        email: "existing@example.com",
        nbOfParticipants: 5,
      };

      await supertest(app)
        .post(`/camps/${campWithBoth._id}/ag/register`)
        .send(registration)
        .expect(201);

      // Verify duplicates exist
      const updatedCamp = await CampModel.findById(campWithBoth._id);
      const sameEmailEntries = updatedCamp.generalMeeting.participants.filter(
        (p) => p.email === "existing@example.com"
      );
      expect(sameEmailEntries.length).toBe(2);
    });

    it("should return 400 if email is missing", async function () {
      const registration = {
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${campWithGM._id}/ag/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if email is invalid", async function () {
      const registration = {
        email: "not-an-email",
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${campWithGM._id}/ag/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if nbOfParticipants is missing", async function () {
      const registration = {
        email: "test@example.com",
      };

      await supertest(app)
        .post(`/camps/${campWithGM._id}/ag/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if nbOfParticipants is negative", async function () {
      const registration = {
        email: "test@example.com",
        nbOfParticipants: -1,
      };

      await supertest(app)
        .post(`/camps/${campWithGM._id}/ag/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if nbOfParticipants is zero", async function () {
      const registration = {
        email: "test@example.com",
        nbOfParticipants: 0,
      };

      await supertest(app)
        .post(`/camps/${campWithGM._id}/ag/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const registration = {
        email: "test@example.com",
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${fakeId}/ag/register`)
        .send(registration)
        .expect(404);
    });

    it("should return 404 if camp has no general meeting", async function () {
      const registration = {
        email: "test@example.com",
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${campWithIE._id}/ag/register`)
        .send(registration)
        .expect(404);
    });

    it("should normalize email to lowercase", async function () {
      const registration = {
        email: "TEST@EXAMPLE.COM",
        nbOfParticipants: 2,
      };

      const res = await supertest(app)
        .post(`/camps/${campWithGM._id}/ag/register`)
        .send(registration)
        .expect(201);

      expect(res.body.email).toBe("test@example.com");
    });
  });

  // ==================== INFO EVENING PUBLIC REGISTER ====================
  describe("POST /camps/:campId/info-evening/register", function () {
    it("should register a participant without authentication", async function () {
      const registration = {
        email: "interested@example.com",
        nbOfParticipants: 4,
      };

      const res = await supertest(app)
        .post(`/camps/${campWithIE._id}/info-evening/register`)
        .send(registration)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");
      expect(res.body.email).toBe("interested@example.com");
      expect(res.body.nbOfParticipants).toBe(4);

      // Verify in database
      const updatedCamp = await CampModel.findById(campWithIE._id);
      expect(updatedCamp.infoEvening.participants.length).toBe(1);
    });

    it("should allow duplicate registrations with same email", async function () {
      const registration = {
        email: "existing@example.com",
        nbOfParticipants: 10,
      };

      await supertest(app)
        .post(`/camps/${campWithBoth._id}/info-evening/register`)
        .send(registration)
        .expect(201);

      // Verify duplicates exist
      const updatedCamp = await CampModel.findById(campWithBoth._id);
      const sameEmailEntries = updatedCamp.infoEvening.participants.filter(
        (p) => p.email === "existing@example.com"
      );
      expect(sameEmailEntries.length).toBe(2);
    });

    it("should return 400 if email is missing", async function () {
      const registration = {
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${campWithIE._id}/info-evening/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if email is invalid", async function () {
      const registration = {
        email: "invalid-email",
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${campWithIE._id}/info-evening/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if nbOfParticipants is missing", async function () {
      const registration = {
        email: "test@example.com",
      };

      await supertest(app)
        .post(`/camps/${campWithIE._id}/info-evening/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if nbOfParticipants is negative", async function () {
      const registration = {
        email: "test@example.com",
        nbOfParticipants: -5,
      };

      await supertest(app)
        .post(`/camps/${campWithIE._id}/info-evening/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 400 if nbOfParticipants is zero", async function () {
      const registration = {
        email: "test@example.com",
        nbOfParticipants: 0,
      };

      await supertest(app)
        .post(`/camps/${campWithIE._id}/info-evening/register`)
        .send(registration)
        .expect(400);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const registration = {
        email: "test@example.com",
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${fakeId}/info-evening/register`)
        .send(registration)
        .expect(404);
    });

    it("should return 404 if camp has no info evening", async function () {
      const registration = {
        email: "test@example.com",
        nbOfParticipants: 2,
      };

      await supertest(app)
        .post(`/camps/${campWithGM._id}/info-evening/register`)
        .send(registration)
        .expect(404);
    });

    it("should normalize email to lowercase", async function () {
      const registration = {
        email: "UPPERCASE@EXAMPLE.COM",
        nbOfParticipants: 1,
      };

      const res = await supertest(app)
        .post(`/camps/${campWithIE._id}/info-evening/register`)
        .send(registration)
        .expect(201);

      expect(res.body.email).toBe("uppercase@example.com");
    });
  });
});
