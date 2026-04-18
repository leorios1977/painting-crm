import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
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

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Tenant is attached by tenantMiddleware in server/_core/index.ts
  return {
    req: opts.req as Request,
    res: opts.res,
    user,
  };
}
