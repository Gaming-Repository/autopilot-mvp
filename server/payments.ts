import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { payments, invoices, InsertPayment, Payment, InsertInvoice, Invoice } from "../drizzle/schema";

/**
 * Create a payment record
 */
export async function createPayment(payment: InsertPayment): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(payments).values(payment);
    const id = result[0]?.insertId;
    if (!id) return null;

    const created = await db.select().from(payments)
      .where(eq(payments.id, id as number))
      .limit(1);

    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Payments] Failed to create payment:", error);
    return null;
  }
}

/**
 * Get user's payment history
 */
export async function getUserPayments(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { payments: [], total: 0 };

  try {
    const result = await db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select().from(payments)
      .where(eq(payments.userId, userId));

    return {
      payments: result,
      total: countResult.length,
    };
  } catch (error) {
    console.error("[Payments] Failed to get user payments:", error);
    return { payments: [], total: 0 };
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: number, userId: number): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(payments)
      .where(and(eq(payments.id, id), eq(payments.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Payments] Failed to get payment:", error);
    return null;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(id: number, userId: number, status: string): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(payments)
      .set({ status: status as any })
      .where(and(eq(payments.id, id), eq(payments.userId, userId)));

    return getPaymentById(id, userId);
  } catch (error) {
    console.error("[Payments] Failed to update payment status:", error);
    return null;
  }
}

/**
 * Create invoice
 */
export async function createInvoice(invoice: InsertInvoice): Promise<Invoice | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(invoices).values(invoice);
    const id = result[0]?.insertId;
    if (!id) return null;

    const created = await db.select().from(invoices)
      .where(eq(invoices.id, id as number))
      .limit(1);

    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[Payments] Failed to create invoice:", error);
    return null;
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: number, userId: number): Promise<Invoice | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Payments] Failed to get invoice:", error);
    return null;
  }
}

/**
 * Get user's invoices
 */
export async function getUserInvoices(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { invoices: [], total: 0 };

  try {
    const result = await db.select().from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select().from(invoices)
      .where(eq(invoices.userId, userId));

    return {
      invoices: result,
      total: countResult.length,
    };
  } catch (error) {
    console.error("[Payments] Failed to get user invoices:", error);
    return { invoices: [], total: 0 };
  }
}

/**
 * Process refund
 */
export async function processRefund(paymentId: number, userId: number, reason: string): Promise<Payment | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const payment = await getPaymentById(paymentId, userId);
    if (!payment) return null;

    await db.update(payments)
      .set({
        status: "refunded",
        refundReason: reason,
        refundId: `REFUND-${Date.now()}`,
      })
      .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)));

    return getPaymentById(paymentId, userId);
  } catch (error) {
    console.error("[Payments] Failed to process refund:", error);
    return null;
  }
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${random}`;
}
