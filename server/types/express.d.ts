import { TenantConfig, DefaultTenantConfig } from '../services/tenant';

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantConfig | DefaultTenantConfig;
      tenantId?: number;
    }
  }
}

export {};
