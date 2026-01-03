import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import ItemModel from "../models/Item.model.js";

describe("Items API", function () {
  let testItem;

  beforeAll(async () => {
    await connectMongo();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create a test item with unique slug
    const timestamp = Date.now();
    testItem = await ItemModel.create({
      slug: `tente-2-places-${timestamp}`,
      name: `Tente 2 places ${timestamp}`,
      description: "Tente légère pour 2 personnes",
    });
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("should return empty array when no items exist", async function () {
    const res = await supertest(app)
      .get("/items")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toEqual([]);
  });
});

describe("POST /items", function () {
  it("should create a new item", async function () {
    const timestamp = Date.now();
    const newItem = {
      slug: `sac-a-dos-50l-${timestamp}`,
      name: `Sac à dos 50L ${timestamp}`,
      description: "Grand sac à dos pour randonnée",
    };

    const res = await supertest(app)
      .post("/items")
      .send(newItem)
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    expect(res.body.slug).toBe(newItem.slug);
    expect(res.body.name).toBe(newItem.name);
  });

  describe("GET /items", function () {
    it("should retrieve the list of all items", async function () {
      const res = await supertest(app)
        .get("/items")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("slug");
      expect(res.body[0]).toHaveProperty("name");
    });

    it("should fail without required slug field", async function () {
      const invalidItem = {
        name: "Item sans slug",
        description: "Description",
      };

      await supertest(app).post("/items").send(invalidItem).expect(400);
    });

    it("should fail without required name field", async function () {
      const invalidItem = {
        slug: "item-sans-nom",
        description: "Description",
      };

      await supertest(app).post("/items").send(invalidItem).expect(400);
    });

    it("should fail with duplicate slug", async function () {
      const duplicateItem = {
        slug: testItem.slug,
        name: "Autre nom",
        description: "Autre description",
      };

      await supertest(app).post("/items").send(duplicateItem).expect(409); // Conflict - handled by error handler
    });
  });

  describe("PUT /item/:id", function () {
    it("should update an existing item", async function () {
      const updates = {
        name: "Tente 2 places MODIFIÉE",
        description: "Description mise à jour",
      };

      const res = await supertest(app)
        .put(`/item/${testItem._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.name).toBe("Tente 2 places MODIFIÉE");
      expect(res.body.description).toBe("Description mise à jour");
      expect(res.body.slug).toBe(testItem.slug); // Slug unchanged
    });

    it("should update only the slug", async function () {
      const updates = {
        slug: "tente-2p-legere",
      };

      const res = await supertest(app)
        .put(`/item/${testItem._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body.slug).toBe("tente-2p-legere");
      expect(res.body.name).toBe(testItem.name);
    });

    it("should return 404 for non-existent item", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app)
        .put(`/item/${fakeId}`)
        .send({ name: "Updated name" })
        .expect(404);
    });

    //failing test for invalid ObjectId
    it("should return 404 for invalid ObjectId", async function () {
      await supertest(app)
        .put("/item/invalid-id")
        .send({ name: "Updated name" })
        .expect(404);
    });
  });

  describe("DELETE /item/:id", function () {
    it("should delete an existing item", async function () {
      const res = await supertest(app)
        .delete(`/item/${testItem._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");

      // Verify it's actually deleted
      const deletedItem = await ItemModel.findById(testItem._id);
      expect(deletedItem).toBeNull();
    });

    it("should return 404 for non-existent item", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app).delete(`/item/${fakeId}`).expect(404);
    });
    //failing test for invalid ObjectId
    it("should return 404 for invalid ObjectId", async function () {
      await supertest(app).delete("/item/invalid-id").expect(404);
    });
  });
});
