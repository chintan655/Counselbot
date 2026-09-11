// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const db = require("../db/connection");

// const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// // 📌 Register
// router.post("/register", async (req, res) => {
//   console.log("📩 Register route hit with data:", req.body);
//   let { name, email, password, role, firm_name, inviteToken } = req.body;
//   const hashed = await bcrypt.hash(password, 10);
//   let firmId = null;

//   // 🧠 If invited, override with invite data
//   if (inviteToken) {
//     const inviteRow = await new Promise((resolve, reject) => {
//       db.query(
//         `SELECT ci.*, c.name, c.email, u.firm_id , u.role as inviter_role
//        FROM client_invites ci
//        JOIN clients c ON ci.client_id = c.id
//        JOIN users u ON c.added_by_user_id = u.id
//        WHERE ci.token = ?`,
//         [inviteToken],
//         (e, r) => (e ? reject(e) : resolve(r))
//       );
//     });

//     if (inviteRow.length) {
//       name = inviteRow[0].name;
//       email = inviteRow[0].email;
//       const inviterRole = inviteRow[0].inviter_role;
//       const addedBy = inviteRow[0].added_by_user_id;
//       const clientId = inviteRow[0].client_id;
//       const inviterId = inviteRow[0].added_by_user_id;

//       // ✅ Only assign firm if admin invited
//       firmId = inviterRole === "admin" ? inviteRow[0].firm_id : null;

//       // ✅ 🔗 AUTO-ASSIGN lawyer if lawyer invited
//       if (inviterRole === "lawyer") {
//         db.query(
//           "INSERT IGNORE INTO client_assignments (client_id, lawyer_id) VALUES (?, ?)",
//           [clientId, addedBy],
//           (err) => {
//             if (err) console.error("Auto-assign lawyer failed", err);
//           }
//         );
//       }
//     } else {
//       return res.status(400).json({ error: "Invalid invite token" });
//     }

//   }


//   // 1. 🏢 Admin creates a new firm
//   if (role === "admin") {
//     await new Promise((resolve, reject) => {
//       db.query(
//         "INSERT INTO firms (name) VALUES (?)",
//         [firm_name],
//         (err, result) => {
//           if (err) return reject(err);
//           firmId = result.insertId;
//           resolve();
//         }
//       );
//     });
//   }

//   // 2. 👨‍⚖️ Lawyer joins existing firm
//   else if (role === "lawyer" && firm_name) {
//     const rows = await new Promise((resolve, reject) => {
//       db.query(
//         "SELECT id FROM firms WHERE name = ?",
//         [firm_name],
//         (err, rows) => (err ? reject(err) : resolve(rows))
//       );
//     });
//     if (!rows.length)
//       return res.status(400).json({ error: "Firm not found. Ask admin to create it." });
//     firmId = rows[0].id;
//   }

//   // 3. 👤 Client optionally joins a firm
//   else if (role === "client" && firm_name) {
//     const rows = await new Promise((resolve, reject) => {
//       db.query("SELECT id FROM firms WHERE name = ?", [firm_name], (err, r) =>
//         err ? reject(err) : resolve(r)
//       );
//     });
//     if (rows.length) firmId = rows[0].id; // silently ignore if not found
//   }

//   // 4. 👤 Create user
//   db.query(
//     "INSERT INTO users (name, email, password, role, firm_id) VALUES (?, ?, ?, ?, ?)",
//     [name, email, hashed, role || "client", firmId],
//     async (err, result) => {
//       if (err) {
//         if (err.code === "ER_DUP_ENTRY") {
//           return res.status(400).json({ message: "Email already registered" });
//         }
//         return res.status(500).json({ message: "Error registering user" });
//       }

//       const userId = result.insertId;

//       // 5. ✅ Updated "find-or-link" logic for clients
//       // 5️⃣ If the new user is a CLIENT …
//       if (role === "client") {
//         // A. find existing client record by email
//         const rows = await new Promise((resolve, reject) => {
//           db.query(
//             "SELECT id FROM clients WHERE email = ? LIMIT 1",
//             [email],
//             (e, r) => (e ? reject(e) : resolve(r))
//           );
//         });

//         if (rows.length) {
//           // 🔗 link that record to this new user + remove firm_id
//           db.query(
//             "UPDATE clients SET user_id = ?, firm_id = NULL WHERE id = ?",
//             [userId, rows[0].id],
//             (err) => {
//               if (err) console.error("Link client->user failed", err);
//             }
//           );
//         }
//         else {
//           // ➕ create fresh client row
//           db.query(
//             "INSERT INTO clients (user_id, name, email, firm_id, added_by_user_id) VALUES (?,?,?,?,?)",
//             [userId, name, email, firmId || null, inviterId],
//             (err) => {
//               if (err) console.error("Auto‑create client failed", err);
//             }
//           );
//         }
//       }


//       res.json({ success: true, userId });
//     }
//   );
// });


// // 📌 Login
// router.post("/login", (req, res) => {
//   const { email, password } = req.body;

//   db.query(`SELECT u.id, u.name, u.email, u.password, u.role, u.firm_id, f.name AS firm_name
//    FROM users u
//    LEFT JOIN firms f ON u.firm_id = f.id
//    WHERE u.email = ?`, [email], async (err, results) => {
//     if (err || results.length === 0) {
//       return res.status(401).json({ message: "Invalid email" });
//     }

//     const user = results[0];
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: "Invalid password" });

//     const token = jwt.sign(
//       { id: user.id, role: user.role, firm_id: user.firm_id, name: user.name, }, // 🎯 add role + firm
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );


//     res.json({
//       success: true,
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         firm_id: user.firm_id,
//         firm_name: user.firm_name
//       },
//     });
//   });
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// 📌 Register
router.post("/register", async (req, res) => {
  console.log("📩 Register route hit with data:", req.body);
  let { name, email, password, role, firm_name, inviteToken } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  let firmId = null;
  let inviterId = null; // ✅ FIXED: initialized globally

  // 🧠 If invited, override with invite data
  if (inviteToken) {
    try {
      const inviteRow = await new Promise((resolve, reject) => {
        db.query(
          `SELECT ci.*, c.name, c.email, u.firm_id , u.role as inviter_role
           FROM client_invites ci
           JOIN clients c ON ci.client_id = c.id
           JOIN users u ON c.added_by_user_id = u.id
           WHERE ci.token = ?`,
          [inviteToken],
          (e, r) => (e ? reject(e) : resolve(r))
        );
      });

      if (inviteRow.length) {
        name = inviteRow[0].name;
        email = inviteRow[0].email;
        const inviterRole = inviteRow[0].inviter_role;
        const addedBy = inviteRow[0].added_by_user_id;
        const clientId = inviteRow[0].client_id;
        inviterId = addedBy;

        // ✅ Only assign firm if admin invited
        firmId = inviterRole === "admin" ? inviteRow[0].firm_id : null;

        // ✅ 🔗 AUTO-ASSIGN lawyer if lawyer invited
        if (inviterRole === "lawyer") {
          db.query(
            "INSERT IGNORE INTO client_assignments (client_id, lawyer_id) VALUES (?, ?)",
            [clientId, addedBy],
            (err) => {
              if (err) console.error("Auto-assign lawyer failed", err);
            }
          );
        }
      } else {
        return res.status(400).json({ error: "Invalid invite token" });
      }
    } catch (err) {
      console.error("❌ Invite token DB error", err);
      return res.status(500).json({ error: "Server error during invite check" });
    }
  }

  // 1. 🏢 Admin creates a new firm
  if (role === "admin") {
    try {
      await new Promise((resolve, reject) => {
        db.query("INSERT INTO firms (name) VALUES (?)", [firm_name], (err, result) => {
          if (err) return reject(err);
          firmId = result.insertId;
          resolve();
        });
      });
    } catch (err) {
      return res.status(500).json({ message: "Error creating firm" });
    }
  }

  // 2. 👨‍⚖️ Lawyer joins existing firm
  else if (role === "lawyer" && firm_name) {
    const rows = await new Promise((resolve, reject) => {
      db.query(
        "SELECT id FROM firms WHERE name = ?",
        [firm_name],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    if (!rows.length) {
      return res.status(400).json({ error: "Firm not found. Ask admin to create it." });
    }
    firmId = rows[0].id;
  }

  // 3. 👤 Client optionally joins a firm
  else if (role === "client" && firm_name) {
    const rows = await new Promise((resolve, reject) => {
      db.query("SELECT id FROM firms WHERE name = ?", [firm_name], (err, r) =>
        err ? reject(err) : resolve(r)
      );
    });
    if (rows.length) firmId = rows[0].id;
  }

  // 4. 👤 Create user
  db.query(
    "INSERT INTO users (name, email, password, role, firm_id) VALUES (?, ?, ?, ?, ?)",
    [name, email, hashed, role || "client", firmId],
    async (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already registered" });
        }
        console.error("❌ User insert failed:", err);
        return res.status(500).json({ message: "Error registering user" });
      }

      const userId = result.insertId;

      // 5️⃣ If the new user is a CLIENT …
      if (role === "client") {
        const rows = await new Promise((resolve, reject) => {
          db.query("SELECT id FROM clients WHERE email = ? LIMIT 1", [email], (e, r) =>
            e ? reject(e) : resolve(r)
          );
        });

        if (rows.length) {
          db.query(
            "UPDATE clients SET user_id = ?, firm_id = NULL WHERE id = ?",
            [userId, rows[0].id],
            (err) => {
              if (err) console.error("Link client->user failed", err);
            }
          );
        } else {
          console.log("🛠 Creating fresh client row...");
          console.log("➡️ Data:", { userId, name, email, firmId, inviterId });

          db.query(
            "INSERT INTO clients (user_id, name, email, firm_id, added_by_user_id) VALUES (?,?,?,?,?)",
            [userId, name, email, firmId || null, inviterId],
            (err) => {
              if (err) console.error("❌ Auto‑create client failed", err);
            }
          );
        }
      }

      res.json({ success: true, userId });
    }
  );
});

// 📌 Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    `SELECT u.id, u.name, u.email, u.password, u.role, u.firm_id, f.name AS firm_name
     FROM users u
     LEFT JOIN firms f ON u.firm_id = f.id
     WHERE u.email = ?`,
    [email],
    async (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ message: "Invalid email" });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid password" });

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          firm_id: user.firm_id,
          name: user.name,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          firm_id: user.firm_id,
          firm_name: user.firm_name,
        },
      });
    }
  );
});



const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();

  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  const [result] = await db.promise().query(
    "UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?",
    [otp, expiry, email]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "User not found." });
  }


  // (err, result) => {
  //   if (err || result.affectedRows === 0) return res.status(404).json({ message: "User not found." });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Password Reset OTP",
    text: `Your OTP is: ${otp}. It will expire in 15 minutes.`,
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) return res.status(500).json({ message: "Email failed." });
    res.json({ success: true });
  });
}
);

// Reset password
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // 🧠 Step 1: Lookup OTP and expiry
    const [rows] = await db.promise().query(
      "SELECT otp_code, otp_expires_at FROM users WHERE email = ?",
      [email]
    );

    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const { otp_code, otp_expires_at } = rows[0];

    // ✅ Validate OTP
    if (otp !== otp_code) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > new Date(otp_expires_at)) return res.status(400).json({ message: "OTP expired" });

    // 🔐 Step 2: Hash and update password
    const hashed = await bcrypt.hash(newPassword, 10);

    await db.promise().query(
      "UPDATE users SET password = ?, otp_code = NULL, otp_expires_at = NULL WHERE email = ?",
      [hashed, email]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
