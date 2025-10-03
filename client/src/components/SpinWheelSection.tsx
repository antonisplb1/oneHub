import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Gift, Gauge, Trash2 } from "lucide-react";
import { getRewards, createReward, updateReward, deleteReward } from "@/lib/api";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Reward } from "@shared/schema";

export default function SpinWheelSection() {
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [isEditRewardDialogOpen, setIsEditRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardName, setRewardName] = useState("");
  const [winChance, setWinChance] = useState("25");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ["/api", "rewards"],
    queryFn: getRewards,
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

  const updateRewardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reward> }) => updateReward(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "rewards"] });
      setIsEditRewardDialogOpen(false);
      setEditingReward(null);
      toast({
        title: "Reward updated!",
        description: "Your reward has been successfully updated.",
      });
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: deleteReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "rewards"] });
      toast({
        title: "Reward deleted!",
        description: "The reward has been removed from the wheel.",
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

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setRewardName(reward.name);
    setWinChance(reward.winChance.toString());
    setIsEditRewardDialogOpen(true);
  };

  const handleUpdateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    updateRewardMutation.mutate({
      id: editingReward.id,
      data: {
        name: rewardName,
        winChance: parseFloat(winChance),
      },
    });
  };

  const handleDeleteReward = (rewardId: string) => {
    if (confirm("Are you sure you want to delete this reward?")) {
      deleteRewardMutation.mutate(rewardId);
    }
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rewards" data-testid="tab-rewards">
            <Gift className="w-4 h-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="spin" data-testid="tab-spin">
            <Gauge className="w-4 h-4 mr-2" />
            Spin Wheel
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
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditReward(reward)}
                          data-testid={`button-edit-reward-${reward.id}`}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDeleteReward(reward.id)}
                          disabled={deleteRewardMutation.isPending}
                          data-testid={`button-delete-reward-${reward.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spin" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Spin QR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Share this QR code with customers. When scanned, they can spin the wheel one time.
                </p>
                {user && (
                  <div className="space-y-3">
                    <div className="flex justify-center p-4 border rounded-md bg-background">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/in-store-spin/${user.id}`)}`}
                        alt="Spin QR code"
                        className="w-64 h-64"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/in-store-spin/${user.id}`)}`;
                        link.download = `spin-qr.png`;
                        link.click();
                      }}
                      data-testid="button-download-qr"
                    >
                      Download QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>In-Store Wheel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Open unlimited spin wheel on a tablet or display for in-store customers
                </p>
                <div className="flex flex-col items-center gap-4 py-4">
                  <Gauge className="w-32 h-32 text-chart-2" />
                  <Button 
                    size="lg"
                    onClick={() => window.open(`/in-store-spin/${user?.id}`, '_blank')}
                    data-testid="button-open-in-store-wheel"
                    className="w-full"
                  >
                    <Gauge className="w-4 h-4 mr-2" />
                    Open In-Store Wheel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditRewardDialogOpen} onOpenChange={setIsEditRewardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateReward} className="space-y-4">
            <div>
              <Label htmlFor="edit-reward-name">Reward Name</Label>
              <Input
                id="edit-reward-name"
                value={rewardName}
                onChange={(e) => setRewardName(e.target.value)}
                data-testid="input-edit-reward-name"
                placeholder="e.g., Free Coffee"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-win-chance">Win Chance (%)</Label>
              <Input
                id="edit-win-chance"
                type="number"
                min="0"
                max="100"
                value={winChance}
                onChange={(e) => setWinChance(e.target.value)}
                data-testid="input-edit-win-chance"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              data-testid="button-update-reward"
              disabled={updateRewardMutation.isPending}
            >
              {updateRewardMutation.isPending ? "Updating..." : "Update Reward"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
