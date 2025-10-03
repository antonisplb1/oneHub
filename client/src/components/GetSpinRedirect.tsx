import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function GetSpinRedirect() {
  const { userId } = useParams();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateTokenAndRedirect = async () => {
      try {
        const response = await fetch(`/api/generate-spin-token/${userId}`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json();
          setError(data.error || "Failed to generate spin token");
          return;
        }

        const data = await response.json();
        setLocation(`/spin/${data.token}`);
      } catch (error) {
        setError("Something went wrong. Please try again.");
      }
    };

    if (userId) {
      generateTokenAndRedirect();
    }
  }, [userId, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-chart-3/20 to-chart-2/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {error ? (
            <>
              <p className="text-2xl mb-4">❌</p>
              <p className="text-lg font-semibold mb-2">Oops!</p>
              <p className="text-muted-foreground">{error}</p>
            </>
          ) : (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Preparing your spin...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
