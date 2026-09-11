const express = require("express");
const router = express.Router();
const db = require("../db/connection");
// const auth = require("../middleware/auth");
const { authMiddleware } = require("../middleware/auth");
// ✅ Add note for a client
router.post("/add", authMiddleware, (req, res) => {
  const { client_id, note_text } = req.body;

  db.query(
    "INSERT INTO notes (client_id, note_text) VALUES (?, ?)",
    [client_id, note_text],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json({ success: true, noteId: result.insertId });
    }
  );
});

// ✅ Get all notes for a client
router.get("/byClient/:id", authMiddleware, (req, res) => {
  const clientId = req.params.id;

  db.query(
    "SELECT * FROM notes WHERE client_id = ? ORDER BY created_at DESC",
    [clientId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json(results);
    }
  );
});



// ✅ Edit a note
router.put("/edit/:id", authMiddleware, (req, res) => {
  const noteId = req.params.id;
  const { note_text } = req.body;

  db.query(
    "UPDATE notes SET note_text = ? WHERE id = ?",
    [note_text, noteId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error", error: err });
      res.json({ success: true });
    }
  );
});

// ✅ Delete a note
router.delete("/delete/:id", authMiddleware, (req, res) => {
  const noteId = req.params.id;

  db.query("DELETE FROM notes WHERE id = ?", [noteId], (err, result) => {
    if (err) return res.status(500).json({ message: "DB error", error: err });
    res.json({ success: true });
  });
});



module.exports = router;
