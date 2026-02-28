import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createArticle,
  getUserArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  searchArticles,
  getArticlesByCategory,
  getDefaultTemplate,
} from "./knowledge-base";
import { getSubscriptionTierDetails } from "./db";

export const knowledgeBaseRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Free tier users get read-only default template
      if (user.subscriptionTier === "free") {
        const defaultArticles = await getDefaultTemplate();
        return { articles: defaultArticles, total: defaultArticles.length };
      }

      const { articles, total } = await getUserArticles(user.id, input.limit, input.offset);
      return { articles, total };
    }),

  getById: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const article = await getArticleById(input, user.id);
      if (!article) throw new TRPCError({ code: "NOT_FOUND" });

      return article;
    }),

  create: protectedProcedure
    .input(z.object({
      category: z.string(),
      title: z.string(),
      content: z.string(),
      searchKeywords: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check tier permission
      const tierDetails = await getSubscriptionTierDetails(user.subscriptionTier);
      if (!tierDetails || !tierDetails.knowledgeBaseEditable) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your plan does not allow editing the knowledge base. Please upgrade.",
        });
      }

      const article = await createArticle({
        userId: user.id,
        category: input.category,
        title: input.title,
        content: input.content,
        searchKeywords: input.searchKeywords || null,
        isDefault: false,
      });

      if (!article) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return article;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      category: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      searchKeywords: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check tier permission
      const tierDetails = await getSubscriptionTierDetails(user.subscriptionTier);
      if (!tierDetails || !tierDetails.knowledgeBaseEditable) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your plan does not allow editing the knowledge base.",
        });
      }

      const existing = await getArticleById(input.id, user.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updates: any = {};
      if (input.category) updates.category = input.category;
      if (input.title) updates.title = input.title;
      if (input.content) updates.content = input.content;
      if (input.searchKeywords !== undefined) updates.searchKeywords = input.searchKeywords;

      const updated = await updateArticle(input.id, user.id, updates);
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check tier permission
      const tierDetails = await getSubscriptionTierDetails(user.subscriptionTier);
      if (!tierDetails || !tierDetails.knowledgeBaseEditable) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your plan does not allow editing the knowledge base.",
        });
      }

      const existing = await getArticleById(input, user.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const success = await deleteArticle(input, user.id);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { success: true };
    }),

  search: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (user.subscriptionTier === "free") {
        const defaultArticles = await getDefaultTemplate();
        return defaultArticles.filter(a =>
          a.title.toLowerCase().includes(input.toLowerCase()) ||
          a.content.toLowerCase().includes(input.toLowerCase())
        );
      }

      const articles = await searchArticles(user.id, input);
      return articles;
    }),

  getByCategory: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (user.subscriptionTier === "free") {
        const defaultArticles = await getDefaultTemplate();
        return defaultArticles.filter(a => a.category === input);
      }

      const articles = await getArticlesByCategory(user.id, input);
      return articles;
    }),

  getDefaultTemplate: publicProcedure.query(async () => {
    const articles = await getDefaultTemplate();
    return articles;
  }),
});
