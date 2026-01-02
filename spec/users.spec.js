import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";

beforeAll(async () => {
  await connectMongo();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /users", function () {
  it("should create a user", async function () {
    const res = await supertest(app)
      .post("/users")
      .send({
        role: ["parent"],
        lastname: "Doe",
        firstname: "John",
      })
      .expect(201)
      .expect("Content-Type", /json/);
  });
});

describe("GET /users", function () {
  test.todo("should retrieve the list of users");
});
