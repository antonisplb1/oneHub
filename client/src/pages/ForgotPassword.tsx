import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";

const GOLD = "#E53935";
const GOLD_DIM = "rgba(229, 57, 53,0.18)";
const GOLD_BORDER = "rgba(229, 57, 53,0.25)";
const SURFACE = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
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
          <h1 className="text-2xl font-light text-white mb-1">Reset your password</h1>
          <p className="text-sm" style={{ color: MUTED }}>We'll send a reset link to your email</p>
        </div>

        <div
          className="p-8 rounded-md"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs tracking-wide" style={{ color: MUTED }}>
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-reset-email"
                  required
                  disabled={isSubmitting}
                  className="bg-transparent border-white/10 text-white placeholder:text-white/20 focus-visible:ring-0 focus-visible:border-white/30"
                />
              </div>
              <Button
                type="submit"
                className="w-full tracking-wide text-sm font-medium"
                style={{ backgroundColor: GOLD, color: "#080808", border: "none" }}
                data-testid="button-send-reset"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-5 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: GOLD_DIM }}
              >
                <Mail className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <p className="text-sm font-light leading-relaxed" style={{ color: MUTED }}>
                If an account exists with that email, you'll receive a reset link shortly.
              </p>
              <Button
                variant="outline"
                className="w-full border-white/15 text-white bg-transparent hover:bg-white/5 text-sm"
                onClick={() => { setSubmitted(false); setEmail(""); }}
                data-testid="button-send-another"
              >
                Send Another
              </Button>
            </div>
          )}

          <div className="mt-6 text-center border-t pt-5" style={{ borderColor: BORDER }}>
            <Link href="/auth">
              <button
                className="inline-flex items-center gap-1.5 text-sm transition-opacity opacity-60 hover:opacity-100"
                style={{ color: MUTED }}
                data-testid="link-back-to-login"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
