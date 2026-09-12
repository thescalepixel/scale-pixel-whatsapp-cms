"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "System theme", light: "Light theme", dark: "Dark theme" };

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("light", "dark");
  if (theme !== "system") document.documentElement.classList.add(theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Storage can throw in some private-browsing modes — the toggle still
    // works for the rest of this session, it just won't persist.
  }
}

/**
 * Cycles System -> Light -> Dark -> System. "System" removes any explicit
 * class, which lets globals.css's prefers-color-scheme media query decide
 * — Light/Dark force the .light/.dark class regardless of the OS setting.
 * The very first render matches the server's markup (no theme class read
 * yet) to avoid a hydration mismatch; the real saved value is read in an
 * effect right after, same as the blocking init script in layout.tsx did
 * for the actual page background before hydration ever started.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })();
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={mounted ? LABEL[theme] : undefined}
      aria-label="Change color theme"
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 ${className}`}
    >
      {theme === "light" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
          <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
      {theme === "dark" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
      {theme === "system" && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0">
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path strokeLinecap="round" d="M8 20h8M12 16v4" />
        </svg>
      )}
      <span suppressHydrationWarning>{mounted ? LABEL[theme] : "Theme"}</span>
    </button>
  );
}
