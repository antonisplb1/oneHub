import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const GOLD = "#E53935";
const BG = "#080808";
const SURFACE = "#101010";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: adminData } = useQuery<{ admin?: any }>({
    queryKey: ['/api/admin/me'],
  });

  useEffect(() => {
    if (adminData?.admin) {
      setLocation("/admin/dashboard");
    }
  }, [adminData, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Logged in successfully" });
      setLocation("/admin/dashboard");
    },
    onError: (error: any) => {
      const errorData = error.data || {};
      toast({
        title: "Login Failed",
        description: errorData.error || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
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
          <p style={{ color: MUTED }} className="text-base">Secure administrator access</p>
        </div>

        <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }} className="rounded-xl overflow-hidden">
          <div style={{ height: "2px", background: `linear-gradient(90deg, ${GOLD} 0%, transparent 65%)` }} />

          <div className="p-8">
            <h2 className="text-lg font-semibold mb-1" style={{ color: "#fff" }}>Admin Login</h2>
            <p className="text-sm mb-7" style={{ color: MUTED }}>Enter your administrator credentials</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-email" style={labelStyle}>Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-admin-email"
                  required
                  disabled={loginMutation.isPending}
                  style={inputStyle}
                  className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" style={labelStyle}>Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                  required
                  disabled={loginMutation.isPending}
                  style={inputStyle}
                  className="focus-visible:ring-0 focus-visible:border-white/30 placeholder:text-white/20"
                />
              </div>
              <button
                type="submit"
                data-testid="button-admin-login-submit"
                disabled={loginMutation.isPending}
                className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: GOLD, color: BG, border: "none", cursor: "pointer" }}
              >
                {loginMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/admin/forgot-password">
                <span style={{ color: GOLD, fontSize: "0.8125rem", cursor: "pointer" }} className="hover:opacity-80 transition-opacity" data-testid="link-admin-forgot-password">
                  Forgot Password?
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
