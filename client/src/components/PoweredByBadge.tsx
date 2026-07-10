import { cn } from "@/lib/utils";

interface PoweredByBadgeProps {
  variant?: "dark" | "light";
  className?: string;
}

export function PoweredByBadge({ variant = "dark", className }: PoweredByBadgeProps) {
  const isDark = variant === "dark";
  const poweredColor = isDark ? "#999999" : "#6E6E6E";
  const nameColor = isDark ? "#FFFFFF" : "#1A1A1A";

  return (
    <div className={cn("flex w-full justify-center", className)}>
      <a
        href="https://unihub.live"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 opacity-[0.85] transition-opacity hover:opacity-100"
        data-testid="link-powered-by-unihub"
      >
        <img
          src="/unihub-mark-192.png"
          alt="uniHub"
          className="h-5 w-5"
          aria-hidden="true"
        />
        <span
          className="text-[13px] leading-none"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          <span style={{ color: poweredColor, fontWeight: 500 }}>Powered by </span>
          <span style={{ color: nameColor, fontWeight: 600 }}>uniHub</span>
          <span style={{ color: "#E53935", fontWeight: 600 }}>.live</span>
        </span>
      </a>
    </div>
  );
}
