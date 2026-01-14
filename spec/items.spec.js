import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import ItemModel from "../models/Item.model.js";
import UserModel from "../models/User.model.js";

// Agents for authenticated requests (maintain cookies)
let agentAdmin;
let agentParent;

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
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /items", function () {
  let testItem = {
    slug: `sac-a-dos-50l`,
    name: `Sac à dos 50L`,
    description: "Grand sac à dos pour randonnée",
  };

  let testItem2 = {
    slug: `tente-4-places`,
    name: `Tente 4 places`,
    description: "Tente spacieuse pour 4 personnes",
  };

  it("should create a new item", async function () {
    const newItem = testItem;

    const res = await agentAdmin
      .post("/items")
      .send(newItem)
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    expect(res.body.slug).toBe(newItem.slug);
    expect(res.body.name).toBe(newItem.name);
  });

  it("should create a second new item", async function () {
    const newItem = testItem2;

    const res = await agentAdmin
      .post("/items")
      .send(newItem)
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    expect(res.body.slug).toBe(newItem.slug);
    expect(res.body.name).toBe(newItem.name);
  });

  it("should fail without required slug field", async function () {
    const invalidItem = {
      name: "Item sans slug",
      description: "Description",
    };

    await agentAdmin.post("/items").send(invalidItem).expect(400);
  });

  it("should fail without required name field", async function () {
    const invalidItem = {
      slug: "item-sans-nom",
      description: "Description",
    };

    await agentAdmin.post("/items").send(invalidItem).expect(400);
  });

  it("should fail with duplicate slug", async function () {
    const duplicateItem = {
      slug: testItem.slug,
      name: "Autre nom",
      description: "Autre description",
    };

    await agentAdmin
      .post("/items")
      .send(duplicateItem)
      .expect(409); // Conflict - handled by error handler
  });

  describe("GET /items", function () {
    it("should retrieve the list of all items", async function () {
      const res = await agentAdmin
        .get("/items")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty("slug");
      expect(res.body[0]).toHaveProperty("name");
    });
  });

  describe("GET /item/:id", function () {
    let getTestItem;

    beforeEach(async () => {
      await cleanDatabaseExceptUsers();

      getTestItem = await ItemModel.create({
        slug: `sac-a-dos-70l`,
        name: `Sac à dos 70L`,
        description: "Très grand sac à dos pour longue randonnée",
      });
    });

    it("should retrieve a specific item by ID", async function () {
      const res = await agentAdmin
        .get(`/items/${getTestItem._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("_id", getTestItem._id.toString());
      expect(res.body.slug).toBe(getTestItem.slug);
      expect(res.body.name).toBe(getTestItem.name);
    });
  });

  describe("PUT /item/:id", function () {
    let putTestItem;
    beforeEach(async () => {
      await cleanDatabaseExceptUsers();

      putTestItem = await ItemModel.create({
        slug: `tente-2-places`,
        name: `Tente 2 places`,
        description: "Tente légère pour 2 personnes",
      });
    });

    it("should update an existing item", async function () {
      const updates = {
        name: "Tente 2 places MODIFIÉE",
        description: "Description mise à jour",
      };
      const res = await agentAdmin
        .put(`/items/${putTestItem._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.name).toBe("Tente 2 places MODIFIÉE");
      expect(res.body.description).toBe("Description mise à jour");
      expect(res.body.slug).toBe(putTestItem.slug); // Slug unchanged
    });

    it("should update only the slug", async function () {
      const updates = {
        slug: "tente-2p-legere",
      };
      const res = await agentAdmin
        .put(`/items/${putTestItem._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.slug).toBe("tente-2p-legere");
      expect(res.body.name).toBe(putTestItem.name);
    });

    it("should return 404 for non-existent item", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin
        .put(`/items/${fakeId}`)
        .send({ name: "Updated name" })
        .expect(404);
    });
  });

  describe("DELETE /item/:id", function () {
    let deleteTestItem;
    beforeEach(async () => {
      await cleanDatabaseExceptUsers();

      deleteTestItem = await ItemModel.create({
        slug: `tente-2-places`,
        name: `Tente 2 places`,
        description: "Tente légère pour 2 personnes",
      });
    });
    it("should delete an existing item", async function () {
      const res = await agentAdmin
        .delete(`/items/${deleteTestItem._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");

      // Verify it's actually deleted
      const deletedItem = await ItemModel.findById(deleteTestItem._id);
      expect(deletedItem).toBeNull();
    });

    it("should return 404 for non-existent item", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await agentAdmin.delete(`/items/${fakeId}`).expect(404);
    });
  });
});
