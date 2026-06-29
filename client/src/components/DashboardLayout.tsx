import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CreditCard,
  Gauge,
  Users,
  BarChart3,
  Settings,
  Scan,
  UtensilsCrossed,
  CalendarClock,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/unihub-logo-transparent_1774625335894.png";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", products: [], permission: 'dashboard' as string | null, ownerOnly: false },
  { title: "Loyalty Cards", icon: CreditCard, href: "/dashboard/loyalty", products: ['loyalty'], permission: 'loyalty' as string | null, ownerOnly: false },
  { title: "QR Scanner", icon: Scan, href: "/dashboard/scanner", products: ['loyalty'], permission: 'loyalty' as string | null, ownerOnly: false },
  { title: "Spin Wheel", icon: Gauge, href: "/dashboard/spin-wheel", products: ['spin'], permission: 'spin' as string | null, ownerOnly: false },
  { title: "Menu Builder", icon: UtensilsCrossed, href: "/dashboard/menu", products: ['menu'], permission: 'menu' as string | null, ownerOnly: false },
  { title: "Shift Manager", icon: CalendarClock, href: "/dashboard/shifts", products: ['shift'], permission: 'shift' as string | null, ownerOnly: false },
  { title: "Customers", icon: Users, href: "/dashboard/customers", products: [], permission: 'customers' as string | null, ownerOnly: false },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics", products: [], permission: 'analytics' as string | null, ownerOnly: false },
  { title: "Team Management", icon: Users, href: "/dashboard/team", products: [], permission: null as string | null, ownerOnly: true },
];

const secondaryItems = [
  { title: "Account", icon: Settings, href: "/dashboard/account", products: [] },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

function SidebarMenuItems() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  // Fetch user info with permissions
  const { data: userInfo } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  const isOwner = !userInfo?.isSubuser;
  const permissions = userInfo?.permissions || [];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filterMenuItems = (items: typeof menuItems) => {
    if (isOwner) {
      // Owner: filter by selectedProducts and show owner-only items
      const selectedProducts = user?.selectedProducts || [];
      return items.filter(item => {
        // Always show owner-only items for owners
        if (item.ownerOnly) return true;
        // Show items without product requirements
        if (item.products.length === 0) return true;
        // Show items that match selected products
        return item.products.some(product => selectedProducts.includes(product));
      });
    } else {
      // Subuser: filter by permissions
      return items.filter(item => {
        // Hide owner-only items for subusers
        if (item.ownerOnly) return false;
        
        // For items with permission requirements, check if user has that permission
        if (item.permission) {
          return permissions.includes(item.permission);
        }
        
        // Show items without permission requirements (shouldn't happen anymore but keeping for safety)
        return true;
      });
    }
  };

  const filteredMenuItems = filterMenuItems(menuItems);
  const filteredSecondaryItems = filterMenuItems(secondaryItems);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium">Main Menu</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={location === item.href}
                  data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                >
                  <Link href={item.href} onClick={handleLinkClick}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Account section - only visible to owners */}
      {isOwner && (
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSecondaryItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.href}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.href} onClick={handleLinkClick}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Check if user has active subscription OR active trial (charge-free bypasses billing)
  const isChargeFree = user && user.chargeFree === true;
  const hasActiveTrial = user && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const hasActiveSubscription = user && user.subscriptionStatus === "active";
  const hasAccess = isChargeFree || hasActiveSubscription || hasActiveTrial;

  // Upgrade mutation - creates checkout session with existing products
  const upgradeMutation = useMutation({
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
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    if (!user?.selectedProducts || user.selectedProducts.length === 0) {
      // If no products selected, go to product selection
      setLocation("/select-products");
    } else {
      // If products already selected, go directly to payment
      upgradeMutation.mutate();
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    } else if (!isLoading && user && !hasAccess) {
      setLocation("/subscription-required");
    }
  }, [isAuthenticated, isLoading, user, hasAccess, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#080808" }}>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#080808" }}>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Verifying access...</p>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "17rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-5 border-b">
            <div className="flex flex-col gap-4">
              <Link href="/dashboard" data-testid="link-home">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <img src={logoImage} alt="uniHub logo" className="h-8 w-8" />
                  <h1 className="text-2xl tracking-tight">
                    <span style={{ color: "#fff", fontWeight: 300 }}>uni</span>
                    <span style={{ color: "#c9a84c", fontStyle: "italic", fontWeight: 600 }}>Hub</span>
                  </h1>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                {user.logo && (
                  <img 
                    src={user.logo} 
                    alt={`${user.shopName} logo`}
                    className="h-11 w-11 object-contain rounded-md"
                    data-testid="img-shop-logo"
                  />
                )}
                <div>
                  <p className="font-semibold">{user.shopName}</p>
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenuItems />
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Button variant="ghost" size="sm" onClick={() => logout()} data-testid="button-logout">
              Logout
            </Button>
          </header>
          
          {/* Trial Status Banner */}
          {!isChargeFree && hasActiveTrial && !hasActiveSubscription && user.trialEndsAt && (
            <Alert className="mx-4 mt-4 border-primary/50 bg-primary/5" data-testid="alert-trial-status">
              <Clock className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Free Trial: {Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Subscribe now to continue using uniHub after your trial ends
                  </span>
                </div>
                <Button 
                  size="sm" 
                  onClick={handleUpgrade}
                  disabled={upgradeMutation.isPending}
                  data-testid="button-upgrade-now"
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
