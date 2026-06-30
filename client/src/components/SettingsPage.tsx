import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Ticket, Gift, UtensilsCrossed, Calendar } from "lucide-react";

const PRODUCT_INFO = [
  {
    id: 'loyalty',
    name: 'Loyalty Cards',
    description: 'Digital loyalty card program with stamp collection',
    price: 19,
    icon: Ticket,
  },
  {
    id: 'spin',
    name: 'Spin Wheel',
    description: 'Prize wheel campaigns for customer engagement',
    price: 5,
    icon: Gift,
  },
  {
    id: 'menu',
    name: 'Menu Builder',
    description: 'Create and manage your digital menu',
    price: 8,
    icon: UtensilsCrossed,
  },
  {
    id: 'shift',
    name: 'Shift Manager',
    description: 'Employee shift scheduling',
    price: 18,
    icon: Calendar,
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shopName, setShopName] = useState(user?.shopName || "");
  const [logoUrl, setLogoUrl] = useState(user?.logo || "");
  const [menuBannerImage, setMenuBannerImage] = useState(user?.menuBannerImage || "");
  const [cardBackgroundColor, setCardBackgroundColor] = useState(user?.cardBackgroundColor || "#4285F4");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(user?.selectedProducts || []);

  useEffect(() => {
    if (user) {
      setShopName(user.shopName || "");
      setLogoUrl(user.logo || "");
      setMenuBannerImage(user.menuBannerImage || "");
      setCardBackgroundColor(user.cardBackgroundColor || "#4285F4");
      setSelectedProducts(user.selectedProducts || []);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: { shopName: string; logo?: string; menuBannerImage?: string; cardBackgroundColor?: string }) => {
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
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductsMutation = useMutation({
    mutationFn: (products: string[]) => {
      return apiRequest("/api/user/select-products", {
        method: "POST",
        body: JSON.stringify({ products }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "auth", "me"] });
      toast({
        title: "Products updated!",
        description: "Your subscription will be adjusted accordingly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const checkoutRes = await apiRequest<{ url: string }>('/api/stripe/create-checkout-session', {
        method: 'POST',
      });
      return checkoutRes;
    },
    onSuccess: (data) => {
      toast({
        title: "Redirecting to checkout",
        description: "Opening payment page in new tab...",
      });
      window.open(data.url, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const manageSubscriptionMutation = useMutation({
    mutationFn: () => {
      return apiRequest("/api/stripe/create-portal-session", {
        method: "POST",
      });
    },
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      shopName,
      logo: logoUrl || undefined,
      menuBannerImage: menuBannerImage || undefined,
      cardBackgroundColor,
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

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingBanner(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setMenuBannerImage(dataUrl);
        setIsUploadingBanner(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Please try again",
          variant: "destructive",
        });
        setIsUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Error uploading image",
        description: "Please try again",
        variant: "destructive",
      });
      setIsUploadingBanner(false);
    }
  };

  const handleRemoveBanner = () => {
    setMenuBannerImage("");
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const calculateBasePrice = (products: string[]) => {
    const sorted = [...products].sort();
    if (sorted.length === 4 && sorted.includes('loyalty') && sorted.includes('spin') && sorted.includes('menu') && sorted.includes('shift')) {
      return 36.99;
    }
    let total = 0;
    if (products.includes('loyalty')) total += 19;
    if (products.includes('spin')) total += 5;
    if (products.includes('menu')) total += 8;
    if (products.includes('shift')) total += 18;
    return total;
  };

  const calculatePrice = (products: string[], additionalStores: number = 0) => {
    return calculateBasePrice(products) + Math.max(0, additionalStores) * 5;
  };

  const handleUpdateProducts = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }
    updateProductsMutation.mutate(selectedProducts);
  };

  const hasProductChanges = () => {
    const current = [...(user?.selectedProducts || [])].sort();
    const selected = [...selectedProducts].sort();
    return JSON.stringify(current) !== JSON.stringify(selected);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground text-lg">Manage your shop information</p>
      </div>

      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Shop Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="shop-name" className="text-sm font-medium">Shop Name</Label>
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
            <div>
              <Label htmlFor="banner-upload">Menu Banner Image (optional)</Label>
              <div className="mt-2">
                {menuBannerImage ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-muted/20">
                      <img
                        src={menuBannerImage}
                        alt="Menu banner"
                        className="w-full h-32 object-cover rounded-md"
                        data-testid="img-banner-preview"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveBanner}
                        className="mt-4"
                        data-testid="button-remove-banner"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Banner
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("banner-upload")?.click()}
                      disabled={isUploadingBanner}
                      data-testid="button-upload-banner"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploadingBanner ? "Uploading..." : "Upload Banner"}
                    </Button>
                    <Input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="hidden"
                      data-testid="input-banner-file"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Upload a banner image for your public menu header (PNG, JPG, max 5MB). Recommended size: 1920x600px for best results.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-color">Loyalty Card Background Color</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Input
                    id="card-color"
                    type="color"
                    value={cardBackgroundColor}
                    onChange={(e) => setCardBackgroundColor(e.target.value)}
                    className="h-12 w-20 cursor-pointer"
                    data-testid="input-card-color"
                  />
                  <Input
                    type="text"
                    value={cardBackgroundColor}
                    onChange={(e) => setCardBackgroundColor(e.target.value)}
                    placeholder="#4285F4"
                    className="w-32 font-mono"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    data-testid="input-card-color-text"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-md border" style={{ backgroundColor: cardBackgroundColor }}>
                  <span className="text-sm text-white font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                    Card Preview
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This color will be used as the background for loyalty cards added to Google Wallet.
              </p>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={updateMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Product Selection</CardTitle>
          <CardDescription>
            Choose which features you want to include in your subscription.
            Subscription amount gets applied on next recurring payment. No additional actions required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {PRODUCT_INFO.map((product) => {
            const Icon = product.icon;
            const isSelected = selectedProducts.includes(product.id);
            
            return (
              <div
                key={product.id}
                className={`flex items-start gap-4 p-4 rounded-md border cursor-pointer transition-all hover-elevate ${
                  isSelected ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => toggleProduct(product.id)}
                data-testid={`card-product-${product.id}`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleProduct(product.id)}
                  data-testid={product.id === 'shift' ? 'checkbox-shift' : `checkbox-product-${product.id}`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid={`text-product-description-${product.id}`}>
                    {product.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" data-testid={`text-product-price-${product.id}`}>
                    €{product.price}
                  </div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
            );
          })}

          {selectedProducts.length === 4 && selectedProducts.includes('loyalty') && selectedProducts.includes('spin') && selectedProducts.includes('menu') && selectedProducts.includes('shift') && (
            <div className="p-4 bg-primary/5 border border-primary rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-primary" data-testid="text-bundle-discount">
                    Complete Bundle Discount!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Save €13/month with all four products
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground line-through">€50</div>
                  <div className="text-xl font-bold text-primary">€36.99</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-muted rounded-md">
            <span className="font-semibold">New Total:</span>
            <span className="text-xl font-bold" data-testid="text-total-price">
              €{calculatePrice(selectedProducts, user?.additionalStores ?? 0).toFixed(2)}/month
            </span>
          </div>

          {hasProductChanges() && (
            <Button
              onClick={handleUpdateProducts}
              disabled={selectedProducts.length === 0 || updateProductsMutation.isPending}
              size="lg"
              data-testid="button-update-products"
            >
              {updateProductsMutation.isPending ? "Updating..." : "Update Products"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-card-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold">Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-semibold text-lg text-foreground">
                    {user?.chargeFree
                      ? "Charge-Free"
                      : user?.subscriptionStatus === "active"
                        ? "Active"
                        : "Inactive"}
                  </span>
                </p>
                {!user?.chargeFree && user?.selectedProducts && user.selectedProducts.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Current Plan: <span className="font-semibold text-foreground">
                        €{calculatePrice(user.selectedProducts, user?.additionalStores ?? 0).toFixed(2)}/month
                      </span>
                    </p>
                    {(user?.additionalStores ?? 0) > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5 pl-1 border-l-2 border-muted ml-1">
                        <p>Base plan: €{calculateBasePrice(user.selectedProducts).toFixed(2)}/month</p>
                        <p>{user.additionalStores ?? 0} extra store{(user.additionalStores ?? 0) !== 1 ? 's' : ''}: €{((user.additionalStores ?? 0) * 5).toFixed(2)}/month</p>
                        <p className="font-medium text-foreground">Total: €{calculatePrice(user.selectedProducts, user.additionalStores ?? 0).toFixed(2)}/month</p>
                      </div>
                    )}
                  </div>
                )}
                {user?.chargeFree && (
                  <p className="text-sm text-muted-foreground" data-testid="text-charge-free-note">
                    Your account has full access at no cost. No subscription is required.
                  </p>
                )}
              </div>
              {!user?.chargeFree && user?.subscriptionStatus !== "active" && user?.selectedProducts && user.selectedProducts.length > 0 && (
                <Button 
                  size="lg" 
                  onClick={() => subscribeMutation.mutate()}
                  disabled={subscribeMutation.isPending}
                  data-testid="button-subscribe"
                >
                  {subscribeMutation.isPending 
                    ? "Loading..." 
                    : `Subscribe Now - €${calculatePrice(user.selectedProducts, user?.additionalStores ?? 0).toFixed(2)}/month`
                  }
                </Button>
              )}
              {!user?.chargeFree && user?.subscriptionStatus === "active" && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => manageSubscriptionMutation.mutate()}
                  disabled={manageSubscriptionMutation.isPending}
                  data-testid="button-manage-subscription"
                >
                  {manageSubscriptionMutation.isPending ? "Loading..." : "Manage Subscription"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
