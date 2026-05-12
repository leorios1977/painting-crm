ALTER TABLE "automation_rules" ADD "tenantId" int DEFAULT 1 NOT NULL;
ALTER TABLE "email_templates" ADD "tenantId" int DEFAULT 1 NOT NULL;
CREATE INDEX "tenantId_idx" ON "automation_rules" ("tenantId");
CREATE INDEX "tenantId_idx" ON "email_templates" ("tenantId");
