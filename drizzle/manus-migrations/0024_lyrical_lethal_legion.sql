ALTER TABLE "app_settings" ADD "tenantId" int DEFAULT 1 NOT NULL;
ALTER TABLE "attachments" ADD "tenantId" int DEFAULT 1 NOT NULL;
ALTER TABLE "communication_log" ADD "tenantId" int DEFAULT 1 NOT NULL;
CREATE INDEX "tenantId_idx" ON "app_settings" ("tenantId");
CREATE INDEX "tenantId_idx" ON "attachments" ("tenantId");
CREATE INDEX "tenantId_idx" ON "communication_log" ("tenantId");
