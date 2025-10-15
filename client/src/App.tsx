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
import CustomerSpinOnce from "@/components/CustomerSpinOnce";
import SettingsPage from "@/components/SettingsPage";
import ScannerPage from "@/components/ScannerPage";
import CustomersSection from "@/components/CustomersSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import SubscriptionRequired from "@/pages/SubscriptionRequired";
import PaymentProcessing from "@/pages/PaymentProcessing";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Demo from "@/pages/Demo";
import SelectProducts from "@/pages/SelectProducts";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import MenuBuilder from "@/pages/MenuBuilder";
import PublicMenu from "@/pages/PublicMenu";
import PublicShifts from "@/pages/PublicShifts";
import ShiftsManager from "@/pages/ShiftsManager";
import Pricing from "@/pages/Pricing";
import CookiePolicy from "@/pages/CookiePolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CookieBanner from "@/components/CookieBanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/demo" component={Demo} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/verify-email/:token" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/select-products" component={SelectProducts} />
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
      <Route path="/dashboard/scanner">
        {() => (
          <DashboardLayout>
            <ScannerPage />
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
      <Route path="/dashboard/customers">
        {() => (
          <DashboardLayout>
            <CustomersSection />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/analytics">
        {() => (
          <DashboardLayout>
            <AnalyticsSection />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/account">
        {() => (
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/menu">
        {() => (
          <DashboardLayout>
            <MenuBuilder />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/shifts">
        {() => (
          <DashboardLayout>
            <ShiftsManager />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/join/:userId" component={JoinLoyalty} />
      <Route path="/spin/:token" component={CustomerSpinWheel} />
      <Route path="/customer-spin/:userId" component={CustomerSpinOnce} />
      <Route path="/in-store-spin/:userId" component={InStoreSpinWheel} />
      <Route path="/card/:customerId" component={CustomerLoyaltyCard} />
      <Route path="/menu/:merchantId" component={PublicMenu} />
      <Route path="/:username/shifts" component={PublicShifts} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <CookieBanner />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
