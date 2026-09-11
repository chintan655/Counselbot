const request = require("supertest");
const app = require("../index");
const db = require("../db/connection");

describe("Auth Routes", () => {
  const testUser = {
    name: "TestUser",
    email: "testuser@example.com",
    password: "password123",
  };

  afterAll((done) => {
    // Clean up test user
    db.query("DELETE FROM users WHERE email = ?", [testUser.email], () => {
      db.end();
      done();
    });
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("success");
    expect(res.body.success).toBe(true || res.body.token); // token on success (if implemented)
  });

  it("should not register duplicate user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Email already registered");
  });

  it("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("should not login with invalid password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "wrongpassword",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid password");
  });

  it("should not login with unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.com",
        password: "password123",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid email");
  });
});
