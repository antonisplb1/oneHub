import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";

export default function PaymentProcessing() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setErrorMessage("No session ID found");
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    const pollInterval = 2000;

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/stripe/verify-session/${sessionId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to verify payment");
        }

        const data = await response.json();

        if (data.success && data.subscriptionStatus === "active") {
          setStatus("success");
          
          // Invalidate user cache to refetch updated subscription status
          await queryClient.invalidateQueries({ queryKey: ["/api", "auth", "me"] });
          
          setTimeout(() => {
            setLocation("/dashboard");
          }, 1500);
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            setStatus("error");
            setErrorMessage("Payment verification timed out. Please try refreshing or contact support.");
          } else {
            setTimeout(verifyPayment, pollInterval);
          }
        }
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify payment");
      }
    };

    verifyPayment();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-card-border shadow-sm">
        {status === "processing" && (
          <>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-semibold mb-2">Processing Payment</CardTitle>
              <CardDescription className="text-base">
                Please wait while we confirm your subscription...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                This usually takes just a few seconds. Do not close this page.
              </p>
            </CardContent>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-semibold mb-2">Payment Successful!</CardTitle>
              <CardDescription className="text-base">
                Your subscription is now active. Redirecting to dashboard...
              </CardDescription>
            </CardHeader>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <XCircle className="w-16 h-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-semibold mb-2">Verification Error</CardTitle>
              <CardDescription className="text-base">{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => window.location.reload()}
                  data-testid="button-retry"
                >
                  Retry Verification
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/subscription-required")}
                  data-testid="button-go-back"
                >
                  Go Back
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
