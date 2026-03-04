// express app config
import express from "express";
import cors from "cors";
import config from "./config/config";
import { errorHandler } from "./middlewares/errorHandler";
import { authMiddleware } from "./middlewares/authMiddleware";
import authRoutes from "./routes/authRoutes";
import itemRoutes from "./routes/itemRoutes";

const app = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Shadow Me Interns API" });
});

// Auth routes (public — no JWT required)
app.use("/api/auth", authRoutes);

// Protected routes (JWT required)
app.use("/api/items", authMiddleware, itemRoutes);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
