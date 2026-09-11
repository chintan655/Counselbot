const express = require("express");
const router = express.Router();
// const auth = require("../middleware/auth");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// File storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", "templates");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 👇 Route to upload template
router.post("/upload", authMiddleware, upload.single("template"), (req, res) => {
  console.log("Upload route hit");
  // console.log("File info:", req.file);
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  res.json({
    success: true,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/templates/${req.file.filename}`,
  });
});

module.exports = router;
