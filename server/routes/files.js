const express = require("express");
const router = express.Router();
const multer = require("multer");
// const auth = require("../middleware/auth");
const { authMiddleware } = require("../middleware/auth");
const db = require("../db/connection");
const path = require("path");
const fs = require("fs");

// ✅ Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // const dir = "uploads";
    const dir = path.join(__dirname, "..", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    // if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Upload Route
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  const userId = req.user.id;
  const clientId = req.body.clientId ? parseInt(req.body.clientId) : null;
  // ...
  await db.promise().query(
    "INSERT INTO files (user_id, client_id, original_name, stored_name, file_path) VALUES (?, ?, ?, ?, ?)",
    [userId, clientId, req.file.originalname, req.file.filename, `/uploads/${req.file.filename}`]
  );
  res.json({ success: true });
});

// Personal files
router.get("/my", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const [files] = await db
    .promise()
    .query("SELECT * FROM files WHERE user_id = ? AND client_id IS NULL", [userId]);
  res.json(files);
});

router.get("/byClient/:clientId", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const clientId = parseInt(req.params.clientId);

  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM files WHERE user_id = ? AND client_id = ?",
        [userId, clientId]
      );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching client files:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// ✅ Download File
router.get("/download/:filename", authMiddleware, (req, res) => {
  const filePath = path.join(__dirname, "..", "uploads", req.params.filename);
  res.download(filePath);
});

// ✅ Delete File
router.delete("/:id", authMiddleware, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.query("SELECT * FROM files WHERE id = ? AND user_id = ?", [fileId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    if (results.length === 0) return res.status(404).json({ message: "File not found" });

    const filePath = results[0].file_path;
    fs.unlink(filePath, (fsErr) => {
      if (fsErr) console.warn("File deletion failed:", fsErr.message);
      db.query("DELETE FROM files WHERE id = ?", [fileId], (delErr) => {
        if (delErr) return res.status(500).json({ message: "DB delete error", error: delErr });
        res.json({ success: true, message: "File deleted" });
      });
    });
  });
});

module.exports = router;
