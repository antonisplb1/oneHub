import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Check, Camera, CameraOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  const scanMutation = useMutation({
    mutationFn: async (qrCodeValue: string) => {
      return apiRequest<any>("/api/loyalty-cards/scan-stamp", {
        method: "POST",
        body: JSON.stringify({ qrCode: qrCodeValue }),
      });
    },
    onSuccess: async (data) => {
      await stopScanning();
      setScanResult(data);
      setShowResultDialog(true);
      isProcessingRef.current = false;
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Customer not found",
        variant: "destructive",
      });
      isProcessingRef.current = false;
    },
  });

  const startScanning = async () => {
    try {
      setScanResult(null);
      setShowResultDialog(false);
      const qrElement = document.getElementById("qr-reader");
      if (!qrElement) {
        throw new Error("QR reader element not found");
      }

      qrElement.style.display = "block";
      setIsScanning(true);
      
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!isProcessingRef.current) {
            isProcessingRef.current = true;
            scanMutation.mutate(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      const qrElement = document.getElementById("qr-reader");
      if (qrElement) {
        qrElement.style.display = "none";
      }
      setIsScanning(false);
      scannerRef.current = null;
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
        isProcessingRef.current = false;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
          .then(() => scannerRef.current?.clear())
          .catch(console.error);
      }
    };
  }, []);

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
            Camera QR Scanner
          </CardTitle>
          <CardDescription>
            Point your camera at the customer's QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            id="qr-reader" 
            className="w-full"
            style={{ 
              display: isScanning ? 'block' : 'none',
              maxWidth: '500px',
              margin: '0 auto'
            }}
          />

          {!isScanning && (
            <div className="flex items-center justify-center p-12 bg-muted rounded-lg">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Camera is ready to scan
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!isScanning ? (
              <Button
                onClick={startScanning}
                className="flex-1"
                data-testid="button-start-camera"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button
                onClick={stopScanning}
                variant="destructive"
                className="flex-1"
                data-testid="button-stop-camera"
              >
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            )}
          </div>

          {isScanning && (
            <p className="text-sm text-center text-muted-foreground">
              Position the QR code within the scanning area
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 text-2xl ${scanResult?.rewardGranted ? "text-green-600" : "text-chart-2"}`}>
              <Check className="w-6 h-6" />
              {scanResult?.rewardGranted ? "Reward Granted!" : "Stamp Awarded!"}
            </DialogTitle>
            <DialogDescription>
              Scan completed successfully
            </DialogDescription>
          </DialogHeader>
          {scanResult && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p className="text-xl font-semibold">{scanResult.customer.name || "Anonymous"}</p>
              </div>
              {scanResult.rewardGranted ? (
                <div className="bg-green-500 text-white p-4 rounded-lg text-center">
                  <p className="font-bold text-lg">Reward Granted!</p>
                  <p className="text-sm mt-1">{scanResult.card.rewardText}</p>
                  <p className="text-sm mt-2">Card has been reset to start collecting again</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progress</p>
                  <p className="text-3xl font-bold text-chart-2">
                    {scanResult.card.stamps}/{scanResult.card.maxStamps} Stamps
                  </p>
                </div>
              )}
              {scanResult.card.isRedeemable && !scanResult.rewardGranted && (
                <div className="bg-chart-2 text-white p-4 rounded-lg text-center">
                  <p className="font-bold text-lg">Card Complete!</p>
                  <p className="text-sm mt-1">Next scan will grant {scanResult.card.rewardText}</p>
                </div>
              )}
              <Button
                onClick={startScanning}
                className="w-full"
                size="lg"
                data-testid="button-scan-again"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Again
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
