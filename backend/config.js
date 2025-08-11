// config.js - Server configuration
const NGROK_URL = "https://cdb99f14b14d.ngrok-free.app"; // Update this with your ngrok URL
const BASE_URL = process.env.NODE_ENV === 'production' ? NGROK_URL : `http://localhost:${process.env.PORT || 3000}`;

module.exports = {
  NGROK_URL,
  BASE_URL,
  PORT: process.env.PORT || 3000,
  MONGODB_URI: "mongodb://localhost:27017/appraisells",
  CORS_ORIGINS: [NGROK_URL, "http://localhost:3000", "https://localhost:3000"]
};
