import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getBookingAnalytics,
  getEmailAnalytics,
  getWhatsappAnalytics,
  getRevenueAnalytics,
  getDashboardMetrics,
} from "./analytics";

export const analyticsRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const metrics = await getDashboardMetrics(user.id);
    return metrics;
  }),

  getBookingMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const metrics = await getBookingAnalytics(user.id, input.startDate, input.endDate);
      return metrics;
    }),

  getEmailMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const metrics = await getEmailAnalytics(user.id, input.startDate, input.endDate);
      return metrics;
    }),

  getWhatsappMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const metrics = await getWhatsappAnalytics(user.id, input.startDate, input.endDate);
      return metrics;
    }),

  getRevenueMetrics: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const metrics = await getRevenueAnalytics(user.id, input.startDate, input.endDate);
      return metrics;
    }),
});
