const express = require("express");
const router = express.Router();
const db = require("../db/connection");

// 🆕 GET invite details by token (used by Register.jsx)
router.get("/:token", async (req, res) => {
    const { token } = req.params;

    // console.log("Looking up invite token:", token);

    db.query(
        `SELECT ci.token, c.name, c.email, u.role AS inviter_role, f.name AS firm_name
     FROM client_invites ci
     JOIN clients c ON ci.client_id = c.id
     JOIN users u ON c.added_by_user_id = u.id
     LEFT JOIN firms f ON u.firm_id = f.id
     WHERE ci.token = ?`,
        [token],
        (err, rows) => {
            if (err) {
                console.error("DB error", err);
                return res.status(500).json({ error: "DB error", err });
            }
            if (!rows.length) {
                // console.warn("No invite found for token:", token);
                return res.status(404).json({ error: "Invite not found" });
            }

            const { email, name, inviter_role, firm_name } = rows[0];
            res.json({
                email,
                name,
                firm_name: inviter_role === "admin" ? firm_name : "", // only if admin
            });
        }
    );
});



module.exports = router;
