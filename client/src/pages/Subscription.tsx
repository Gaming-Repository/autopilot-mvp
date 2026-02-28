import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, X, Loader2, Calendar } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

const TIER_FEATURES = {
  free: {
    name: "Free",
    price: "$0",
    period: "Forever",
    description: "Perfect for getting started",
    features: [
      { name: "Up to 5 bookings/month", included: true },
      { name: "Email auto-replies (5/month)", included: true },
      { name: "WhatsApp auto-replies (5/month)", included: true },
      { name: "Knowledge base (read-only)", included: true },
      { name: "Basic analytics", included: true },
      { name: "Branded booking page", included: false },
      { name: "Custom domain", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Priority support", included: false },
    ],
  },
  basic: {
    name: "Basic",
    price: "$29",
    period: "/month",
    description: "For growing businesses",
    features: [
      { name: "Up to 50 bookings/month", included: true },
      { name: "Email auto-replies (50/month)", included: true },
      { name: "WhatsApp auto-replies (50/month)", included: true },
      { name: "Knowledge base (editable)", included: true },
      { name: "Basic analytics", included: true },
      { name: "Branded booking page", included: true },
      { name: "Custom domain", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Priority support", included: false },
    ],
  },
  pro: {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For established businesses",
    features: [
      { name: "Unlimited bookings", included: true },
      { name: "Unlimited email auto-replies", included: true },
      { name: "Unlimited WhatsApp auto-replies", included: true },
      { name: "Knowledge base (editable)", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Branded booking page", included: true },
      { name: "Custom domain", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
    ],
  },
};

export default function Subscription() {
  const { user } = useAuth();
  const { data: usage } = trpc.subscription.getUserUsage.useQuery();
  const { data: trialStatus } = trpc.auth.checkTrialStatus.useQuery();

  const getCurrentTier = () => {
    // Determine tier from user data
    // This would be set during auth - for now, assume free
    return "free";
  };

  const currentTier = getCurrentTier();
  const tierConfig = TIER_FEATURES[currentTier as keyof typeof TIER_FEATURES];

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 100; // Unlimited
    return (used / limit) * 100;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Current Plan */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Subscription</h1>
          <p className="text-muted-foreground">Manage your plan and billing</p>
        </div>

        {/* Trial Status */}
        {trialStatus && trialStatus.isTrialActive && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Trial Period Active
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                    {trialStatus.daysRemaining} days remaining • Expires {new Date(trialStatus.trialEndDate).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the {tierConfig.name} plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{tierConfig.price}</p>
                <p className="text-sm text-muted-foreground">{tierConfig.period}</p>
              </div>
              <Badge className="text-lg px-4 py-2">{tierConfig.name}</Badge>
            </div>

            {currentTier === "free" && (
              <Button className="w-full" size="lg">
                Upgrade to Basic
              </Button>
            )}
            {currentTier === "basic" && (
              <Button className="w-full" size="lg">
                Upgrade to Pro
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        {usage && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Usage</CardTitle>
              <CardDescription>Your current usage for this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Bookings</label>
                  <span className="text-sm text-muted-foreground">
                    {usage.bookingsUsed} / {usage.bookingsLimit === 0 ? "∞" : usage.bookingsLimit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.bookingsUsed, usage.bookingsLimit)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Email Auto-Replies</label>
                  <span className="text-sm text-muted-foreground">
                    {usage.emailRepliesUsed} / {usage.emailRepliesLimit === 0 ? "∞" : usage.emailRepliesLimit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.emailRepliesUsed, usage.emailRepliesLimit)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">WhatsApp Auto-Replies</label>
                  <span className="text-sm text-muted-foreground">
                    {usage.whatsappRepliesUsed} / {usage.whatsappRepliesLimit === 0 ? "∞" : usage.whatsappRepliesLimit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.whatsappRepliesUsed, usage.whatsappRepliesLimit)}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Social Media Replies</label>
                  <span className="text-sm text-muted-foreground">
                    {usage.socialRepliesUsed} / {usage.socialRepliesLimit === 0 ? "∞" : usage.socialRepliesLimit}
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage(usage.socialRepliesUsed, usage.socialRepliesLimit)}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Comparison */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">All Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(TIER_FEATURES).map(([tier, config]) => (
              <Card key={tier} className={tier === currentTier ? "border-primary ring-2 ring-primary" : ""}>
                <CardHeader>
                  <CardTitle>{config.name}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-3xl font-bold">{config.price}</p>
                    <p className="text-sm text-muted-foreground">{config.period}</p>
                  </div>

                  {tier !== currentTier && (
                    <Button className="w-full" variant={tier === "pro" ? "default" : "outline"}>
                      {tier === "free" ? "Current Plan" : `Upgrade to ${config.name}`}
                    </Button>
                  )}

                  <div className="space-y-3 border-t pt-4">
                    {config.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground line-through"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              No billing history yet. Upgrade to a paid plan to see invoices here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
