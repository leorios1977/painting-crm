import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { tenants, tenantIntegrations } from "../../drizzle/schema";

export interface TenantConfig {
  id: number;
  businessName: string;
  industry: string;
  subdomain: string;
  customDomain: string | null;
  plan: "starter" | "pro" | "enterprise";
  stripeCustomerId: string | null;
  billingStatus: "active" | "suspended" | "cancelled";
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  brandName: string | null;
  createdAt: Date;
  integrations: TenantIntegrationConfig[];
}

export interface TenantIntegrationConfig {
  id: number;
  service: string;
  mode: "shared" | "custom";
  apiKeyEncrypted: string | null;
  configJson: string | null;
  createdAt: Date;
}

export interface DefaultTenantConfig {
  id: null;
  businessName: string;
  industry: string;
  subdomain: null;
  customDomain: null;
  plan: "starter";
  stripeCustomerId: null;
  billingStatus: "active";
  logoUrl: null;
  primaryColor: null;
  secondaryColor: null;
  brandName: null;
  createdAt: Date;
  integrations: [];
}

export async function getTenantConfig(tenantId: number): Promise<TenantConfig | DefaultTenantConfig> {
  const db = await getDb();
  if (!db) return getDefaultTenantConfig();
  try {
    const tenantResult = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenantResult || tenantResult.length === 0) return getDefaultTenantConfig();
    const tenant = tenantResult[0];
    const integrations = await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, tenantId));
    return {
      id: tenant.id,
      businessName: tenant.businessName,
      industry: tenant.industry,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      plan: tenant.plan,
      stripeCustomerId: tenant.stripeCustomerId,
      billingStatus: tenant.billingStatus,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      brandName: tenant.brandName,
      createdAt: tenant.createdAt,
      integrations: integrations.map((i) => ({
        id: i.id,
        service: i.service,
        mode: i.mode,
        apiKeyEncrypted: i.apiKeyEncrypted,
        configJson: i.configJson,
        createdAt: i.createdAt,
      })),
    };
  } catch (error) {
    console.error("[Tenant Service] Error:", error);
    return getDefaultTenantConfig();
  }
}

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain)).limit(1);
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Tenant Service] Subdomain lookup error:", error);
    return null;
  }
}

function getDefaultTenantConfig(): DefaultTenantConfig {
  return {
    id: null,
    businessName: "Default Business",
    industry: "painting",
    subdomain: null,
    customDomain: null,
    plan: "starter",
    stripeCustomerId: null,
    billingStatus: "active",
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
    brandName: null,
    createdAt: new Date(),
    integrations: [],
  };
}
