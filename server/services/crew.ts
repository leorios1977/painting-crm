/**
 * server/services/crew.ts — Crew member CRUD helpers
 */
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { crewMembers } from "../../drizzle/schema";
import type { InsertCrewMember } from "../../drizzle/schema";

/** List all crew members, optionally filtered by status */
export async function listCrewMembers(status?: "active" | "inactive" | "all", tenantId: number = 1) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(crewMembers).where(eq(crewMembers.tenantId, tenantId)).orderBy(crewMembers.name);
  if (!status || status === "all") return rows;
  return rows.filter((r) => r.status === status);
}

/** Get a single crew member by ID */
export async function getCrewMember(id: number, tenantId: number = 1) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(crewMembers).where(and(eq(crewMembers.id, id), eq(crewMembers.tenantId, tenantId)));
  return rows[0] ?? null;
}

/** Create a new crew member */
export async function createCrewMember(
  data: Pick<InsertCrewMember, "name" | "phone" | "email" | "role" | "status" | "tenantId">
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(crewMembers).values({
    name: data.name,
    phone: data.phone ?? null,
    email: data.email ?? null,
    role: data.role ?? null,
    status: data.status ?? "active",
    tenantId: data.tenantId ?? 1,
  });
  const id = (result as any).insertId as number;
  return getCrewMember(id, data.tenantId ?? 1);
}

/** Update an existing crew member */
export async function updateCrewMember(
  id: number,
  data: Partial<Pick<InsertCrewMember, "name" | "phone" | "email" | "role" | "status">>,
  tenantId: number = 1
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(crewMembers).set(data).where(and(eq(crewMembers.id, id), eq(crewMembers.tenantId, tenantId)));
  return getCrewMember(id, tenantId);
}

/** Deactivate a crew member (soft delete) */
export async function deactivateCrewMember(id: number, tenantId: number = 1) {
  return updateCrewMember(id, { status: "inactive" }, tenantId);
}

/** Reactivate a crew member */
export async function reactivateCrewMember(id: number, tenantId: number = 1) {
  return updateCrewMember(id, { status: "active" }, tenantId);
}
