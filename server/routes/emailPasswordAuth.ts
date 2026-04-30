/**
 * emailPasswordAuth.ts
 *
 * Simple email/password authentication endpoints for Vercel deployment.
 * Replaces Manus OpenID OAuth flow with JWT tokens stored in localStorage.
 *
 * POST /api/auth/login  — validate credentials, return signed JWT
 * POST /api/auth/logout — stateless; client discards the token
 */

import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

const TOKEN_EXPIRY_SECONDS = 365 * 24 * 60 * 60; // 1 year

function getJwtSecret(): Uint8Array {
  const secret = ENV.cookieSecret || "fallback-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function signEmailJwt(userId: number, email: string, role: string): Promise<string> {
  return new SignJWT({ userId, email, role, type: "email-password" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyEmailJwt(token: string): Promise<{ userId: number; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ["HS256"] });
    const { userId, email, role } = payload as Record<string, unknown>;
    if (typeof userId !== "number" || typeof email !== "string" || typeof role !== "string") {
      return null;
    }
    return { userId, email, role };
  } catch {
    return null;
  }
}

export function registerEmailPasswordAuthRoutes(app: Express): void {
  /**
   * POST /api/auth/login
   * Body: { email: string, password: string }
   * Returns: { token: string, user: { id, name, email, role } }
   */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const db = await getDb();
      if (!db) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ error: "Password login not set up for this account" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update lastSignedIn
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const token = await signEmailJwt(user.id, user.email ?? email, user.role);

      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("[Auth] Login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * POST /api/auth/logout
   * Stateless — client is responsible for removing the token from localStorage.
   */
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    return res.json({ success: true });
  });
}
