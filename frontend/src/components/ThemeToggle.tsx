import { Show } from "solid-js";
import { Sun, Moon } from "lucide-solid";
import { theme } from "../state/theme";

/**
 * Icon-only ghost button. Shows a Sun while dark (click → light) and a Moon
 * while light (click → dark). Clicking always sets an explicit mode, leaving
 * "auto".
 */
export default function ThemeToggle() {
  const isDark = () => theme.resolved() === "dark";
  return (
    <button
      type="button"
      class="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-prc-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-prc-100"
      title={isDark() ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle colour theme"
      onClick={() => theme.toggle()}
    >
      <Show when={isDark()} fallback={<Moon size={18} />}>
        <Sun size={18} />
      </Show>
    </button>
  );
}
