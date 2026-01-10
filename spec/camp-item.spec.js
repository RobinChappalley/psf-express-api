import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase, cleanDatabaseExceptUsers } from "./utils.js";
import CampModel from "../models/Camp.model.js";
import ItemModel from "../models/Item.model.js";
import UserModel from "../models/User.model.js";

// Tokens for authentication
let tokenAdmin;
let tokenParent;

describe("Camp Items API", function () {
  let testCamp;
  let testItem1;
  let testItem2;

  beforeAll(async () => {
    await connectMongo();
    await cleanDatabase();

    // Create admin user
    await UserModel.create({
      role: ["admin"],
      lastname: "Admin",
      firstname: "CampItems",
      email: "admin.campitems@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 57",
    });

    // Create parent user
    await UserModel.create({
      role: ["parent"],
      lastname: "Parent",
      firstname: "CampItems",
      email: "parent.campitems@email.com",
      password: "123456",
      phoneNumber: "+41 79 123 34 58",
    });

    // Login admin
    const resAdmin = await supertest(app)
      .post("/login")
      .send({ email: "admin.campitems@email.com", password: "123456" });
    tokenAdmin = resAdmin.body.token;

    // Login parent
    const resParent = await supertest(app)
      .post("/login")
      .send({ email: "parent.campitems@email.com", password: "123456" });
    tokenParent = resParent.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await cleanDatabaseExceptUsers();

    // Create test items with unique slugs
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
    it("should retrieve all items from a camp as admin", async function () {
      const res = await supertest(app)
        .get(`/camps/${testCamp._id}/items`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("item");
      expect(res.body[0]).toHaveProperty("quantity");
      expect(res.body[0].quantity).toBe(5);
    });

    it("should retrieve all items from a camp as parent", async function () {
      const res = await supertest(app)
        .get(`/camps/${testCamp._id}/items`)
        .set("Authorization", `Bearer ${tokenParent}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .get(`/camps/${testCamp._id}/items`)
        .expect(401);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();
      await supertest(app)
        .get(`/camps/${fakeId}/items`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .expect(404);
    });
  });

  describe("POST /camps/:id/items", function () {
    it("should add a new item to camp as admin", async function () {
      const newItem = {
        item_id: testItem2._id.toString(),
        quantity: 10,
      };

      const res = await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send(newItem)
        .expect(201)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("item");
      expect(res.body.quantity).toBe(10);

      // Verify camp has 2 items now
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.itemsList.length).toBe(2);
    });

    it("should return 401 without authentication", async function () {
      const newItem = {
        item_id: testItem2._id.toString(),
        quantity: 10,
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .send(newItem)
        .expect(401);
    });

    it("should return 403 for non-admin user", async function () {
      const newItem = {
        item_id: testItem2._id.toString(),
        quantity: 10,
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .set("Authorization", `Bearer ${tokenParent}`)
        .send(newItem)
        .expect(403);
    });

    it("should fail without required item_id", async function () {
      const invalidItem = {
        quantity: 10,
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send(invalidItem)
        .expect(400);
    });

    it("should fail without required quantity", async function () {
      const invalidItem = {
        item_id: testItem2._id.toString(),
      };

      await supertest(app)
        .post(`/camps/${testCamp._id}/items`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
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
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send(newItem)
        .expect(404);
    });
  });

  describe("PUT /camps/:id/item/:id2", function () {
    it("should update quantity of existing item in camp as admin", async function () {
      const updates = {
        item_id: testItem1._id.toString(),
        quantity: 15,
      };

      const res = await supertest(app)
        .put(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send(updates)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toBeInstanceOf(Array);
      const updatedItem = res.body.find(
        (element) => element.item._id.toString() === testItem1._id.toString()
      );
      expect(updatedItem.quantity).toBe(15);
    });

    it("should return 401 without authentication", async function () {
      const updates = {
        item_id: testItem1._id.toString(),
        quantity: 15,
      };

      await supertest(app)
        .put(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .send(updates)
        .expect(401);
    });

    it("should return 403 for non-admin user", async function () {
      const updates = {
        item_id: testItem1._id.toString(),
        quantity: 15,
      };

      await supertest(app)
        .put(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .set("Authorization", `Bearer ${tokenParent}`)
        .send(updates)
        .expect(403);
    });

    it("should return 404 for non-existent item in camp", async function () {
      const updates = {
        item_id: testItem2._id.toString(),
        quantity: 20,
      };

      await supertest(app)
        .put(`/camps/${testCamp._id}/item/${testItem2._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
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
        .put(`/camps/${fakeId}/item/${testItem1._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .send(updates)
        .expect(404);
    });
  });

  describe("DELETE /camps/:id/item/:id2", function () {
    it("should remove an item from camp as admin", async function () {
      const res = await supertest(app)
        .delete(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect("Content-Type", /json/);

      expect(res.body).toHaveProperty("message");

      // Verify item was removed
      const updatedCamp = await CampModel.findById(testCamp._id);
      expect(updatedCamp.itemsList.length).toBe(0);
    });

    it("should return 401 without authentication", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .expect(401);
    });

    it("should return 403 for non-admin user", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/item/${testItem1._id}`)
        .set("Authorization", `Bearer ${tokenParent}`)
        .expect(403);
    });

    it("should return 404 for non-existent camp", async function () {
      const fakeId = new mongoose.Types.ObjectId();

      await supertest(app)
        .delete(`/camps/${fakeId}/item/${testItem1._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .expect(404);
    });

    it("should succeed even if item not in camp", async function () {
      await supertest(app)
        .delete(`/camps/${testCamp._id}/item/${testItem2._id}`)
        .set("Authorization", `Bearer ${tokenAdmin}`)
        .expect(200);
    });
  });
});
