import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shopName, setShopName] = useState(user?.shopName || "");
  const [logoUrl, setLogoUrl] = useState(user?.logo || "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogoUrl(dataUrl);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Please try again",
          variant: "destructive",
        });
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error uploading image",
        description: "Please try again",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
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
              <Label htmlFor="logo-upload">Shop Logo (optional)</Label>
              <div className="mt-2">
                {logoUrl ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-muted/20 flex items-center gap-4">
                      <img
                        src={logoUrl}
                        alt="Shop logo"
                        className="h-20 w-20 object-contain"
                        data-testid="img-logo-preview"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        data-testid="button-remove-logo"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Logo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={isUploadingImage}
                      data-testid="button-upload-logo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingImage ? "Uploading..." : "Upload Logo"}
                    </Button>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-logo-file"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Upload your shop logo (PNG, JPG, max 2MB). It will be displayed on customer loyalty cards and Google Wallet passes.
                </p>
              </div>
            </div>
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
