import { eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "./db";
import { bookings, InsertBooking, Booking } from "../drizzle/schema";

/**
 * Create a new booking
 */
export async function createBooking(booking: InsertBooking): Promise<Booking | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(bookings).values(booking);
    const id = result[0]?.insertId;
    if (!id) return null;

    const created = await db.select().from(bookings).where(eq(bookings.id, id as number)).limit(1);
    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Bookings] Failed to create booking:", error);
    return null;
  }
}

/**
 * Get user's bookings with pagination
 */
export async function getUserBookings(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return { bookings: [], total: 0 };

  try {
    const result = await db.select().from(bookings)
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.startTime))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db.select().from(bookings)
      .where(eq(bookings.userId, userId));

    return {
      bookings: result,
      total: countResult.length,
    };
  } catch (error) {
    console.error("[Bookings] Failed to get user bookings:", error);
    return { bookings: [], total: 0 };
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(id: number, userId: number): Promise<Booking | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Bookings] Failed to get booking:", error);
    return null;
  }
}

/**
 * Update booking
 */
export async function updateBooking(id: number, userId: number, updates: Partial<Booking>): Promise<Booking | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(bookings)
      .set(updates)
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)));

    return getBookingById(id, userId);
  } catch (error) {
    console.error("[Bookings] Failed to update booking:", error);
    return null;
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(bookings)
      .set({ status: "cancelled" })
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)));

    return true;
  } catch (error) {
    console.error("[Bookings] Failed to cancel booking:", error);
    return false;
  }
}

/**
 * Get bookings for a date range (for calendar view)
 */
export async function getBookingsByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        gte(bookings.startTime, startDate),
        lte(bookings.endTime, endDate)
      ))
      .orderBy(bookings.startTime);

    return result;
  } catch (error) {
    console.error("[Bookings] Failed to get bookings by date range:", error);
    return [];
  }
}

/**
 * Check for booking conflicts (overlapping times)
 */
export async function checkBookingConflict(userId: number, startTime: Date, endTime: Date, excludeId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const conditions = [
      eq(bookings.userId, userId),
      gte(bookings.startTime, new Date(startTime.getTime() - 60 * 60 * 1000)), // 1 hour buffer
      lte(bookings.endTime, new Date(endTime.getTime() + 60 * 60 * 1000))
    ];

    if (excludeId) {
      // Exclude current booking when updating
      conditions.push(eq(bookings.id, excludeId));
    }

    const result = await db.select().from(bookings)
      .where(and(...conditions));

    return result.length > 0;
  } catch (error) {
    console.error("[Bookings] Failed to check booking conflict:", error);
    return false;
  }
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(bookings)
      .set({ reminderSentAt: new Date() })
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)));

    return true;
  } catch (error) {
    console.error("[Bookings] Failed to mark reminder sent:", error);
    return false;
  }
}

/**
 * Mark confirmation as sent
 */
export async function markConfirmationSent(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(bookings)
      .set({ confirmationSentAt: new Date() })
      .where(and(eq(bookings.id, id), eq(bookings.userId, userId)));

    return true;
  } catch (error) {
    console.error("[Bookings] Failed to mark confirmation sent:", error);
    return false;
  }
}
