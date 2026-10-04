import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/25",
  secondary:
    "bg-white text-ink border border-black/10 hover:bg-black/5 dark:bg-white/5 dark:text-white dark:border-white/15 dark:hover:bg-white/10",
  ghost: "bg-transparent text-ink/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10",
  danger: "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400",
};

export default function Button({ variant = "primary", full, className = "", children, ...rest }: Props) {
  return (
    <button
      className={`touch-btn inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[15px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
