import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Load environment variables
dotenv.config();

// Import routes
import healthRoutes from "./routes/health.js";
import caseRoutes from "./routes/cases.js";
import disputeRoutes from "./routes/disputes.js";
import templeRoutes from "./routes/temples.js";
import cmReliefRoutes from "./routes/cmrelief.js";
import educationRoutes from "./routes/education.js";
import csrIndustrialRoutes from "./routes/csrindustrial.js";
import appointmentRoutes from "./routes/appointments.js";
import programRoutes from "./routes/programs.js";
import userRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";
import emergencyRoutes from "./routes/emergencies.js";

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8080",
      process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("💡 Make sure MongoDB is running on your system");
    console.log("💡 You can start MongoDB with: mongod");
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/temples", templeRoutes);
app.use("/api/cmrelief", cmReliefRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/csr", csrIndustrialRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Sahaya Pragathi API Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      cases: "/api/cases",
      disputes: "/api/disputes",
      temples: "/api/temples",
      cmrelief: "/api/cmrelief",
      education: "/api/education",
      csr: "/api/csr",
      appointments: "/api/appointments",
      users: "/api/users",
      upload: "/api/upload",
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  await mongoose.connection.close();
  process.exit(0);
});
