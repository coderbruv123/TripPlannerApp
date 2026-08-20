import { useEffect, useState } from "react";

const STORAGE_KEY = "tripapp.darkmode";
const EVENT = "tripapp:darkmode";

export function getDarkMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useDarkMode(): [boolean, (next: boolean) => void] {
  const [dark, setDark] = useState<boolean>(() => getDarkMode());

  useEffect(() => {
    const sync = () => setDark(getDarkMode());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setDarkMode = (next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore storage errors */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return [dark, setDarkMode];
}
