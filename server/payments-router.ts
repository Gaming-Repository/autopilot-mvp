import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createPayment,
  getUserPayments,
  getPaymentById,
  updatePaymentStatus,
  createInvoice,
  getInvoiceById,
  getUserInvoices,
  processRefund,
  generateInvoiceNumber,
} from "./payments";
import { getSubscriptionTierDetails } from "./db";

export const paymentsRouter = router({
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { payments, total } = await getUserPayments(user.id, input.limit, input.offset);
      return { payments, total };
    }),

  getById: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const payment = await getPaymentById(input, user.id);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });

      return payment;
    }),

  initiatePayment: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      description: z.string(),
      bookingId: z.number().optional(),
      subscriptionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check tier permission for PayPal
      const tierDetails = await getSubscriptionTierDetails(user.subscriptionTier);
      if (!tierDetails || !tierDetails.paypalPayments) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your plan does not support payments. Please upgrade to Basic or Pro.",
        });
      }

      // Create payment record
      const payment = await createPayment({
        userId: user.id,
        bookingId: input.bookingId || null,
        subscriptionId: input.subscriptionId || null,
        amount: String(input.amount) as any,
        currency: "USD",
        paymentMethod: "paypal",
        paymentId: `PAYPAL-${Date.now()}`,
        status: "pending",
      });

      if (!payment) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // TODO: Integrate with PayPal API to create payment link
      // For now, return mock PayPal URL
      const paypalUrl = `https://sandbox.paypal.com/cgi-bin/webscr?cmd=_xclick&business=merchant@example.com&item_name=${encodeURIComponent(input.description)}&amount=${input.amount}&invoice=${payment.id}`;

      return {
        paymentId: payment.id,
        paypalUrl,
        status: "pending",
      };
    }),

  handlePaypalCallback: protectedProcedure
    .input(z.object({
      paymentId: z.number(),
      status: z.enum(["completed", "failed", "pending"]),
      transactionId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const payment = await getPaymentById(input.paymentId, user.id);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await updatePaymentStatus(input.paymentId, user.id, input.status);
      if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // If payment completed, create invoice
      if (input.status === "completed") {
        const invoiceNumber = generateInvoiceNumber();
        await createInvoice({
          userId: user.id,
          paymentId: input.paymentId,
          invoiceNumber,
          amount: payment.amount as any,
          description: `Payment for ${input.transactionId || "booking"}`,
        });
      }

      return { success: true, status: input.status };
    }),

  requestRefund: protectedProcedure
    .input(z.object({
      paymentId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const payment = await getPaymentById(input.paymentId, user.id);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });

      if (payment.status === "refunded") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This payment has already been refunded.",
        });
      }

      const refunded = await processRefund(input.paymentId, user.id, input.reason);
      if (!refunded) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // TODO: Integrate with PayPal API to process refund
      return { success: true, refundId: refunded.refundId };
    }),

  getInvoices: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const { invoices, total } = await getUserInvoices(user.id, input.limit, input.offset);
      return { invoices, total };
    }),

  getInvoice: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const invoice = await getInvoiceById(input, user.id);
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

      return invoice;
    }),
});
