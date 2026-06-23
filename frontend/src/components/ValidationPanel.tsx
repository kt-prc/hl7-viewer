import { For, Show } from "solid-js";
import { store } from "../state/store";
import { IssueSeverity } from "../hl7/validate";

const SEVERITY_STYLE: Record<IssueSeverity, string> = {
  error: "text-red-700 bg-red-50 ring-red-200",
  warning: "text-amber-700 bg-amber-50 ring-amber-200",
  info: "text-slate-600 bg-slate-50 ring-slate-200",
};

const SEVERITY_ICON: Record<IssueSeverity, string> = {
  error: "✕",
  warning: "!",
  info: "i",
};

/** Lists validation issues; clicking one jumps the views to its location. */
export default function ValidationPanel() {
  const issues = store.issues;
  return (
    <div class="flex flex-col">
      <h2 class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Validation
        <Show when={issues().length > 0}>
          <span class="ml-1 text-slate-400">({issues().length})</span>
        </Show>
      </h2>
      <Show
        when={issues().length > 0}
        fallback={<p class="px-3 py-1 text-sm text-emerald-600">No issues found ✓</p>}
      >
        <ul class="flex flex-col gap-1 px-2">
          <For each={issues()}>
            {(issue) => (
              <li>
                <button
                  classList={{
                    "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs ring-1 transition-colors hover:brightness-95":
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
    </div>
  );
}
