import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import from lib directory
import { config } from "./lib/config";
import { HttpException } from "./lib/exceptions";

// Import routes
import authRouter from "./routes/auth.route";
import assetRouter from "./routes/asset.route";
import evidenceRouter from "./routes/evidence.route";
import verificationRouter from "./routes/verification.route";
import serviceRecordRouter from "./routes/service-record.route";

const app = new Hono();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use("*", logger());
app.use("*", cors({ origin: config.frontendUrl, credentials: true }));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "VeriPass Backend API",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.route("/api/auth", authRouter);
app.route("/api/assets", assetRouter);
app.route("/api/evidence", evidenceRouter);
app.route("/api/verification-requests", verificationRouter);
app.route("/api/service-records", serviceRecordRouter);

// ============================================================
// ERROR HANDLERS
// ============================================================

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  // Handle custom HTTP exceptions
  if (err instanceof HttpException) {
    return c.json({ error: err.message, details: err.details }, err.statusCode);
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return c.json({ error: "Validation failed", details: err }, 400);
  }

  // Handle unknown errors
  console.error("Server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// ============================================================
// START SERVER
// ============================================================

console.log(`🚀 VeriPass Backend starting...`);
console.log(`📍 Port: ${config.port}`);
console.log(`🌍 Environment: ${config.nodeEnv}`);
console.log(`🔗 CORS enabled for: ${config.frontendUrl}`);

serve({
  fetch: app.fetch,
  port: config.port,
});

console.log(`✅ Server running at http://localhost:${config.port}`);
