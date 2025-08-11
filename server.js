// server.js - Main server entry point
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import backend modules
const config = require('./backend/config');
const { mongoose } = require('./backend/database');
const { approvePayment, completePayment } = require('./backend/payment');
const { registerProfile, registerUser, getRegistrationStatus } = require('./backend/registration');

const app = express();

console.log(`🔧 Base URL: ${config.BASE_URL}`);

// Middleware
app.use(cors({
  origin: config.CORS_ORIGINS,
  credentials: true
}));
app.use(express.static(__dirname));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Payment endpoints
app.post("/approve-payment", approvePayment);
app.post("/complete-payment", completePayment);

// Registration endpoints
app.post("/register-profile", registerProfile);
app.post("/register-user", registerUser);
app.get("/registration-status/:email", getRegistrationStatus);

// Status endpoint
app.get("/api/status", async (req, res) => {
  try {
    const { UserRegistration, PiPayment } = require('./backend/database');
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const userCount = await UserRegistration.countDocuments();
    const paymentCount = await PiPayment.countDocuments();
    
    res.json({
      success: true,
      configuration: {
        ngrokUrl: config.NGROK_URL,
        baseUrl: config.BASE_URL,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: dbStatus,
        name: 'appraisells',
        collections: {
          userRegistrations: userCount,
          piPayments: paymentCount
        }
      },
      server: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Status check failed",
      error: error.message
    });
  }
});

// Configuration endpoint
app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    message: "When you get a new ngrok tunnel, update the NGROK_URL variable in backend/config.js",
    currentConfig: {
      ngrokUrl: config.NGROK_URL,
      baseUrl: config.BASE_URL,
      port: config.PORT,
      corsOrigins: config.CORS_ORIGINS
    },
    instructions: {
      step1: "Get your new ngrok tunnel URL (e.g., https://abc123.ngrok.io)",
      step2: "Update the NGROK_URL variable in backend/config.js",
      step3: "Restart the server",
      step4: "Verify the new URL works by visiting /api/config"
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error("❌ Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${config.PORT}`);
  console.log(`🌐 Base URL: ${config.BASE_URL}`);
  console.log(`📊 Status endpoint: ${config.BASE_URL}/api/status`);
  console.log(`⚙️  Config endpoint: ${config.BASE_URL}/api/config`);
  console.log(`💾 MongoDB container: appraisells-mongo`);
  console.log(`🪙 Pi payments enabled for registration`);
  console.log(`🔗 ngrok URL: ${config.NGROK_URL} ${config.NGROK_URL.includes('your-ngrok-url') ? '⚠️  UPDATE NEEDED!' : '✅'}`);
});
