const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { getProfile } = require("../controllers/profileController");

router.get("/profile", authMiddleware, getProfile);

module.exports = router;
