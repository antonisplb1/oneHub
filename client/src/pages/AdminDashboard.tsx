import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, UserPlus, LogOut, RefreshCw } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MerchantsManager from "@/components/MerchantsManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['loyalty', 'spin']);
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: adminData, isLoading } = useQuery<{ admin?: any }>({
    queryKey: ['/api/admin/me'],
  });

  useEffect(() => {
    if (!isLoading && !adminData?.admin) {
      setLocation("/admin");
    }
  }, [adminData, isLoading, setLocation]);

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; shopName: string; selectedProducts: string[] }) => {
      const response = await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `User ${data.user.email} created successfully`,
      });
      setEmail("");
      setPassword("");
      setShopName("");
      setSelectedProducts(['loyalty', 'spin']);
      setConfirmCreateOpen(false);
    },
    onError: (error: any) => {
      const errorData = error.data || {};
      toast({
        title: "User Creation Failed",
        description: errorData.error || "Failed to create user",
        variant: "destructive",
      });
      setConfirmCreateOpen(false);
    },
  });

  const reseedMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/reseed-demo', {
        method: 'POST',
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Demo Reseeded",
        description: data.message || "Demo account refreshed with fresh data",
      });
    },
    onError: (error: any) => {
      const errorData = error.data || {};
      toast({
        title: "Reseed Failed",
        description: errorData.error || "Failed to reseed demo account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/logout', {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/me'] });
      setLocation("/admin");
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmCreateOpen(true);
  };

  const handleProductToggle = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) 
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-primary">Admin Portal</h1>
              <p className="text-sm text-muted-foreground">
                Logged in as {adminData?.admin?.email}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => logoutMutation.mutate()}
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Create User</CardTitle>
                  <CardDescription className="mt-1">
                    Manually create fully-activated users (bypasses email verification and subscription)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="user-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-user-email"
                    required
                    disabled={createUserMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-user-password"
                    required
                    disabled={createUserMutation.isPending}
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-shop-name" className="text-sm font-medium">Shop Name</Label>
                  <Input
                    id="user-shop-name"
                    type="text"
                    placeholder="My Coffee Shop"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    data-testid="input-user-shop-name"
                    required
                    disabled={createUserMutation.isPending}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Product Access</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="product-loyalty"
                        checked={selectedProducts.includes('loyalty')}
                        onCheckedChange={() => handleProductToggle('loyalty')}
                        data-testid="checkbox-product-loyalty"
                        disabled={createUserMutation.isPending}
                      />
                      <Label
                        htmlFor="product-loyalty"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Loyalty Cards
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="product-spin"
                        checked={selectedProducts.includes('spin')}
                        onCheckedChange={() => handleProductToggle('spin')}
                        data-testid="checkbox-product-spin"
                        disabled={createUserMutation.isPending}
                      />
                      <Label
                        htmlFor="product-spin"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Spin Wheel
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="product-menu"
                        checked={selectedProducts.includes('menu')}
                        onCheckedChange={() => handleProductToggle('menu')}
                        data-testid="checkbox-product-menu"
                        disabled={createUserMutation.isPending}
                      />
                      <Label
                        htmlFor="product-menu"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Menu Builder
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="product-shift"
                        checked={selectedProducts.includes('shift')}
                        onCheckedChange={() => handleProductToggle('shift')}
                        data-testid="checkbox-product-shift"
                        disabled={createUserMutation.isPending}
                      />
                      <Label
                        htmlFor="product-shift"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Shift Manager
                      </Label>
                    </div>
                  </div>
                  {selectedProducts.length === 0 && (
                    <p className="text-sm text-destructive">Please select at least one product</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  data-testid="button-create-user-submit" 
                  disabled={createUserMutation.isPending || selectedProducts.length === 0}
                >
                  {createUserMutation.isPending ? "Creating User..." : "Create User"}
                </Button>
              </form>

              <AlertDialog open={confirmCreateOpen} onOpenChange={setConfirmCreateOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create this user?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will create a fully-activated account for {email || "this user"}
                      {shopName ? ` (${shopName})` : ""} with access to{" "}
                      {selectedProducts.length} product{selectedProducts.length === 1 ? "" : "s"}.
                      Email verification and subscription are bypassed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-create-user">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        createUserMutation.mutate({ email, password, shopName, selectedProducts })
                      }
                      disabled={createUserMutation.isPending}
                      data-testid="button-confirm-create-user"
                    >
                      Create User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Reseed Demo Account</CardTitle>
                  <CardDescription className="mt-1">
                    Wipe and repopulate demo@unihub.live with fresh customers, spins, menu, and current-week shifts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    data-testid="button-reseed-demo"
                    disabled={reseedMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${reseedMutation.isPending ? "animate-spin" : ""}`} />
                    {reseedMutation.isPending ? "Reseeding..." : "Reseed Demo Data"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reseed the demo account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will wipe ALL current data on the demo account and repopulate it
                      with fresh customers, spins, menu, and current-week shifts. This cannot
                      be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-cancel-reseed">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => reseedMutation.mutate()}
                      data-testid="button-confirm-reseed"
                    >
                      Reseed Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <div className="mt-6">
            <MerchantsManager />
          </div>
        </div>
      </div>
    </div>
  );
}
