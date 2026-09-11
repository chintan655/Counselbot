const request = require("supertest");
const app = require("../index");
const db = require("../db/connection");

let token;

beforeAll(async () => {
  // Register the user first
  await request(app).post("/api/auth/register").send({
    name: "Chat Tester",
    email: "chat@example.com",
    password: "pass1234",
  });

  // Login to get the token (use the same password as above)
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email: "chat@example.com",
      password: "pass1234",  // <-- fixed to match registration
    });

  token = loginRes.body.token; // save JWT
});

afterAll(async () => {
  await db.promise().query("DELETE FROM users WHERE email = 'chat@example.com'");
  await db.promise().query("DELETE FROM chat_sessions");
  await db.promise().query("DELETE FROM chat_messages");
  await db.end();
   // await the promise here
});

describe("Chat Routes", () => {
  it("should create a new chat session and respond", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ message: "Generate a legal notice", history: [] });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("response");
    expect(res.body).toHaveProperty("sessionId");
  });

  it("should fetch chat sessions", async () => {
    const res = await request(app)
      .get("/api/chat/sessions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
