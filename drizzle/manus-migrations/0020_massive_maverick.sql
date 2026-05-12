ALTER TABLE "job_photos" ADD "tenantId" int DEFAULT 1 NOT NULL;
CREATE INDEX "tenantId_idx" ON "job_photos" ("tenantId");
