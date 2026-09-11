const request = require("supertest");
const express = require("express");
const generateRoute = require("../routes/generate");
const geminiService = require("../services/geminiService");

jest.mock("../services/geminiService"); // mock Gemini service

const app = express();
app.use(express.json());
app.use("/api/generate", generateRoute);

describe("🧪 POST /api/generate", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return generated text from Gemini", async () => {
    const fakeText = "This is a generated legal document.";
    geminiService.generateDocWithGemini.mockResolvedValue(fakeText);

    const res = await request(app)
      .post("/api/generate")
      .send({ content: "Sample input content" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ text: fakeText });
    expect(geminiService.generateDocWithGemini).toHaveBeenCalledWith("Sample input content");
  });

  it("should handle errors from Gemini service", async () => {
    geminiService.generateDocWithGemini.mockRejectedValue(new Error("Gemini crash"));

    const res = await request(app)
      .post("/api/generate")
      .send({ content: "Test error input" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "Gemini failed");
    expect(res.body).toHaveProperty("error");
  });
});
