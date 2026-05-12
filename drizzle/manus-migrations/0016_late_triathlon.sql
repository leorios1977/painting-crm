ALTER TABLE "appointments" ADD "tenantId" int DEFAULT 1 NOT NULL;
CREATE INDEX "tenantId_idx" ON "appointments" ("tenantId");
