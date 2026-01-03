import supertest from "supertest";
import app from "../app.js";
import { connectMongo } from "../db/db.js";
import mongoose from "mongoose";
import { cleanDatabase } from "./utils.js";
import UserModel from "../models/User.model.js";
import CampModel from "../models/Camp.model.js";

beforeAll(async () => {
  await connectMongo();

  await UserModel.syncIndexes();
  await CampModel.syncIndexes();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /users", function () {
  //Documents to use as references (parent, children, camps)
  let parentUser;
  let childUser;
  let camp1;
  let camp2;

  beforeEach(async () => {
    await cleanDatabase();

    //Create a user with role PARENT
    parentUser = await UserModel.create({
      role: ["parent"],
      lastname: "Parent",
      firstname: "Jean",
    });

    //Create a user with role ENFANT
    childUser = await UserModel.create({
      role: ["enfant"],
      lastname: "Child",
      firstname: "Alice",
      parent: parentUser._id,
    });

    //Create two camps
    camp1 = await CampModel.create({ title: "Camp de marche 2024" });
    camp2 = await CampModel.create({ title: "Camp de marche 2025" });
  });

  it("should create a user with minimum of data", async function () {
    const res = await supertest(app)
      .post("/users")
      .send({
        lastname: "Doe",
        firstname: "John",
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    expect(res.body.role).toEqual(["enfant"]);
    expect(res.body.lastname).toBe("Doe");
    expect(res.body.firstname).toBe("John");
  });

  it("should create a user with an account (email and password)", async function () {
    const res = await supertest(app)
      .post("/users")
      .send({
        role: ["parent"],
        lastname: "WithAccount",
        firstname: "User",
        email: "user.withAccount@email.com",
        password: "123456",
      })
      .expect(201)
      .expect("Content-Type", /json/);

    expect(res.body).toHaveProperty("_id");
    expect(res.body.role).toEqual(["parent"]);
    expect(res.body.lastname).toBe("WithAccount");
    expect(res.body.firstname).toBe("User");
    expect(res.body.email).toBe("user.withaccount@email.com");
  });

  it("should create a user ACCOMPAGNANT with all fields except parent", async function () {
    const res = await supertest(app)
      .post("/users")
      .send({
        role: ["accompagnant"],
        lastname: "Smith",
        firstname: "Dave",
        email: "dave.smith@email.com",
        password: "123456",
        phoneNumber: "+41 79 123 34 54",
        address: {
          street: "Rue de Test 12",
          city: "Yverdon-les-Bains",
          postalCode: 1400,
          country: "CH",
        },
        children: [childUser._id.toString()],
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
    expect(res.body.lastname).toBe("Smith");
    expect(res.body.firstname).toBe("Dave");
    expect(res.body.email).toBe("dave.smith@email.com");
    expect(res.body.phoneNumber).toBe("+41791233454");
    expect(res.body.address).toMatchObject({
      street: "Rue de Test 12",
      city: "Yverdon-les-Bains",
      postalCode: 1400,
      country: "CH",
    });
    expect(res.body.children).toEqual([childUser._id.toString()]);
    expect(res.body.camps).toEqual([
      camp1._id.toString(),
      camp2._id.toString(),
    ]);
    expect(res.body.participationInfo).toMatchObject({
      birthDate: new Date("2000-01-01").toISOString(),
      tshirtInfo: { size: "m", gender: "m" },
      allergies: ["pollen", "peanuts"],
      medication: ["ibuprofen"],
      insuranceNumber: "CH123456",
      insuranceName: "Assura",
      idExpireDate: new Date("2030-12-31").toISOString(),
      publicTransportPass: "AG",
      isCASMember: true,
      isHelicopterInsured: false,
      hasPhotoConsent: true,
      hasPaid: true,
    });
  });
});

describe("GET /users", function () {
  it("should retrieve all users", async function () {
    const res = await supertest(app)
      .get("/users")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(res.body).toBeInstanceOf(Array);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("_id");
      expect(res.body[0]).toHaveProperty("lastname");
      expect(res.body[0]).toHaveProperty("firstname");
    }
  });
});
