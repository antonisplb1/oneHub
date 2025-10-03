import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/components/LandingPage";
import AuthPage from "@/components/AuthPage";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHome from "@/components/DashboardHome";
import LoyaltyCardsSection from "@/components/LoyaltyCardsSection";
import SpinWheelSection from "@/components/SpinWheelSection";
import CustomerSpinWheel from "@/components/CustomerSpinWheel";
import CustomerLoyaltyCard from "@/components/CustomerLoyaltyCard";
import JoinLoyalty from "@/components/JoinLoyalty";
import InStoreSpinWheel from "@/components/InStoreSpinWheel";
import SettingsPage from "@/components/SettingsPage";
import SubscriptionRequired from "@/pages/SubscriptionRequired";
import PaymentProcessing from "@/pages/PaymentProcessing";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/subscription-required" component={SubscriptionRequired} />
      <Route path="/payment-processing" component={PaymentProcessing} />
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <DashboardHome />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/loyalty">
        {() => (
          <DashboardLayout>
            <LoyaltyCardsSection />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/spin-wheel">
        {() => (
          <DashboardLayout>
            <SpinWheelSection />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/settings">
        {() => (
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/join/:userId" component={JoinLoyalty} />
      <Route path="/spin/:token" component={CustomerSpinWheel} />
      <Route path="/spin-in-store/:userId" component={InStoreSpinWheel} />
      <Route path="/card/:customerId" component={CustomerLoyaltyCard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
