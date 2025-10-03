import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AuthPage() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shopName, setShopName] = useState("");
  
  const { login, signup, isLoggingIn, isSigningUp, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

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
    if (signupPassword !== confirmPassword) {
      return;
    }
    signup({ email: signupEmail, password: signupPassword, confirmPassword, shopName });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold text-primary mb-3 tracking-tight">MerchantHub</h1>
          <p className="text-muted-foreground text-lg">Manage loyalty & engagement</p>
        </div>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
            <CardDescription className="text-base">Login or create your account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      data-testid="input-login-email"
                      required
                      disabled={isLoggingIn}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      data-testid="input-login-password"
                      required
                      disabled={isLoggingIn}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full" data-testid="button-login-submit" disabled={isLoggingIn}>
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="shop-name" className="text-sm font-medium">Shop Name</Label>
                    <Input
                      id="shop-name"
                      type="text"
                      placeholder="My Coffee Shop"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      data-testid="input-shop-name"
                      required
                      disabled={isSigningUp}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      data-testid="input-signup-email"
                      required
                      disabled={isSigningUp}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      data-testid="input-confirm-password"
                      required
                      disabled={isSigningUp}
                    />
                    {confirmPassword && signupPassword !== confirmPassword && (
                      <p className="text-sm text-destructive mt-1">Passwords don't match</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full" 
                    data-testid="button-signup-submit" 
                    disabled={isSigningUp || signupPassword !== confirmPassword}
                  >
                    {isSigningUp ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
