import { For, Show } from "solid-js";
import { store } from "../state/store";
import { getMessageLabel } from "../hl7/accessors";

/** Horizontal tab strip for navigating a multi-message file. */
export default function MessageTabs() {
  return (
    <Show when={store.messageCount() > 1}>
      <div class="flex items-stretch gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 dark:border-slate-700 dark:bg-slate-900">
        <For each={store.state.messages}>
          {(message, i) => (
            <button
              classList={{
                "shrink-0 border-b-2 px-3 py-1.5 text-xs font-medium transition-colors": true,
                "border-prc-600 text-prc-600 dark:border-prc-100 dark:text-prc-100":
                  i() === store.state.activeIndex,
                "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100":
                  i() !== store.state.activeIndex,
              }}
              onClick={() => store.setActiveIndex(i())}
            >
              <span class="font-mono">{getMessageLabel(message, i())}</span>
            </button>
          )}
        </For>
      </div>
    </Show>
  );
}
