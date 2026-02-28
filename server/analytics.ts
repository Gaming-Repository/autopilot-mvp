import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { bookings, emailConversations, whatsappConversations, payments } from "../drizzle/schema";

/**
 * Get booking analytics for a date range
 */
export async function getBookingAnalytics(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0 };

  try {
    const result = await db.select().from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        gte(bookings.startTime, startDate),
        lte(bookings.endTime, endDate)
      ));

    const total = result.length;
    const completed = result.filter(b => b.status === "completed").length;
    const cancelled = result.filter(b => b.status === "cancelled").length;
    const noShow = result.filter(b => b.status === "no-show").length;
    const revenue = result.reduce((sum, b) => {
      const amount = parseFloat(b.amount as any || "0");
      return sum + (b.paymentStatus === "paid" ? amount : 0);
    }, 0);

    return { total, completed, cancelled, noShow, revenue };
  } catch (error) {
    console.error("[Analytics] Failed to get booking analytics:", error);
    return { total: 0, completed: 0, cancelled: 0, noShow: 0, revenue: 0 };
  }
}

/**
 * Get email reply analytics
 */
export async function getEmailAnalytics(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalConversations: 0, repliesGenerated: 0, flaggedForReview: 0 };

  try {
    const result = await db.select().from(emailConversations)
      .where(and(
        eq(emailConversations.userId, userId),
        gte(emailConversations.lastMessageAt, startDate),
        lte(emailConversations.lastMessageAt, endDate)
      ));

    const totalConversations = result.length;
    const repliesGenerated = result.filter(c => c.autoReplyGenerated).length;
    const flaggedForReview = result.filter(c => c.flaggedForReview).length;

    return { totalConversations, repliesGenerated, flaggedForReview };
  } catch (error) {
    console.error("[Analytics] Failed to get email analytics:", error);
    return { totalConversations: 0, repliesGenerated: 0, flaggedForReview: 0 };
  }
}

/**
 * Get WhatsApp reply analytics
 */
export async function getWhatsappAnalytics(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalConversations: 0, repliesGenerated: 0, flaggedForReview: 0 };

  try {
    const result = await db.select().from(whatsappConversations)
      .where(and(
        eq(whatsappConversations.userId, userId),
        gte(whatsappConversations.lastMessageAt, startDate),
        lte(whatsappConversations.lastMessageAt, endDate)
      ));

    const totalConversations = result.length;
    const repliesGenerated = result.filter(c => c.autoReplyGenerated).length;
    const flaggedForReview = result.filter(c => c.flaggedForReview).length;

    return { totalConversations, repliesGenerated, flaggedForReview };
  } catch (error) {
    console.error("[Analytics] Failed to get WhatsApp analytics:", error);
    return { totalConversations: 0, repliesGenerated: 0, flaggedForReview: 0 };
  }
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, completedPayments: 0, pendingPayments: 0, refunds: 0 };

  try {
    const result = await db.select().from(payments)
      .where(and(
        eq(payments.userId, userId),
        gte(payments.createdAt, startDate),
        lte(payments.createdAt, endDate)
      ));

    const totalRevenue = result.reduce((sum, p) => {
      const amount = parseFloat(p.amount as any || "0");
      return sum + (p.status === "completed" ? amount : 0);
    }, 0);

    const completedPayments = result.filter(p => p.status === "completed").length;
    const pendingPayments = result.filter(p => p.status === "pending").length;
    const refunds = result.reduce((sum, p) => {
      const amount = parseFloat(p.amount as any || "0");
      return sum + (p.status === "refunded" ? amount : 0);
    }, 0);

    return { totalRevenue, completedPayments, pendingPayments, refunds };
  } catch (error) {
    console.error("[Analytics] Failed to get revenue analytics:", error);
    return { totalRevenue: 0, completedPayments: 0, pendingPayments: 0, refunds: 0 };
  }
}

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(userId: number) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const bookingMetrics = await getBookingAnalytics(userId, thirtyDaysAgo, now);
  const emailMetrics = await getEmailAnalytics(userId, thirtyDaysAgo, now);
  const whatsappMetrics = await getWhatsappAnalytics(userId, thirtyDaysAgo, now);
  const revenueMetrics = await getRevenueAnalytics(userId, thirtyDaysAgo, now);

  return {
    period: "last_30_days",
    bookings: bookingMetrics,
    email: emailMetrics,
    whatsapp: whatsappMetrics,
    revenue: revenueMetrics,
  };
}
