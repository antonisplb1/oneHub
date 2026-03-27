import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/unihub-logo-transparent_1774625335894.png";

const GOLD = "#c9a84c";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function ResetPassword() {
  const [, params] = useRoute("/reset-password/:token");
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: params?.token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      toast({ title: "Success", description: data.message });
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
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(201,168,76,0.05) 0%, transparent 70%)" }}
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
          <h1 className="text-2xl font-light text-white mb-1">Create a new password</h1>
          <p className="text-sm" style={{ color: MUTED }}>Enter and confirm your new password below</p>
        </div>

        <div
          className="p-8 rounded-md"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs tracking-wide" style={{ color: MUTED }}>
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
                required
                disabled={isSubmitting}
                minLength={6}
                className="bg-transparent border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs tracking-wide" style={{ color: MUTED }}>
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-new-password"
                required
                disabled={isSubmitting}
                className="bg-transparent border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white/30"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full tracking-wide text-sm font-medium"
              style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
              data-testid="button-reset-password"
              disabled={isSubmitting || newPassword !== confirmPassword}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
