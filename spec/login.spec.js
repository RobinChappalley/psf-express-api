import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import User from "../models/User.model.js";

describe("POST /login", function () {
  const validUser = {
    firstname: "John",
    lastname: "Doe",
    email: "john.doe@test.com",
    password: "password123",
    role: ["parent"],
  };

  beforeAll(async () => {
    await connectMongo();
  });
  afterAll(async () => {
    await mongoose.connection.close();
  });
  beforeEach(async () => {
    await User.deleteMany({});
    await User.create(validUser);
  });

  it("should login successfully with valid credentials", async function () {
    const res = await supertest(app)
      .post("/login")
      .send({
        email: validUser.email,
        password: validUser.password,
      })
      .expect(200) // Ou 201 selon votre code
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("token");
  });

  it("should return a JWT token on successful login", async function () {
    const res = await supertest(app)
      .post("/login")
      .send({
        email: validUser.email,
        password: validUser.password,
      })
      .expect(200) // On vérifie d'abord que le statut est OK
      .expect("Content-Type", /json/);

    // --- VÉRIFICATION DU JWT ---
    // 1. Vérifier que la réponse contient bien la propriété du token
    // ATTENTION : Si votre backend renvoie { "accessToken": "..." }, changez "token" par "accessToken"
    if (!res.body.token) {
      throw new Error("La propriété 'token' est manquante dans la réponse");
    }
  });

  it("should fail with incorrect password", async function () {
    await supertest(app)
      .post("/login")
      .send({
        email: validUser.email,
        password: "WRONG_PASSWORD", // Mauvais mot de passe
      })
      .expect(401); // 401 Unauthorized est le standard
  });

  it("should fail if user does not exist", async function () {
    await supertest(app)
      .post("/login")
      .send({
        email: "unknown@test.com",
        password: "password123",
      })
      .expect(401)
      .expect("Content-Type", /json/);
  });
});
