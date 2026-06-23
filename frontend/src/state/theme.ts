import { createSignal, createRoot, createEffect } from "solid-js";

export type ThemeMode = "auto" | "light" | "dark";

const STORAGE_KEY = "theme";

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "auto") return v;
  } catch {
    /* localStorage unavailable — fall through to auto */
  }
  return "auto";
}

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

/**
 * Theme store: tri-state mode ("auto" follows the OS) persisted to
 * localStorage["theme"]. The resolved light/dark is applied as a `.dark` class
 * on <html>. Note: only the UI theme preference is stored — never HL7 data.
 */
function createTheme() {
  const [mode, setModeSignal] = createSignal<ThemeMode>(readStored());
  const [systemDark, setSystemDark] = createSignal(prefersDark());

  // Track OS preference changes so "auto" stays live.
  if (typeof window !== "undefined" && window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", (e) => setSystemDark(e.matches));
  }

  const resolved = () => (mode() === "auto" ? (systemDark() ? "dark" : "light") : mode());

  createEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved() === "dark");
  });

  const setMode = (next: ThemeMode) => {
    setModeSignal(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failure */
    }
  };

  /** Toggle to the opposite of what's currently shown, leaving "auto". */
  const toggle = () => setMode(resolved() === "dark" ? "light" : "dark");

  return { mode, resolved, setMode, toggle };
}

export const theme = createRoot(createTheme);
