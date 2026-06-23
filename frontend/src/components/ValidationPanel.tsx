import { For, Show } from "solid-js";
import { store } from "../state/store";
import { IssueSeverity } from "../hl7/validate";

const SEVERITY_STYLE: Record<IssueSeverity, string> = {
  error:
    "text-coral-600 bg-warm-50 ring-warm-200 dark:text-coral-500 dark:bg-slate-800 dark:ring-coral-600/40",
  warning:
    "text-warm-400 bg-warm-50 ring-warm-100 dark:text-warm-200 dark:bg-slate-800 dark:ring-warm-400/40",
  info: "text-slate-600 bg-slate-50 ring-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:ring-slate-600",
};

const SEVERITY_ICON: Record<IssueSeverity, string> = {
  error: "✕",
  warning: "!",
  info: "i",
};

/** Validation issue list; clicking an issue jumps the views to its location. */
export default function ValidationPanel() {
  const issues = store.issues;
  return (
    <Show
      when={issues().length > 0}
      fallback={
        <p class="px-3 py-2 text-sm text-grn-700 dark:text-grn-300">No issues found ✓</p>
      }
    >
      <ul class="flex flex-col gap-1 p-2">
        <For each={issues()}>
          {(issue) => (
            <li>
              <button
                classList={{
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs ring-1 transition-colors hover:brightness-95 dark:hover:brightness-110":
                    true,
                  [SEVERITY_STYLE[issue.severity]]: true,
                }}
                disabled={issue.segmentIndex == null}
                onClick={() =>
                  issue.segmentIndex != null &&
                  store.select({ segmentIndex: issue.segmentIndex, fieldNumber: issue.field })
                }
              >
                <span class="mt-0.5 font-bold" aria-hidden="true">
                  {SEVERITY_ICON[issue.severity]}
                </span>
                <span>{issue.message}</span>
              </button>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
