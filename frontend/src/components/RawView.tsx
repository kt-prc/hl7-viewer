import { For, Show } from "solid-js";
import { store } from "../state/store";
import { Hl7Message } from "../hl7/types";
import { indexToFieldNumber } from "../hl7/types";

/** Syntax-highlighted raw HL7. Clicking a field selects it (links to the tree). */
export default function RawView(props: { message: Hl7Message }) {
  const sel = () => store.state.selection;

  return (
    <div class="h-full overflow-auto bg-slate-900 p-3 font-mono text-[13px] leading-relaxed text-slate-100">
      <For each={props.message.segments}>
        {(segment, si) => {
          const tokens = segment.raw.split(props.message.delimiters.field);
          return (
            <div class="whitespace-pre-wrap break-all">
              <span class="font-semibold text-sky-300">{tokens[0]}</span>
              <For each={tokens.slice(1)}>
                {(token, ti) => {
                  const fieldNumber = indexToFieldNumber(segment.id, ti());
                  const selected = () =>
                    sel()?.segmentIndex === si() && sel()?.fieldNumber === fieldNumber;
                  return (
                    <>
                      <span class="text-slate-500">{props.message.delimiters.field}</span>
                      <span
                        classList={{
                          "cursor-pointer rounded-sm hover:bg-slate-700": true,
                          "bg-amber-400 text-slate-900": selected(),
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
        <p class="text-slate-500">Empty message.</p>
      </Show>
    </div>
  );
}
