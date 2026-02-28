import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getOrCreateWhatsappConversation,
  getUserWhatsappConversations,
  getWhatsappConversationById,
  addMessageToWhatsappConversation,
  saveWhatsappAutoReply,
  flagWhatsappForReview,
  getFlaggedWhatsappConversations,
} from "./whatsapp-replies";
import { canUseFeature, incrementUsage } from "./db";
import { getArticlesByCategory } from "./knowledge-base";
import { invokeGemini } from "./gemini-llm";

export const whatsappRepliesRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { conversations, total } = await getUserWhatsappConversations(user.id, input.limit, input.offset);
      return { conversations, total };
    }),

  getById: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await getWhatsappConversationById(input, user.id);
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...conversation,
        messageHistory: conversation.messageHistory ? JSON.parse(conversation.messageHistory as any) : [],
      };
    }),

  addMessage: protectedProcedure
    .input(z.object({
      customerPhone: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const conversation = await getOrCreateWhatsappConversation(user.id, input.customerPhone);
      if (!conversation) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updated = await addMessageToWhatsappConversation(conversation.id, user.id, {
        role: "user",
        content: input.content,
        timestamp: new Date(),
      });

      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return {
        ...updated,
        messageHistory: updated.messageHistory ? JSON.parse(updated.messageHistory as any) : [],
      };
    }),

  generateReply: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check tier limit
      const canReply = await canUseFeature(user.id, "whatsappRepliesUsed");
      if (!canReply) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached your WhatsApp reply limit for this month.",
        });
      }

      const conversation = await getWhatsappConversationById(input.conversationId, user.id);
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND" });

      try {
        // Get knowledge base context
        const knowledgeArticles = await getArticlesByCategory(user.id, "FAQ");
        const knowledgeContext = knowledgeArticles
          .map(a => `${a.title}: ${a.content}`)
          .join("\n\n");

        const messageHistory = conversation.messageHistory ? JSON.parse(conversation.messageHistory as any) : [];
        const conversationText = messageHistory
          .map((m: any) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
          .join("\n");

        // Generate reply using LLM - keep it concise for WhatsApp
        const systemPrompt = `You are a helpful WhatsApp customer service assistant. Keep responses brief and friendly (under 160 characters when possible). Use the following knowledge base to answer customer questions accurately. If you're not confident, respond with "I'm not sure. Please contact support."

Knowledge Base:
${knowledgeContext || "No knowledge base articles available."}`;

        const userMessage = `Please generate a brief WhatsApp reply to this customer conversation:\n\n${conversationText}`;

        const response = await invokeGemini({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const replyContent = typeof messageContent === "string" ? messageContent : "";

        // Save the generated reply
        await saveWhatsappAutoReply(input.conversationId, user.id, replyContent);

        // Increment usage
        await incrementUsage(user.id, "whatsappRepliesUsed");

        return {
          replyContent: replyContent || "",
          confidence: replyContent?.includes("I'm not sure") ? "low" : "high",
          characterCount: replyContent?.length || 0,
        };
      } catch (error) {
        console.error("[WhatsAppReplies] Failed to generate reply:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate reply. Please try again.",
        });
      }
    }),

  flagForReview: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const success = await flagWhatsappForReview(input, user.id);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { success: true };
    }),

  getFlagged: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const conversations = await getFlaggedWhatsappConversations(user.id);
    return conversations;
  }),
});
