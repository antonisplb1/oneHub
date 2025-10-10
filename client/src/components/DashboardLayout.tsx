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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@assets/blob-b137548_1759662451793.png";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard", products: [] },
  { title: "Loyalty Cards", icon: CreditCard, href: "/dashboard/loyalty", products: ['loyalty'] },
  { title: "QR Scanner", icon: Scan, href: "/dashboard/scanner", products: ['loyalty'] },
  { title: "Spin Wheel", icon: Gauge, href: "/dashboard/spin-wheel", products: ['spin'] },
  { title: "My Menu", icon: UtensilsCrossed, href: "/dashboard/menu", products: [] },
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    } else if (!isLoading && user && user.subscriptionStatus !== "active") {
      setLocation("/subscription-required");
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user.subscriptionStatus !== "active") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Verifying subscription...</p>
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
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
