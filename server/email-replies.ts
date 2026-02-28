import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { emailConversations, InsertEmailConversation, EmailConversation } from "../drizzle/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * Create or get email conversation
 */
export async function getOrCreateEmailConversation(
  userId: number,
  senderEmail: string,
  subject: string
): Promise<EmailConversation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Try to find existing conversation
    const existing = await db.select().from(emailConversations)
      .where(and(
        eq(emailConversations.userId, userId),
        eq(emailConversations.senderEmail, senderEmail),
        eq(emailConversations.subject, subject)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new conversation
    const result = await db.insert(emailConversations).values({
      userId,
      senderEmail,
      subject,
      messageHistory: JSON.stringify([]),
      lastMessageAt: new Date(),
      autoReplyGenerated: false,
      flaggedForReview: false,
    });

    const id = result[0]?.insertId;
    if (!id) return null;

    const created = await db.select().from(emailConversations)
      .where(eq(emailConversations.id, id as number))
      .limit(1);

    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[EmailReplies] Failed to get/create conversation:", error);
    return null;
  }
}

/**
 * Get user's email conversations
 */
export async function getUserEmailConversations(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { conversations: [], total: 0 };

  try {
    const result = await db.select().from(emailConversations)
      .where(eq(emailConversations.userId, userId))
      .orderBy(desc(emailConversations.lastMessageAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select().from(emailConversations)
      .where(eq(emailConversations.userId, userId));

    return {
      conversations: result,
      total: countResult.length,
    };
  } catch (error) {
    console.error("[EmailReplies] Failed to get conversations:", error);
    return { conversations: [], total: 0 };
  }
}

/**
 * Get conversation by ID
 */
export async function getEmailConversationById(id: number, userId: number): Promise<EmailConversation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(emailConversations)
      .where(and(eq(emailConversations.id, id), eq(emailConversations.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[EmailReplies] Failed to get conversation:", error);
    return null;
  }
}

/**
 * Add message to conversation
 */
export async function addMessageToConversation(
  id: number,
  userId: number,
  message: Message
): Promise<EmailConversation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const conversation = await getEmailConversationById(id, userId);
    if (!conversation) return null;

    const history = conversation.messageHistory ? JSON.parse(conversation.messageHistory as any) : [];
    history.push(message);

    await db.update(emailConversations)
      .set({
        messageHistory: JSON.stringify(history),
        lastMessageAt: new Date(),
      })
      .where(and(eq(emailConversations.id, id), eq(emailConversations.userId, userId)));

    return getEmailConversationById(id, userId);
  } catch (error) {
    console.error("[EmailReplies] Failed to add message:", error);
    return null;
  }
}

/**
 * Save auto-reply to conversation
 */
export async function saveAutoReply(
  id: number,
  userId: number,
  replyContent: string
): Promise<EmailConversation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(emailConversations)
      .set({
        autoReplyGenerated: true,
        autoReplyContent: replyContent,
      })
      .where(and(eq(emailConversations.id, id), eq(emailConversations.userId, userId)));

    return getEmailConversationById(id, userId);
  } catch (error) {
    console.error("[EmailReplies] Failed to save auto-reply:", error);
    return null;
  }
}

/**
 * Flag conversation for review
 */
export async function flagForReview(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(emailConversations)
      .set({ flaggedForReview: true })
      .where(and(eq(emailConversations.id, id), eq(emailConversations.userId, userId)));

    return true;
  } catch (error) {
    console.error("[EmailReplies] Failed to flag for review:", error);
    return false;
  }
}

/**
 * Get flagged conversations
 */
export async function getFlaggedConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(emailConversations)
      .where(and(
        eq(emailConversations.userId, userId),
        eq(emailConversations.flaggedForReview, true)
      ))
      .orderBy(desc(emailConversations.lastMessageAt));

    return result;
  } catch (error) {
    console.error("[EmailReplies] Failed to get flagged conversations:", error);
    return [];
  }
}
