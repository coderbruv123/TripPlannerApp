import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "tripplanner-theme";
const EVENT = "tripplanner:theme";

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

export function getTheme(): Theme {
  if (typeof document !== "undefined") {
    const current = document.documentElement.dataset.theme;

    if (current === "dark" || current === "light") return current;
  }

  const stored = readStored();

  if (stored) return stored;

  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage blocked — the theme still applies for this visit */
  }
}

export function setTheme(theme: Theme): void {
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: theme }));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";

  setTheme(next);

  return next;
}

/** Reads the current theme and re-renders on every change, from anywhere. */
export function useTheme(): Theme {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  useEffect(() => {
    const onTheme = (event: Event) => {
      const detail = (event as CustomEvent<Theme>).detail;

      if (detail === "dark" || detail === "light") setThemeState(detail);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setThemeState(getTheme());
    };

    window.addEventListener(EVENT, onTheme);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(EVENT, onTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return theme;
}
