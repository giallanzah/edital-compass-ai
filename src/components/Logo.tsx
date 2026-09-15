import wordmarkAsset from "@/assets/fomenta-logo-wordmark.png.asset.json";
import markAsset from "@/assets/fomenta-mark.png.asset.json";

type Variant = "full" | "compact" | "mark";

type Props = {
  className?: string;
  /** full = símbolo + wordmark (header do site) · compact = versão menor · mark = só o símbolo */
  variant?: Variant;
  /** altura em px */
  size?: number;
};

// Proporções reais dos arquivos (largura ÷ altura)
const WORDMARK_RATIO = 1101 / 443;
const MARK_RATIO = 324 / 443;

const HEIGHTS: Record<Variant, number> = { full: 36, compact: 28, mark: 28 };

export function LogoMark({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={markAsset.url}
      alt=""
      width={Math.round(size * MARK_RATIO)}
      height={size}
      style={{ height: size, width: "auto" }}
      className={`shrink-0 select-none ${className}`}
      aria-hidden
    />
  );
}

export function Logo({ className = "", variant = "full", size }: Props) {
  const h = size ?? HEIGHTS[variant];

  if (variant === "mark") {
    return (
      <span className={`inline-flex ${className}`} aria-label="fomenta.ai">
        <LogoMark size={h} />
      </span>
    );
  }

  return (
    <img
      src={wordmarkAsset.url}
      alt="fomenta.ai"
      width={Math.round(h * WORDMARK_RATIO)}
      height={h}
      style={{ height: h, width: "auto" }}
      className={`shrink-0 select-none ${className}`}
    />
  );
}
