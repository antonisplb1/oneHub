import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { hasUserMadeChoice, acceptAllCookies, rejectOptionalCookies } from "@/lib/cookieConsent";
import CookiePreferences from "./CookiePreferences";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    setIsVisible(!hasUserMadeChoice());
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setIsVisible(false);
  };

  const handleRejectOptional = () => {
    rejectOptionalCookies();
    setIsVisible(false);
  };

  const handleManagePreferences = () => {
    setShowPreferences(true);
  };

  const handlePreferencesClose = (open: boolean) => {
    setShowPreferences(open);
    if (!open) {
      setIsVisible(!hasUserMadeChoice());
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300" data-testid="cookie-banner">
        <Card className="mx-auto max-w-5xl backdrop-blur-md bg-card/95 border-border">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-start gap-4">
              <Cookie className="h-6 w-6 shrink-0 text-primary mt-1" />
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-base" data-testid="text-cookie-title">
                  We use cookies
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-cookie-message">
                  We use essential cookies to keep uniHub running, and optional cookies to help us improve your experience and analyze usage.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
              <Button
                variant="outline"
                onClick={handleRejectOptional}
                data-testid="button-reject-optional"
                className="w-full sm:w-auto"
              >
                Reject optional
              </Button>
              <Button
                variant="outline"
                onClick={handleManagePreferences}
                data-testid="button-manage-preferences"
                className="w-full sm:w-auto"
              >
                Manage preferences
              </Button>
              <Button
                onClick={handleAcceptAll}
                data-testid="button-accept-all"
                className="w-full sm:w-auto"
              >
                Accept all
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CookiePreferences 
        open={showPreferences} 
        onOpenChange={handlePreferencesClose}
      />
    </>
  );
}
