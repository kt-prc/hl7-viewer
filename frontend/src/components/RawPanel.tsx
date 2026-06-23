import { Show, createSignal } from "solid-js";
import { Search } from "lucide-solid";
import { store } from "../state/store";
import RawView from "./RawView";
import SearchBar from "./SearchBar";
import { Hl7Message } from "../hl7/types";

/** Raw view column with a search toggle in its header (search hidden by default). */
export default function RawPanel(props: { message: Hl7Message }) {
  const [showSearch, setShowSearch] = createSignal(false);

  return (
    <div class="flex h-full min-h-0 flex-col">
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-1 dark:border-slate-700 dark:bg-slate-800">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Raw
        </span>
        <button
          classList={{
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-colors":
              true,
            "bg-prc-100 text-prc-700 dark:bg-prc-700 dark:text-prc-100": showSearch(),
            "text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700":
              !showSearch(),
          }}
          title="Search this message"
          onClick={() => {
            const next = !showSearch();
            setShowSearch(next);
            if (!next) store.setSearchQuery("");
          }}
        >
          <Search size={13} />
          Search
        </button>
      </div>
      <Show when={showSearch()}>
        <SearchBar autofocus />
      </Show>
      <div class="min-h-0 flex-1">
        <RawView message={props.message} />
      </div>
    </div>
  );
}
