import { Show, createMemo, createSignal } from "solid-js";
import { ChevronDown, ChevronUp } from "lucide-solid";
import { store } from "../state/store";
import FieldInspector from "./FieldInspector";
import ValidationPanel from "./ValidationPanel";

type Tab = "inspector" | "validation";

/** Collapsible bottom dock with Inspector / Validation tabs (replaces the column). */
export default function BottomPanel() {
  const [tab, setTab] = createSignal<Tab>("inspector");
  const [collapsed, setCollapsed] = createSignal(false);

  const errorCount = createMemo(
    () => store.issues().filter((i) => i.severity === "error").length,
  );
  const issueCount = createMemo(() => store.issues().length);

  const tabClass = (t: Tab) =>
    t === tab()
      ? "border-prc-600 text-prc-600 dark:border-prc-100 dark:text-prc-100"
      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100";

  return (
    <div class="flex shrink-0 flex-col border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div class="flex items-center justify-between border-b border-slate-200 px-2 dark:border-slate-700">
        <div class="flex items-stretch gap-1">
          <button
            class={`border-b-2 px-3 py-1.5 text-xs font-medium ${tabClass("inspector")}`}
            onClick={() => {
              setTab("inspector");
              setCollapsed(false);
            }}
          >
            Inspector
          </button>
          <button
            class={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-medium ${tabClass("validation")}`}
            onClick={() => {
              setTab("validation");
              setCollapsed(false);
            }}
          >
            Validation
            <Show when={issueCount() > 0}>
              <span
                classList={{
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none": true,
                  "bg-coral-500 text-white": errorCount() > 0,
                  "bg-warm-200 text-warm-400 dark:bg-warm-400/30 dark:text-warm-200":
                    errorCount() === 0,
                }}
              >
                {issueCount()}
              </span>
            </Show>
          </button>
        </div>
        <button
          class="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          title={collapsed() ? "Expand" : "Collapse"}
          onClick={() => setCollapsed((c) => !c)}
        >
          <Show when={collapsed()} fallback={<ChevronDown size={16} />}>
            <ChevronUp size={16} />
          </Show>
        </button>
      </div>
      <Show when={!collapsed()}>
        <div class="max-h-52 min-h-[3.5rem] overflow-auto">
          <Show when={tab() === "inspector"} fallback={<ValidationPanel />}>
            <FieldInspector />
          </Show>
        </div>
      </Show>
    </div>
  );
}
