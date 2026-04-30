import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyEmailJwt } from "../routes/emailPasswordAuth";
import { getUserById } from "../db";
import type { Request } from "express";

// Extend Express Request to include tenant from middleware
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: number | null;
        plan: "starter" | "pro" | "enterprise";
        billingStatus: "active" | "suspended" | "cancelled";
        subdomain?: string | null;
      };
    }
  }
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // 1. Try email/password JWT from Authorization: Bearer <token> header
  const authHeader = opts.req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = await verifyEmailJwt(token);
      if (payload) {
        user = await getUserById(payload.userId);
      }
    } catch {
      user = null;
    }
  }

  // 2. Fall back to Manus OAuth cookie session (for backward compatibility)
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch {
      user = null;
    }
  }

  // Tenant is attached by tenantMiddleware in server/_core/index.ts
  return {
    req: opts.req as Request,
    res: opts.res,
    user,
  };
}
