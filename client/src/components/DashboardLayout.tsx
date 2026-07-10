import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Store,
  ChevronDown,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasAccessGrantingSubscription } from "@/lib/subscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/contexts/StoreContext";
import SupportChatWidget from "@/components/SupportChatWidget";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";

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
  { title: "Stores", icon: Store, href: "/dashboard/stores", products: [], permission: null as string | null, ownerOnly: true },
  { title: "Account", icon: Settings, href: "/dashboard/account", products: [], permission: null as string | null, ownerOnly: true },
];

interface DashboardLayoutProps {
  children: ReactNode;
  // When set, the page is gated to the active store having this product enabled.
  // The backend enforces this too; this guard prevents direct-URL access from
  // rendering a feature the selected store hasn't enabled.
  requiredProduct?: 'loyalty' | 'spin' | 'menu' | 'shift';
}

function StoreSwitcher() {
  const { stores, activeStore, setActiveStoreId } = useStore();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: userInfo } = useQuery<{ isSubuser?: boolean; permissions?: string[] }>({
    queryKey: ['/api/auth/me'],
  });
  const isOwner = !userInfo?.isSubuser;

  if (stores.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-1">
        <Store className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{activeStore?.displayName || activeStore?.shopName || "My Store"}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-1 w-full text-left hover-elevate rounded-md py-1" data-testid="button-store-switcher">
          <Store className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate flex-1">{activeStore?.displayName || activeStore?.shopName || "My Store"}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {stores.map(store => (
          <DropdownMenuItem
            key={store.id}
            data-testid={`option-store-${store.id}`}
            onClick={() => {
              setActiveStoreId(store.id);
              qc.clear();
              toast({ title: "Switched store", description: `Now managing ${store.displayName || store.shopName}` });
            }}
            className={store.id === activeStore?.id ? "font-medium" : ""}
          >
            {store.displayName || store.shopName}
            {store.id === activeStore?.id && <span className="ml-auto text-primary text-xs">Active</span>}
          </DropdownMenuItem>
        ))}
        {isOwner && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/stores" className="cursor-pointer">
                <Plus className="w-3 h-3 mr-2" />
                Manage Stores
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarMenuItems() {
  const [location] = useLocation();
  const { activeStore } = useStore();
  const { setOpenMobile, isMobile } = useSidebar();

  // Fetch user info with permissions
  const { data: userInfo } = useQuery<{ isSubuser?: boolean; permissions?: string[] }>({
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
      // Owner: filter by the CURRENTLY SELECTED store's products and show
      // owner-only items. Switching stores changes which features appear.
      const selectedProducts = activeStore?.selectedProducts || [];
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

export default function DashboardLayout({ children, requiredProduct }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { activeStore } = useStore();
  const { toast } = useToast();

  // Per-store product gate: block direct-URL access to a feature the active
  // store hasn't enabled. Only block when we positively know the product is
  // absent (activeStore loaded) to avoid flashing during load.
  const productBlocked =
    !!requiredProduct &&
    !!activeStore &&
    !(activeStore.selectedProducts || []).includes(requiredProduct);

  // Check if user has an access-granting subscription OR active trial (charge-free
  // bypasses billing). "past_due" counts as access-granting so a merchant with a
  // temporarily failing card keeps working during Stripe's retry grace window.
  const isChargeFree = user && user.chargeFree === true;
  const hasActiveTrial = user && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const hasActiveSubscription = user && hasAccessGrantingSubscription(user.subscriptionStatus);
  const isPastDue = user && user.subscriptionStatus === "past_due";
  const hasAccess = isChargeFree || hasActiveSubscription || hasActiveTrial;

  // Per-browser-session dismissal of the past-due banner so it doesn't nag on
  // every page, but reappears on the next login until payment is fixed.
  const [pastDueDismissed, setPastDueDismissed] = useState(
    () => sessionStorage.getItem("pastDueBannerDismissed") === "true",
  );

  // Send the merchant to the Stripe customer portal to update their card.
  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest<{ url: string }>('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      return res;
    },
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't open billing portal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
                    <span style={{ color: "#E53935", fontStyle: "italic", fontWeight: 600 }}>Hub</span>
                  </h1>
                </div>
              </Link>
              <StoreSwitcher />
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
          
          {/* Past-due Banner: card payment is failing but Stripe is still
              retrying, so the merchant keeps access while we nudge them to fix it. */}
          {!isChargeFree && isPastDue && !pastDueDismissed && (
            <Alert variant="destructive" className="mx-4 mt-4" data-testid="alert-past-due">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Your last payment didn't go through</span>
                  <span className="text-sm">
                    Please update your payment method to keep your subscription active.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                    data-testid="button-update-payment"
                  >
                    {portalMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Update payment <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      sessionStorage.setItem("pastDueBannerDismissed", "true");
                      setPastDueDismissed(true);
                    }}
                    data-testid="button-dismiss-past-due"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Trial Status Banner */}
          {!isChargeFree && hasActiveTrial && !hasActiveSubscription && user.trialEndsAt && (
            <Alert className="mx-4 mt-4 border-primary/50 bg-primary/5" data-testid="alert-trial-status">
              <Clock className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {(() => {
                      const msLeft = new Date(user.trialEndsAt).getTime() - new Date().getTime();
                      const days = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                      if (msLeft < 1000 * 60 * 60 * 24) return "Free Trial: less than 1 day remaining";
                      return `Free Trial: ${days} days remaining`;
                    })()}
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
            {productBlocked ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Alert className="max-w-md" data-testid="alert-product-not-enabled">
                  <Store className="h-4 w-4" />
                  <AlertDescription className="flex flex-col gap-3">
                    <span>
                      This feature isn't enabled for{" "}
                      <span className="font-medium">
                        {activeStore?.displayName || activeStore?.shopName || "this store"}
                      </span>
                      . Enable it from the store's product settings to use it here.
                    </span>
                    <Link href="/dashboard/stores" data-testid="link-manage-stores">
                      <Button size="sm" variant="outline">
                        Manage stores <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
      <SupportChatWidget />
    </SidebarProvider>
  );
}
