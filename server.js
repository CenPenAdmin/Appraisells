
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// === Middleware ===
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.static(__dirname));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// === Route: Serve main page ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});




// === Start Server ===
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
