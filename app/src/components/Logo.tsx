import { BRAND } from "../brand";

export default function Logo({ size = 32, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" className="fill-ink dark:fill-white" />
        <circle cx="32" cy="26" r="13" fill="none" stroke="#ff5d73" strokeWidth="3" />
        <path d="M19 26 H45" stroke="#6fb7ff" strokeWidth="2.5" strokeDasharray="3 4" />
        <path d="M32 13 V50" stroke="#6fb7ff" strokeWidth="2.5" strokeDasharray="3 4" />
        <path d="M20 50 Q32 42 44 50" fill="none" stroke="#ffd166" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {showName && (
        <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-white">
          {BRAND.shortName}
        </span>
      )}
    </div>
  );
}
