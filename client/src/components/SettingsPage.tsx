import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shopName, setShopName] = useState(user?.shopName || "");
  const [logoUrl, setLogoUrl] = useState(user?.logo || "");

  const updateMutation = useMutation({
    mutationFn: (data: { shopName: string; logo?: string }) => {
      return apiRequest("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "auth", "me"] });
      toast({
        title: "Settings updated!",
        description: "Your shop information has been saved.",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      shopName,
      logo: logoUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your shop information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="shop-name">Shop Name</Label>
              <Input
                id="shop-name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="My Coffee Shop"
                data-testid="input-shop-name"
                required
              />
            </div>
            <div>
              <Label htmlFor="logo-url">Logo URL (optional)</Label>
              <Input
                id="logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                data-testid="input-logo-url"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter a URL to your shop logo. It will be displayed on customer loyalty cards.
              </p>
            </div>
            {logoUrl && (
              <div>
                <Label>Logo Preview</Label>
                <div className="mt-2 p-4 border rounded-md bg-muted/20">
                  <img
                    src={logoUrl}
                    alt="Shop logo"
                    className="h-20 w-20 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Status: <span className="font-semibold text-foreground">
                  {user?.subscriptionStatus === "active" ? "Active" : "Inactive"}
                </span>
              </p>
              {user?.subscriptionStatus !== "active" && (
                <Button data-testid="button-subscribe">
                  Subscribe Now - €25/month
                </Button>
              )}
              {user?.subscriptionStatus === "active" && (
                <Button variant="outline" data-testid="button-manage-subscription">
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
