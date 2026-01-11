import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import User from "../models/User.model.js";

beforeAll(async () => {
  await connectMongo();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /signup", function () {
  beforeAll(async () => {
    await cleanDatabase();
  });

  it("should create a new parent account and return a token", async function () {
    const res = await supertest(app)
      .post("/signup")
      .send({
        email: "newparent@test.com",
        password: "password123",
        firstname: "New",
        lastname: "Parent",
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.role).toEqual(["parent"]);
    expect(res.body.user.email).toBe("newparent@test.com");
  });

  it("should fail if email is already used", async function () {
    // First signup
    await supertest(app).post("/signup").send({
      email: "duplicate@test.com",
      password: "password123",
      firstname: "First",
      lastname: "User",
    });

    // Second signup with same email
    await supertest(app)
      .post("/signup")
      .send({
        email: "duplicate@test.com",
        password: "password123",
        firstname: "Second",
        lastname: "User",
      })
      .expect(400);
  });

  it("should fail if required fields are missing", async function () {
    await supertest(app)
      .post("/signup")
      .send({
        email: "incomplete@test.com",
      })
      .expect(400);
  });

  it("should fail if password is too short", async function () {
    await supertest(app)
      .post("/signup")
      .send({
        email: "shortpass@test.com",
        password: "123",
        firstname: "Short",
        lastname: "Pass",
      })
      .expect(400);
  });
});

describe("POST /login", function () {
  const validUser = {
    firstname: "John",
    lastname: "Doe",
    email: "john.doe@test.com",
    password: "password123",
    role: ["parent"],
  };

  beforeAll(async () => {
    await cleanDatabase();
    await User.create(validUser);
  });

  it("should login successfully with valid credentials", async function () {
    const res = await supertest(app)
      .post("/login")
      .send({
        email: validUser.email,
        password: validUser.password,
      })
      .expect(200)
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
      .expect(200)
      .expect("Content-Type", /json/);

    if (!res.body.token) {
      throw new Error("La propriété 'token' est manquante dans la réponse");
    }
  });

  it("should fail with incorrect password", async function () {
    await supertest(app)
      .post("/login")
      .send({
        email: validUser.email,
        password: "WRONG_PASSWORD",
      })
      .expect(401);
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
