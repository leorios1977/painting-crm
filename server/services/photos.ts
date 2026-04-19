/**
 * photos.ts — Before/After photo upload service
 *
 * Uses Manus S3 storage (storagePut) to store job photos.
 * Photos are stored under the key: job-photos/{leadId}/{type}/{nanoid}.{ext}
 * The public URL is persisted in the job_photos table.
 */

import { nanoid } from "nanoid";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { jobPhotos } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface UploadPhotoInput {
  leadId: number;
  type: "before" | "after";
  fileBuffer: Buffer;
  mimeType: string;
  originalName: string;
  caption?: string;
  uploadedBy?: number;
  tenantId?: number;
}

export interface PhotoRecord {
  id: number;
  leadId: number;
  photoUrl: string;
  photoKey: string;
  type: "before" | "after";
  caption: string | null;
  uploadedBy: number | null;
  uploadedAt: Date;
}

/** Upload a photo buffer to S3 and persist the record in job_photos */
export async function uploadPhoto(input: UploadPhotoInput): Promise<PhotoRecord> {
  const { leadId, type, fileBuffer, mimeType, originalName, caption, uploadedBy, tenantId = 1 } = input;

  // Derive extension from mime type or original filename
  const ext = getExtension(mimeType, originalName);
  const key = `job-photos/${leadId}/${type}/${nanoid(10)}.${ext}`;

  // Upload to S3
  const { url } = await storagePut(key, fileBuffer, mimeType);

  // Persist record in DB
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(jobPhotos).values({
    leadId,
    photoUrl: url,
    photoKey: key,
    type,
    caption: caption ?? null,
    uploadedBy: uploadedBy ?? null,
    tenantId,
  });

  // Fetch the inserted record
  const rows = await db
    .select()
    .from(jobPhotos)
    .where(and(eq(jobPhotos.leadId, leadId), eq(jobPhotos.photoKey, key)))
    .limit(1);

  if (!rows[0]) throw new Error("Failed to retrieve inserted photo record");

  return rows[0] as PhotoRecord;
}

/** List all photos for a lead, optionally filtered by type */
export async function listPhotos(
  leadId: number,
  type?: "before" | "after",
  tenantId: number = 1
): Promise<PhotoRecord[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = type
    ? await db
        .select()
        .from(jobPhotos)
        .where(and(eq(jobPhotos.leadId, leadId), eq(jobPhotos.type, type), eq(jobPhotos.tenantId, tenantId)))
    : await db.select().from(jobPhotos).where(and(eq(jobPhotos.leadId, leadId), eq(jobPhotos.tenantId, tenantId)));

  return rows as PhotoRecord[];
}

/** Delete a photo record from the DB (S3 object remains but is unreferenced) */
export async function deletePhoto(photoId: number, tenantId: number = 1): Promise<{ success: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch the record first to confirm it exists
  const rows = await db
    .select()
    .from(jobPhotos)
    .where(and(eq(jobPhotos.id, photoId), eq(jobPhotos.tenantId, tenantId)))
    .limit(1);

  if (!rows[0]) {
    return { success: false };
  }

  await db.delete(jobPhotos).where(and(eq(jobPhotos.id, photoId), eq(jobPhotos.tenantId, tenantId)));
  return { success: true };
}

/** Get all photos for a lead grouped by type — used by CustomerPortal */
export async function getPhotosByLead(leadId: number, tenantId: number = 1): Promise<{
  before: PhotoRecord[];
  after: PhotoRecord[];
}> {
  const all = await listPhotos(leadId, undefined, tenantId);
  return {
    before: all.filter((p) => p.type === "before"),
    after: all.filter((p) => p.type === "after"),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExtension(mimeType: string, originalName: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  };
  if (mimeMap[mimeType]) return mimeMap[mimeType];
  const parts = originalName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
}
