import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import { blogPosts, blogImages, type InsertBlogPost, type InsertBlogImage } from "../../drizzle/schema";

/** Generate a URL-friendly slug from a title */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 200);
}

/** Ensure slug is unique by appending a counter if needed */
async function uniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let slug = baseSlug;
  let counter = 0;
  while (true) {
    const candidate = counter === 0 ? slug : `${slug}-${counter}`;
    const existing = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(
        excludeId
          ? and(eq(blogPosts.slug, candidate), sql`${blogPosts.id} != ${excludeId}`)
          : eq(blogPosts.slug, candidate)
      )
      .limit(1);
    if (existing.length === 0) return candidate;
    counter++;
  }
}

/** List all blog posts (admin view — all statuses) */
export async function listAllPosts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));
}

/** List published blog posts (public view) */
export async function listPublishedPosts() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));
}

/** Get a single post by slug (public) */
export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Get a single post by ID (admin) */
export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Create a new blog post */
export async function createPost(data: {
  title: string;
  content?: string;
  excerpt?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  featuredImageUrl?: string;
  projectAddress?: string;
  projectLatitude?: string;
  projectLongitude?: string;
  status?: "draft" | "published" | "archived";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slug = await uniqueSlug(slugify(data.title));
  const now = data.status === "published" ? new Date() : undefined;
  const [result] = await db.insert(blogPosts).values({
    title: data.title,
    slug,
    content: data.content ?? null,
    excerpt: data.excerpt ?? null,
    seoTitle: data.seoTitle ?? null,
    seoKeywords: data.seoKeywords ?? null,
    seoDescription: data.seoDescription ?? null,
    featuredImageUrl: data.featuredImageUrl ?? null,
    projectAddress: data.projectAddress ?? null,
    projectLatitude: data.projectLatitude ?? null,
    projectLongitude: data.projectLongitude ?? null,
    status: data.status ?? "draft",
    publishedAt: now,
  });
  return { id: result.insertId, slug };
}

/** Update an existing blog post */
export async function updatePost(
  id: number,
  data: {
    title?: string;
    content?: string;
    excerpt?: string;
    seoTitle?: string;
    seoKeywords?: string;
    seoDescription?: string;
    featuredImageUrl?: string;
    projectAddress?: string;
    projectLatitude?: string;
    projectLongitude?: string;
    status?: "draft" | "published" | "archived";
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) {
    updates.title = data.title;
    updates.slug = await uniqueSlug(slugify(data.title), id);
  }
  if (data.content !== undefined) updates.content = data.content;
  if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
  if (data.seoTitle !== undefined) updates.seoTitle = data.seoTitle;
  if (data.seoKeywords !== undefined) updates.seoKeywords = data.seoKeywords;
  if (data.seoDescription !== undefined) updates.seoDescription = data.seoDescription;
  if (data.featuredImageUrl !== undefined) updates.featuredImageUrl = data.featuredImageUrl;
  if (data.projectAddress !== undefined) updates.projectAddress = data.projectAddress;
  if (data.projectLatitude !== undefined) updates.projectLatitude = data.projectLatitude;
  if (data.projectLongitude !== undefined) updates.projectLongitude = data.projectLongitude;
  if (data.status !== undefined) {
    updates.status = data.status;
    // Set publishedAt when first published
    if (data.status === "published") {
      const existing = await getPostById(id);
      if (existing && !existing.publishedAt) {
        updates.publishedAt = new Date();
      }
    }
  }

  if (Object.keys(updates).length === 0) return;
  await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));
}

/** Delete a blog post and its images */
export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogImages).where(eq(blogImages.postId, id));
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

/** Get images for a post */
export async function getPostImages(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(blogImages)
    .where(eq(blogImages.postId, postId))
    .orderBy(blogImages.displayOrder);
}

/** Add an image to a post */
export async function addPostImage(data: {
  postId: number;
  imageUrl: string;
  caption?: string;
  displayOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(blogImages).values({
    postId: data.postId,
    imageUrl: data.imageUrl,
    caption: data.caption ?? null,
    displayOrder: data.displayOrder ?? 0,
  });
  return { id: result.insertId };
}

/** Delete a blog image */
export async function deletePostImage(imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogImages).where(eq(blogImages.id, imageId));
}

/** Get related posts (same status=published, excluding current, limit 3) */
export async function getRelatedPosts(currentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      featuredImageUrl: blogPosts.featuredImageUrl,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.status, "published"), sql`${blogPosts.id} != ${currentId}`))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);
}
