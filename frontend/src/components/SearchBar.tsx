import { Show, For } from "solid-js";
import { store } from "../state/store";

/** Free-text and positional ("PID-3", "OBX-5.1") search over the active message. */
export default function SearchBar() {
  return (
    <div class="flex flex-col gap-2 px-3 py-2">
      <input
        type="search"
        class="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        placeholder="Search text or position (e.g. PID-3)"
        value={store.state.searchQuery}
        onInput={(e) => store.setSearchQuery(e.currentTarget.value)}
      />
      <Show when={store.state.searchQuery}>
        <div class="text-xs text-slate-500">
          {store.matches().length} match{store.matches().length === 1 ? "" : "es"}
        </div>
        <ul class="flex max-h-40 flex-col gap-0.5 overflow-auto">
          <For each={store.matches()}>
            {(m) => {
              const seg = store.activeMessage()?.segments[m.segmentIndex];
              return (
                <li>
                  <button
                    class="w-full rounded px-2 py-1 text-left text-xs hover:bg-slate-100"
                    onClick={() =>
                      store.select({ segmentIndex: m.segmentIndex, fieldNumber: m.fieldNumber })
                    }
                  >
                    <span class="font-mono font-medium text-sky-700">
                      {seg?.id}
                      {m.fieldNumber != null ? `-${m.fieldNumber}` : ""}
                    </span>{" "}
                    <span class="text-slate-500">{m.snippet}</span>
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
