ALTER TABLE "crew_members" ADD "tenantId" int DEFAULT 1 NOT NULL;
CREATE INDEX "tenantId_idx" ON "crew_members" ("tenantId");
