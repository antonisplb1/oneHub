import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/blob-b137548_1759662451793.png";

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
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
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

      toast({
        title: "Success",
        description: data.message || "Account setup complete! You can now log in.",
      });

      setTimeout(() => {
        setLocation("/auth");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/">
            <div className="flex items-center justify-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-3">
              <img src={logoImage} alt="uniHub logo" className="h-10 w-10" />
              <h1 className="text-4xl font-semibold text-primary tracking-tight">uniHub</h1>
            </div>
          </Link>
          <p className="text-muted-foreground text-lg">Set up your team member account</p>
        </div>

        <Card className="border-card-border shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold">Create Your Password</CardTitle>
            <CardDescription className="text-base">
              Enter a password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  data-testid="input-confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                data-testid="button-setup-account"
              >
                {isSubmitting ? "Setting up..." : "Set Up Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/auth">
            <span 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
