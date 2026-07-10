import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";
import { Link } from "wouter";

const GOLD = "#E53935";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

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

        if (!response.ok) throw new Error("Failed to verify payment");

        const data = await response.json();

        if (data.success && data.subscriptionStatus === "active") {
          setStatus("success");
          await queryClient.invalidateQueries({ queryKey: ["/api", "auth", "me"] });
          setTimeout(() => setLocation("/dashboard"), 1500);
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
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ backgroundColor: "#080808", color: "white" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 40%, rgba(229, 57, 53,0.05) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
              <img src={logoImage} alt="uniHub logo" className="h-7 w-7" />
              <span className="text-xl tracking-tight">
                <span className="text-white" style={{ fontWeight: 300 }}>uni</span>
                <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
              </span>
            </div>
          </Link>
        </div>

        <div
          className="p-10 rounded-md text-center"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          {status === "processing" && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: GOLD }} />
              </div>
              <h2 className="text-xl font-light text-white">Processing Payment</h2>
              <p className="text-sm font-light" style={{ color: MUTED }}>
                Please wait while we confirm your subscription. Do not close this page.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
                >
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-light text-white">Payment Successful</h2>
              <p className="text-sm font-light" style={{ color: MUTED }}>
                Your subscription is now active. Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
                >
                  <XCircle className="w-7 h-7 text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-light text-white">Verification Error</h2>
              <p className="text-sm font-light" style={{ color: MUTED }}>{errorMessage}</p>
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full tracking-wide text-sm font-medium"
                  style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
                  data-testid="button-retry"
                >
                  Retry Verification
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm border-white/15 text-white bg-transparent hover:bg-white/5"
                  onClick={() => setLocation("/subscription-required")}
                  data-testid="button-go-back"
                >
                  Go Back
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm hover:bg-white/5"
                  style={{ color: MUTED }}
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
