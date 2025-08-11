// config.js - Server configuration
require('dotenv').config();

const NGROK_URL = process.env.NGROK_URL || "https://cdb99f14b14d.ngrok-free.app";
const BASE_URL = process.env.NODE_ENV === 'production' ? NGROK_URL : `http://localhost:${process.env.PORT || 3000}`;

module.exports = {
  NGROK_URL,
  BASE_URL,
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/appraisells",
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [NGROK_URL, "http://localhost:3000", "https://localhost:3000"],
  
  // Pi Network API Configuration
  PI_API_KEY: process.env.PI_API_KEY,
  PI_API_URL: process.env.PI_API_URL || "https://api.minepi.com",
  PI_SANDBOX: process.env.PI_SANDBOX === 'true' || true
};
