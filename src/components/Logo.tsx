type Variant = "full" | "compact" | "mark";

type Props = {
  className?: string;
  /** full = símbolo + wordmark (header do site) · compact = versão menor · mark = só o símbolo */
  variant?: Variant;
  size?: number;
};

const SIZES: Record<Variant, number> = { full: 26, compact: 22, mark: 26 };

export function LogoMark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" />
      <polyline points="6,18 32,32 58,18" />
      <polyline points="6,46 32,32 58,46" />
      <line x1="32" y1="4" x2="32" y2="32" />
      <line x1="32" y1="32" x2="32" y2="60" />
    </svg>
  );
}

export function Logo({ className = "", variant = "full", size }: Props) {
  const px = size ?? SIZES[variant];

  if (variant === "mark") {
    return (
      <span className={`inline-flex text-foreground ${className}`} aria-label="fomenta.ai">
        <LogoMark size={px} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 text-foreground ${className}`}
      aria-label="fomenta.ai"
    >
      <LogoMark size={px} />
      <span
        className="font-medium tracking-tight leading-none"
        style={{ fontSize: variant === "compact" ? 15 : 17 }}
      >
        fomenta<span className="text-muted-foreground">.ai</span>
      </span>
    </span>
  );
}
