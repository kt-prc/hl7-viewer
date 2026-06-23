import { For, Show, createSignal } from "solid-js";
import { store } from "../state/store";
import {
  ALL_PHI_CATEGORIES,
  CATEGORY_LABELS,
  DeidStrategy,
} from "../hl7/deidentify";
import { PhiCategory } from "../hl7/dictionary";

const STRATEGIES: Array<{ id: DeidStrategy; label: string; hint: string }> = [
  { id: "synthetic", label: "Synthetic", hint: "Replace with realistic fake values (keeps structure)" },
  { id: "placeholder", label: "Placeholder", hint: 'Replace with "REDACTED"' },
  { id: "blank", label: "Blank", hint: "Empty the value entirely" },
];

/** Modal to scrub PHI from the active message, entirely in-browser. */
export default function DeidentifyDialog(props: { open: boolean; onClose: () => void }) {
  const [strategy, setStrategy] = createSignal<DeidStrategy>("synthetic");
  const [categories, setCategories] = createSignal<Set<PhiCategory>>(
    new Set(ALL_PHI_CATEGORIES),
  );

  const toggleCat = (c: PhiCategory) =>
    setCategories((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });

  const apply = () => {
    store.deidentifyActive({ strategy: strategy(), categories: categories() });
    props.onClose();
  };

  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
        onClick={props.onClose}
      >
        <div
          class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 class="text-lg font-semibold text-slate-800">De-identify message</h2>
          <p class="mt-1 text-sm text-slate-500">
            Scrubs PHI in this tab only. Nothing is sent anywhere.
          </p>

          <fieldset class="mt-4">
            <legend class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Strategy
            </legend>
            <div class="mt-2 flex flex-col gap-1.5">
              <For each={STRATEGIES}>
                {(s) => (
                  <label class="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="radio"
                      name="strategy"
                      class="mt-0.5"
                      checked={strategy() === s.id}
                      onChange={() => setStrategy(s.id)}
                    />
                    <span>
                      <span class="font-medium text-slate-700">{s.label}</span>
                      <span class="block text-xs text-slate-500">{s.hint}</span>
                    </span>
                  </label>
                )}
              </For>
            </div>
          </fieldset>

          <fieldset class="mt-4">
            <legend class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Categories
            </legend>
            <div class="mt-2 grid grid-cols-2 gap-1.5">
              <For each={ALL_PHI_CATEGORIES}>
                {(c) => (
                  <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={categories().has(c)}
                      onChange={() => toggleCat(c)}
                    />
                    {CATEGORY_LABELS[c]}
                  </label>
                )}
              </For>
            </div>
          </fieldset>

          <div class="mt-5 flex justify-end gap-2">
            <button
              class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <button
              class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-40"
              disabled={categories().size === 0}
              onClick={apply}
            >
              De-identify
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
