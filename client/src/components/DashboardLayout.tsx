import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@assets/blob-b137548_1759662451793.png";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", products: [] },
  { title: "Loyalty Cards", icon: CreditCard, href: "/dashboard/loyalty", products: ['loyalty'] },
  { title: "QR Scanner", icon: Scan, href: "/dashboard/scanner", products: ['loyalty'] },
  { title: "Spin Wheel", icon: Gauge, href: "/dashboard/spin-wheel", products: ['spin'] },
  { title: "Menu Builder", icon: UtensilsCrossed, href: "/dashboard/menu", products: ['menu'] },
  { title: "Shift Manager", icon: CalendarClock, href: "/dashboard/shifts", products: ['shift'] },
  { title: "Customers", icon: Users, href: "/dashboard/customers", products: [] },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics", products: [] },
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

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filterMenuItems = (items: typeof menuItems) => {
    const selectedProducts = user?.selectedProducts || [];
    return items.filter(item => {
      if (item.products.length === 0) return true;
      return item.products.some(product => selectedProducts.includes(product));
    });
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
    </>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  // Check if user has active subscription OR active trial
  const hasActiveTrial = user && user.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const hasActiveSubscription = user && user.subscriptionStatus === "active";
  const hasAccess = hasActiveSubscription || hasActiveTrial;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    } else if (!isLoading && user && !hasAccess) {
      setLocation("/subscription-required");
    }
  }, [isAuthenticated, isLoading, user, hasAccess, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verifying access...</p>
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
                <div className="flex items-center gap-3 cursor-pointer">
                  <img src={logoImage} alt="uniHub logo" className="h-8 w-8" />
                  <h1 className="text-2xl font-semibold text-primary">uniHub</h1>
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
          {hasActiveTrial && !hasActiveSubscription && user.trialEndsAt && (
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
                <Link href="/select-products">
                  <Button size="sm" data-testid="button-upgrade-now">
                    Upgrade Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
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
