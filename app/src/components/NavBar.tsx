import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/create", label: "Create" },
  { to: "/about", label: "About" },
  { to: "/privacy", label: "Privacy" },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-paper/90 backdrop-blur dark:border-white/5 dark:bg-ink/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button onClick={() => navigate("/")} className="touch-btn -ml-1 flex items-center">
          <Logo size={30} />
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-ink/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="touch-btn flex h-11 w-11 items-center justify-center rounded-full border border-black/10 sm:hidden dark:border-white/10"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-black/5 px-4 py-3 sm:hidden dark:border-white/5">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `touch-btn flex items-center rounded-xl px-4 py-3 text-base font-medium ${
                  isActive ? "bg-ink text-white dark:bg-white dark:text-ink" : "text-ink/80 dark:text-white/80"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
