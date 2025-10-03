import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Check, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ScannerPage() {
  const [qrCode, setQrCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (qrCodeValue: string) => {
      return apiRequest<any>("/api/loyalty-cards/scan-stamp", {
        method: "POST",
        body: JSON.stringify({ qrCode: qrCodeValue }),
      });
    },
    onSuccess: (data) => {
      setScanResult(data);
      setQrCode("");
      toast({
        title: "Success!",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Customer not found",
        variant: "destructive",
      });
    },
  });

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCode.trim()) {
      scanMutation.mutate(qrCode.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR Scanner</h1>
        <p className="text-muted-foreground mt-2">
          Scan customer QR codes to add stamps to their loyalty cards
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Scan Customer QR Code
          </CardTitle>
          <CardDescription>
            Enter the QR code shown on the customer's loyalty card
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <Label htmlFor="qrCode">QR Code Value</Label>
              <Input
                id="qrCode"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Paste or type QR code here"
                data-testid="input-qr-code"
                disabled={scanMutation.isPending}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Use a QR scanner device to automatically fill this field
              </p>
            </div>
            <Button
              type="submit"
              disabled={!qrCode.trim() || scanMutation.isPending}
              data-testid="button-scan"
              className="w-full"
            >
              {scanMutation.isPending ? "Scanning..." : "Add Stamp"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {scanResult && (
        <Card className="bg-chart-2/10 border-chart-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-chart-2">
              <Check className="w-5 h-5" />
              Stamp Added Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Customer</p>
              <p className="text-lg">{scanResult.customer.name || "Anonymous"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Progress</p>
              <p className="text-2xl font-bold text-chart-2">
                {scanResult.card.stamps}/{scanResult.card.maxStamps} Stamps
              </p>
            </div>
            {scanResult.card.isRedeemable && (
              <div className="bg-chart-2 text-white p-4 rounded-lg text-center">
                <p className="font-bold text-lg">🎉 Reward Ready!</p>
                <p className="text-sm mt-1">{scanResult.card.rewardText}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
