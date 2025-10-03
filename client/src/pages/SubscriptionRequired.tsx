import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle } from "lucide-react";

export default function SubscriptionRequired() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle>Subscription Required</CardTitle>
          <CardDescription>
            Your payment was not completed or your subscription is not active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            To access the dashboard, you need an active subscription. 
            If you just completed payment, please wait a moment and refresh the page.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.reload()}
              data-testid="button-refresh"
            >
              Refresh Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => logout()}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
