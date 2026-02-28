import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { brandedBookingPages, InsertBrandedBookingPage, BrandedBookingPage } from "../drizzle/schema";

/**
 * Create or update branded booking page
 */
export async function createOrUpdateBrandedPage(page: InsertBrandedBookingPage): Promise<BrandedBookingPage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Check if page exists
    const existing = await db.select().from(brandedBookingPages)
      .where(eq(brandedBookingPages.userId, page.userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db.update(brandedBookingPages)
        .set(page)
        .where(eq(brandedBookingPages.userId, page.userId));

      return getPageByUserId(page.userId);
    } else {
      // Create new
      const result = await db.insert(brandedBookingPages).values(page);
      const id = result[0]?.insertId;
      if (!id) return null;

      const created = await db.select().from(brandedBookingPages)
        .where(eq(brandedBookingPages.id, id as number))
        .limit(1);

      return created.length > 0 ? created[0] : null;
    }
  } catch (error) {
    console.error("[BrandedPages] Failed to create/update page:", error);
    return null;
  }
}

/**
 * Get branded page by user ID
 */
export async function getPageByUserId(userId: number): Promise<BrandedBookingPage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(brandedBookingPages)
      .where(eq(brandedBookingPages.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[BrandedPages] Failed to get page:", error);
    return null;
  }
}

/**
 * Get public branded page by slug
 */
export async function getPublicPageBySlug(slug: string): Promise<BrandedBookingPage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(brandedBookingPages)
      .where(and(
        eq(brandedBookingPages.slug, slug),
        eq(brandedBookingPages.isActive, true)
      ))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[BrandedPages] Failed to get public page:", error);
    return null;
  }
}

/**
 * Update page settings
 */
export async function updatePageSettings(userId: number, updates: Partial<BrandedBookingPage>): Promise<BrandedBookingPage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(brandedBookingPages)
      .set(updates)
      .where(eq(brandedBookingPages.userId, userId));

    return getPageByUserId(userId);
  } catch (error) {
    console.error("[BrandedPages] Failed to update page:", error);
    return null;
  }
}

/**
 * Toggle page active status
 */
export async function togglePageActive(userId: number, isActive: boolean): Promise<BrandedBookingPage | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(brandedBookingPages)
      .set({ isActive })
      .where(eq(brandedBookingPages.userId, userId));

    return getPageByUserId(userId);
  } catch (error) {
    console.error("[BrandedPages] Failed to toggle active:", error);
    return null;
  }
}

/**
 * Generate unique slug
 */
export function generateSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}
