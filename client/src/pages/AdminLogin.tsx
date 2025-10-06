import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: adminData } = useQuery({
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
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-semibold text-primary tracking-tight">Admin Portal</h1>
          </div>
          <p className="text-muted-foreground text-lg">Secure administrator access</p>
        </div>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold">Admin Login</CardTitle>
            <CardDescription className="text-base">
              Enter your administrator credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-admin-email"
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="w-full" 
                data-testid="button-admin-login-submit" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
