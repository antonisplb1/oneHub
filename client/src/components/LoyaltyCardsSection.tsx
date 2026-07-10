import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, QrCode, Users, Scan, Gift, Bell } from "lucide-react";
import { getLoyaltyCards, addStamp, getShopQRCode, getLoyaltySettings, updateLoyaltySettings } from "@/lib/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PoweredByBadge } from "@/components/PoweredByBadge";

const notificationSchema = z.object({
  header: z.string().optional(),
  body: z.string().min(1, "Message is required"),
  displayStartTime: z.string().min(1, "Start time is required"),
  displayEndTime: z.string().min(1, "End time is required"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function LoyaltyCardsSection() {
  const [maxStamps, setMaxStamps] = useState("10");
  const [rewardText, setRewardText] = useState("Free Coffee");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: loyaltySettings } = useQuery({
    queryKey: ["/api", "loyalty-settings"],
    queryFn: getLoyaltySettings,
  });

  useEffect(() => {
    if (loyaltySettings) {
      setMaxStamps(String(loyaltySettings.maxStamps));
      setRewardText(loyaltySettings.rewardText);
    }
  }, [loyaltySettings]);

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      header: "",
      body: "",
      displayStartTime: "",
      displayEndTime: "",
    },
  });

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

  const sendNotificationMutation = useMutation({
    mutationFn: async (values: NotificationFormValues) => {
      return apiRequest("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          header: values.header || undefined,
          body: values.body,
          displayStartTime: new Date(values.displayStartTime).toISOString(),
          displayEndTime: new Date(values.displayEndTime).toISOString(),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification sent successfully to all customers",
      });
      notificationForm.reset();
      setIsNotificationOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: updateLoyaltySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api", "loyalty-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api", "loyalty-cards"] });
      toast({
        title: "Settings saved",
        description: "Your loyalty card settings have been updated.",
      });
      setIsSettingsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMaxStamps = parseInt(maxStamps, 10);
    if (!rewardText.trim()) {
      toast({
        title: "Error",
        description: "Reward description is required",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(parsedMaxStamps) || parsedMaxStamps < 1 || parsedMaxStamps > 20) {
      toast({
        title: "Error",
        description: "Stamps required must be between 1 and 20",
        variant: "destructive",
      });
      return;
    }
    saveSettingsMutation.mutate({ rewardText: rewardText.trim(), maxStamps: parsedMaxStamps });
  };

  const onNotificationSubmit = (values: NotificationFormValues) => {
    sendNotificationMutation.mutate(values);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Loyalty Cards</h1>
          <p className="text-muted-foreground text-lg">Manage customer stamps and rewards</p>
        </div>
        <div className="flex gap-3">
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
              <Button variant="outline" size="lg" data-testid="button-card-settings">
                <Plus className="w-4 h-4 mr-2" />
                Card Settings
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Loyalty Card Settings</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSettings} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="max-stamps" className="text-sm font-medium">Stamps Required</Label>
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
              <div className="space-y-2">
                <Label htmlFor="reward-text" className="text-sm font-medium">Reward Description</Label>
                <Input
                  id="reward-text"
                  value={rewardText}
                  onChange={(e) => setRewardText(e.target.value)}
                  data-testid="input-reward-text"
                  placeholder="e.g., Free Coffee, 10% Off"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={saveSettingsMutation.isPending} data-testid="button-save-settings">
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs defaultValue="customers">
        <div className="flex items-center justify-between gap-4 flex-wrap">
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
          
          <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <DialogTrigger asChild>
              <Button size="lg" data-testid="button-send-notification-trigger">
                <Bell className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">Send Customer Notification</DialogTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Send a push notification to all customers who have added your loyalty card to Google Wallet
                </p>
              </DialogHeader>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-4 pt-4">
                  <FormField
                    control={notificationForm.control}
                    name="header"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Optional header"
                            data-testid="input-notification-header"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter notification message"
                            data-testid="textarea-notification-body"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={notificationForm.control}
                      name="displayStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              data-testid="input-notification-start-time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="displayEndTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              data-testid="input-notification-end-time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sendNotificationMutation.isPending}
                    className="w-full"
                    size="lg"
                    data-testid="button-send-notification"
                  >
                    {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="customers" className="space-y-6 mt-6">
          <Card className="border-card-border shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold">Active Loyalty Cards</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground py-4">Loading...</p>
              ) : cards.length === 0 ? (
                <p className="text-muted-foreground py-4">No loyalty cards yet. Customers will appear here once they scan your QR code.</p>
              ) : (
                <div className="space-y-4">
                  {cards.map(({ card, customer }) => (
                    <div
                      key={card.id}
                      className={`flex items-center justify-between gap-6 p-6 border rounded-xl hover-elevate ${
                        card.isRedeemable ? "border-chart-2 bg-chart-2/5" : ""
                      }`}
                      data-testid={`customer-card-${card.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-lg">{customer?.name || "Anonymous Customer"}</p>
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
                          <p className="text-sm text-chart-2 font-medium mt-2">
                            Next scan will grant reward and reset card to 0
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: card.maxStamps }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr-code" className="mt-6">
          <Card className="border-card-border shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold">Shop QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              {qrCodeData ? (
                <img 
                  src={qrCodeData.qrCode} 
                  alt="Shop QR Code" 
                  className="w-72 h-72 border rounded-2xl shadow-sm"
                />
              ) : (
                <div className="w-72 h-72 bg-muted rounded-2xl flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-muted-foreground" />
                </div>
              )}
              <p className="text-muted-foreground text-center max-w-md">
                Customers scan this QR code to join your loyalty program
              </p>
              {qrCodeData && (
                <a 
                  href={qrCodeData.qrCode} 
                  download="shop-qr-code.png"
                >
                  <Button variant="outline" size="lg" data-testid="button-download-qr">
                    Download QR Code
                  </Button>
                </a>
              )}
              <PoweredByBadge variant="dark" className="pt-2" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
