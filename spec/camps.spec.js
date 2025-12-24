import supertest from "supertest";
import app from "../app.js";

describe("POST /users", function () {
  it("should create a user", async function () {});
});

describe("GET /camps", function () {
  test.todo("should retrieve the list of camps");
});

const res = await supertest(app)
  .post("/users")
  .send({
    name: "John Doe",
    password: "1234",
  })
  .expect(200)
  .expect("Content-Type", /json/);
