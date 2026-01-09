import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import UserModel from "../models/User.model.js";
import CampModel from "../models/Camp.model.js";

// Tokens for authentication
let tokenAdmin;
let tokenParent;
let adminUser;
let parentUser;

beforeAll(async () => {
  await connectMongo();
  await cleanDatabase();

  await UserModel.syncIndexes();
  await CampModel.syncIndexes();

  // Create admin user
  adminUser = await UserModel.create({
    role: ["admin"],
    lastname: "Admin",
    firstname: "User",
    email: "admin.users@email.com",
    password: "123456",
    phoneNumber: "+41 79 123 34 57",
  });

  // Create parent user
  parentUser = await UserModel.create({
    role: ["parent"],
    lastname: "Parent",
    firstname: "User",
    email: "parent.users@email.com",
    password: "123456",
    phoneNumber: "+41 79 123 34 58",
  });

  // Login admin
  const resAdmin = await supertest(app)
    .post("/login")
    .send({ email: "admin.users@email.com", password: "123456" });
  tokenAdmin = resAdmin.body.token;

  // Login parent
  const resParent = await supertest(app)
    .post("/login")
    .send({ email: "parent.users@email.com", password: "123456" });
  tokenParent = resParent.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /users", function () {
  it("should retrieve all users as admin", async function () {
    const res = await supertest(app)
      .get("/users")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("should retrieve all users as parent", async function () {
    const res = await supertest(app)
      .get("/users")
      .set("Authorization", `Bearer ${tokenParent}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeInstanceOf(Array);
  });

  it("should return 401 without authentication", async function () {
    await supertest(app).get("/users").expect(401);
  });
});

describe("GET /users/:id", function () {
  it("should retrieve a user by id as admin", async () => {
    const res = await supertest(app)
      .get(`/users/${parentUser._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id", parentUser._id.toString());
    expect(res.body.lastname).toBe("Parent");
  });

  it("should retrieve a user by id as parent", async () => {
    const res = await supertest(app)
      .get(`/users/${adminUser._id}`)
      .set("Authorization", `Bearer ${tokenParent}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id", adminUser._id.toString());
  });

  it("should return 401 without authentication", async () => {
    await supertest(app).get(`/users/${parentUser._id}`).expect(401);
  });
});

describe("POST /users", function () {
  let camp1;
  let camp2;

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    // Create two camps for testing
    camp1 = await CampModel.create({ title: "Camp de marche 2024" });
    camp2 = await CampModel.create({ title: "Camp de marche 2025" });
  });

  it("should create a user as admin with any role", async function () {
    const res = await supertest(app)
      .post("/users")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        role: ["accompagnant"],
        lastname: "Smith",
        firstname: "Dave",
        email: "dave.smith@email.com",
        password: "123456",
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    expect(res.body.role).toEqual(["accompagnant"]);
    expect(res.body.lastname).toBe("Smith");
  });

  it("should create a user as parent but force role to parent", async function () {
    const res = await supertest(app)
      .post("/users")
      .set("Authorization", `Bearer ${tokenParent}`)
      .send({
        role: ["admin"], // Try to set admin role
        lastname: "Doe",
        firstname: "Jane",
        email: "jane.doe@email.com",
        password: "123456",
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    // Role should be forced to parent, not admin
    expect(res.body.role).toEqual(["parent"]);
    expect(res.body.lastname).toBe("Doe");
  });

  it("should return 401 without authentication", async function () {
    await supertest(app)
      .post("/users")
      .send({
        lastname: "Test",
        firstname: "User",
      })
      .expect(401);
  });

  it("should create a user with full data as admin", async function () {
    // First create a child user
    const childRes = await supertest(app)
      .post("/users")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        role: ["enfant"],
        lastname: "Child",
        firstname: "Test",
      })
      .expect(201);

    const res = await supertest(app)
      .post("/users")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        role: ["accompagnant"],
        lastname: "Complete",
        firstname: "User",
        email: "complete.user@email.com",
        password: "123456",
        phoneNumber: "+41 79 123 34 54",
        address: {
          street: "Rue de Test 12",
          city: "Yverdon-les-Bains",
          postalCode: 1400,
          country: "CH",
        },
        children: [childRes.body._id],
        camps: [camp1._id.toString(), camp2._id.toString()],
        participationInfo: {
          birthDate: "2000-01-01",
          tshirtInfo: {
            size: "m",
            gender: "m",
          },
          allergies: ["pollen", "peanuts"],
          medication: ["ibuprofen"],
          insuranceNumber: "CH123456",
          insuranceName: "Assura",
          idExpireDate: "2030-12-31",
          publicTransportPass: "AG",
          isCASMember: true,
          isHelicopterInsured: false,
          hasPhotoConsent: true,
          hasPaid: true,
        },
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    expect(res.body.role).toEqual(["accompagnant"]);
    expect(res.body.address).toMatchObject({
      street: "Rue de Test 12",
      city: "Yverdon-les-Bains",
      postalCode: 1400,
      country: "CH",
    });
  });
});

describe("PUT /users/:id", function () {
  let testUser;

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    // Create a test user
    testUser = await UserModel.create({
      role: ["parent"],
      lastname: "ToUpdate",
      firstname: "User",
      email: "toupdate@email.com",
      password: "123456",
    });
  });

  it("should update any user as admin", async () => {
    const res = await supertest(app)
      .put(`/users/${testUser._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        firstname: "Updated",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id", testUser._id.toString());
    expect(res.body.firstname).toBe("Updated");
  });

  it("should allow parent to update their own profile", async () => {
    const res = await supertest(app)
      .put(`/users/${parentUser._id}`)
      .set("Authorization", `Bearer ${tokenParent}`)
      .send({
        firstname: "ParentUpdated",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.firstname).toBe("ParentUpdated");
  });

  it("should return 403 when parent tries to update another user", async () => {
    await supertest(app)
      .put(`/users/${testUser._id}`)
      .set("Authorization", `Bearer ${tokenParent}`)
      .send({
        firstname: "Hacked",
      })
      .expect(403);
  });

  it("should return 401 without authentication", async () => {
    await supertest(app)
      .put(`/users/${testUser._id}`)
      .send({
        firstname: "Test",
      })
      .expect(401);
  });
});

describe("DELETE /users/:id", () => {
  let testUser;

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    // Create a test user to delete
    testUser = await UserModel.create({
      role: ["enfant"],
      lastname: "ToDelete",
      firstname: "User",
    });
  });

  it("should delete a user as admin", async () => {
    const res = await supertest(app)
      .delete(`/users/${testUser._id}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("message", "User successfully deleted");

    // Check if user has really been deleted
    const deletedUser = await UserModel.findById(testUser._id);
    expect(deletedUser).toBeNull();
  });

  it("should return 403 when parent tries to delete a user", async () => {
    await supertest(app)
      .delete(`/users/${testUser._id}`)
      .set("Authorization", `Bearer ${tokenParent}`)
      .expect(403);
  });

  it("should return 401 without authentication", async () => {
    await supertest(app).delete(`/users/${testUser._id}`).expect(401);
  });
});
