const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { authMiddleware, requireRole } = require("../middleware/auth");

// GET  /api/users/lawyers  → returns all lawyers in admin's firm
router.get("/lawyers", authMiddleware, requireRole("admin"), (req, res) => {
  db.query(
    "SELECT id, name FROM users WHERE role = 'lawyer' AND firm_id = ?",
    [req.user.firm_id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "DB error", err });
      res.json(rows);
    }
  );
});

module.exports = router;

// 📩 Register route hit with data: {
//   name: 'Priya',
//   email: 'priya@gmail.com',
//   password: 'Priya@123',
//   role: 'admin',
//   firm_name: 'Priya'
// }
// 📩 Register route hit with data: {
//   name: 'Lawyer_Priya',
//   email: 'LawyerPriya@gmail.com', 
//   password: 'Priya@123',
//   role: 'lawyer',
//   firm_name: 'Priya'
// }