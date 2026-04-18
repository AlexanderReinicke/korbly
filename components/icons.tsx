import type { CSSProperties } from "react";

type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  sw?: number;
};

function Ico({ children, size = 48, className = "", style = {}, sw = 1.25 }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", ...style }}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Onion = (p: IconProps) => (
  <Ico {...p}>
    <path d="M12 24 C 12 16, 17 11, 24 11 C 31 11, 36 16, 36 24 C 36 34, 31 41, 24 41 C 17 41, 12 34, 12 24 Z" />
    <path d="M16 22 C 17 17, 20 14, 24 14" opacity="0.7" />
    <path d="M24 11 L 24 7" />
    <path d="M24 7 L 21 5" />
    <path d="M24 7 L 27 5" />
  </Ico>
);

export const Garlic = (p: IconProps) => (
  <Ico {...p}>
    <path d="M13 25 C 13 17, 18 12, 24 12 C 30 12, 35 17, 35 25 C 35 34, 30 41, 24 41 C 18 41, 13 34, 13 25 Z" />
    <path d="M24 12 L 24 40" opacity="0.55" />
    <path d="M18.5 15 C 17 20, 17 28, 18.5 36" opacity="0.55" />
    <path d="M29.5 15 C 31 20, 31 28, 29.5 36" opacity="0.55" />
    <path d="M24 12 L 24 8" />
    <path d="M24 8 L 27 6" opacity="0.6" />
  </Ico>
);

export const Paprika = (p: IconProps) => (
  <Ico {...p}>
    <path d="M11 22 C 11 18, 14 16, 17 17 C 19 18, 21 18, 24 17 C 27 18, 29 18, 31 17 C 34 16, 37 18, 37 22 C 37 33, 31 41, 24 41 C 17 41, 11 33, 11 22 Z" />
    <path d="M24 17 L 24 11" />
    <path d="M24 11 C 22 10, 20 9, 19 7" />
    <path d="M24 11 C 26 10, 28 9, 29 7" />
    <path d="M24 24 C 24 31, 22 36, 20 39" opacity="0.5" />
  </Ico>
);

export const Egg = (p: IconProps) => (
  <Ico {...p}>
    <path d="M24 9 C 32 9, 37 19, 37 28 C 37 35, 31 39, 24 39 C 17 39, 11 35, 11 28 C 11 19, 16 9, 24 9 Z" />
    <path d="M17 22 C 18 18, 20 16, 22 15" opacity="0.55" />
  </Ico>
);

export const Bread = (p: IconProps) => (
  <Ico {...p}>
    <path d="M9 28 C 9 22, 15 18, 24 18 C 33 18, 39 22, 39 28 C 39 34, 33 38, 24 38 C 15 38, 9 34, 9 28 Z" />
    <path d="M16 24 L 19 21" />
    <path d="M23 24 L 26 21" />
    <path d="M30 24 L 33 21" />
    <path d="M12 32 L 36 32" opacity="0.45" />
  </Ico>
);

export const Parsley = (p: IconProps) => (
  <Ico {...p}>
    <path d="M24 41 L 24 18" />
    <circle cx="19" cy="26" r="3.5" />
    <circle cx="29" cy="26" r="3.5" />
    <circle cx="17" cy="19" r="3.5" />
    <circle cx="31" cy="19" r="3.5" />
    <circle cx="24" cy="13" r="3.5" />
  </Ico>
);

export const Wine = (p: IconProps) => (
  <Ico {...p}>
    <path d="M20 7 L 28 7 L 28 15 C 28 17, 30 19, 31 22 C 32 25, 32 28, 32 32 L 32 40 C 32 41, 31 42, 30 42 L 18 42 C 17 42, 16 41, 16 40 L 16 32 C 16 28, 16 25, 17 22 C 18 19, 20 17, 20 15 Z" />
    <path d="M20 11 L 28 11" />
    <rect x="18" y="26" width="12" height="10" rx="0.5" />
  </Ico>
);

export const Knife = (p: IconProps) => (
  <Ico {...p}>
    <path d="M6 28 L 28 20 L 28 26 Z" />
    <path d="M28 21 L 40 23 L 40 27 L 28 25 Z" />
    <circle cx="32" cy="24" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="36" cy="24" r="0.8" fill="currentColor" stroke="none" />
  </Ico>
);

export const Schnitzel = (p: IconProps) => (
  <Ico {...p}>
    <ellipse cx="24" cy="30" rx="18" ry="6" />
    <ellipse cx="22" cy="28" rx="12" ry="5" />
    <path d="M32 27 L 38 25 L 37 31 Z" />
    <path d="M37 27 L 37 29" opacity="0.55" />
  </Ico>
);

export const Dumpling = (p: IconProps) => (
  <Ico {...p}>
    <circle cx="24" cy="27" r="12" />
    <path d="M18 23 C 20 20, 22 19, 25 19" opacity="0.5" />
    <path d="M24 15 L 21 11" />
    <path d="M24 15 L 27 11" />
    <path d="M24 15 L 24 10" />
  </Ico>
);

export const Chives = (p: IconProps) => (
  <Ico {...p}>
    <path d="M16 41 L 16 12" />
    <path d="M20 41 L 20 9" />
    <path d="M24 41 L 24 7" />
    <path d="M28 41 L 28 9" />
    <path d="M32 41 L 32 12" />
    <path d="M13 32 L 35 32" />
  </Ico>
);

export const Coffee = (p: IconProps) => (
  <Ico {...p}>
    <path d="M12 20 L 32 20 L 32 33 C 32 35, 30 37, 28 37 L 16 37 C 14 37, 12 35, 12 33 Z" />
    <path d="M32 23 C 36 23, 37 26, 37 28 C 37 30, 36 33, 32 33" />
    <path d="M9 40 L 35 40" opacity="0.55" />
    <path d="M18 15 C 17 13, 19 12, 18 10" opacity="0.7" />
    <path d="M26 15 C 25 13, 27 12, 26 10" opacity="0.7" />
  </Ico>
);

export const Basket = (p: IconProps) => (
  <Ico {...p}>
    <path d="M10 22 L 38 22 L 34 40 L 14 40 Z" />
    <path d="M15 22 C 17 15, 21 12, 24 12 C 27 12, 31 15, 33 22" />
    <path d="M12 28 L 36 28" opacity="0.5" />
    <path d="M13 34 L 35 34" opacity="0.5" />
    <path d="M18 22 L 18 40" opacity="0.4" />
    <path d="M24 22 L 24 40" opacity="0.4" />
    <path d="M30 22 L 30 40" opacity="0.4" />
  </Ico>
);

export const CargoBike = (p: IconProps) => (
  <Ico {...p}>
    <circle cx="12" cy="34" r="6" />
    <circle cx="38" cy="34" r="5" />
    <path d="M12 34 L 20 34" />
    <path d="M20 34 L 22 22 L 33 22 L 33 34" />
    <path d="M33 34 L 38 34" />
    <path d="M20 34 L 18 17 L 15 17" />
    <path d="M33 23 L 37 20 L 40 20" />
    <rect x="23" y="11" width="10" height="10" rx="1" />
    <path d="M23 16 L 33 16" opacity="0.5" />
  </Ico>
);

export const Plate = (p: IconProps) => (
  <Ico {...p}>
    <circle cx="24" cy="24" r="16" />
    <circle cx="24" cy="24" r="11" opacity="0.55" />
  </Ico>
);

export const Clock = (p: IconProps) => (
  <Ico {...p}>
    <circle cx="24" cy="24" r="14" />
    <path d="M24 16 L 24 24 L 30 27" />
  </Ico>
);

export const Check = (p: IconProps) => (
  <Ico {...p}>
    <path d="M12 24 L 21 33 L 36 16" />
  </Ico>
);

export const ArrowRight = (p: IconProps) => (
  <Ico {...p}>
    <path d="M8 24 L 40 24" />
    <path d="M32 16 L 40 24 L 32 32" />
  </Ico>
);

export const ICON_FRIEZE = [Onion, Garlic, Paprika, Egg, Bread, Parsley, Wine, Knife, Schnitzel, Dumpling, Chives, Coffee];
