/**
 * emailPasswordAuth.ts
 *
 * Simple email/password authentication endpoints for Vercel deployment.
 * Replaces Manus OpenID OAuth flow with JWT tokens stored in localStorage.
 *
 * POST /api/auth/login    — validate credentials, return signed JWT
 * POST /api/auth/logout   — stateless; client discards the token
 * POST /api/auth/register — create a new user account and return signed JWT
 */

import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "../db";
import { users, appSettings } from "../../drizzle/schema";
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

  /**
   * POST /api/auth/register
   * Body: { businessName, ownerName, email, password, phone?, city?, state?, website?, hearAboutUs?, plan? }
   * Returns: { token: string, user: { id, name, email, role } }
   */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const {
        businessName,
        ownerName,
        email,
        password,
        phone,
        city,
        state,
        plan,
        hearAboutUs,
      } = req.body as {
        businessName?: string;
        ownerName?: string;
        email?: string;
        password?: string;
        phone?: string;
        city?: string;
        state?: string;
        website?: string;
        hearAboutUs?: string;
        plan?: string;
      };

      if (!businessName?.trim()) return res.status(400).json({ error: "Business name is required" });
      if (!ownerName?.trim()) return res.status(400).json({ error: "Owner name is required" });
      if (!email?.trim()) return res.status(400).json({ error: "Email is required" });
      if (!password || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

      const normalizedEmail = email.toLowerCase().trim();

      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing) return res.status(409).json({ error: "An account with this email already exists" });

      const passwordHash = await bcrypt.hash(password, 12);
      const openId = `email-${normalizedEmail}-${Date.now()}`;

      const [newUser] = await db
        .insert(users)
        .values({
          openId,
          name: ownerName.trim(),
          email: normalizedEmail,
          passwordHash,
          loginMethod: "email-password",
          role: "user",
          lastSignedIn: new Date(),
        })
        .returning();

      if (!newUser) return res.status(500).json({ error: "Failed to create account" });

      try {
        await db.insert(appSettings).values({
          tenantId: newUser.id,
          businessName: businessName.trim(),
          companyEmail: normalizedEmail,
        });
      } catch (settingsErr) {
        console.warn("[Register] Failed to seed app_settings:", (settingsErr as Error).message);
      }

      console.log(
        `[Register] New account: ${businessName} (${normalizedEmail})` +
        (phone ? ` | Phone: ${phone}` : "") +
        (city && state ? ` | ${city}, ${state}` : "") +
        (plan ? ` | Plan: ${plan}` : "") +
        (hearAboutUs ? ` | Source: ${hearAboutUs}` : "")
      );

      const token = await signEmailJwt(newUser.id, normalizedEmail, newUser.role);

      return res.status(201).json({
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      });
    } catch (err) {
      console.error("[Auth] Register error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
