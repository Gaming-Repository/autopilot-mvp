import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow with subscription and trial fields.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "basic", "pro"]).default("free").notNull(),
  trialStartedAt: timestamp("trialStartedAt").defaultNow().notNull(),
  trialDaysRemaining: int("trialDaysRemaining").default(30).notNull(),
  isEarlyAdopter: boolean("isEarlyAdopter").default(false).notNull(),
  trialConvertedAt: timestamp("trialConvertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Early adopter counter for tracking first 10 signups
 */
export const earlyAdopterCounter = mysqlTable("earlyAdopterCounter", {
  id: int("id").autoincrement().primaryKey(),
  slotsUsed: int("slotsUsed").default(0).notNull(),
  maxSlots: int("maxSlots").default(10).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EarlyAdopterCounter = typeof earlyAdopterCounter.$inferSelect;

/**
 * Subscription tier definitions
 */
export const subscriptionTiers = mysqlTable("subscriptionTiers", {
  id: int("id").autoincrement().primaryKey(),
  name: mysqlEnum("name", ["free", "basic", "pro"]).notNull().unique(),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }),
  bookingsPerMonth: int("bookingsPerMonth").default(-1).notNull(),
  emailRepliesPerMonth: int("emailRepliesPerMonth").default(-1).notNull(),
  whatsappRepliesPerMonth: int("whatsappRepliesPerMonth").default(-1).notNull(),
  socialRepliesPerMonth: int("socialRepliesPerMonth").default(-1).notNull(),
  knowledgeBaseEditable: boolean("knowledgeBaseEditable").default(false).notNull(),
  brandedBookingPage: boolean("brandedBookingPage").default(false).notNull(),
  paypalPayments: boolean("paypalPayments").default(false).notNull(),
  teamMembers: int("teamMembers").default(1).notNull(),
  analyticsLevel: mysqlEnum("analyticsLevel", ["basic", "full"]).default("basic").notNull(),
});

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;

/**
 * Bookings table
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled", "no-show"]).default("pending").notNull(),
  reminderSentAt: timestamp("reminderSentAt"),
  confirmationSentAt: timestamp("confirmationSentAt"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  paymentId: varchar("paymentId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Knowledge base articles
 */
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  searchKeywords: text("searchKeywords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBaseArticle = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseArticle = typeof knowledgeBase.$inferInsert;

/**
 * Email conversations with message history
 */
export const emailConversations = mysqlTable("emailConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  messageHistory: json("messageHistory"),
  lastMessageAt: timestamp("lastMessageAt").notNull(),
  autoReplyGenerated: boolean("autoReplyGenerated").default(false).notNull(),
  autoReplyContent: text("autoReplyContent"),
  flaggedForReview: boolean("flaggedForReview").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailConversation = typeof emailConversations.$inferSelect;
export type InsertEmailConversation = typeof emailConversations.$inferInsert;

/**
 * WhatsApp conversations with message history
 */
export const whatsappConversations = mysqlTable("whatsappConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  messageHistory: json("messageHistory"),
  lastMessageAt: timestamp("lastMessageAt").notNull(),
  autoReplyGenerated: boolean("autoReplyGenerated").default(false).notNull(),
  autoReplyContent: text("autoReplyContent"),
  flaggedForReview: boolean("flaggedForReview").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation = typeof whatsappConversations.$inferInsert;

/**
 * Usage tracking per user per month
 */
export const usageTracking = mysqlTable("usageTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: date("month").notNull(),
  bookingsUsed: int("bookingsUsed").default(0).notNull(),
  emailRepliesUsed: int("emailRepliesUsed").default(0).notNull(),
  whatsappRepliesUsed: int("whatsappRepliesUsed").default(0).notNull(),
  socialRepliesUsed: int("socialRepliesUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [unique().on(table.userId, table.month)]);

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

/**
 * Payments table
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookingId: int("bookingId"),
  subscriptionId: varchar("subscriptionId", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["paypal", "stripe"]).notNull(),
  paymentId: varchar("paymentId", { length: 255 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  invoiceId: varchar("invoiceId", { length: 255 }),
  refundId: varchar("refundId", { length: 255 }),
  refundReason: text("refundReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Invoices table
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  paymentId: int("paymentId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 255 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  pdfUrl: varchar("pdfUrl", { length: 1024 }),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Branded booking pages
 */
export const brandedBookingPages = mysqlTable("brandedBookingPages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  customDomain: varchar("customDomain", { length: 255 }),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#000000").notNull(),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#FFFFFF").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrandedBookingPage = typeof brandedBookingPages.$inferSelect;
export type InsertBrandedBookingPage = typeof brandedBookingPages.$inferInsert;

/**
 * Notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["booking_confirmation", "booking_reminder", "payment_receipt", "owner_alert", "new_inquiry"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;