import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import ItemModel from "../models/Item.model.js";

describe("Camp Items API", function () {
  let testCamp;
  let testItem1;
  let testItem2;

  beforeAll(async () => {
    await connectMongo();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create test items with unique slugs
    const timestamp = Date.now();
    testItem1 = await ItemModel.create({
      slug: `tente-2-places`,
      name: `Tente 2 places`,
      description: "Tente légère pour 2 personnes",
    });

    testItem2 = await ItemModel.create({
      slug: `sac-a-dos-50l`,
      name: `Sac à dos 50L`,
      description: "Grand sac à dos pour randonnée",
    });

    // Create test camp with one item and unique title
    testCamp = await CampModel.create({
      title: `Camp de test 2025`,
      startDate: "2025-07-01",
      endDate: "2025-07-15",
      itemsList: [
        {
          item: testItem1._id,
          quantity: 5,
        },
      ],
    });
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  describe("GET /camps/:id", function () {
    it("should retrieve a camp by ID", async function () {
      const res = await supertest(app)
        .get(`/camps/${testCamp._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("title");
      expect(res.body.title).toBe("Camp de test 2025");
    });
  });

  describe("GET /camps/:id/items", function () {
    it("should retrieve all items from a camp", async function () {
      const res = await supertest(app)
        .get(`/camps/${testCamp._id}/items`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("item");
      expect(res.body[0]).toHaveProperty("quantity");
      expect(res.body[0].quantity).toBe(5);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app).get(`/camps/${fakeId}/items`).expect(404);
    });
  });

  describe("POST /camps/:id/items", function () {
    it("should add a new item to camp", async function () {
      const newItem = {
        item_id: testItem2._id.toString(),
        quantity: 10,
      };

      const res = await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .send(newItem)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("item");
      expect(res.body.quantity).toBe(10);

      // Verify camp has 2 items now
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.itemsList.length).toBe(2);
    });

    it("should fail without required item_id", async function () {
      const invalidItem = {
        quantity: 10,
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .send(invalidItem)
        .expect(400);
    });

    it("should fail without required quantity", async function () {
      const invalidItem = {
        item_id: testItem2._id.toString(),
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .send(invalidItem)
        .expect(400);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const newItem = {
        item_id: testItem2._id.toString(),
        quantity: 10,
      };

      await supertest(app)
        .post(`/camps/${fakeId}/items`)
        .send(newItem)
        .expect(404);
    });
  });

  describe("PUT /camps/:id/item/:id2", function () {
    it("should update quantity of existing item in camp", async function () {
      const updates = {
        item_id: testItem1._id.toString(),
        quantity: 15,
      };

      const res = await supertest(app)
        .put(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      const updatedItem = res.body.find(
        (element) => element.item._id.toString() === testItem1._id.toString()
      );
      expect(updatedItem.quantity).toBe(15);
    });

    it("should return 404 for non-existent item in camp", async function () {
      const updates = {
        item_id: testItem2._id.toString(),
        quantity: 20,
      };

      await supertest(app)
        .put(`/camps/${testCamp._id}/item`)
        .send(updates)
        .expect(404);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const updates = {
        item_id: testItem1._id.toString(),
        quantity: 20,
      };

      await supertest(app)
        .put(`/camps/${fakeId}/item`)
        .send(updates)
        .expect(404);
    });
  });

  describe("DELETE /camps/:id/item/:id2", function () {
    it("should remove an item from camp", async function () {
      const itemToDelete = {
        item_id: testItem1._id.toString(),
      };

      const res = await supertest(app)
        .delete(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");

      // Verify item was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      console.log("Items List after deletion:", updatedCamp.itemsList);
      expect(updatedCamp.itemsList.length).toBe(0);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      const itemToDelete = {
        item_id: testItem1._id.toString(),
      };

      await supertest(app)
        .delete(`/camps/${fakeId}/item/${testItem1._id}`)
        .send(itemToDelete)
        .expect(404);
    });

    it("should succeed even if item not in camp", async function () {
      const itemToDelete = {
        item_id: testItem2._id.toString(),
      };

      await supertest(app)
        .delete(`/camps/${testCamp._id}/item/${testItem2._id}`)
        .send(itemToDelete)
        .expect(200);
    });
  });
});
