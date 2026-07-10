import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { PoweredByBadge } from "@/components/PoweredByBadge";

export default function JoinLoyalty() {
  // Handles /join/:userId (legacy), /join/:storeId (new QR), and /:shopName/join (slug-based)
  const params = useParams<{ userId?: string; shopName?: string }>();
  const storeRef = params.userId || params.shopName;
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");

  const joinMutation = useMutation({
    mutationFn: async (data: { storeId: string; userId: string; name?: string }) => {
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
    // Send storeRef as both storeId and userId — backend resolves by storeId, userId, or shopName slug.
    joinMutation.mutate({
      storeId: storeRef!,
      userId: storeRef!,
      name: name || undefined,
    });
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Loyalty Program</CardTitle>
          <p className="text-muted-foreground">Get rewards with every visit!</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                data-testid="input-name"
                disabled={joinMutation.isPending}
                required
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
      <PoweredByBadge variant="dark" className="absolute inset-x-0 bottom-6" />
    </div>
  );
}
