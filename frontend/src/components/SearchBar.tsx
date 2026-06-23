import { Show, For } from "solid-js";
import { Search } from "lucide-solid";
import { store } from "../state/store";

/** Compact search: free text or positional ("PID-3", "OBX-5.1"). */
export default function SearchBar(props: { autofocus?: boolean }) {
  return (
    <div class="border-b border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-900">
      <div class="relative">
        <Search
          size={14}
          class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          ref={(el) => props.autofocus && queueMicrotask(() => el.focus())}
          class="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-7 pr-3 text-sm text-slate-800 focus:border-prc-500 focus:outline-none focus:ring-1 focus:ring-prc-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          placeholder="Search text or position (e.g. PID-3)"
          value={store.state.searchQuery}
          onInput={(e) => store.setSearchQuery(e.currentTarget.value)}
        />
      </div>
      <Show when={store.state.searchQuery}>
        <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {store.matches().length} match{store.matches().length === 1 ? "" : "es"}
        </div>
        <ul class="mt-1 flex max-h-32 flex-col gap-0.5 overflow-auto">
          <For each={store.matches()}>
            {(m) => {
              const seg = store.activeMessage()?.segments[m.segmentIndex];
              return (
                <li>
                  <button
                    class="w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() =>
                      store.select({ segmentIndex: m.segmentIndex, fieldNumber: m.fieldNumber })
                    }
                  >
                    <span class="font-mono font-medium text-prc-600 dark:text-prc-100">
                      {seg?.id}
                      {m.fieldNumber != null ? `-${m.fieldNumber}` : ""}
                    </span>{" "}
                    <span class="text-slate-500 dark:text-slate-400">{m.snippet}</span>
                  </button>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  );
}
