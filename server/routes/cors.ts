/**
 * cors.ts — CORS middleware configuration
 *
 * Allows cross-origin requests from the following domains:
 *   - https://dfw-painters.com
 *   - https://www.dfw-painters.com
 *   - https://dfw-propainters.com
 *   - https://www.dfw-propainters.com
 *
 * All other origins are denied by default.
 *
 * Usage:
 *   import { corsMiddleware } from "./routes/cors";
 *   app.use("/api/public", corsMiddleware);
 */
import cors from "cors";

const ALLOWED_ORIGINS: string[] = [
  "https://dfw-painters.com",
  "https://www.dfw-painters.com",
  "https://dfw-propainters.com",
  "https://www.dfw-propainters.com",
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
});
