const functions = require("firebase-functions");
const express = require("express");

const app = express();

// Test route
app.get("/hello", (req, res) => {
  res.send("Hello from Firebase 🚀");
});

// Export properly
exports.api = functions.https.onRequest(app);