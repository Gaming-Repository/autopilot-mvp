import { eq, and, gte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, earlyAdopterCounter, usageTracking, subscriptionTiers } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Check and claim early adopter slot (atomic operation)
 * Returns true if slot was claimed, false if all slots are taken
 */
export async function claimEarlyAdopterSlot(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get current counter
    const counter = await db.select().from(earlyAdopterCounter).limit(1);
    
    if (counter.length === 0) {
      // Initialize counter if it doesn't exist
      await db.insert(earlyAdopterCounter).values({
        slotsUsed: 1,
        maxSlots: 10,
      });
      return true;
    }

    const current = counter[0];
    if (current.slotsUsed < current.maxSlots) {
      // Claim slot
      await db.update(earlyAdopterCounter)
        .set({ slotsUsed: current.slotsUsed + 1 })
        .where(eq(earlyAdopterCounter.id, current.id));
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Database] Failed to claim early adopter slot:", error);
    return false;
  }
}

/**
 * Get early adopter counter status
 */
export async function getEarlyAdopterStatus() {
  const db = await getDb();
  if (!db) return null;

  try {
    const counter = await db.select().from(earlyAdopterCounter).limit(1);
    return counter.length > 0 ? counter[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get early adopter status:", error);
    return null;
  }
}

/**
 * Get or create usage tracking for current month
 */
export async function getMonthlyUsage(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthDate = monthStart.toISOString().split('T')[0];

    let usage = await db.select().from(usageTracking)
      .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, monthDate as any)))
      .limit(1);

    if (usage.length === 0) {
      // Create new usage record for this month
      await db.insert(usageTracking).values({
        userId,
        month: monthDate as any,
        bookingsUsed: 0,
        emailRepliesUsed: 0,
        whatsappRepliesUsed: 0,
        socialRepliesUsed: 0,
      });
      usage = await db.select().from(usageTracking)
        .where(and(eq(usageTracking.userId, userId), eq(usageTracking.month, monthDate as any)))
        .limit(1);
    }

    return usage.length > 0 ? usage[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get monthly usage:", error);
    return null;
  }
}

/**
 * Increment usage counter
 */
export async function incrementUsage(userId: number, field: 'bookingsUsed' | 'emailRepliesUsed' | 'whatsappRepliesUsed' | 'socialRepliesUsed') {
  const db = await getDb();
  if (!db) return false;

  try {
    const usage = await getMonthlyUsage(userId);
    if (!usage) return false;

    await db.update(usageTracking)
      .set({ [field]: (usage[field] as number) + 1 })
      .where(eq(usageTracking.id, usage.id));
    return true;
  } catch (error) {
    console.error(`[Database] Failed to increment ${field}:`, error);
    return false;
  }
}

/**
 * Get subscription tier details
 */
export async function getSubscriptionTierDetails(tier: 'free' | 'basic' | 'pro') {
  const db = await getDb();
  if (!db) return null;

  try {
    const tierDetails = await db.select().from(subscriptionTiers)
      .where(eq(subscriptionTiers.name, tier))
      .limit(1);
    return tierDetails.length > 0 ? tierDetails[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get subscription tier:", error);
    return null;
  }
}

/**
 * Check if user has exceeded usage limit for a feature
 */
export async function canUseFeature(userId: number, feature: 'bookingsUsed' | 'emailRepliesUsed' | 'whatsappRepliesUsed' | 'socialRepliesUsed'): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) return false;

    const tierDetails = await getSubscriptionTierDetails(user[0].subscriptionTier);
    if (!tierDetails) return false;

    const usage = await getMonthlyUsage(userId);
    if (!usage) return false;

    // Map feature to tier limit
    const limitMap: Record<string, string> = {
      bookingsUsed: 'bookingsPerMonth',
      emailRepliesUsed: 'emailRepliesPerMonth',
      whatsappRepliesUsed: 'whatsappRepliesPerMonth',
      socialRepliesUsed: 'socialRepliesPerMonth',
    };

    const limit = tierDetails[limitMap[feature] as keyof typeof tierDetails] as number;
    const used = usage[feature as keyof typeof usage] as number;

    // -1 means unlimited
    if (limit === -1) return true;
    return used < limit;
  } catch (error) {
    console.error("[Database] Failed to check feature usage:", error);
    return false;
  }
}
