// const express = require("express");
// const router = express.Router();
// const db = require("../db/connection");
// const auth = require("../middleware/auth");
// const { Groq } = require("groq-sdk");

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// // 💬 POST /api/chat
// router.post("/", auth, async (req, res) => {
//   const userId = req.user.id;
//   const { message, history = [], sessionId = null, clientId = null } = req.body;

//   try {
//     let activeSessionId = sessionId;

//     // ✅ 1. If no session, create one
//     if (!sessionId) {
//       const [result] = await db.promise().query(
//         "INSERT INTO chat_sessions (user_id, client_id, title) VALUES (?, ?, ?)",
//         [userId, clientId, message.slice(0, 30)]
//       );
//       activeSessionId = result.insertId;
//     }

//     // 🧠 Prepare chat context
//     const [clients] = await db.promise().query("SELECT * FROM clients WHERE user_id = ?", [userId]);
//     const [notes] = await db.promise().query(
//       "SELECT n.*, c.name AS client_name FROM notes n JOIN clients c ON n.client_id = c.id WHERE c.user_id = ?", [userId]
//     );
//     const [docs] = await db.promise().query(
//       "SELECT d.*, c.name AS client_name FROM documents d JOIN clients c ON d.client_id = c.id WHERE d.user_id = ?", [userId]
//     );

//     let context = " You are a helpful Indian legal assistant AI that remembers the conversation. After each message you should ask user if they want information for specific country and if they want specific Law order nd IPCs. Also tell previous famous case decision to user if user's case is similar or related with that case. \n\n";
//     if (["client", "note", "document"].some(k => message.toLowerCase().includes(k))) {
//       context += `  Clients: ${clients.map(c => `- ${c.name} (${c.email})`).join("\n")}
//           Notes:   ${notes.map(n => `- [${n.client_name}] ${n.note_text}`).join("\n")}
//           Docs:    ${docs.map(d => `- [${d.client_name}] ${d.doc_type}`).join("\n")}
//           `;
//     }

//     const messages = [
//       { role: "system", content: context },
//       ...history.map(m => ({ role: m.from === "user" ? "user" : "assistant", content: m.text })),
//       { role: "user", content: message }
//     ];

//     const chat = await groq.chat.completions.create({ model: "llama3-70b-8192", messages });
//     const response = chat.choices[0].message.content;

//     // 💾 Save both messages in chat_messages
//     await db.promise().query(
//       "INSERT INTO chat_messages (session_id, sender, text) VALUES (?, ?, ?), (?, ?, ?)",
//       [activeSessionId, "user", message, activeSessionId, "bot", response]
//     );

//     res.json({ response, sessionId: activeSessionId });
//   } catch (err) {
//     console.error("Chat Error:", err);
//     res.status(500).json({ message: "Chatbot error", error: err.message });
//   }
// });

// // 🔄 GET /api/chat/sessions
// router.get("/sessions", auth, async (req, res) => {
//   const userId = req.user.id;
//   const [rows] = await db.promise().query(
//     "SELECT s.id, s.title, s.created_at, s.is_pinned , c.name AS client_name     FROM chat_sessions s      LEFT JOIN clients c ON s.client_id = c.id WHERE s.user_id = ? ORDER BY s.is_pinned DESC, s.created_at DESC ", [userId]

//   );
//   res.json(rows);
// });

// // ❌ DELETE a chat session and its messages
// router.delete("/sessions/:id", auth, async (req, res) => {
//   const sessionId = req.params.id;

//   try {
//     // 1. Delete related chat messages first
//     await db.promise().query("DELETE FROM chat_messages WHERE session_id = ?", [sessionId]);

//     // 2. Then delete the session
//     await db.promise().query("DELETE FROM chat_sessions WHERE id = ?", [sessionId]);

//     res.json({ message: "Chat session deleted" });
//   } catch (err) {
//     console.error("Delete Chat Error:", err);
//     res.status(500).json({ message: "Error deleting chat", error: err.message });
//   }
// });


// // 📌 Toggle pin/unpin a chat session
// router.put("/sessions/:id/pin", auth, async (req, res) => {
//   const sessionId = req.params.id;
//   const { is_pinned } = req.body;
//   try {
//     await db.promise().query(
//       "UPDATE chat_sessions SET is_pinned = ? WHERE id = ?",
//       [is_pinned, sessionId]
//     );
//     const [[updated]] = await db.promise().query(
//       "SELECT id, is_pinned FROM chat_sessions WHERE id = ?",
//       [sessionId]
//     );
//     res.json(updated);
//     // res.json({ success: true });
//   } catch (err) {
//     console.error("Pin Toggle Error:", err);
//     res.status(500).json({ message: "Failed to update pin status" });
//   }
// });


// // 📝 PUT /api/chat/sessions/:id/rename
// router.put("/sessions/:id/rename", auth, async (req, res) => {
//   const sessionId = req.params.id;
//   const { newTitle } = req.body;

//   try {
//     await db.promise().query(
//       "UPDATE chat_sessions SET title = ? WHERE id = ?",
//       [newTitle, sessionId]
//     );
//     res.json({ message: "Title updated", title: newTitle });
//   } catch (err) {
//     console.error("Rename Error:", err);
//     res.status(500).json({ message: "Rename failed", error: err.message });
//   }
// });


// // 📨 GET /api/chat/sessions/:id  -> return all messages in that session
// router.get("/sessions/:id", auth, async (req, res) => {
//   const sessionId = req.params.id;
//   const userId = req.user.id;

//   // make sure the session actually belongs to the logged-in user
//   const [[session]] = await db
//     .promise()
//     .query("SELECT id FROM chat_sessions WHERE id=? AND user_id=?", [
//       sessionId,
//       userId,
//     ]);

//   if (!session)
//     return res.status(403).json({ message: "Session not found or forbidden" });

//   // grab messages
//   const [rows] = await db
//     .promise()
//     .query(
//       `SELECT sender AS role, text, created_at 
//        FROM chat_messages 
//        WHERE session_id=? 
//        ORDER BY created_at ASC`,
//       [sessionId]
//     );

//   res.json(rows); // [{role:'user', text:'...', created_at:'...'}, …]
// });



// module.exports = router;



// routes/chat.js  🔄 Gemini-native version
const express = require("express");
const router = express.Router();
const db = require("../db/connection");
// const auth    = require("../middleware/auth");
const { authMiddleware } = require("../middleware/auth");

// 👉 our small helper that calls Gemini’s generateContent endpoint
const { chatWithGemini } = require("../services/geminiChat");

/* ─────────────────────────  POST /api/chat  ───────────────────────── */
router.post("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { message, history = [], sessionId = null, clientId = null, fileText = null } = req.body;

  try {
    /* 1️⃣  Create a new session if needed */
    let activeSessionId = sessionId;
    if (!sessionId) {
      const [result] = await db.promise().query(
        "INSERT INTO chat_sessions (user_id, client_id, title) VALUES (?, ?, ?)",
        [userId, clientId, message.slice(0, 30)]
      );
      activeSessionId = result.insertId;
    }

    /* 2️⃣  Build dynamic context (clients / notes / docs) */
    const userRole = req.user.role;

    let clients = [];
    if (userRole === "admin") {
      // Admin: all clients in their firm
      [clients] = await db.promise().query(
        `SELECT * FROM clients
      WHERE firm_id = (SELECT firm_id FROM users WHERE id = ?)`,
        [userId]
      );
    } else if (userRole === "lawyer") {
      // Lawyer: own + assigned clients
      [clients] = await db.promise().query(
        `SELECT * FROM clients
      WHERE user_id = ?
         OR id IN (
           SELECT client_id FROM client_assignments
            WHERE lawyer_id = ?
         )`,
        [userId, userId]
      );
    } else if (userRole === "client") {
      // Client: only self (assuming clients table stores user_id)
      [clients] = await db.promise().query(
        `SELECT * FROM clients WHERE user_id = ?`,
        [userId]
      );
    }

    // Get client IDs
    const clientIds = clients.map(c => c.id);
    if (clientIds.length === 0) {
      console.log("No clients found for this user");
    }

    // Get notes
    let notes = [];
    if (clientIds.length > 0) {
      [notes] = await db.promise().query(
        `SELECT n.*, c.name AS client_name
       FROM notes n
       JOIN clients c ON n.client_id = c.id
      WHERE n.client_id IN (?)`,
        [clientIds]
      );
    }

    // Get documents
    let docs = [];
    if (clientIds.length > 0) {
      [docs] = await db.promise().query(
        `SELECT d.*, c.name AS client_name
       FROM documents d
       JOIN clients c ON d.client_id = c.id
      WHERE d.client_id IN (?)`,
        [clientIds]
      );
    }


    let context =
      "You are a helpful Indian legal assistant AI that remembers the conversation and Do continue Chat. " +
      "After each answer ask the user if they need information for a specific country, IPC section, or landmark case. " +
      "If their query resembles a known case, mention that precedent.\n\n";

    if (fileText) {
      context += `File Content:\n${fileText}\n\n`;
    }

    if (["client", "note", "document"].some(k => message.toLowerCase().includes(k))) {
      context +=
        `Clients:\n${clients.map(c => `- ${c.name} | ${c.email} | ${c.phone}`).join("\n")}\n` +
        `Notes:\n${notes.map(n => `- [${n.client_name}] ${n.note_text}`).join("\n")}\n` +
        `Docs:\n${docs.map(d => `- [${d.client_name}] ${d.doc_type} | ${d.content}`).join("\n")}\n`;
    }

    const messages = [
      { role: "user", content: context },  // inject context as first user message
      ...history.map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text
      })),
      { role: "user", content: message }  // keep actual input clean
    ];


    /* 4️⃣  Call Gemini */
    const response = await chatWithGemini(messages, 0.3); // temperature = 0.3

    /* 5️⃣  Persist both user & bot messages */
    await db.promise().query(
      `INSERT INTO chat_messages (session_id, sender, text)
       VALUES (?, ?, ?), (?, ?, ?)`,
      [activeSessionId, "user", message, activeSessionId, "bot", response]
    );

    res.json({ response, sessionId: activeSessionId });
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({ message: "Chatbot error", error: err.message });
  }
});


const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const upload = multer({ dest: "uploads/" });

router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const ext = path.extname(file.originalname).toLowerCase();
  let text = "";

  try {
    if (ext === ".pdf") {
      const data = fs.readFileSync(file.path);
      const pdfData = await pdfParse(data);
      text = pdfData.text;
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: file.path });
      text = result.value;
    } else if (ext === ".txt") {
      text = fs.readFileSync(file.path, "utf8");
    } else {
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // Clean up uploaded file after extraction
    fs.unlinkSync(file.path);

    res.json({ text });
  } catch (err) {
    console.error("File processing error:", err);
    res.status(500).json({ message: "Failed to read file" });
  }
});


/* ─────────────────────  GET /api/chat/sessions  ───────────────────── */
router.get("/sessions", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const [rows] = await db.promise().query(
    `SELECT s.id, s.title, s.created_at, s.is_pinned,
            c.name AS client_name
       FROM chat_sessions s
  LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.user_id = ?
   ORDER BY s.is_pinned DESC, s.created_at DESC`,
    [userId]
  );
  res.json(rows);
});

/* ───────────────────  DELETE /api/chat/sessions/:id  ───────────────── */
router.delete("/sessions/:id", authMiddleware, async (req, res) => {
  const sessionId = req.params.id;
  try {
    await db.promise().query(
      "DELETE FROM chat_messages WHERE session_id = ?",
      [sessionId]
    );
    await db.promise().query(
      "DELETE FROM chat_sessions WHERE id = ?",
      [sessionId]
    );
    res.json({ message: "Chat session deleted" });
  } catch (err) {
    console.error("Delete Chat Error:", err);
    res.status(500).json({ message: "Error deleting chat", error: err.message });
  }
});

/* ───────────────  PUT /api/chat/sessions/:id/pin  ─────────────── */
router.put("/sessions/:id/pin", authMiddleware, async (req, res) => {
  const sessionId = req.params.id;
  const { is_pinned } = req.body;
  try {
    await db.promise().query(
      "UPDATE chat_sessions SET is_pinned = ? WHERE id = ?",
      [is_pinned, sessionId]
    );
    const [[updated]] = await db.promise().query(
      "SELECT id, is_pinned FROM chat_sessions WHERE id = ?",
      [sessionId]
    );
    res.json(updated);
  } catch (err) {
    console.error("Pin Toggle Error:", err);
    res.status(500).json({ message: "Failed to update pin status" });
  }
});

/* ─────────────  PUT /api/chat/sessions/:id/rename  ───────────── */
router.put("/sessions/:id/rename", authMiddleware, async (req, res) => {
  const sessionId = req.params.id;
  const { newTitle } = req.body;
  try {
    await db.promise().query(
      "UPDATE chat_sessions SET title = ? WHERE id = ?",
      [newTitle, sessionId]
    );
    res.json({ message: "Title updated", title: newTitle });
  } catch (err) {
    console.error("Rename Error:", err);
    res.status(500).json({ message: "Rename failed", error: err.message });
  }
});

/* ───────  GET /api/chat/sessions/:id  (return messages)  ─────── */
router.get("/sessions/:id", authMiddleware, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;

  const [[session]] = await db.promise().query(
    "SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?",
    [sessionId, userId]
  );
  if (!session)
    return res.status(403).json({ message: "Session not found or forbidden" });

  const [rows] = await db.promise().query(
    `SELECT sender AS role, text, created_at
       FROM chat_messages
      WHERE session_id = ?
   ORDER BY created_at ASC`,
    [sessionId]
  );
  res.json(rows);
});

module.exports = router;
