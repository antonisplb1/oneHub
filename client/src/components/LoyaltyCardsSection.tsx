import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, QrCode, Users } from "lucide-react";

export default function LoyaltyCardsSection() {
  const [maxStamps, setMaxStamps] = useState("10");
  const [rewardText, setRewardText] = useState("Free Coffee");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  //todo: remove mock functionality
  const mockCustomers = [
    { id: "1", name: "John Doe", stamps: 7, maxStamps: 10 },
    { id: "2", name: "Jane Smith", stamps: 10, maxStamps: 10, redeemable: true },
    { id: "3", name: "Bob Johnson", stamps: 3, maxStamps: 10 },
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Settings saved:", { maxStamps, rewardText });
    setIsSettingsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Loyalty Cards</h1>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-card-settings">
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
              <div className="space-y-4">
                {mockCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                    data-testid={`customer-card-${customer.id}`}
                  >
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.stamps}/{customer.maxStamps} stamps
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array.from({ length: customer.maxStamps }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
                              i < customer.stamps
                                ? "bg-chart-2 border-chart-2 text-white"
                                : "border-muted"
                            }`}
                          >
                            {i < customer.stamps ? "✓" : ""}
                          </div>
                        ))}
                      </div>
                      {customer.redeemable && (
                        <Button size="sm" variant="default" data-testid={`button-redeem-${customer.id}`}>
                          Redeem
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-code">
          <Card>
            <CardHeader>
              <CardTitle>Shop QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-64 h-64 bg-muted rounded-md flex items-center justify-center">
                <QrCode className="w-32 h-32 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Customers scan this QR code to join your loyalty program
              </p>
              <Button variant="outline" data-testid="button-download-qr">
                Download QR Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
