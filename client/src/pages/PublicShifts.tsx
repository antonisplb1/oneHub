import { useState } from "react";
import { useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShiftSchedule } from "@/components/ShiftSchedule";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { format } from "date-fns";
import { getWeekRange, addWeeks } from "@/lib/shiftDates";
import type { Shift } from "@shared/schema";
import { PoweredByBadge } from "@/components/PoweredByBadge";

const GOLD = "#E53935";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED = "rgba(255,255,255,0.45)";

interface MerchantData {
  shopName: string;
  logo: string | null;
  cardBackgroundColor: string;
}

interface ShiftResponse {
  shifts: Shift[];
  merchant: MerchantData;
}

export default function PublicShifts() {
  const [match, params] = useRoute("/:username/shifts");
  const username = params?.username || "";
  const { toast } = useToast();

  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showDialog, setShowDialog] = useState(true);

  const { mutate: validatePin, isPending } = useMutation({
    mutationFn: async (pinValue: string) => {
      const response = await apiRequest<ShiftResponse>(`/api/shifts/public/${username}`, {
        method: "POST",
        body: JSON.stringify({ pin: pinValue }),
        headers: { "Content-Type": "application/json" },
      });
      return response;
    },
    onSuccess: (data) => {
      setShifts(data.shifts);
      setMerchant(data.merchant);
      setAuthenticated(true);
      setShowDialog(false);
      toast({
        title: "Access Granted",
        description: `Welcome to ${data.merchant.shopName}'s shift schedule`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to validate PIN";
      if (error.message?.includes("Store not found") || errorMessage.includes("404")) {
        toast({ title: "Store Not Found", description: "This store could not be found. Please check the link.", variant: "destructive" });
      } else if (error.message?.includes("Invalid PIN") || errorMessage.includes("401")) {
        toast({ title: "Invalid PIN", description: "The PIN you entered is incorrect. Please try again.", variant: "destructive" });
        setPin("");
      } else {
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      }
    },
  });

  const handleSubmitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4 || pin.length > 6) {
      toast({ title: "Invalid PIN", description: "PIN must be 4-6 digits", variant: "destructive" });
      return;
    }
    validatePin(pin);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) setPin(value);
  };

  const handlePreviousWeek = () => setCurrentWeek(addWeeks(currentWeek, -1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const { start, end } = getWeekRange(currentWeek);

  if (!match) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#080808", color: "white" }}
      >
        <div
          className="w-full max-w-md p-10 rounded-md text-center"
          style={{ backgroundColor: "#111111", border: `1px solid ${BORDER}` }}
          data-testid="error-state"
        >
          <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: MUTED }} />
          <h3 className="text-xl font-light text-white mb-2">Invalid URL</h3>
          <p className="text-sm font-light" style={{ color: MUTED }}>
            Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080808", color: "white" }}>
      {/* PIN Entry Dialog */}
      <Dialog open={showDialog && !authenticated} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md" data-testid="pin-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Enter Access PIN
            </DialogTitle>
            <DialogDescription>
              Please enter the PIN to view the shift schedule for {username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 4-6 digit PIN"
                value={pin}
                onChange={handlePinChange}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                data-testid="input-pin"
                disabled={isPending}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || pin.length < 4}
              data-testid="button-submit-pin"
            >
              {isPending ? "Validating..." : "Access Schedule"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Branded Calendar View */}
      {authenticated && merchant && (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header with branding */}
          <div
            className="rounded-md p-5"
            style={{ backgroundColor: "#111111", border: `1px solid ${BORDER}` }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {merchant.logo && (
                  <img
                    src={merchant.logo}
                    alt={merchant.shopName}
                    className="w-14 h-14 rounded-md object-cover flex-shrink-0"
                    data-testid="merchant-logo"
                  />
                )}
                <div>
                  <h2 className="text-lg font-medium text-white" data-testid="merchant-name">
                    {merchant.shopName}
                  </h2>
                  <p className="text-xs" style={{ color: MUTED }}>Shift Schedule</p>
                </div>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousWeek}
                  className="border-white/15 text-white bg-transparent hover:bg-white/5"
                  data-testid="button-prev-week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div
                  className="text-sm font-light px-4 text-center min-w-[200px]"
                  style={{ color: MUTED }}
                  data-testid="week-range"
                >
                  {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextWeek}
                  className="border-white/15 text-white bg-transparent hover:bg-white/5"
                  data-testid="button-next-week"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Shift Schedule */}
          <ShiftSchedule
            shifts={shifts}
            weekStart={currentWeek}
            readOnly={true}
            branding={{
              colors: { primary: merchant.cardBackgroundColor },
              logo: merchant.logo || undefined,
            }}
          />
        </div>
      )}
      <PoweredByBadge variant="dark" className="pb-10 pt-6" />
    </div>
  );
}
