import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    subscriptionTier: "free",
    trialStartedAt: new Date(),
    trialDaysRemaining: 30,
    isEarlyAdopter: false,
    trialConvertedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth system", () => {
  it("returns current user with me query", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toEqual(ctx.user);
    expect(result?.subscriptionTier).toBe("free");
  });

  it("clears session cookie on logout", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("checks trial status correctly", async () => {
    const now = new Date();
    const { ctx } = createAuthContext({
      trialStartedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      trialDaysRemaining: 30,
    });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.checkTrialStatus();

    expect(result.isTrialActive).toBe(true);
    expect(result.daysRemaining).toBeLessThanOrEqual(30);
    expect(result.daysRemaining).toBeGreaterThanOrEqual(24);
  });

  it("detects expired trial", async () => {
    const now = new Date();
    const { ctx } = createAuthContext({
      trialStartedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      trialDaysRemaining: 30,
    });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.checkTrialStatus();

    expect(result.isTrialActive).toBe(false);
    expect(result.daysRemaining).toBe(0);
  });

  it("identifies early adopter status", async () => {
    const { ctx } = createAuthContext({
      isEarlyAdopter: true,
      trialDaysRemaining: 90,
    });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.checkTrialStatus();

    expect(result.isEarlyAdopter).toBe(true);
  });
});

describe("subscription system", () => {
  it("returns early adopter status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.getEarlyAdopterStatus();

    expect(result).toHaveProperty("slotsUsed");
    expect(result).toHaveProperty("slotsRemaining");
    expect(result).toHaveProperty("allSlotsClaimed");
    expect(result.slotsRemaining).toBeLessThanOrEqual(10);
  });
});
