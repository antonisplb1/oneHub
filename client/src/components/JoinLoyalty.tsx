import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";

export default function JoinLoyalty() {
  const { userId } = useParams();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const joinMutation = useMutation({
    mutationFn: async (data: { userId: string; name?: string; email?: string; phone?: string }) => {
      return apiRequest<{ customer: any; loyaltyCard: any }>("/api/customers/join", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setLocation(`/card/${data.customer.id}`);
    },
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate({
      userId: userId!,
      name: name || undefined,
      email: email || undefined,
      phone: phone || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Loyalty Program</CardTitle>
          <p className="text-muted-foreground">Get rewards with every visit!</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                data-testid="input-name"
                disabled={joinMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                data-testid="input-email"
                disabled={joinMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                data-testid="input-phone"
                disabled={joinMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={joinMutation.isPending}
              data-testid="button-join"
            >
              {joinMutation.isPending ? "Joining..." : "Join Now"}
            </Button>
            {joinMutation.isError && (
              <p className="text-sm text-destructive text-center">
                {(joinMutation.error as any)?.message || "Failed to join. Please try again."}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
