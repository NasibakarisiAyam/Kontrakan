import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import kontrakanRoutes from "./routes/kontrakan_routes.js";
import penyewaRoutes from "./routes/penyewa_routes.js";
import pembayaranRoutes from "./routes/pembayaran_routes.js";
import authRoutes from "./routes/auth_routes.js";
import { errorHandler } from "./lib/errors.js";
import logger from "./lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env sebelum mengakses process.env
dotenv.config({ path: path.join(__dirname, "../.env") });

// Validasi variabel lingkungan wajib
const REQUIRED_ENV = ["JWT_SECRET", "MONGO_URI"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  logger.warn(`Variabel ENV tidak ditemukan: ${missingEnv.join(", ")}. Menggunakan nilai default.`);
}

// Default JWT secret (hanya untuk development)
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    logger.error("JWT_SECRET wajib diset di environment production!");
    process.exit(1);
  }
  process.env.JWT_SECRET = "dev-secret-key-ganti-di-production";
  logger.warn("Menggunakan JWT_SECRET default. JANGAN gunakan ini di production!");
}

// Normalisasi MONGO_URI
let MONGODB_URI = process.env.MONGO_URI;

if (MONGODB_URI) {
  // JANGAN tambah database name - URI dari .env sudah lengkap!
  // Cukup gunakan sebagaimana adanya
  logger.info(`MongoDB URI: ${MONGODB_URI.split('@')[0]}@...`);
} else {
  const fallback = "mongodb://127.0.0.1:27017/kontrakan";
  logger.warn(`MONGO_URI tidak ditemukan. Menggunakan fallback: ${fallback}`);
  MONGODB_URI = fallback;
}

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────

// 1. Trust proxy (penting untuk rate limiting di balik reverse proxy / Railway / Render)
app.set("trust proxy", 1);

// 2. Debug middleware - DIHAPUS karena mengganggu body parsing
// Middleware ini mengonsumsi request stream sebelum express.json() bisa membacanya

// 3. CORS - PENTING: Letakkan SEBELUM route handlers
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (misal: curl, Postman, mobile app)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Origin tidak diizinkan oleh CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

// 4. Handle preflight requests
// NOTE: app.options('*', cors()) removed - path-to-regexp v6+ tidak support '*' tanpa parameter name
// CORS middleware sudah menangani preflight requests secara otomatis melalui origin check

// 5. Body parsing - PASTIKAN INI SEBELUM ROUTES
app.use(express.json({ 
  limit: "10mb",
  verify: (req, res, buf) => {
    // Store raw body for debugging if needed
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: "10mb",
  parameterLimit: 10000
}));

// 6. Rate limiting (logging middleware dihapus untuk menghindari masalah)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: { success: false, message: "Terlalu banyak request. Coba lagi nanti." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter ke semua routes kecuali auth
app.use(/^\/(?!api\/auth).*/, limiter);

// Rate limiter khusus auth (lebih ketat)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 8. Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// ─── Koneksi Database ──────────────────────────────────────────────────────────

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("✓ Database terhubung");
  } catch (err) {
    logger.error("✗ Gagal koneksi database:", err.message);
    logger.warn("Server berjalan tanpa database. Periksa konfigurasi MongoDB.");
  }
};

connectDB();

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB terputus. Mencoba reconnect...");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB terhubung kembali.");
});

// ─── Routes ────────────────────────────────────────────────────────────────────

// Test endpoint untuk memastikan server berjalan
app.get("/api/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Test endpoint untuk POST
app.post("/api/test", (req, res) => {
  console.log('Test POST received body:', req.body);
  res.json({ 
    success: true, 
    message: "POST test successful",
    receivedData: req.body
  });
});

// Auth routes dengan rate limiter khusus
app.use("/api/auth", authLimiter, authRoutes);

// Routes lainnya
app.use("/api/kontrakan", kontrakanRoutes);
app.use("/api/penyewa", penyewaRoutes);
app.use("/api/pembayaran", pembayaranRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  res.json({
    status: "OK",
    message: "Server running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus[dbState] ?? "unknown",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Server Backend Berjalan Normal",
    version: "1.0.0",
    endpoints: {
      test: "/api/test",
      health: "/api/health",
      auth: "/api/auth",
      kontrakan: "/api/kontrakan",
      penyewa: "/api/penyewa",
      pembayaran: "/api/pembayaran",
    },
  });
});

// 404 handler — harus setelah semua route
app.use((req, res) => {
  logger.warn(`404 - Route tidak ditemukan: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: "Route tidak ditemukan",
    path: req.path,
  });
});

// Global error handler — harus paling akhir
app.use(errorHandler);

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info(`${signal} diterima. Menutup server...`);
  await mongoose.connection.close();
  logger.info("Koneksi database ditutup.");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Tangkap uncaught exception agar server tidak crash diam-diam
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});

// ─── Start Server ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info(`✓ Server berjalan di http://localhost:${PORT}`);
  logger.info(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`✓ API Endpoints:`);
  logger.info(`  - Test:       http://localhost:${PORT}/api/test`);
  logger.info(`  - Health:     http://localhost:${PORT}/api/health`);
  logger.info(`  - Auth:       http://localhost:${PORT}/api/auth`);
  logger.info(`  - Kontrakan:  http://localhost:${PORT}/api/kontrakan`);
  logger.info(`  - Penyewa:    http://localhost:${PORT}/api/penyewa`);
  logger.info(`  - Pembayaran: http://localhost:${PORT}/api/pembayaran`);
});

export default app;