import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCookieConsent, setCookieConsent } from "@/lib/cookieConsent";

interface CookiePreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CookiePreferences({ open, onOpenChange }: CookiePreferencesProps) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [open]);

  const handleSavePreferences = () => {
    setCookieConsent({
      essential: true,
      analytics,
      marketing,
    });
    onOpenChange(false);
  };

  const handleAcceptAll = () => {
    setCookieConsent({
      essential: true,
      analytics: true,
      marketing: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-cookie-preferences">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Manage your cookie settings. Choose which types of cookies you want to allow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="essential" className="text-base font-medium">
                  Essential Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required for login, payments, and core functionality. Cannot be disabled.
                </p>
              </div>
              <Switch
                id="essential"
                checked={true}
                disabled={true}
                data-testid="switch-essential"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="analytics" className="text-base font-medium">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how users interact with our site to improve performance. (Currently not in use)
                </p>
              </div>
              <Switch
                id="analytics"
                checked={analytics}
                onCheckedChange={setAnalytics}
                data-testid="switch-analytics"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="marketing" className="text-base font-medium">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used for personalized advertising and remarketing. (Not currently active, planned for future)
                </p>
              </div>
              <Switch
                id="marketing"
                checked={marketing}
                onCheckedChange={setMarketing}
                data-testid="switch-marketing"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleSavePreferences}
            data-testid="button-save-preferences"
          >
            Save Preferences
          </Button>
          <Button
            onClick={handleAcceptAll}
            data-testid="button-accept-all-dialog"
          >
            Accept All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
