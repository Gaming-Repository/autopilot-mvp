import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createOrUpdateBrandedPage,
  getPageByUserId,
  getPublicPageBySlug,
  updatePageSettings,
  togglePageActive,
  generateSlug,
} from "./branded-pages";
import { getSubscriptionTierDetails } from "./db";

export const brandedPagesRouter = router({
  getMyPage: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const page = await getPageByUserId(user.id);
    return page;
  }),

  createOrUpdate: protectedProcedure
    .input(z.object({
      businessName: z.string(),
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check tier permission
      const tierDetails = await getSubscriptionTierDetails(user.subscriptionTier);
      if (!tierDetails || !tierDetails.brandedBookingPage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your plan does not support branded booking pages. Please upgrade to Basic or Pro.",
        });
      }

      const slug = generateSlug(input.businessName);

      const page = await createOrUpdateBrandedPage({
        userId: user.id,
        slug,
        logoUrl: input.logoUrl || null,
        primaryColor: input.primaryColor || "#000000",
        secondaryColor: input.secondaryColor || "#FFFFFF",
        description: input.description || null,
        isActive: true,
      });

      if (!page) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return page;
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      logoUrl: z.string().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      description: z.string().optional(),
      customDomain: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const updates: any = {};
      if (input.logoUrl) updates.logoUrl = input.logoUrl;
      if (input.primaryColor) updates.primaryColor = input.primaryColor;
      if (input.secondaryColor) updates.secondaryColor = input.secondaryColor;
      if (input.description !== undefined) updates.description = input.description;
      if (input.customDomain !== undefined) updates.customDomain = input.customDomain;

      const updated = await updatePageSettings(user.id, updates);
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return updated;
    }),

  toggleActive: protectedProcedure
    .input(z.boolean())
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const updated = await togglePageActive(user.id, input);
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { success: true, isActive: input };
    }),

  getPublicPage: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const page = await getPublicPageBySlug(input);
      if (!page) throw new TRPCError({ code: "NOT_FOUND" });

      return page;
    }),
});
