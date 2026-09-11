const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { authMiddleware, requireRole } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/chat_files"));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ─────────────────────────────────────────────
// helper: ensure lawyer can access that client
function lawyerOwnsClient(lawyerId, clientId) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT 1 FROM client_assignments WHERE lawyer_id = ? AND client_id = ?",
      [lawyerId, clientId],
      (err, rows) => (err ? reject(err) : resolve(rows.length > 0))
    );
  });
}

// ─────────────────────────────────────────────
// 1. Lawyer sends message to a client (unregistered or registered)
router.post(
  "/lawyer/send",
  authMiddleware,
  requireRole("lawyer"),
  async (req, res) => {
    const { client_id, text } = req.body;
    const lawyerId = req.user.id;

    if (!text?.trim()) return res.status(400).json({ error: "Empty message" });
    /* check assignment */
    if (!(await lawyerOwnsClient(lawyerId, client_id)))
      return res.status(403).json({ error: "Client not assigned to you" });

    /* upsert conversation */
    db.query(
      `INSERT INTO lc_conversations (lawyer_id, client_id, last_message)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE last_message = VALUES(last_message), updated_at = NOW()`,
      [lawyerId, client_id, text],
      (err, convoResult) => {
        if (err) return res.status(500).json({ error: "DB error", err });

        const conversationId =
          convoResult.insertId || convoResult.insertId === 0
            ? convoResult.insertId
            : undefined;

        // fetch existing convo id if duplicate insert
        const getId = conversationId
          ? Promise.resolve(conversationId)
          : new Promise((resolve, reject) => {
            db.query(
              "SELECT id FROM lc_conversations WHERE lawyer_id = ? AND client_id = ?",
              [lawyerId, client_id],
              (e, r) => (e ? reject(e) : resolve(r[0].id))
            );
          });

        getId.then((cid) => {
          db.query(
            "INSERT INTO lc_messages (conversation_id, sender_type, sender_user_id, text) VALUES (?,?,?,?)",
            [cid, "lawyer", lawyerId, text],
            (err2) => {
              if (err2)
                return res.status(500).json({ error: "DB error", err2 });
              res.json({ success: true, conversation_id: cid });
            }
          );
        });
      }
    );
  }
);

// ─────────────────────────────────────────────
// 2. Client (registered) sends message to their lawyer
router.post("/client/send", authMiddleware, requireRole("client"), (req, res) => {
  const { lawyer_id, text } = req.body;
  const clientUserId = req.user.id;

  if (!text?.trim()) return res.status(400).json({ error: "Empty message" });

// 🔍 STEP 1: Get client's internal ID
  db.query(
    "SELECT id FROM clients WHERE user_id = ?",
    [clientUserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error", err });
      if (!rows.length) return res.status(404).json({ error: "Client not found" });

      const clientId = rows[0].id;


      // ✅ STEP 2: Check if this lawyer is assigned to the client
      db.query(
        "SELECT 1 FROM client_assignments WHERE client_id = ? AND lawyer_id = ?",
        [clientId, lawyer_id],
        (err2, assignedRows) => {
          if (err2) return res.status(500).json({ error: "DB error", err2 });
          if (!assignedRows.length) {
            return res.status(403).json({ error: "Lawyer not assigned to you" });
          }

          // ✅ STEP 3: Insert conversation
          db.query(
            `INSERT INTO lc_conversations (lawyer_id, client_id, last_message)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE last_message = VALUES(last_message), updated_at = NOW()`,
            [lawyer_id, clientId, text],
            (err3, convoRes) => {
              if (err3) return res.status(500).json({ error: "DB error", err3 });

              const cid = convoRes.insertId
                ? convoRes.insertId
                : null;

              const getId = cid
                ? Promise.resolve(cid)
                : new Promise((resolve, reject) => {
                    db.query(
                      "SELECT id FROM lc_conversations WHERE lawyer_id = ? AND client_id = ?",
                      [lawyer_id, clientId],
                      (e, r) => (e ? reject(e) : resolve(r[0].id))
                    );
                  });

              getId.then((convId) => {
                db.query(
                  "INSERT INTO lc_messages (conversation_id, sender_type, sender_user_id, text) VALUES (?,?,?,?)",
                  [convId, "client", clientUserId, text],
                  (err4) => {
                    if (err4) return res.status(500).json({ error: "DB error", err4 });
                    res.json({ success: true, conversation_id: convId });
                  }
                );
              });
            }
          );
        }
      );
    }
  );
});
    // ─────────────────────────────────────────────
    // 3. Get all conversations (lawyer OR client)
    router.get("/conversations", authMiddleware, (req, res) => {
      const { id: uid, role } = req.user;

      let sql, params;
      if (role === "lawyer") {
        sql =
          "SELECT * FROM lc_conversations WHERE lawyer_id = ? ORDER BY updated_at DESC";
        params = [uid];
      } else if (role === "client") {
        sql = `
      SELECT lc.*
      FROM lc_conversations lc
      JOIN clients c ON c.id = lc.client_id
      WHERE c.user_id = ?
      ORDER BY lc.updated_at DESC
    `;
        params = [uid];
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }

      db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "DB error", err });
        res.json(rows);
      });
    });

    // ─────────────────────────────────────────────
    // 4. Get messages for a conversation
    router.get("/messages/:conversationId", authMiddleware, (req, res) => {
      const convId = req.params.conversationId;
      db.query(
        "SELECT * FROM lc_messages WHERE conversation_id = ? ORDER BY sent_at ASC",
        [convId],
        (err, rows) => {
          if (err) return res.status(500).json({ error: "DB error", err });
          res.json(rows);
        }
      );
    });


    //5. for uploading a file inside chat
    router.post(
      "/upload",
      authMiddleware,
      upload.single("file"),
      (req, res) => {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const { conversation_id } = req.body;
        const { id: userId, role } = req.user;
        const senderType = role === "lawyer" ? "lawyer" : "client";
        const fileUrl = `/chat_files/${req.file.filename}`;

        // save message with file URL
        db.query(
          "INSERT INTO lc_messages (conversation_id, sender_type, sender_user_id, text) VALUES (?, ?, ?, ?)",
          [conversation_id, senderType, userId, fileUrl],
          (err) => {
            if (err) return res.status(500).json({ error: "DB error", err });
            res.json({ success: true, file: fileUrl });
          }
        );
      }
    );


    module.exports = router;
