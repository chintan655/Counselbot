const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
const authRoutes = require("./routes/auth");
const documentRoutes = require('./routes/documents');
const clientRoutes = require("./routes/clients");
const noteRoutes = require("./routes/notes");
const genRoute = require("./routes/generate");
const chatRoutes = require("./routes/chat");
const fileRoutes = require("./routes/files");
const templateRoutes = require("./routes/templates");
const lawyerClientChatRoutes = require("./routes/lc_chat");
const inviteRoutes = require("./routes/invites");
const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);
app.use("/api/invite", inviteRoutes);
const path = require("path");
app.use("/api/lc", lawyerClientChatRoutes);
app.use("/chat_files", express.static(path.join(__dirname, "uploads/chat_files")));
app.use("/api/users", require("./routes/users"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/templates", templateRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/generate", genRoute);
app.use("/api/notes", noteRoutes);
app.use("/api/clients", clientRoutes);
app.use('/api/documents', documentRoutes);
app.use("/api/auth", authRoutes)

module.exports = app;
// app.listen(5000, () => {
//   console.log('Server running on http://localhost:5000');
// });
// Only listen when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(5000, () => {
    console.log("Server running on 5000");
  });
}