import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  claimEarlyAdopterSlot,
  getEarlyAdopterStatus,
  getMonthlyUsage,
  getSubscriptionTierDetails,
  canUseFeature,
} from "./db";
import { bookingsRouter } from "./bookings-router";
import { knowledgeBaseRouter } from "./knowledge-base-router";
import { emailRepliesRouter } from "./email-replies-router";
import { whatsappRepliesRouter } from "./whatsapp-replies-router";
import { paymentsRouter } from "./payments-router";
import { analyticsRouter } from "./analytics-router";
import { brandedPagesRouter } from "./branded-pages-router";

export const appRouter = router({
  system: systemRouter,
  bookings: bookingsRouter,
  knowledgeBase: knowledgeBaseRouter,
  emailReplies: emailRepliesRouter,
  whatsappReplies: whatsappRepliesRouter,
  payments: paymentsRouter,
  analytics: analyticsRouter,
  brandedPages: brandedPagesRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    checkTrialStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const now = new Date();
      const trialEndDate = new Date(user.trialStartedAt);
      trialEndDate.setDate(trialEndDate.getDate() + user.trialDaysRemaining);

      const isTrialActive = now < trialEndDate;
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        isTrialActive,
        daysRemaining: Math.max(0, daysRemaining),
        trialEndDate,
        isEarlyAdopter: user.isEarlyAdopter,
        subscriptionTier: user.subscriptionTier,
        trialConvertedAt: user.trialConvertedAt,
      };
    }),
  }),

  subscription: router({
    getEarlyAdopterStatus: publicProcedure.query(async () => {
      const status = await getEarlyAdopterStatus();
      if (!status) return { slotsUsed: 0, slotsRemaining: 10, allSlotsClaimed: false };
      return {
        slotsUsed: status.slotsUsed,
        slotsRemaining: status.maxSlots - status.slotsUsed,
        allSlotsClaimed: status.slotsUsed >= status.maxSlots,
      };
    }),

    getUserUsage: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const usage = await getMonthlyUsage(user.id);
      const tierDetails = await getSubscriptionTierDetails(user.subscriptionTier);

      if (!usage || !tierDetails) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      return {
        bookingsUsed: usage.bookingsUsed,
        bookingsLimit: tierDetails.bookingsPerMonth,
        emailRepliesUsed: usage.emailRepliesUsed,
        emailRepliesLimit: tierDetails.emailRepliesPerMonth,
        whatsappRepliesUsed: usage.whatsappRepliesUsed,
        whatsappRepliesLimit: tierDetails.whatsappRepliesPerMonth,
        socialRepliesUsed: usage.socialRepliesUsed,
        socialRepliesLimit: tierDetails.socialRepliesPerMonth,
      };
    }),

    canUseFeature: protectedProcedure
      .input(z.enum(["bookingsUsed", "emailRepliesUsed", "whatsappRepliesUsed", "socialRepliesUsed"]))
      .query(async ({ ctx, input }) => {
        const user = ctx.user;
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const canUse = await canUseFeature(user.id, input);
        return { canUse };
      }),
  }),

  admin: router({
    getEarlyAdopterStatus: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user || user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const status = await getEarlyAdopterStatus();
      return status || { slotsUsed: 0, maxSlots: 10, updatedAt: new Date() };
    }),
  }),
});

export type AppRouter = typeof appRouter;
