import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, ExternalLink, Plus, Loader2, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function BrandedBookingPages() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    primaryColor: "#3b82f6",
    logoUrl: "",
  });

  const { data: myPage, isLoading, refetch } = trpc.brandedPages.getMyPage.useQuery();

  const createPageMutation = trpc.brandedPages.createOrUpdate.useMutation();
  const togglePageMutation = trpc.brandedPages.toggleActive.useMutation();

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createPageMutation.mutateAsync({
        businessName: formData.businessName,
        description: formData.description,
        primaryColor: formData.primaryColor,
        logoUrl: formData.logoUrl || undefined,
      });

      toast.success("Booking page created successfully");
      setFormData({
        businessName: "",
        description: "",
        primaryColor: "#3b82f6",
        logoUrl: "",
      });
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create page");
    }
  };

  const handleTogglePage = async () => {
    try {
      await togglePageMutation.mutateAsync(!myPage?.isActive);
      toast.success(myPage?.isActive ? "Page deactivated" : "Page activated");
      refetch();
    } catch (error) {
      toast.error("Failed to toggle page");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getPublicUrl = () => {
    if (!myPage?.slug) return "";
    return `${window.location.origin}/book/${myPage.slug}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Branded Booking Page</h1>
            <p className="text-muted-foreground">Customize your public booking page</p>
          </div>
          {!myPage && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking Page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Your Booking Page</DialogTitle>
                  <DialogDescription>Design a branded booking page for your customers</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePage} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Business Name *</label>
                    <Input
                      placeholder="Your business name"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Tell customers what to expect..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <Input
                        placeholder="#3b82f6"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input
                      placeholder="https://example.com/logo.png"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    />
                  </div>

                  <Button type="submit" disabled={createPageMutation.isPending} className="w-full">
                    {createPageMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Page"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Page Display */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : !myPage ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No booking page yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>Create Your First Page</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Page Preview */}
            <Card className="lg:col-span-2 overflow-hidden">
              <div
                className="h-32 w-full"
                style={{ backgroundColor: myPage.primaryColor }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{myPage.slug}</CardTitle>
                    {myPage.logoUrl && (
                      <img src={myPage.logoUrl} alt="Logo" className="h-10 w-10 rounded mt-2 object-cover" />
                    )}
                  </div>
                  {myPage.isActive && <Badge>Active</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {myPage.description && (
                  <p className="text-sm text-muted-foreground">{myPage.description}</p>
                )}

                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">Public Booking URL</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-sm bg-secondary p-3 rounded truncate">
                      {getPublicUrl()}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getPublicUrl())}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(getPublicUrl(), "_blank")}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Page
                  </Button>
                  <Button
                    variant={myPage.isActive ? "destructive" : "default"}
                    onClick={handleTogglePage}
                    disabled={togglePageMutation.isPending}
                  >
                    {myPage.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Slug</label>
                  <p className="text-sm text-muted-foreground mt-1">{myPage.slug}</p>
                </div>

                <div>
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="flex gap-2 mt-2">
                    <div
                      className="h-10 w-10 rounded border"
                      style={{ backgroundColor: myPage.primaryColor }}
                    />
                    <code className="flex-1 text-sm bg-secondary p-2 rounded">
                      {myPage.primaryColor}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className="mt-2">
                    {myPage.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-3">
                    To edit your booking page, create a new one or contact support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
