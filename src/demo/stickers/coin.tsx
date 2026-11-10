const gold = {
  face: "#f7c33f",
  back: "#eab12b",
  rim: "#e3a51e",
  bevel: "#ffd970",
  edge: "#c88a12",
  groove: "#9f6807",
  shade: "#3d2600",
  glint: "#fff6d8",
};

const star = "M32 22 C33 29 35 31 42 32 C35 33 33 35 32 42 C31 35 29 33 22 32 C29 31 31 29 32 22 Z";

export function CoinSide({ back = false, className }: { back?: boolean; className?: string }) {
  return (
    <svg viewBox="10 10 44 44" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="22" fill={back ? gold.back : gold.face} />
      <circle cx="32" cy="32" r="20.4" fill="none" stroke={gold.rim} strokeWidth={2.6} />
      <circle cx="32" cy="32" r="18.6" fill="none" stroke={gold.bevel} strokeWidth={1} />
      <circle cx="32" cy="32" r="14.5" fill="none" stroke={gold.rim} strokeWidth={2} />
      <path d={star} fill={gold.rim} />
      {!back && (
        <path
          d="M17 28 A15.5 15.5 0 0 1 26.5 17"
          fill="none"
          stroke={gold.bevel}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function CoinRim({ className }: { className?: string }) {
  return (
    <svg viewBox="10 10 44 44" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="22" fill={gold.edge} />
      <circle
        cx="32"
        cy="32"
        r="21.2"
        fill="none"
        stroke={gold.groove}
        strokeWidth={1.6}
        strokeDasharray="1.4 2"
      />
    </svg>
  );
}

export function CoinShade({ className }: { className?: string }) {
  return (
    <svg viewBox="10 10 44 44" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="22" fill={gold.shade} />
    </svg>
  );
}

export function CoinGlint({ className }: { className?: string }) {
  return (
    <svg viewBox="10 10 44 44" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="22" fill={gold.glint} />
    </svg>
  );
}
