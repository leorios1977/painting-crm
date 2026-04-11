/**
 * server/services/crew.ts — Crew member CRUD helpers
 */
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { crewMembers } from "../../drizzle/schema";
import type { InsertCrewMember } from "../../drizzle/schema";

/** List all crew members, optionally filtered by status */
export async function listCrewMembers(status?: "active" | "inactive" | "all") {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(crewMembers).orderBy(crewMembers.name);
  if (!status || status === "all") return rows;
  return rows.filter((r) => r.status === status);
}

/** Get a single crew member by ID */
export async function getCrewMember(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crewMembers).where(eq(crewMembers.id, id));
  return rows[0] ?? null;
}

/** Create a new crew member */
export async function createCrewMember(
  data: Pick<InsertCrewMember, "name" | "phone" | "email" | "role" | "status">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(crewMembers).values({
    name: data.name,
    phone: data.phone ?? null,
    email: data.email ?? null,
    role: data.role ?? null,
    status: data.status ?? "active",
  });
  const id = (result as any).insertId as number;
  return getCrewMember(id);
}

/** Update an existing crew member */
export async function updateCrewMember(
  id: number,
  data: Partial<Pick<InsertCrewMember, "name" | "phone" | "email" | "role" | "status">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crewMembers).set(data).where(eq(crewMembers.id, id));
  return getCrewMember(id);
}

/** Deactivate a crew member (soft delete) */
export async function deactivateCrewMember(id: number) {
  return updateCrewMember(id, { status: "inactive" });
}

/** Reactivate a crew member */
export async function reactivateCrewMember(id: number) {
  return updateCrewMember(id, { status: "active" });
}
