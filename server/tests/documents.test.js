const request = require("supertest");
const app = require("../index");
const db = require("../db/connection");

let token;
let clientId;
let documentId;

beforeAll(async () => {
  // Register a new user (ignore error if user already exists)
  try {
    await request(app).post("/api/auth/register").send({
      name: "Doc Tester",
      email: "docuser@example.com",
      password: "docpass123",
    });
  } catch (err) {
    // User might already exist, ignore
  }

  // Login to get token
  const res = await request(app).post("/api/auth/login").send({
    email: "docuser@example.com",
    password: "docpass123",
  });
  token = res.body.token;

  // Create a client for document association
  const clientRes = await request(app)
    .post("/api/clients")  // Adjust if your route differs
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Client Doc",
      email: "clientdoc@example.com",
      phone: "1234567890",
    });

  clientId = clientRes.body.clientId;
});

afterAll(async () => {
  await db.promise().query("DELETE FROM documents WHERE doc_type = 'Test Doc'");
  await db.promise().query("DELETE FROM clients WHERE email = 'clientdoc@example.com'");
  await db.promise().query("DELETE FROM users WHERE email = 'docuser@example.com'");
  await db.end();
});

describe("Document Routes", () => {
  it("should generate a document using Gemini", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        docType: "Test Legal Agreement",
        clientInfo: "John Doe from today, residing in Mumbai.",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("document");
  }, 20000); // 20 seconds timeout for generation

  it("should save a generated document", async () => {
    const res = await request(app)
      .post("/api/documents/save")
      .set("Authorization", `Bearer ${token}`)
      .send({
        client_id: clientId,
        doc_type: "Test Doc",
        content: "This is a test document content.",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("docId");

    documentId = res.body.docId; // Save for delete test
  });

  it("should fetch all documents for user", async () => {
    const res = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should fetch documents by client ID", async () => {
    const res = await request(app)
      .get(`/api/documents/byClient/${clientId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should delete a document", async () => {
    const res = await request(app)
      .delete(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Document deleted");
  });
});
