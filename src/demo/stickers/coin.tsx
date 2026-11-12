import { gold, star } from "@/demo/stickers/gold";

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
