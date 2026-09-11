const express = require("express");
const router = express.Router();
const { generateDocWithGemini } = require("../services/geminiService");
const db = require('../db/connection');
// const auth = require("../middleware/auth");
const mammoth = require("mammoth");
const { authMiddleware } = require("../middleware/auth");
const mime = require("mime-types");




const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const { generateDocWithGroq } = require("../services/groqService");

// For template doc uploads (optional: we already did a version of this)
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "templates");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: templateStorage });


// ✅ 1. Generate document (public)
router.post("/generate", async (req, res) => {
  const { docType, clientInfo } = req.body;

  const todayDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const cleanClientInfo = clientInfo
    .replace(/from today/gi, `from ${todayDate}`)
    .replace(/\btoday\b/gi, todayDate);

  const prompt = `
  You are a legal document drafting assistant. Output should      be in professional plain text — no markdown (*, **, #, etc.).
  Use clean spacing, uppercase for headers, and legal formatting.

  Generate a ${docType} based on this info:\n${cleanClientInfo}
  Your response should be realistic, with current legal formatting and today's date: ${todayDate}
  `;

  const generatedDoc = await generateDocWithGemini(prompt);
  res.json({ success: true, document: generatedDoc });
});

// ✅ 2. Save document (private)
router.post("/save", authMiddleware, (req, res) => {
  const { client_id, doc_type, content } = req.body;
  const user_id = req.user.id;

  if (!doc_type || !content) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  db.query(
    "INSERT INTO documents (user_id, client_id, doc_type, content) VALUES (?, ?, ?, ?)",
    [user_id, client_id, doc_type, content],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json({ success: true, docId: result.insertId });
    }
  );
});

// ✅ 3. Save-from-chat (private)
router.post("/save-from-chat", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { docType, clientId = null, content } = req.body;

  try {
    await db.promise().query(`
      INSERT INTO documents (user_id, client_id, doc_type, content)
      VALUES (?, ?, ?, ?)
    `, [userId, clientId, docType, content]);

    res.json({ success: true, message: "Saved as document" });
  } catch (err) {
    console.error("Error saving document:", err);
    res.status(500).json({ success: false, message: "Save failed" });
  }
});

// ✅ 4. Fetch documents of logged-in user only (private)
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [docs] = await db.promise().query(`
      SELECT d.*, c.name AS client_name 
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.user_id = ?
      ORDER BY d.created_at DESC
    `, [userId]);

    res.json(docs);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ message: "Error retrieving documents" });
  }
});


// ✅ 5. Generate with template (private)

router.post("/generate-from-template", authMiddleware, async (req, res) => {
  const { templatePath, clientInfo } = req.body;
  if (!templatePath || !clientInfo) {
    return res.status(400).json({ success: false, message: "Missing template or info" });
  }

  try {
    const fullPath = path.join(__dirname, "..", templatePath.replace(/^\/+/, ""));
    const ext = path.extname(fullPath).toLowerCase();

    let templateText;

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: fullPath });
      templateText = result.value;
    } else if (ext === ".txt") {
      templateText = fs.readFileSync(fullPath, "utf-8");
    } else if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(fullPath);
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(dataBuffer);
      templateText = data.text;
    } else {
      return res.status(400).json({ success: false, message: "Unsupported file format" });
    }

    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const prompt = `
You are a legal AI assistant. Do not change wording or formatting.
Use this TEMPLATE below, and insert client information properly.

--- TEMPLATE ---
${templateText}

--- CLIENT INFO ---
${clientInfo}

Today's date is ${today}.
Just generate filled document. No extra words or formatting.
`;

    const filledDoc = await generateDocWithGemini(prompt);
    res.json({ success: true, document: filledDoc });
  } catch (err) {
    console.error("Template gen error:", err);
    res.status(500).json({ success: false, message: "Failed to generate doc" });
  }
});


router.get("/byClient/:id", authMiddleware, (req, res) => {
  const clientId = req.params.id;
  const userId = req.user.id;

  db.query(
    "SELECT * FROM documents WHERE client_id = ? AND user_id = ? ORDER BY created_at DESC",
    [clientId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json(rows);
    }
  );
});


// DELETE /api/documents/:id
router.delete("/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const docId = req.params.id;

  db.query(
    "DELETE FROM documents WHERE id = ? AND user_id = ?",
    [docId, userId],
    (err, result) => {
      if (err) {
        console.error("Delete doc DB error:", err);
        return res.status(500).json({ message: "Server error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json({ message: "Document deleted" });
    }
  );
});



module.exports = router;
