import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentProcessing() {
  const [, setLocation] = useLocation();
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
      <Card className="w-full max-w-md">
        {status === "processing" && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <CardTitle>Processing Payment</CardTitle>
              <CardDescription>
                Please wait while we confirm your subscription...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                This usually takes just a few seconds. Do not close this page.
              </p>
            </CardContent>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle>Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription is now active. Redirecting to dashboard...
              </CardDescription>
            </CardHeader>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle>Verification Error</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  data-testid="button-retry"
                >
                  Retry Verification
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/subscription-required")}
                  data-testid="button-go-back"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
