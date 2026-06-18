type Props = { className?: string; showWordmark?: boolean };

export function Logo({ className = "", showWordmark = true }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="h-7 w-7 shrink-0"
        aria-hidden
      >
        {/* hexagon outline */}
        <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" />
        {/* inner facets */}
        <polyline points="6,18 32,32 58,18" />
        <polyline points="6,46 32,32 58,46" />
        <line x1="32" y1="4" x2="32" y2="32" />
        <line x1="32" y1="32" x2="32" y2="60" />
        <line x1="6,18".split(",")[0] y1="18" x2="32" y2="60" />
      </svg>
      {showWordmark && (
        <span className="text-[17px] font-medium tracking-tight">
          fomenta<span className="text-muted-foreground">.ai</span>
        </span>
      )}
    </div>
  );
}
