import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getBookingsByDateRange,
  checkBookingConflict,
  markReminderSent,
  markConfirmationSent,
} from "./bookings";
import { canUseFeature, incrementUsage } from "./db";

export const bookingsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { bookings, total } = await getUserBookings(user.id, input.limit, input.offset);
      return { bookings, total };
    }),

  getById: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const booking = await getBookingById(input, user.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      return booking;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      startTime: z.date(),
      endTime: z.date(),
      customerName: z.string(),
      customerEmail: z.string().email(),
      customerPhone: z.string().optional(),
      amount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check tier limit
      const canBook = await canUseFeature(user.id, "bookingsUsed");
      if (!canBook) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached your booking limit for this month. Please upgrade your plan.",
        });
      }

      // Check for conflicts
      const hasConflict = await checkBookingConflict(user.id, input.startTime, input.endTime);
      if (hasConflict) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This time slot conflicts with an existing booking.",
        });
      }

      const booking = await createBooking({
        userId: user.id,
        title: input.title,
        description: input.description || null,
        startTime: input.startTime,
        endTime: input.endTime,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone || null,
        amount: input.amount ? String(input.amount) as any : null,
        status: "pending",
        paymentStatus: "pending",
      });

      if (!booking) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // Increment usage
      await incrementUsage(user.id, "bookingsUsed");

      return booking;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      status: z.enum(["pending", "confirmed", "completed", "cancelled", "no-show"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const existing = await getBookingById(input.id, user.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      // Check for conflicts if time is being changed
      if (input.startTime && input.endTime) {
        const hasConflict = await checkBookingConflict(user.id, input.startTime, input.endTime, input.id);
        if (hasConflict) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This time slot conflicts with another booking.",
          });
        }
      }

      const updates: any = {};
      if (input.title) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.startTime) updates.startTime = input.startTime;
      if (input.endTime) updates.endTime = input.endTime;
      if (input.status) updates.status = input.status;

      const updated = await updateBooking(input.id, user.id, updates);
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return updated;
    }),

  cancel: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const booking = await getBookingById(input, user.id);
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

      const success = await cancelBooking(input, user.id);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { success: true };
    }),

  getByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const bookings = await getBookingsByDateRange(user.id, input.startDate, input.endDate);
      return bookings;
    }),

  markReminderSent: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const success = await markReminderSent(input, user.id);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { success: true };
    }),

  markConfirmationSent: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const success = await markConfirmationSent(input, user.id);
      if (!success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      return { success: true };
    }),
});
