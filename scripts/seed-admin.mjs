/**
 * seed-admin.mjs
 *
 * Creates or updates the default admin user in the database.
 * Run with: node scripts/seed-admin.mjs
 *
 * Uses env vars:
 *   OWNER_EMAIL    (default: admin@paintersmax.app)
 *   OWNER_PASSWORD (default: paintersmax2026)
 *   DATABASE_URL   (required)
 */

import "dotenv/config";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const email = process.env.OWNER_EMAIL ?? "admin@paintersmax.app";
const password = process.env.OWNER_PASSWORD ?? "paintersmax2026";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[seed-admin] ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require" });

async function seedAdmin() {
  console.log(`[seed-admin] Seeding admin user: ${email}`);

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Check if user already exists
  const existing = await sql`
    SELECT id, email, role FROM users WHERE email = ${email} LIMIT 1
  `;

  if (existing.length > 0) {
    // Update password and ensure admin role
    await sql`
      UPDATE users
      SET "passwordHash" = ${passwordHash},
          role = 'admin',
          "updatedAt" = NOW()
      WHERE email = ${email}
    `;
    console.log(`[seed-admin] Updated existing user (id=${existing[0].id}) to admin with new password`);
  } else {
    // Insert new admin user
    // openId is required (unique), use email as a stable identifier
    const openId = `email:${email}`;
    await sql`
      INSERT INTO users ("openId", name, email, "passwordHash", role, "loginMethod", "createdAt", "updatedAt", "lastSignedIn")
      VALUES (
        ${openId},
        'Admin',
        ${email},
        ${passwordHash},
        'admin',
        'email',
        NOW(),
        NOW(),
        NOW()
      )
    `;
    console.log(`[seed-admin] Created new admin user: ${email}`);
  }

  await sql.end();
  console.log("[seed-admin] Done.");
}

seedAdmin().catch((err) => {
  console.error("[seed-admin] Error:", err);
  process.exit(1);
});
