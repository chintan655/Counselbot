
// const express = require("express");
// const router = express.Router();
// const { generateDocWithGroq } = require("../services/geminiClient");

// router.post("/", async (req, res) => {
//   const { content } = req.body;
//   try {
//     const result = await generateDocWithGroq(content);
//     res.json({ text: result });
//   } catch (err) {
//     console.log("GROQ error", err);
//     res.status(500).json({ message: "GROQ failed", error: err });
//   }
// });

// module.exports = router;


// routes/generate.js  (Gemini version)
const express = require("express");
const router = express.Router();

// ⬇️ swap to your new service module
const { generateDocWithGemini } = require("../services/geminiService");

router.post("/", async (req, res) => {
  const { content } = req.body;

  try {
    // call Gemini instead of Groq
    const result = await generateDocWithGemini(content);
    res.json({ text: result });
  } catch (err) {
    console.log("Gemini error", err);
    res.status(500).json({ message: "Gemini failed", error: err });
  }
});

module.exports = router;
