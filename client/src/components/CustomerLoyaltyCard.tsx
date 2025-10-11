import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Download, Wallet, Smartphone, X, Share2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SiApple, SiGoogle } from "react-icons/si";

export default function CustomerLoyaltyCard() {
  const { customerId } = useParams();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api", "loyalty-card", "customer", customerId],
    queryFn: () => apiRequest<any>(`/api/loyalty-card/customer/${customerId}`),
    enabled: !!customerId,
  });

  const { data: qrData } = useQuery({
    queryKey: ["/api", "customer-qr", customerId],
    queryFn: () => apiRequest<{ qrCode: string; qrCodeValue: string }>(`/api/customer-qr/${customerId}`),
    enabled: !!customerId,
  });

  // iOS Detection
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };

  // Detect iOS on mount
  useEffect(() => {
    if (isIOS()) {
      setShowIOSInstructions(true);
    }
  }, []);

  // Helper function to set or update meta tags
  const setMetaTag = (name: string, content: string, useProperty = false) => {
    const attribute = useProperty ? 'property' : 'name';
    let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Helper function to set or update link tags
  const setLinkTag = (rel: string, href: string) => {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', rel);
      document.head.appendChild(element);
    }
    element.setAttribute('href', href);
  };

  // Set iOS web app meta tags when data is available
  useEffect(() => {
    if (!data) return;

    const { user } = data;
    const shopName = user?.shopName || "Shop";
    const shopLogo = user?.logo;

    // Set Apple-specific meta tags
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    setMetaTag('apple-mobile-web-app-title', shopName);
    
    // Set theme color
    setMetaTag('theme-color', '#0ea5e9'); // Using a primary blue color
    
    // Set apple touch icon if logo exists
    if (shopLogo) {
      setLinkTag('apple-touch-icon', shopLogo);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading your card...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Card not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { card, customer, user } = data;
  const shopName = user?.shopName || "Shop";
  const shopLogo = user?.logo;
  const stamps = card.stamps;
  const maxStamps = card.maxStamps;
  const rewardText = card.rewardText;
  const isRedeemable = card.isRedeemable;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Avatar className="h-20 w-20 mx-auto">
            {shopLogo ? (
              <AvatarImage src={shopLogo} alt={shopName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {shopName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{shopName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {customer?.name || "Loyalty Member"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              {stamps}/{maxStamps} Stamps
            </p>
            <div className="grid grid-cols-5 gap-3 justify-items-center">
              {Array.from({ length: maxStamps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                    i < stamps
                      ? "bg-chart-2 border-chart-2 text-white"
                      : "border-muted bg-muted/20"
                  }`}
                  data-testid={`stamp-${i}`}
                >
                  {i < stamps && <Check className="w-6 h-6" />}
                </div>
              ))}
            </div>
          </div>

          {isRedeemable ? (
            <div className="text-center space-y-4">
              <Badge variant="default" className="text-lg px-4 py-2">
                Reward Ready!
              </Badge>
              <p className="text-xl font-semibold text-chart-2">{rewardText}</p>
              <p className="text-sm text-muted-foreground">
                Show this screen to the cashier to claim your reward!
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">
                {maxStamps - stamps} more {maxStamps - stamps === 1 ? "stamp" : "stamps"} until your {rewardText}
              </p>
            </div>
          )}

          {showIOSInstructions && (
            <Alert className="relative" data-testid="alert-ios-instructions">
              <Smartphone className="h-4 w-4" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setShowIOSInstructions(false)}
                data-testid="button-dismiss-ios-instructions"
              >
                <X className="h-4 w-4" />
              </Button>
              <AlertTitle data-testid="text-ios-title">Save to Home Screen</AlertTitle>
              <AlertDescription data-testid="text-ios-description">
                <p className="mb-2">Quick access your loyalty card like an app:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Tap the Share button <span className="inline-flex items-center"><Share2 className="w-4 h-4" /></span> in Safari</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                  Note: Full Apple Wallet integration is coming soon! For now, save this page for quick access.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {qrData && (
            <div className="pt-4 border-t space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium mb-3">Show this QR code to collect stamps</p>
                <div className="flex justify-center">
                  <img 
                    src={qrData.qrCode} 
                    alt="Customer QR Code" 
                    className="w-48 h-48"
                    data-testid="customer-qr-code"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm font-medium text-center">Add to Wallet</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.open(`/api/wallet/apple/${customerId}`, '_blank');
                }}
                data-testid="button-add-to-apple-wallet"
              >
                <SiApple className="w-5 h-5 mr-2" />
                Apple Wallet
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.open(`/api/wallet/google/${customerId}`, '_blank');
                }}
                data-testid="button-add-to-google-wallet"
              >
                <SiGoogle className="w-5 h-5 mr-2" />
                Google Wallet
              </Button>
            </div>
          </div>

          <div className="pt-4 text-center text-xs text-muted-foreground space-y-2">
            <p>Save to your digital wallet for quick access</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
