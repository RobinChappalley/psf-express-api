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

// Helper pour extraire le cookie token
function getTokenCookie(res) {
  const cookies = res.headers["set-cookie"];
  if (!cookies) return null;
  const tokenCookie = cookies.find((c) => c.startsWith("token="));
  return tokenCookie || null;
}

describe("POST /signup", function () {
  beforeAll(async () => {
    await cleanDatabase();
  });

  it("should create a new parent account and set token cookie", async function () {
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

    // Token is now in cookie, not in body
    expect(getTokenCookie(res)).toBeTruthy();
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

    // Token is now in cookie
    expect(getTokenCookie(res)).toBeTruthy();
    expect(res.body).toHaveProperty("user");
  });

  it("should set a valid token cookie on successful login", async function () {
    const res = await supertest(app)
      .post("/login")
      .send({
        email: validUser.email,
        password: validUser.password,
      })
      .expect(200)
      .expect("Content-Type", /json/);

    const tokenCookie = getTokenCookie(res);
    if (!tokenCookie) {
      throw new Error("Le cookie 'token' est manquant dans la réponse");
    }
    // Verify cookie has httpOnly flag
    expect(tokenCookie).toContain("HttpOnly");
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

describe("PUT /change-password", function () {
  const testUser = {
    firstname: "Change",
    lastname: "Password",
    email: "changepass@test.com",
    password: "oldpassword123",
    role: ["parent"],
  };

  // Use agent to maintain cookies across requests
  let agent;

  beforeAll(async () => {
    await cleanDatabase();
    await User.create(testUser);

    agent = supertest.agent(app);
    await agent
      .post("/login")
      .send({ email: testUser.email, password: testUser.password });
  });

  it("should change password successfully with valid current password", async function () {
    const res = await agent
      .put("/change-password")
      .send({
        currentPassword: "oldpassword123",
        newPassword: "newpassword456",
      })
      .expect(200);

    expect(res.body.message).toBe("Mot de passe modifié avec succès");

    // Verify new password works
    const loginRes = await supertest(app)
      .post("/login")
      .send({ email: testUser.email, password: "newpassword456" })
      .expect(200);

    expect(getTokenCookie(loginRes)).toBeTruthy();
  });

  it("should fail with incorrect current password", async function () {
    // Re-login with new password from previous test
    const newAgent = supertest.agent(app);
    await newAgent
      .post("/login")
      .send({ email: testUser.email, password: "newpassword456" });

    await newAgent
      .put("/change-password")
      .send({
        currentPassword: "wrongpassword",
        newPassword: "anotherpassword789",
      })
      .expect(401);
  });

  it("should fail without authentication", async function () {
    await supertest(app)
      .put("/change-password")
      .send({
        currentPassword: "newpassword456",
        newPassword: "anotherpassword789",
      })
      .expect(401);
  });

  it("should fail if new password is too short", async function () {
    const newAgent = supertest.agent(app);
    await newAgent
      .post("/login")
      .send({ email: testUser.email, password: "newpassword456" });

    await newAgent
      .put("/change-password")
      .send({
        currentPassword: "newpassword456",
        newPassword: "short",
      })
      .expect(400);
  });

  it("should fail if new password is same as current", async function () {
    const newAgent = supertest.agent(app);
    await newAgent
      .post("/login")
      .send({ email: testUser.email, password: "newpassword456" });

    await newAgent
      .put("/change-password")
      .send({
        currentPassword: "newpassword456",
        newPassword: "newpassword456",
      })
      .expect(400);
  });
});
