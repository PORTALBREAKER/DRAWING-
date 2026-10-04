import { useThemeStore } from "../state/themeStore";

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="touch-btn flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/70 text-lg shadow-sm transition active:scale-95 dark:border-white/10 dark:bg-white/5"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
