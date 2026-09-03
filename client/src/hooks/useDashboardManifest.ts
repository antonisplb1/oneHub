import { useEffect } from "react";
import { useLocation } from "wouter";

export function useDashboardManifest() {
  const [location] = useLocation();

  useEffect(() => {
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifest) return;

    if (location === "/scan" || location === "/dashboard/scanner") {
      return;
    }

    if (location.startsWith("/dashboard")) {
      manifest.setAttribute("href", `/api/manifest?start=${encodeURIComponent(location)}`);
      return;
    }

    manifest.setAttribute("href", "/site.webmanifest");
  }, [location]);
}