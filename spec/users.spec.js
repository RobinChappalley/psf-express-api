import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";

beforeAll(async () => {
  await connectMongo();
  await cleanDatabase();
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
        password: "123456",
        email: "johndoe@mail.com",
      })
      .expect(201)
      .expect("Content-Type", /json/);
  });
});

describe("GET /users", function () {
  it("should retrieve the list of users", async function () {
    const res = await supertest(app)
      .get("/users")
      .expect(200)
      .expect("Content-Type", /json/);
  });
});
