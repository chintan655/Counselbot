const request = require("supertest");
const app = require("../index"); // or "../app" depending on your project
const db = require("../db/connection");

let token;
let clientId;

describe("Client Routes", () => {
  beforeAll(async () => {
    // Make sure user exists (register first)
    await request(app).post("/api/auth/register").send({
      name: "Client Tester",
      email: "client@example.com",
      password: "pass1234",
    });

    // Then login
    const res = await request(app).post("/api/auth/login").send({
      email: "client@example.com",
      password: "pass1234",
    });

    token = res.body.token;
  });

  it("should add a new client", async () => {
    const res = await request(app)
      .post("/api/clients/add")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("clientId");
    clientId = res.body.clientId;
  });

  it("should get clients for logged-in user", async () => {
    const res = await request(app)
      .get("/api/clients/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should update a client", async () => {
    const res = await request(app)
      .put(`/api/clients/${clientId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "John Updated",
        email: "john@example.com",
        phone: "9876543210",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });

  it("should delete a client", async () => {
    const res = await request(app)
      .delete(`/api/clients/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
  });
});
