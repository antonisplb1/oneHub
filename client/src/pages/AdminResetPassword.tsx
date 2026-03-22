import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { ShieldCheck, Loader2 } from "lucide-react";

const GOLD = "#c9a84c";
const BG = "#080808";
const SURFACE = "#101010";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function AdminResetPassword() {
  const [, params] = useRoute("/admin/reset-password/:token");
  const token = params?.token;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Password reset failed");
      }

      toast({ title: "Success", description: "Your admin password has been reset successfully" });
      setTimeout(() => setLocation("/admin"), 1500);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
  } as React.CSSProperties;

  const labelStyle = { color: "rgba(255,255,255,0.7)", fontSize: "0.8125rem", fontWeight: 500 } as React.CSSProperties;

  if (!token) {
    return (
      <div style={{ backgroundColor: BG, minHeight: "100vh" }} className="flex items-center justify-center p-6">
        <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }} className="w-full max-w-md rounded-xl overflow-hidden">
          <div style={{ height: "2px", background: `linear-gradient(90deg, ${GOLD} 0%, transparent 65%)` }} />
          <div className="p-8">
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#fff" }}>Invalid Reset Link</h2>
            <p className="text-sm mb-6" style={{ color: MUTED }}>This password reset link is invalid. Please request a new one.</p>
            <button
              onClick={() => setLocation("/admin/forgot-password")}
              data-testid="button-request-new-link"
              className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD, color: BG, border: "none", cursor: "pointer" }}
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: "100vh" }} className="flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <ShieldCheck style={{ color: GOLD }} className="h-9 w-9" />
            <h1 className="text-4xl tracking-tight" style={{ color: "#fff", fontWeight: 300 }}>
              Admin <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Portal</span>
            </h1>
          </div>
          <p style={{ color: MUTED }} className="text-base">Create a new password</p>
        </div>

        <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }} className="rounded-xl overflow-hidden">
          <div style={{ height: "2px", background: `linear-gradient(90deg, ${GOLD} 0%, transparent 65%)` }} />

          <div className="p-8">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "#fff" }}>Reset Password</h2>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Enter your new admin password</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword" style={labelStyle}>New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="input-admin-new-password"
                  required
                  disabled={isSubmitting}
                  minLength={6}
                  style={inputStyle}
                  className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  data-testid="input-admin-confirm-password"
                  required
                  disabled={isSubmitting}
                  minLength={6}
                  style={inputStyle}
                  className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive mt-1">Passwords don't match</p>
                )}
              </div>
              <button
                type="submit"
                data-testid="button-admin-reset-password-submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: GOLD, color: BG, border: "none", cursor: "pointer" }}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
