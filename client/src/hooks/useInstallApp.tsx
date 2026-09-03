import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

type InstructionKind = "ios" | "mac-safari" | "generic" | "reload";

interface CapturedInstallPrompt {
  event: BeforeInstallPromptEvent;
  manifestHref: string;
}

interface InstallAppContextValue {
  isStandalone: boolean;
  requestInstall: () => Promise<void>;
}

const InstallAppContext = createContext<InstallAppContextValue | null>(null);
const RELOAD_FLAG = "unihub.install.openAfterReload.v1";

function activeManifestHref() {
  return document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.getAttribute("href") ?? "";
}

function InstallInstructions({
  kind,
  onInstall,
}: {
  kind: InstructionKind;
  onInstall: () => Promise<void>;
}) {
  if (kind === "reload") {
    return (
      <>
        <DialogDescription>
          This page is ready to install. Select Install to open your browser's app dialog.
        </DialogDescription>
        <DialogFooter>
          <Button onClick={() => void onInstall()} data-testid="button-install-after-reload">
            Install
          </Button>
        </DialogFooter>
      </>
    );
  }

  const instructions =
    kind === "ios"
      ? "Tap Share → Add to Home Screen → turn on 'Open as Web App' → Add."
      : kind === "mac-safari"
        ? "File → Add to Dock."
        : "Open your browser menu and choose Install app / Add to Home screen.";

  return <DialogDescription>{instructions}</DialogDescription>;
}

export function InstallAppProvider({ children }: { children: ReactNode }) {
  const [capturedPrompt, setCapturedPrompt] = useState<CapturedInstallPrompt | null>(null);
  const [instructionKind, setInstructionKind] = useState<InstructionKind | null>(null);
  const [isStandalone, setIsStandalone] = useState(() =>
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone ||
      window.matchMedia("(display-mode: standalone)").matches,
    ),
  );

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () => {
      setIsStandalone(
        Boolean(
          (window.navigator as Navigator & { standalone?: boolean }).standalone ||
          displayMode.matches,
        ),
      );
    };

    displayMode.addEventListener("change", updateStandalone);
    return () => displayMode.removeEventListener("change", updateStandalone);
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG) === "true") {
        sessionStorage.removeItem(RELOAD_FLAG);
        setInstructionKind("reload");
      }
    } catch {
      // Session storage can be unavailable in hardened browser modes.
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setCapturedPrompt({
        event: event as BeforeInstallPromptEvent,
        manifestHref: activeManifestHref(),
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const requestInstall = async () => {
    const userAgent = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(userAgent);
    const macSafari =
      /Macintosh/i.test(userAgent) &&
      /Safari/i.test(userAgent) &&
      !/(Chrome|Chromium|CriOS|Edg|OPR)/i.test(userAgent);

    if (ios) {
      setInstructionKind("ios");
      return;
    }

    if (macSafari) {
      setInstructionKind("mac-safari");
      return;
    }

    if (!capturedPrompt) {
      setInstructionKind("generic");
      return;
    }

    if (capturedPrompt.manifestHref !== activeManifestHref()) {
      try {
        sessionStorage.setItem(RELOAD_FLAG, "true");
      } catch {
        setInstructionKind("generic");
        return;
      }
      window.location.reload();
      return;
    }

    try {
      await capturedPrompt.event.prompt();
      setInstructionKind(null);
    } catch {
      setInstructionKind("generic");
    } finally {
      setCapturedPrompt(null);
    }
  };

  const value = useMemo(
    () => ({ isStandalone, requestInstall }),
    [isStandalone, capturedPrompt],
  );

  return (
    <InstallAppContext.Provider value={value}>
      {children}
      <Dialog open={instructionKind !== null} onOpenChange={(open) => !open && setInstructionKind(null)}>
        <DialogContent data-testid="dialog-install-instructions">
          <DialogHeader>
            <DialogTitle>Install uniHub</DialogTitle>
            {instructionKind && (
              <InstallInstructions kind={instructionKind} onInstall={requestInstall} />
            )}
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </InstallAppContext.Provider>
  );
}

export function useInstallApp() {
  const context = useContext(InstallAppContext);
  if (!context) {
    throw new Error("useInstallApp must be used within InstallAppProvider");
  }
  return context;
}