const request = require("supertest");
const express = require("express");
const notesRoutes = require("../routes/notes");
const db = require("../db/connection");
const auth = require("../middleware/auth");

jest.mock("../db/connection"); // ✅ mock database
jest.mock("../middleware/auth"); // ✅ bypass auth for now

auth.mockImplementation((req, res, next) => next()); // allow requests

const app = express();
app.use(express.json());
app.use("/api/notes", notesRoutes);

describe("🧪 Notes API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Test POST /add
  it("should add a note for a client", async () => {
    const fakeResult = { insertId: 101 };
    db.query.mockImplementation((query, values, callback) => {
      callback(null, fakeResult);
    });

    const res = await request(app)
      .post("/api/notes/add")
      .send({ client_id: 1, note_text: "Test Note" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, noteId: 101 });
  });

  // ✅ Test GET /byClient/:id
  it("should return notes for a client", async () => {
    const fakeNotes = [
      { id: 1, client_id: 1, note_text: "Sample Note", created_at: "2024-01-01" },
    ];

    db.query.mockImplementation((query, values, callback) => {
      callback(null, fakeNotes);
    });

    const res = await request(app).get("/api/notes/byClient/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(fakeNotes);
  });

  // ✅ Test PUT /edit/:id
  it("should update a note", async () => {
    db.query.mockImplementation((query, values, callback) => {
      callback(null, { affectedRows: 1 });
    });

    const res = await request(app)
      .put("/api/notes/edit/1")
      .send({ note_text: "Updated Note" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  // ✅ Test DELETE /delete/:id
  it("should delete a note", async () => {
    db.query.mockImplementation((query, values, callback) => {
      callback(null, { affectedRows: 1 });
    });

    const res = await request(app).delete("/api/notes/delete/1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  // ❌ Test DB error handling
  it("should handle DB error on /add", async () => {
    db.query.mockImplementation((query, values, callback) => {
      callback(new Error("Simulated DB error"), null);
    });

    const res = await request(app)
      .post("/api/notes/add")
      .send({ client_id: 1, note_text: "Fail note" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "DB error");
  });
});
