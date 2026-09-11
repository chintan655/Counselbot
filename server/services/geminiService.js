// const axios = require("axios");
// require("dotenv").config();

// async function generateDocWithGroq(prompt) {
//   try {
//     const response = await axios.post(
//       "https://api.groq.com/openai/v1/chat/completions",
//       {
//         model: "llama3-70b-8192",
//         messages: [
//           {
//             role: "system",
//             content: "You are a legal document assistant. Respond in clear legal format."
//           },
//           {
//             role: "user",
//             content: prompt
//           }
//         ],
//         temperature: 0.5,
//         max_tokens: 1000
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return response.data.choices[0].message.content.trim();
//   } catch (err) {
//     console.error("Groq Error:", err.response?.data || err.message);
//     return "Failed to generate doc.";
//   }
// }


// // ✏️ append to bottom
// async function fillTemplateWithGroq(templateText, clientInfo) {
//   const prompt = `
//   You are a strict paralegal robot. NEVER change layout or punctuation.
//   Take the TEMPLATE delimited by <<<TEMPLATE>>> <<<END>>>
//   and the CLIENT INFO delimited by <<<INFO>>> <<<ENDINFO>>>.
//   Replace placeholders or obvious variables inside the template
//   with the matching client details. If any detail is missing, reply
//   with "MISSING_FIELD:<field-name>". Output ONLY the final document,
//   no markdown, no commentary.

//   <<<TEMPLATE>>>
//   ${templateText}
//   <<<END>>>

//   <<<INFO>>>
//   ${clientInfo}
//   <<<ENDINFO>>>
//   `;

//   return generateDocWithGroq(prompt);   // you already export this fn
// }

// module.exports = {
//   ...module.exports,
//   fillTemplateWithGroq,           // 👈 export it
// };




// module.exports = { generateDocWithGroq };


// geminiService.js  ✅ swap‑in for your old groqClient.js
const axios = require("axios");
require("dotenv").config();

const MODEL = "gemini-2.5-flash";      

async function generateDocWithGemini(prompt) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const content =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    if (!content) {
      console.error("Gemini responded without text:", res.data);
      return "Failed to generate doc (empty response)";
    }
    return content.trim();
  } catch (err) {
    console.error("Gemini Error:", err.response?.data || err.message);
    return "Failed to generate doc.";
  }
}




/**
 * Fill a template using Gemini, preserving layout exactly.
 */
async function fillTemplateWithGemini(templateText, clientInfo) {
  const prompt = `
  You are a strict paralegal robot. NEVER change layout or punctuation.
  Take the TEMPLATE delimited by <<<TEMPLATE>>> <<<END>>>
  and the CLIENT INFO delimited by <<<INFO>>> <<<ENDINFO>>>.
  Replace placeholders or obvious variables inside the template
  with the matching client details. If any detail is missing, reply
  with "MISSING_FIELD:<field-name>". Output ONLY the final document,
  no markdown, no commentary.

  <<<TEMPLATE>>>
  ${templateText}
  <<<END>>>

  <<<INFO>>>
  ${clientInfo}
  <<<ENDINFO>>>
  `;

  return generateDocWithGemini(prompt);
}

module.exports = {
  generateDocWithGemini,
  fillTemplateWithGemini
};
