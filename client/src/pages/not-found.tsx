import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PoweredByBadge } from "@/components/PoweredByBadge";
import logoImage from "@assets/unihub-mark-512_1783671585777.png";

const GOLD = "#E53935";
const MUTED = "rgba(255,255,255,0.45)";
const BORDER = "rgba(255,255,255,0.07)";

export default function NotFound() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 relative"
      style={{ backgroundColor: "#080808", color: "white" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(229, 57, 53,0.05) 0%, transparent 70%)" }}
      />
      <div className="relative text-center max-w-md">
        <Link href="/">
          <div className="flex items-center justify-center gap-2 mb-12 cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
            <img src={logoImage} alt="uniHub" className="h-6 w-6" />
            <span className="text-base" style={{ fontWeight: 300 }}>
              <span className="text-white">uni</span>
              <span style={{ color: GOLD, fontStyle: "italic", fontWeight: 600 }}>Hub</span>
            </span>
          </div>
        </Link>

        <p className="text-xs tracking-[0.25em] uppercase mb-4" style={{ color: GOLD }}>404</p>
        <h1 className="text-4xl font-light text-white mb-4">Page not found</h1>
        <p className="text-base font-light mb-10" style={{ color: MUTED }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link href="/">
          <Button
            variant="outline"
            className="border-white/15 text-white bg-transparent hover:bg-white/5 gap-2 tracking-wide text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <PoweredByBadge variant="dark" className="absolute inset-x-0 bottom-6" />
    </div>
  );
}
