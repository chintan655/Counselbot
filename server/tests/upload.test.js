const request = require("supertest");
const app = require("../index");
const db = require("../db/connection");
const path = require("path");

let token;

beforeAll(async () => {
  // Register user (ignore if already exists)
  try {
    await request(app).post("/api/auth/register").send({
      name: "Upload Tester",
      email: "uploaduser@example.com",
      password: "uploadpass123",
    });
  } catch (err) {
    // Ignore error if user already exists
  }

  // Login user to get token
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "uploaduser@example.com",
    password: "uploadpass123",
  });

  token = loginRes.body.token;
});

afterAll(async () => {
  // Clean up test user
  await db.promise().query("DELETE FROM users WHERE email = ?", ["uploaduser@example.com"]);
  await db.end();
});

describe("Template Upload Route", () => {
  it("should upload a template file successfully", async () => {
    const filePath = path.join(__dirname, "sample-file.pdf"); // Make sure this test file exists here

    const res = await request(app)
      .post("/api/templates/upload")    // Correct route path
      .set("Authorization", `Bearer ${token}`)
      .attach("template", filePath);    // Field name must match 'template'

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("fileName");
    expect(res.body).toHaveProperty("originalName");
    expect(res.body).toHaveProperty("path");
  });
});
