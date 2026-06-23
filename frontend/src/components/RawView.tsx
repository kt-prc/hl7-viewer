import { For, Show } from "solid-js";
import { store } from "../state/store";
import { Hl7Message } from "../hl7/types";
import { indexToFieldNumber } from "../hl7/types";

/** Syntax-highlighted raw HL7. Clicking a field selects it (links to the tree). */
export default function RawView(props: { message: Hl7Message }) {
  const sel = () => store.state.selection;

  return (
    <div class="h-full overflow-auto bg-slate-50 p-3 font-mono text-[13px] leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <For each={props.message.segments}>
        {(segment, si) => {
          const tokens = segment.raw.split(props.message.delimiters.field);
          return (
            <div class="whitespace-pre-wrap break-all">
              <span class="font-semibold text-prc-600 dark:text-prc-100">{tokens[0]}</span>
              <For each={tokens.slice(1)}>
                {(token, ti) => {
                  const fieldNumber = indexToFieldNumber(segment.id, ti());
                  const selected = () =>
                    sel()?.segmentIndex === si() && sel()?.fieldNumber === fieldNumber;
                  return (
                    <>
                      <span class="text-slate-400 dark:text-slate-600">
                        {props.message.delimiters.field}
                      </span>
                      <span
                        classList={{
                          "cursor-pointer rounded-sm hover:bg-slate-200 dark:hover:bg-slate-800":
                            true,
                          "bg-warm-200 text-slate-900 ring-1 ring-warm-400": selected(),
                        }}
                        title={`${segment.id}-${fieldNumber}`}
                        onClick={() => store.select({ segmentIndex: si(), fieldNumber })}
                      >
                        {token || "​"}
                      </span>
                    </>
                  );
                }}
              </For>
            </div>
          );
        }}
      </For>
      <Show when={props.message.segments.length === 0}>
        <p class="text-slate-400 dark:text-slate-600">Empty message.</p>
      </Show>
    </div>
  );
}
