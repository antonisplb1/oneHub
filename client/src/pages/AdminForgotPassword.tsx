import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

const GOLD = "#c9a84c";
const BG = "#080808";
const SURFACE = "#101010";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setSubmitted(true);
      toast({ title: "Email sent", description: data.message });
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
          <p style={{ color: MUTED }} className="text-base">Reset your admin password</p>
        </div>

        <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }} className="rounded-xl overflow-hidden">
          <div style={{ height: "2px", background: `linear-gradient(90deg, ${GOLD} 0%, transparent 65%)` }} />

          <div className="p-8">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "#fff" }}>Forgot Password</h2>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Enter your admin email and we'll send you a reset link</p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" style={labelStyle}>Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-admin-reset-email"
                    required
                    disabled={isSubmitting}
                    style={inputStyle}
                    className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="button-admin-send-reset"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: GOLD, color: BG, border: "none", cursor: "pointer" }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 style={{ color: GOLD }} className="h-12 w-12" />
                </div>
                <p style={{ color: MUTED }} className="text-sm leading-relaxed">
                  If an admin account exists with that email, you'll receive a password reset link shortly.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                  data-testid="button-admin-send-another"
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#fff", border: `1px solid ${BORDER}`, cursor: "pointer" }}
                >
                  Send Another
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/admin">
                <span style={{ color: MUTED, fontSize: "0.8125rem", cursor: "pointer" }} className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity" data-testid="link-back-to-admin-login">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Login
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
