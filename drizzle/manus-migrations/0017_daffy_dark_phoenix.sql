ALTER TABLE "blog_posts" ADD "tenantId" int DEFAULT 1 NOT NULL;
ALTER TABLE "blog_images" ADD "tenantId" int DEFAULT 1 NOT NULL;
CREATE INDEX "tenantId_idx" ON "blog_posts" ("tenantId");
CREATE INDEX "tenantId_idx" ON "blog_images" ("tenantId");
