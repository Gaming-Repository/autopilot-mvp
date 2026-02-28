import { eq, and, like, desc } from "drizzle-orm";
import { getDb } from "./db";
import { knowledgeBase, InsertKnowledgeBaseArticle, KnowledgeBaseArticle } from "../drizzle/schema";

/**
 * Create a knowledge base article
 */
export async function createArticle(article: InsertKnowledgeBaseArticle): Promise<KnowledgeBaseArticle | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(knowledgeBase).values(article);
    const id = result[0]?.insertId;
    if (!id) return null;

    const created = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.id, id as number))
      .limit(1);

    return created.length > 0 ? created[0] : null;
  } catch (error) {
    console.error("[KnowledgeBase] Failed to create article:", error);
    return null;
  }
}

/**
 * Get user's knowledge base articles
 */
export async function getUserArticles(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return { articles: [], total: 0 };

  try {
    const result = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.userId, userId))
      .orderBy(desc(knowledgeBase.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.userId, userId));

    return {
      articles: result,
      total: countResult.length,
    };
  } catch (error) {
    console.error("[KnowledgeBase] Failed to get user articles:", error);
    return { articles: [], total: 0 };
  }
}

/**
 * Get article by ID
 */
export async function getArticleById(id: number, userId: number): Promise<KnowledgeBaseArticle | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(knowledgeBase)
      .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[KnowledgeBase] Failed to get article:", error);
    return null;
  }
}

/**
 * Update article
 */
export async function updateArticle(id: number, userId: number, updates: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    await db.update(knowledgeBase)
      .set(updates)
      .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)));

    return getArticleById(id, userId);
  } catch (error) {
    console.error("[KnowledgeBase] Failed to update article:", error);
    return null;
  }
}

/**
 * Delete article
 */
export async function deleteArticle(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(knowledgeBase)
      .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.userId, userId)));

    return true;
  } catch (error) {
    console.error("[KnowledgeBase] Failed to delete article:", error);
    return false;
  }
}

/**
 * Search articles by keywords or title
 */
export async function searchArticles(userId: number, query: string): Promise<KnowledgeBaseArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const searchTerm = `%${query}%`;
    const result = await db.select().from(knowledgeBase)
      .where(and(
        eq(knowledgeBase.userId, userId),
        like(knowledgeBase.title, searchTerm)
      ))
      .orderBy(desc(knowledgeBase.createdAt));

    return result;
  } catch (error) {
    console.error("[KnowledgeBase] Failed to search articles:", error);
    return [];
  }
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(userId: number, category: string): Promise<KnowledgeBaseArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(knowledgeBase)
      .where(and(
        eq(knowledgeBase.userId, userId),
        eq(knowledgeBase.category, category)
      ))
      .orderBy(desc(knowledgeBase.createdAt));

    return result;
  } catch (error) {
    console.error("[KnowledgeBase] Failed to get articles by category:", error);
    return [];
  }
}

/**
 * Get default knowledge base template for free tier users
 */
export async function getDefaultTemplate(): Promise<KnowledgeBaseArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.select().from(knowledgeBase)
      .where(eq(knowledgeBase.isDefault, true))
      .orderBy(knowledgeBase.category);

    return result;
  } catch (error) {
    console.error("[KnowledgeBase] Failed to get default template:", error);
    return [];
  }
}

/**
 * Create default knowledge base template (admin only)
 */
export async function createDefaultTemplate(articles: InsertKnowledgeBaseArticle[]): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    for (const article of articles) {
      await db.insert(knowledgeBase).values({
        ...article,
        isDefault: true,
      });
    }
    return true;
  } catch (error) {
    console.error("[KnowledgeBase] Failed to create default template:", error);
    return false;
  }
}
