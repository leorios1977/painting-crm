/**
 * One-time migration: add ownerName, phone, city, state, website, plan
 * columns to app_settings table.
 */
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

try {
  await sql`ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "ownerName" varchar(200)`;
  await sql`ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "phone" varchar(30)`;
  await sql`ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "city" varchar(100)`;
  await sql`ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "state" varchar(50)`;
  await sql`ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "website" varchar(500)`;
  await sql`ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "plan" varchar(50) DEFAULT 'starter'`;
  console.log("✓ Migration applied successfully");
} catch (err) {
  console.error("Migration error:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
