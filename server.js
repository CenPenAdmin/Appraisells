
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

// === Pi Network Auth Endpoint ===
// Expects { pi_token: "..." } in body
app.post("/auth", async (req, res) => {
  const { pi_token } = req.body;
  // TODO: Replace with real Pi Network verification in production
  if (!pi_token) {
    return res.status(400).json({ message: "Missing pi_token" });
  }
  // Simulate verification and extraction
  // In production, verify token and fetch user info from Pi API
  const username = "sandbox_user";
  const wallet = {
    address: "test_wallet_address",
    balance: 1000
  };
  res.json({ username, wallet });
});

// === Pi Network Payment Endpoints (Sandbox) ===
// Approve payment
app.post("/approve-payment", (req, res) => {
  const { paymentId, amount, to } = req.body;
  // Simulate approval logic
  if (!paymentId || !amount || !to) {
    return res.status(400).json({ message: "Missing payment info" });
  }
  // In production, verify payment with Pi API
  res.json({ status: "approved", paymentId });
});

// Complete payment
app.post("/complete-payment", (req, res) => {
  const { paymentId } = req.body;
  // Simulate completion logic
  if (!paymentId) {
    return res.status(400).json({ message: "Missing paymentId" });
  }
  // In production, confirm payment completion with Pi API
  res.json({ status: "completed", paymentId });
});

// === Start Server ===
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
