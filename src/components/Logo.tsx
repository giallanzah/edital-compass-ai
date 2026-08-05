import logoAsset from "@/assets/fomenta-logo.png.asset.json";

type Props = { className?: string; showWordmark?: boolean; size?: number };

export function Logo({ className = "", showWordmark = true, size = 28 }: Props) {
  if (showWordmark) {
    return (
      <img
        src={logoAsset.url}
        alt="fomenta.ai"
        style={{ height: size * 1.15 }}
        className={`w-auto object-contain ${className}`}
      />
    );
  }
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>

      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        width={size}
        height={size}
        className="shrink-0"
        aria-hidden
      >
        <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" />
        <polyline points="6,18 32,32 58,18" />
        <polyline points="6,46 32,32 58,46" />
        <line x1="32" y1="4" x2="32" y2="32" />
        <line x1="32" y1="32" x2="32" y2="60" />
        <line x1="6" y1="18" x2="32" y2="60" />
        <line x1="58" y1="18" x2="32" y2="60" />
        <line x1="6" y1="46" x2="32" y2="4" />
        <line x1="58" y1="46" x2="32" y2="4" />
      </svg>
      {showWordmark && (
        <span className="text-[17px] font-medium tracking-tight leading-none">
          fomenta<span className="text-muted-foreground">.ai</span>
        </span>
      )}
    </div>
  );
}
