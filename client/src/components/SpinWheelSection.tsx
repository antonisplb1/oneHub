import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Ticket, Gift } from "lucide-react";

export default function SpinWheelSection() {
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [rewardName, setRewardName] = useState("");
  const [winChance, setWinChance] = useState("25");

  //todo: remove mock functionality
  const mockRewards = [
    { id: "1", name: "Free Coffee", winChance: 30, timesWon: 12, isActive: true },
    { id: "2", name: "10% Off", winChance: 25, timesWon: 8, isActive: true },
    { id: "3", name: "Free Pastry", winChance: 20, timesWon: 5, isActive: true },
    { id: "4", name: "Better Luck Next Time", winChance: 25, timesWon: 15, isActive: true },
  ];

  const mockTokens = [
    { id: "1", customerName: "John Doe", token: "ABC123", isUsed: false, expiresAt: "2025-10-10" },
    { id: "2", customerName: "Jane Smith", token: "XYZ789", isUsed: true, expiresAt: "2025-10-09" },
  ];

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating reward:", { rewardName, winChance });
    setIsRewardDialogOpen(false);
    setRewardName("");
    setWinChance("25");
  };

  const handleGenerateToken = () => {
    console.log("Generating spin token");
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
              <Button type="submit" className="w-full" data-testid="button-create-reward">
                Create Reward
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards" data-testid="tab-rewards">
            <Gift className="w-4 h-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="tokens" data-testid="tab-tokens">
            <Ticket className="w-4 h-4 mr-2" />
            Spin Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prize Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                    data-testid={`reward-${reward.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{reward.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {reward.winChance}% chance • Won {reward.timesWon} times
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Spin Tokens</CardTitle>
              <Button onClick={handleGenerateToken} data-testid="button-generate-token">
                <Plus className="w-4 h-4 mr-2" />
                Generate Token
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTokens.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                    data-testid={`token-${token.id}`}
                  >
                    <div>
                      <p className="font-semibold font-mono">{token.token}</p>
                      <p className="text-sm text-muted-foreground">
                        {token.customerName} • Expires {token.expiresAt}
                      </p>
                    </div>
                    <Badge variant={token.isUsed ? "secondary" : "default"}>
                      {token.isUsed ? "Used" : "Active"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
