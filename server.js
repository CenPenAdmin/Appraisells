const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

// === Configuration ===
// NGROK_URL: Update this when you get a new ngrok tunnel
const NGROK_URL = "https://your-ngrok-url.ngrok.io"; // Update this with your ngrok URL
const BASE_URL = process.env.NODE_ENV === 'production' ? NGROK_URL : `http://localhost:${port}`;

console.log(`🔧 Base URL: ${BASE_URL}`);

// === MongoDB Connection ===
mongoose.connect("mongodb://localhost:27017/appraisells");

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ MongoDB connection error:"));
db.once("open", () => {
  console.log("✅ Connected to MongoDB (appraisells-mongo container)");
});

// === MongoDB Schemas ===
const UserRegistrationSchema = new mongoose.Schema({
  personalInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true }
  },
  shippingAddress: {
    address1: { type: String, required: true },
    address2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  agreements: {
    shipping: { type: Boolean, required: true },
    terms: { type: Boolean, required: true },
    privacy: { type: Boolean, required: true }
  },
  payment: {
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    approvedAt: Date,
    completedAt: Date
  },
  piUser: {
    uid: String,
    username: String
  },
  registrationStatus: {
    type: String,
    enum: ['pending', 'payment_approved', 'completed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PiPaymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  memo: String,
  metadata: Object,
  status: {
    type: String,
    enum: ['created', 'approved', 'completed', 'cancelled', 'failed'],
    default: 'created'
  },
  userEmail: String,
  timestamps: {
    created: { type: Date, default: Date.now },
    approved: Date,
    completed: Date
  }
});

const UserRegistration = mongoose.model("UserRegistration", UserRegistrationSchema);
const PiPayment = mongoose.model("PiPayment", PiPaymentSchema);

// === Middleware ===
app.use(cors({
  origin: [NGROK_URL, "http://localhost:3000", "https://localhost:3000"],
  credentials: true
}));
app.use(express.static(__dirname));
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request body:", JSON.stringify(req.body, null, 2));
  }
  next();
});

// === Route: Serve main page ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// === Pi Payment Approval Endpoint ===
app.post("/approve-payment", async (req, res) => {
  try {
    const { paymentId, userEmail } = req.body;
    
    console.log(`🔄 Processing payment approval for: ${paymentId}`);
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Store payment in database with approved status
    const piPayment = await PiPayment.findOneAndUpdate(
      { paymentId },
      {
        status: 'approved',
        userEmail,
        'timestamps.approved': new Date()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    // Update user registration if exists
    if (userEmail) {
      await UserRegistration.findOneAndUpdate(
        { 'personalInfo.email': userEmail },
        { 
          'payment.approvedAt': new Date(),
          registrationStatus: 'payment_approved',
          updatedAt: new Date()
        }
      );
    }

    console.log(`✅ Payment approved: ${paymentId}`);
    
    res.json({
      success: true,
      message: "Payment approved successfully",
      paymentId,
      status: 'approved'
    });

  } catch (error) {
    console.error("❌ Payment approval error:", error);
    res.status(500).json({
      success: false,
      message: "Payment approval failed",
      error: error.message
    });
  }
});

// === Pi Payment Completion Endpoint ===
app.post("/complete-payment", async (req, res) => {
  try {
    const { paymentId, userEmail } = req.body;
    
    console.log(`🔄 Processing payment completion for: ${paymentId}`);
    
    if (!paymentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment ID is required" 
      });
    }

    // Update payment status to completed
    const piPayment = await PiPayment.findOneAndUpdate(
      { paymentId },
      {
        status: 'completed',
        'timestamps.completed': new Date()
      },
      { new: true }
    );

    if (!piPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Update user registration
    if (userEmail) {
      await UserRegistration.findOneAndUpdate(
        { 'personalInfo.email': userEmail },
        { 
          'payment.completed': true,
          'payment.completedAt': new Date(),
          registrationStatus: 'completed',
          updatedAt: new Date()
        }
      );
    }

    console.log(`✅ Payment completed: ${paymentId}`);
    
    res.json({
      success: true,
      message: "Payment completed successfully",
      paymentId,
      status: 'completed'
    });

  } catch (error) {
    console.error("❌ Payment completion error:", error);
    res.status(500).json({
      success: false,
      message: "Payment completion failed",
      error: error.message
    });
  }
});

// === User Registration Endpoint ===
app.post("/register-user", async (req, res) => {
  try {
    const registrationData = req.body;
    
    console.log(`🔄 Processing user registration for: ${registrationData.personalInfo?.email}`);
    
    // Validate required data
    if (!registrationData.personalInfo || !registrationData.payment?.paymentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required registration data"
      });
    }

    // Check if payment was completed
    const piPayment = await PiPayment.findOne({ 
      paymentId: registrationData.payment.paymentId,
      status: 'completed'
    });

    if (!piPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment not completed. Please complete payment first."
      });
    }

    // Check if user already registered
    const existingUser = await UserRegistration.findOne({
      'personalInfo.email': registrationData.personalInfo.email
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Create new user registration
    const newRegistration = new UserRegistration({
      ...registrationData,
      registrationStatus: 'completed',
      'payment.completed': true,
      'payment.completedAt': new Date()
    });

    await newRegistration.save();

    console.log(`✅ User registered successfully: ${registrationData.personalInfo.email}`);
    
    res.json({
      success: true,
      message: "Registration completed successfully",
      registrationId: newRegistration._id,
      email: registrationData.personalInfo.email
    });

  } catch (error) {
    console.error("❌ Registration error:", error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message
      });
    }
  }
});

// === Get User Registration Status ===
app.get("/registration-status/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    const registration = await UserRegistration.findOne({
      'personalInfo.email': email
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    res.json({
      success: true,
      registration: {
        email: registration.personalInfo.email,
        name: registration.personalInfo.fullName,
        status: registration.registrationStatus,
        paymentCompleted: registration.payment.completed,
        registeredAt: registration.createdAt
      }
    });

  } catch (error) {
    console.error("❌ Status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check registration status"
    });
  }
});

// === Database Status Endpoint ===
app.get("/api/status", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const userCount = await UserRegistration.countDocuments();
    const paymentCount = await PiPayment.countDocuments();
    
    res.json({
      success: true,
      configuration: {
        ngrokUrl: NGROK_URL,
        baseUrl: BASE_URL,
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

// === Configuration Endpoint ===
app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    message: "When you get a new ngrok tunnel, update the NGROK_URL variable in server.js",
    currentConfig: {
      ngrokUrl: NGROK_URL,
      baseUrl: BASE_URL,
      port: port,
      corsOrigins: [NGROK_URL, "http://localhost:3000", "https://localhost:3000"]
    },
    instructions: {
      step1: "Get your new ngrok tunnel URL (e.g., https://abc123.ngrok.io)",
      step2: "Update the NGROK_URL variable at the top of server.js",
      step3: "Restart the server",
      step4: "Verify the new URL works by visiting /api/config"
    }
  });
});

// === Error handling middleware ===
app.use((error, req, res, next) => {
  console.error("❌ Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// === Start Server ===
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📊 Status endpoint: ${BASE_URL}/api/status`);
  console.log(`⚙️  Config endpoint: ${BASE_URL}/api/config`);
  console.log(`💾 MongoDB container: appraisells-mongo`);
  console.log(`🪙 Pi payments enabled for registration`);
  console.log(`🔗 ngrok URL: ${NGROK_URL} ${NGROK_URL.includes('your-ngrok-url') ? '⚠️  UPDATE NEEDED!' : '✅'}`);
});
