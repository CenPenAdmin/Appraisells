// database.js - MongoDB connection and schemas
const mongoose = require("mongoose");
const config = require('./config');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ MongoDB connection error:"));
db.once("open", () => {
  console.log("✅ Connected to MongoDB (appraisells-mongo container)");
});

// User Registration Schema
const UserRegistrationSchema = new mongoose.Schema({
  personalInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false }
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
    enum: ['pending', 'profile_completed', 'payment_approved', 'completed'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pi Payment Schema
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

module.exports = {
  UserRegistration,
  PiPayment,
  mongoose
};
