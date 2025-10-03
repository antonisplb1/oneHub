import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Ticket, Gift, Gauge } from "lucide-react";
import { getRewards, getSpinTokens, createReward, createSpinToken } from "@/lib/api";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function SpinWheelSection() {
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [rewardName, setRewardName] = useState("");
  const [winChance, setWinChance] = useState("25");
  const [customerName, setCustomerName] = useState("");
  const [expiryMinutes, setExpiryMinutes] = useState("30");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ["/api", "rewards"],
    queryFn: getRewards,
  });

  const { data: tokens = [], isLoading: isLoadingTokens } = useQuery({
    queryKey: ["/api", "spin-tokens"],
    queryFn: getSpinTokens,
  });

  const { data: tokenQR, refetch: refetchTokenQR } = useQuery({
    queryKey: ["/api", "spin-token", selectedTokenId, "qr"],
    queryFn: () => apiRequest<{ qrCode: string; url: string }>(`/api/spin-token/${selectedTokenId}/qr`),
    enabled: !!selectedTokenId,
  });

  const { data: inStoreQR } = useQuery({
    queryKey: ["/api", "spin-in-store-qr", user?.id],
    queryFn: () => apiRequest<{ qrCode: string; url: string }>(`/api/spin-in-store-qr/${user!.id}`),
    enabled: !!user?.id,
  });

  const rewardMutation = useMutation({
    mutationFn: createReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "rewards"] });
      setIsRewardDialogOpen(false);
      setRewardName("");
      setWinChance("25");
      toast({
        title: "Reward created!",
        description: "Your new reward has been added to the wheel.",
      });
    },
  });

  const tokenMutation = useMutation({
    mutationFn: createSpinToken,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api", "spin-tokens"] });
      setIsTokenDialogOpen(false);
      setCustomerName("");
      toast({
        title: "Token generated!",
        description: `Token: ${data.token}`,
        duration: 5000,
      });
    },
  });

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    rewardMutation.mutate({
      name: rewardName,
      winChance: parseFloat(winChance),
    });
  };

  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    tokenMutation.mutate({
      customerName: customerName || undefined,
      expiryMinutes: parseInt(expiryMinutes),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Spin Wheel</h1>
        <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-reward">
              <Plus className="w-4 h-4 mr-2" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <Label htmlFor="reward-name">Reward Name</Label>
                <Input
                  id="reward-name"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  data-testid="input-reward-name"
                  placeholder="e.g., Free Coffee"
                  required
                />
              </div>
              <div>
                <Label htmlFor="win-chance">Win Chance (%)</Label>
                <Input
                  id="win-chance"
                  type="number"
                  min="0"
                  max="100"
                  value={winChance}
                  onChange={(e) => setWinChance(e.target.value)}
                  data-testid="input-win-chance"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                data-testid="button-create-reward"
                disabled={rewardMutation.isPending}
              >
                {rewardMutation.isPending ? "Creating..." : "Create Reward"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards" data-testid="tab-rewards">
            <Gift className="w-4 h-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="tokens" data-testid="tab-tokens">
            <Ticket className="w-4 h-4 mr-2" />
            Spin Tokens
          </TabsTrigger>
          <TabsTrigger value="in-store" data-testid="tab-in-store">
            <Gauge className="w-4 h-4 mr-2" />
            In-Store Wheel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prize Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRewards ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : rewards.length === 0 ? (
                <p className="text-muted-foreground">No rewards configured yet. Add your first reward to get started.</p>
              ) : (
                <div className="space-y-4">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`reward-${reward.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{reward.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reward.winChance}% chance • Won {reward.timesWon || 0} times
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={reward.isActive ? "default" : "secondary"}>
                          {reward.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button size="sm" variant="ghost" data-testid={`button-edit-reward-${reward.id}`}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <CardTitle>Spin Tokens</CardTitle>
              <Dialog open={isTokenDialogOpen} onOpenChange={setIsTokenDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-generate-token">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Spin Token</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGenerateToken} className="space-y-4">
                    <div>
                      <Label htmlFor="customer-name">Customer Name (optional)</Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        data-testid="input-customer-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry-minutes">Expiry (minutes)</Label>
                      <Input
                        id="expiry-minutes"
                        type="number"
                        min="1"
                        max="1440"
                        value={expiryMinutes}
                        onChange={(e) => setExpiryMinutes(e.target.value)}
                        data-testid="input-expiry-minutes"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={tokenMutation.isPending}
                      data-testid="button-submit-token"
                    >
                      {tokenMutation.isPending ? "Generating..." : "Generate Token"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingTokens ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : tokens.length === 0 ? (
                <p className="text-muted-foreground">No tokens generated yet. Create one to share with customers.</p>
              ) : (
                <div className="space-y-4">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                      data-testid={`token-${token.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold font-mono text-lg">{token.token}</p>
                        <p className="text-sm text-muted-foreground">
                          {token.customerName || "Anonymous"} • Expires {new Date(token.expiresAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={token.isUsed ? "secondary" : "default"}>
                          {token.isUsed ? "Used" : "Active"}
                        </Badge>
                        {!token.isUsed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTokenId(token.id)}
                            data-testid={`button-qr-${token.id}`}
                          >
                            Show QR
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="in-store">
          <Card>
            <CardHeader>
              <CardTitle>In-Store Wheel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Let customers spin the wheel unlimited times at your store location. Display this QR code at the counter or on a tablet.
              </p>
              {inStoreQR ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={inStoreQR.qrCode}
                    alt="In-store wheel QR code"
                    className="w-64 h-64 border rounded-md"
                  />
                  <a href={inStoreQR.qrCode} download="in-store-wheel-qr.png">
                    <Button variant="outline" data-testid="button-download-in-store-qr">
                      Download QR Code
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="w-64 h-64 bg-muted rounded-md flex items-center justify-center mx-auto">
                  <Gauge className="w-32 h-32 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTokenId && tokenQR && (
        <Dialog open={!!selectedTokenId} onOpenChange={() => setSelectedTokenId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Token QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <img
                src={tokenQR.qrCode}
                alt="Token QR code"
                className="w-64 h-64 border rounded-md"
              />
              <p className="text-sm text-muted-foreground text-center">
                Customer scans this QR code to spin the wheel once
              </p>
              <a href={tokenQR.qrCode} download={`spin-token-qr.png`}>
                <Button variant="outline" data-testid="button-download-token-qr">
                  Download QR Code
                </Button>
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
