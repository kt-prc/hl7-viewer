import { For } from "solid-js";
import { store } from "../state/store";
import { getMessageLabel } from "../hl7/accessors";

/** Sidebar list of messages parsed from a multi-message file. */
export default function MessageList() {
  return (
    <div class="flex flex-col">
      <h2 class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Messages ({store.messageCount()})
      </h2>
      <ul class="flex flex-col gap-0.5">
        <For each={store.state.messages}>
          {(message, i) => (
            <li>
              <button
                classList={{
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors": true,
                  "bg-sky-100 text-sky-900 font-medium": i() === store.state.activeIndex,
                  "text-slate-600 hover:bg-slate-100": i() !== store.state.activeIndex,
                }}
                onClick={() => store.setActiveIndex(i())}
              >
                <span class="font-mono">{getMessageLabel(message, i())}</span>
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
