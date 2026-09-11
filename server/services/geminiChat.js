const axios = require("axios");

async function chatWithGemini(messages, temperature = 0.4) {
  const apiKey = process.env.GEMINI_API_KEY;

  const contents = messages
    .filter(m => m.role === "user" || m.role === "assistant") // ignore system
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

  const res = await axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    {
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 1024
      }
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      }
    }
  );

  return res.data.candidates[0].content.parts[0].text;
}

module.exports = { chatWithGemini };
