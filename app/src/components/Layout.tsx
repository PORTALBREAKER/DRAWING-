import { Outlet, Link } from "react-router-dom";
import NavBar from "./NavBar";
import { BRAND } from "../brand";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink dark:bg-ink dark:text-white">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-black/5 px-4 py-6 text-center text-xs text-ink/50 dark:border-white/10 dark:text-white/40">
        <p className="mx-auto max-w-md">
          🔒 Your reference stays private and is processed locally whenever possible.
        </p>
        <p className="mt-2">
          {BRAND.name} · <Link to="/about" className="underline">About</Link> ·{" "}
          <Link to="/privacy" className="underline">Privacy</Link> · Free &amp; open-source tools only
        </p>
      </footer>
    </div>
  );
}
