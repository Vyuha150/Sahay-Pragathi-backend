import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Health check endpoint
router.get("/", async (req, res) => {
  try {
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name,
      },
      memory: {
        heapUsed: `${Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024
        )} MB`,
        heapTotal: `${Math.round(
          process.memoryUsage().heapTotal / 1024 / 1024
        )} MB`,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Database ping endpoint
router.get("/db", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({
      status: "ok",
      message: "Database connection is healthy",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message,
    });
  }
});

export default router;
