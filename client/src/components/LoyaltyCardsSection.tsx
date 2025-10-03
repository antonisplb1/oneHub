import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, Users, Scan, Gift } from "lucide-react";
import { getLoyaltyCards, addStamp, getShopQRCode } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function LoyaltyCardsSection() {
  const [maxStamps, setMaxStamps] = useState("10");
  const [rewardText, setRewardText] = useState("Free Coffee");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["/api", "loyalty-cards"],
    queryFn: getLoyaltyCards,
  });

  const { data: qrCodeData } = useQuery({
    queryKey: ["/api", "shop-qr-code"],
    queryFn: getShopQRCode,
  });

  const stampMutation = useMutation({
    mutationFn: addStamp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "loyalty-cards"] });
      toast({
        title: "Stamp added!",
        description: "Customer stamp has been recorded.",
      });
    },
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Settings saved:", { maxStamps, rewardText });
    setIsSettingsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Loyalty Cards</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setLocation("/dashboard/scanner")}
            size="lg"
            data-testid="button-open-scanner"
          >
            <Scan className="w-4 h-4 mr-2" />
            Scan QR Code
          </Button>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-card-settings">
                <Plus className="w-4 h-4 mr-2" />
                Card Settings
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Loyalty Card Settings</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <Label htmlFor="max-stamps">Stamps Required</Label>
                <Input
                  id="max-stamps"
                  type="number"
                  min="1"
                  max="20"
                  value={maxStamps}
                  onChange={(e) => setMaxStamps(e.target.value)}
                  data-testid="input-max-stamps"
                />
              </div>
              <div>
                <Label htmlFor="reward-text">Reward Description</Label>
                <Input
                  id="reward-text"
                  value={rewardText}
                  onChange={(e) => setRewardText(e.target.value)}
                  data-testid="input-reward-text"
                  placeholder="e.g., Free Coffee, 10% Off"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-save-settings">
                Save Settings
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers" data-testid="tab-customers">
            <Users className="w-4 h-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="qr-code" data-testid="tab-qr-code">
            <QrCode className="w-4 h-4 mr-2" />
            Shop QR Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Loyalty Cards</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : cards.length === 0 ? (
                <p className="text-muted-foreground">No loyalty cards yet. Customers will appear here once they scan your QR code.</p>
              ) : (
                <div className="space-y-4">
                  {cards.map(({ card, customer }) => (
                    <div
                      key={card.id}
                      className={`flex items-center justify-between p-4 border rounded-md hover-elevate ${
                        card.isRedeemable ? "border-chart-2 bg-chart-2/5" : ""
                      }`}
                      data-testid={`customer-card-${card.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{customer?.name || "Anonymous Customer"}</p>
                          {card.isRedeemable && (
                            <Badge variant="default" className="bg-chart-2" data-testid={`badge-reward-ready-${card.id}`}>
                              <Gift className="w-3 h-3 mr-1" />
                              Reward Ready
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {card.stamps}/{card.maxStamps} stamps
                          {card.totalRewards > 0 && (
                            <span className="ml-2">• {card.totalRewards} rewards granted</span>
                          )}
                        </p>
                        {card.isRedeemable && (
                          <p className="text-sm text-chart-2 font-medium mt-1">
                            Next scan will grant reward and reset card to 0
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          {Array.from({ length: card.maxStamps }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
                                i < card.stamps
                                  ? "bg-chart-2 border-chart-2 text-white"
                                  : "border-muted"
                              }`}
                            >
                              {i < card.stamps ? "✓" : ""}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-code">
          <Card>
            <CardHeader>
              <CardTitle>Shop QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {qrCodeData ? (
                <img 
                  src={qrCodeData.qrCode} 
                  alt="Shop QR Code" 
                  className="w-64 h-64 border rounded-md"
                />
              ) : (
                <div className="w-64 h-64 bg-muted rounded-md flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-muted-foreground" />
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center">
                Customers scan this QR code to join your loyalty program
              </p>
              {qrCodeData && (
                <a 
                  href={qrCodeData.qrCode} 
                  download="shop-qr-code.png"
                >
                  <Button variant="outline" data-testid="button-download-qr">
                    Download QR Code
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
