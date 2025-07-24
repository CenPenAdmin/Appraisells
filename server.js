const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "profiles.json");

// === Middleware ===
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.static(__dirname));
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// === Initialize profiles.json if it doesn't exist ===
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// === Helper to load and save profiles ===
const loadProfiles = () => {
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
};

const saveProfiles = (profiles) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2));
};

// === Route: Save Profile ===
app.post("/save-profile", (req, res) => {
  try {
    const profiles = loadProfiles();
    const newProfile = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    saveProfiles(profiles);
    res.json({ message: "✅ Profile saved successfully." });
  } catch (err) {
    console.error("❌ Error saving profile:", err);
    res.status(500).json({ message: "❌ Failed to save profile." });
  }
});

// === Route: Get All Profiles (optional) ===
app.get("/profiles", (req, res) => {
  try {
    const profiles = loadProfiles();
    res.json(profiles);
  } catch (err) {
    console.error("❌ Error loading profiles:", err);
    res.status(500).json({ message: "❌ Failed to load profiles." });
  }
});

// === Route: Serve main page ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// === Start Server ===
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
