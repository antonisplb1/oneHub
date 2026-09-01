import { useEffect } from "react";

export function useScanManifest() {
  useEffect(() => {
    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const appTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    const originalManifestHref = manifest?.dataset.scanOriginalHref ?? manifest?.getAttribute("href");
    const originalAppTitle = appTitle?.dataset.scanOriginalContent ?? appTitle?.getAttribute("content");

    manifest?.setAttribute("href", "/scan.webmanifest");
    appTitle?.setAttribute("content", "uniHub Scan");

    return () => {
      if (manifest && originalManifestHref !== null && originalManifestHref !== undefined) {
        manifest.setAttribute("href", originalManifestHref);
        delete manifest.dataset.scanOriginalHref;
      }
      if (appTitle && originalAppTitle !== null && originalAppTitle !== undefined) {
        appTitle.setAttribute("content", originalAppTitle);
        delete appTitle.dataset.scanOriginalContent;
      }
    };
  }, []);
}