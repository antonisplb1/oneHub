import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyEmail() {
  const [, params] = useRoute("/verify-email/:token");
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${params?.token}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }

        setStatus("success");
        setTimeout(() => {
          setLocation("/select-products");
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Verification failed");
      }
    };

    if (params?.token) {
      verifyEmail();
    }
  }, [params?.token, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-card-border shadow-sm">
        {status === "verifying" && (
          <>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-semibold mb-2">Verifying Email</CardTitle>
              <CardDescription className="text-base">
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-semibold mb-2">Email Verified!</CardTitle>
              <CardDescription className="text-base">
                Your email has been verified successfully. Redirecting to product selection...
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
              <CardTitle className="text-2xl font-semibold mb-2">Verification Failed</CardTitle>
              <CardDescription className="text-base">{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  onClick={() => setLocation("/auth")}
                  data-testid="button-go-to-login"
                >
                  Go to Login
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
