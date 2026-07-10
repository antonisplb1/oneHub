import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";

const GOLD = "#E53935";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function SubuserSetup() {
  const [, params] = useRoute("/subuser-setup/:token");
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/subuser-setup/${params?.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Account setup failed");
      }

      toast({ title: "Success", description: data.message || "Account setup complete! You can now log in." });
      setTimeout(() => setLocation("/auth"), 1500);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{ backgroundColor: "#080808", color: "white" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(229, 57, 53,0.05) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity mb-5">
              <img src={logoImage} alt="uniHub logo" className="h-7 w-7" />
              <span className="text-xl tracking-tight">
                <span className="text-white" style={{ fontWeight: 300 }}>uni</span>
                <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
              </span>
            </div>
          </Link>
          <h1 className="text-2xl font-light text-white mb-1">Set up your account</h1>
          <p className="text-sm" style={{ color: MUTED }}>Create a password for your team member account</p>
        </div>

        <div
          className="p-8 rounded-md"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs tracking-wide" style={{ color: MUTED }}>
                Password
              </Label>
              <Input
                id="password"
                data-testid="input-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-transparent border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs tracking-wide" style={{ color: MUTED }}>
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                data-testid="input-confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-transparent border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white/30"
              />
            </div>
            <Button
              type="submit"
              className="w-full tracking-wide text-sm font-medium"
              style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
              data-testid="button-setup-account"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Setting up..." : "Set Up Account"}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/auth">
            <span
              className="text-sm transition-opacity opacity-50 hover:opacity-80 cursor-pointer"
              style={{ color: MUTED }}
              data-testid="link-back-to-login"
            >
              Back to login
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
