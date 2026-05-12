ALTER TABLE "leads" ADD "tenantId" int DEFAULT 1 NOT NULL;
CREATE INDEX "tenantId_idx" ON "leads" ("tenantId");
