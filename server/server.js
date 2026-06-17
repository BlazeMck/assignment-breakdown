/**
 * Assignment Breakdown Server
 * Main entry point for the Express API
 */
require("dotenv").config();
const express = require("express");
const assignmentRoutes = require("./routes/assignments");
const taskRoutes = require("./routes/tasks");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: "1mb" }));

// Content-Type enforcement for mutations
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
    return res.status(400).json({
      success: false,
      error: "Bad Request",
      message: "Content-Type must be application/json",
    });
  }
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/assignments", assignmentRoutes);
app.use("/api/assignments/:assignmentId/tasks", taskRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
