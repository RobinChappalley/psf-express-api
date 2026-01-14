import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import UserModel from "../models/User.model.js";
import CampModel from "../models/Camp.model.js";

// Agents for authenticated requests (maintain cookies)
let agentAdmin;
let agentParent;
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

  // Login admin with agent (cookies are automatically maintained)
  agentAdmin = supertest.agent(app);
  await agentAdmin
    .post("/login")
    .send({ email: "admin.users@email.com", password: "123456" });

  // Login parent with agent
  agentParent = supertest.agent(app);
  await agentParent
    .post("/login")
    .send({ email: "parent.users@email.com", password: "123456" });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /users", function () {
  it("should retrieve all users as admin", async function () {
    const res = await agentAdmin
      .get("/users")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it("should retrieve all users as parent", async function () {
    const res = await agentParent
      .get("/users")
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
    const res = await agentAdmin
      .get(`/users/${parentUser._id}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id", parentUser._id.toString());
    expect(res.body.lastname).toBe("Parent");
  });

  it("should retrieve a user by id as parent", async () => {
    const res = await agentParent
      .get(`/users/${adminUser._id}`)
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
    const res = await agentAdmin
      .post("/users")
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

  it("should create a child user when parent creates a user", async function () {
    const res = await agentParent
      .post("/users")
      .send({
        role: ["admin"], // Try to set admin role
        lastname: "Doe",
        firstname: "Jane",
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    // Role should be forced to enfant, not admin
    expect(res.body.role).toEqual(["enfant"]);
    // Parent should be set to the creating user
    expect(res.body.parent).toBe(parentUser._id.toString());
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
    const childRes = await agentAdmin
      .post("/users")
      .send({
        role: ["enfant"],
        lastname: "Child",
        firstname: "Test",
      })
      .expect(201);

    const res = await agentAdmin
      .post("/users")
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

  afterEach(async () => {
    // Clean up testUser to avoid duplicate key error
    if (testUser) {
      await UserModel.findByIdAndDelete(testUser._id);
    }
  });

  it("should update any user as admin", async () => {
    const res = await agentAdmin
      .put(`/users/${testUser._id}`)
      .send({
        firstname: "Updated",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id", testUser._id.toString());
    expect(res.body.firstname).toBe("Updated");
  });

  it("should allow parent to update their own profile", async () => {
    const res = await agentParent
      .put(`/users/${parentUser._id}`)
      .send({
        firstname: "ParentUpdated",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.firstname).toBe("ParentUpdated");
  });

  it("should return 403 when parent tries to update another user", async () => {
    await agentParent
      .put(`/users/${testUser._id}`)
      .send({
        firstname: "Hacked",
      })
      .expect(403);
  });

  it("should allow parent to update their own child", async () => {
    // Create a child for the parent
    const childRes = await agentParent
      .post("/users")
      .send({
        lastname: "Child",
        firstname: "MyOwn",
      })
      .expect(201);

    const childId = childRes.body._id;

    // Parent should be able to update their child
    const res = await agentParent
      .put(`/users/${childId}`)
      .send({
        firstname: "UpdatedChild",
      })
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body.firstname).toBe("UpdatedChild");

    // Cleanup
    await UserModel.findByIdAndDelete(childId);
  });

  it("should return 403 when parent tries to update another parent's child", async () => {
    // Create another parent
    const otherParent = await UserModel.create({
      role: ["parent"],
      lastname: "Other",
      firstname: "Parent",
      email: "other.parent@email.com",
      password: "123456",
    });

    // Create a child for the other parent
    const otherChild = await UserModel.create({
      role: ["enfant"],
      lastname: "Other",
      firstname: "Child",
      parent: otherParent._id,
    });

    // Our parent should NOT be able to update the other parent's child
    await agentParent
      .put(`/users/${otherChild._id}`)
      .send({
        firstname: "Hacked",
      })
      .expect(403);

    // Cleanup
    await UserModel.findByIdAndDelete(otherChild._id);
    await UserModel.findByIdAndDelete(otherParent._id);
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

  afterEach(async () => {
    // Clean up testUser if it wasn't deleted by the test
    if (testUser) {
      await UserModel.findByIdAndDelete(testUser._id);
    }
  });

  it("should delete a user as admin", async () => {
    const res = await agentAdmin
      .delete(`/users/${testUser._id}`)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty(
      "message",
      "Utilisateur supprimé avec succès"
    );

    // Check if user has really been deleted
    const deletedUser = await UserModel.findById(testUser._id);
    expect(deletedUser).toBeNull();
  });

  it("should return 403 when parent tries to delete a user", async () => {
    await agentParent.delete(`/users/${testUser._id}`).expect(403);
  });

  it("should return 401 without authentication", async () => {
    await supertest(app).delete(`/users/${testUser._id}`).expect(401);
  });
});
