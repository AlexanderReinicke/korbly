import Link from "next/link";
import { Basket } from "./icons";

export function MiniNav({ step }: { step?: "intake" | "pick" | "cart" }) {
  const steps: Array<["intake" | "pick" | "cart", string]> = [
    ["intake", "01 Preferences"],
    ["pick", "02 Dinners"],
    ["cart", "03 Cart"]
  ];
  return (
    <div className="topnav">
      <div className="container" style={{ padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div className="kmark">K</div>
          <span className="t-display-s">Korbly</span>
        </Link>
        <div className="flex gap-8 mobile-hide" style={{ alignItems: "center", whiteSpace: "nowrap", flexShrink: 0 }}>
          {steps.map(([id, label], index) => {
            const active = id === step;
            return (
              <span key={id} className={`t-label-xs ${active ? "" : "ink-whisper"}`} style={{ color: active ? "var(--paprika)" : undefined }}>
                {label}
                {index < steps.length - 1 ? <span className="ink-whisper" style={{ margin: "0 10px" }}>·</span> : null}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function money(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

export function RecipeImage({ src, alt, icon = <Basket size={44} /> }: { src: string | null; alt: string; icon?: React.ReactNode }) {
  return src ? (
    <img className="recipe-img" src={src} alt={alt} />
  ) : (
    <div style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", color: "var(--ink)", opacity: 0.7 }}>
      {icon}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="t-body-s" style={{ color: "var(--paprika)", marginTop: 16 }}>
      {children}
    </div>
  );
}
