import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";
import { Link } from "wouter";
import { PoweredByBadge } from "@/components/PoweredByBadge";

const GOLD = "#E53935";
const GOLD_DIM = "rgba(229, 57, 53,0.18)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

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
        setTimeout(() => setLocation("/select-products"), 2000);
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
          {status === "verifying" && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: GOLD }} />
              </div>
              <h2 className="text-xl font-light text-white">Verifying Email</h2>
              <p className="text-sm font-light" style={{ color: MUTED }}>
                Please wait while we verify your email address...
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
              <h2 className="text-xl font-light text-white">Email Verified</h2>
              <p className="text-sm font-light" style={{ color: MUTED }}>
                Your email has been verified. Redirecting to product selection...
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
              <h2 className="text-xl font-light text-white">Verification Failed</h2>
              <p className="text-sm font-light" style={{ color: MUTED }}>{errorMessage}</p>
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => setLocation("/auth")}
                  className="w-full tracking-wide text-sm font-medium"
                  style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
                  data-testid="button-go-to-login"
                >
                  Go to Login
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm border-white/10 hover:bg-white/5"
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
      <PoweredByBadge variant="dark" className="absolute inset-x-0 bottom-6" />
    </div>
  );
}
