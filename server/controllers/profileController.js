const db = require("../db/connection");

exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [userRows] = await db.promise().query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    if (user.firm_id) {
      profile.firm_id = user.firm_id;
      const [admin] = await db.promise().query("SELECT name FROM users WHERE role = 'admin' AND firm_id = ?", [user.firm_id]);
      profile.firm_name = admin[0]?.name || "Unknown";
      profile.admin_name = admin[0]?.name || null;
    }

    if (user.role === "admin") {
      const [lawyers] = await db.promise().query("SELECT name, email, created_at FROM users WHERE role = 'lawyer' AND firm_id = ?", [user.firm_id]);
      const [clients] = await db.promise().query(`
        SELECT c.name, c.email, c.created_at, ca.lawyer_id, u.name AS lawyer_name
        FROM clients c
        LEFT JOIN client_assignments ca ON ca.client_id = c.id
        LEFT JOIN users u ON ca.lawyer_id = u.id
        WHERE c.firm_id = ?
      `, [user.firm_id]);
      profile.lawyers = lawyers;
      profile.clients = clients;
    }

    if (user.role === "lawyer") {
      const [clients] = await db.promise().query(`
        SELECT c.name, c.email, c.created_at, c.added_by_user_id, u.name AS added_by
        FROM client_assignments ca
        JOIN clients c ON ca.client_id = c.id
        LEFT JOIN users u ON u.id = c.added_by_user_id
        WHERE ca.lawyer_id = ?`, [userId]);

      const clientIds = clients.map(c => c.id);
      let files = [];
      if (clientIds.length) {
        [files] = await db.promise().query(`
          SELECT f.original_name, f.uploaded_at, f.client_id, c.name AS client_name
          FROM files f
          JOIN clients c ON c.id = f.client_id
          WHERE f.client_id IN (?)
        `, [clientIds]);
      }

      profile.clients = clients;
      profile.files = files;
    }

    if (user.role === "client") {
      const [clientRow] = await db.promise().query("SELECT * FROM clients WHERE user_id = ?", [userId]);
      const client = clientRow[0];

      const [lawyerRes] = await db.promise().query(`
        SELECT u.name FROM client_assignments ca
        JOIN users u ON u.id = ca.lawyer_id
        WHERE ca.client_id = ?`, [client.id]);

      const [files] = await db.promise().query("SELECT original_name, uploaded_at FROM files WHERE client_id = ?", [client.id]);

      profile.client_info = client;
      profile.lawyer_name = lawyerRes[0]?.name || "Unassigned";
      profile.files = files;
    }

    res.json(profile);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

