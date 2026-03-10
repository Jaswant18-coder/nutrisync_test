import "express-async-errors";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Routes
import patientRoutes from "./routes/patients";
import mealPlanRoutes from "./routes/mealPlans";
import kitchenRoutes from "./routes/kitchen";
import trackingRoutes from "./routes/tracking";
import inventoryRoutes from "./routes/inventory";
import dietGroupRoutes from "./routes/dietGroups";
import reportRoutes from "./routes/reports";
import authRoutes from "./routes/auth";
import suggestionRoutes from "./routes/suggestions";
import chatRoutes from "./routes/chat";
import meRoutes from "./routes/me";

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.NODE_ENV === "production"
  ? [
    process.env.RENDER_EXTERNAL_URL,
    process.env.FRONTEND_URL,
    /\.pages\.dev$/,
    /\.vercel\.app$/,
  ].filter(Boolean) as (string | RegExp)[]
  : [/^http:\/\/localhost(:\d+)?$/];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/meal-plans", mealPlanRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/diet-groups", dietGroupRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/me", meRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
);

// Serve frontend static files in production (only if dist folder exists)
const clientDir = path.join(__dirname, "../../dist");
if (fs.existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 NutriSync backend running on http://localhost:${PORT}`);
  console.log(`📦 Database: Cloudflare D1 (${process.env.CF_D1_DATABASE_ID ?? "not configured"})`);
});

export default app;
