// const jwt = require("jsonwebtoken");
// const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// function authMiddleware(req, res, next) {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ message: "Token missing" });

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).json({ message: "Invalid token" });
//   }
// }

// module.exports = authMiddleware;


// middleware/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// 🛡️ Auth middleware to decode JWT and attach user
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // ⬅️ you'll access req.user.role later
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// 🔐 Role-based access middleware
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

// ✅ Export both
module.exports = {
  authMiddleware,
  requireRole
};
