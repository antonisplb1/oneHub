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
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  CreditCard,
  Gauge,
  Users,
  BarChart3,
  Settings,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Loyalty Cards", icon: CreditCard, href: "/dashboard/loyalty" },
  { title: "QR Scanner", icon: Scan, href: "/dashboard/scanner" },
  { title: "Spin Wheel", icon: Gauge, href: "/dashboard/spin-wheel" },
  { title: "Customers", icon: Users, href: "/dashboard/customers" },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
];

const secondaryItems = [
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
];

interface DashboardLayoutProps {
  children: ReactNode;
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

  const shopInitials = user.shopName.substring(0, 2).toUpperCase();

  const style = {
    "--sidebar-width": "17rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-5 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-primary text-primary-foreground text-base font-semibold">
                  {shopInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.shopName}</p>
                <p className="text-xs text-muted-foreground">
                  {user.subscriptionStatus === "active" ? "Pro Plan" : "Free Trial"}
                </p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium">Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}
                      >
                        <Link href={item.href}>
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
                  {secondaryItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        data-testid={`link-${item.title.toLowerCase()}`}
                      >
                        <Link href={item.href}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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
