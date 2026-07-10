import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";
import { Loader2 } from "lucide-react";

const GOLD = "#E53935";
const BG = "#080808";
const SURFACE = "#101010";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);

  const { login, signup, isLoggingIn, isSigningUp, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'login') setActiveTab('login');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email: loginEmail, password: loginPassword });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== confirmPassword) return;
    signup({ email: signupEmail, password: signupPassword, confirmPassword, shopName, turnstileToken });
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
          <Link href="/">
            <div className="inline-flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-3">
              <img src={logoImage} alt="uniHub logo" className="h-10 w-10" />
              <h1 className="text-4xl tracking-tight">
                <span style={{ color: "#fff", fontWeight: 300 }}>uni</span>
                <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
              </h1>
            </div>
          </Link>
          <p style={{ color: MUTED }} className="text-base">Manage loyalty &amp; engagement</p>
        </div>

        <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }} className="rounded-xl overflow-hidden">
          <div style={{ height: "2px", background: `linear-gradient(90deg, ${GOLD} 0%, transparent 65%)` }} />

          <div className="p-8">
            <div
              className="flex gap-1 mb-8 p-1 rounded-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              {(["login", "signup"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  data-testid={`tab-${tab}`}
                  className="flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: activeTab === tab ? GOLD : "transparent",
                    color: activeTab === tab ? BG : MUTED,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {tab === "login" ? "Login" : "Sign Up"}
                </button>
              ))}
            </div>

            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" style={labelStyle}>Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    data-testid="input-login-email"
                    required
                    disabled={isLoggingIn}
                    style={inputStyle}
                    className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" style={labelStyle}>Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    data-testid="input-login-password"
                    required
                    disabled={isLoggingIn}
                    style={inputStyle}
                    className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                  />
                </div>
                <button
                  type="submit"
                  data-testid="button-login-submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: GOLD, color: BG, border: "none", cursor: "pointer" }}
                >
                  {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoggingIn ? "Logging in..." : "Login"}
                </button>
                <div className="text-center">
                  <a href="/forgot-password" style={{ color: GOLD, fontSize: "0.8125rem" }} className="hover:opacity-80 transition-opacity" data-testid="link-forgot-password">
                    Forgot Password?
                  </a>
                </div>
              </form>
            )}

            {activeTab === "signup" && (
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="shop-name" style={labelStyle}>Shop Name</Label>
                  <Input
                    id="shop-name"
                    type="text"
                    placeholder="My Coffee Shop"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    data-testid="input-shop-name"
                    required
                    disabled={isSigningUp}
                    style={inputStyle}
                    className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" style={labelStyle}>Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    data-testid="input-signup-email"
                    required
                    disabled={isSigningUp}
                    style={inputStyle}
                    className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" style={labelStyle}>Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    data-testid="input-signup-password"
                    required
                    disabled={isSigningUp}
                    minLength={6}
                    style={inputStyle}
                    className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" style={labelStyle}>Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                    required
                    disabled={isSigningUp}
                    style={inputStyle}
                    className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                  />
                  {confirmPassword && signupPassword !== confirmPassword && (
                    <p className="text-sm text-destructive mt-1">Passwords don't match</p>
                  )}
                </div>
                <div className="space-y-2" data-testid="turnstile-widget">
                  <div className="flex justify-center">
                    <Turnstile
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onSuccess={(token) => {
                        setTurnstileToken(token);
                        setTurnstileError(false);
                      }}
                      onError={() => {
                        setTurnstileToken(null);
                        setTurnstileError(true);
                      }}
                      onExpire={() => {
                        setTurnstileToken(null);
                      }}
                    />
                  </div>
                  {turnstileError && (
                    <p style={{ color: MUTED }} className="text-xs text-center">
                      Note: CAPTCHA widget may not load in development. This is expected and won't prevent testing.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  data-testid="button-signup-submit"
                  disabled={isSigningUp || signupPassword !== confirmPassword}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: GOLD, color: BG, border: "none", cursor: "pointer" }}
                >
                  {isSigningUp && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSigningUp ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p style={{ color: "rgba(255,255,255,0.25)" }} className="text-xs text-center mt-6">
          By signing up you agree to our{" "}
          <a href="/terms-of-service" style={{ color: GOLD }} className="hover:opacity-80">Terms</a>
          {" "}&amp;{" "}
          <a href="/privacy-policy" style={{ color: GOLD }} className="hover:opacity-80">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
