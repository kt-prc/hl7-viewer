import { Show } from "solid-js";
import { store } from "../state/store";
import { describeField, describeSegment, isPhiField } from "../hl7/dictionary";

/** Detail pane describing the currently-selected field (HL7Soup-style). */
export default function FieldInspector() {
  const sel = () => store.state.selection;
  const message = store.activeMessage;
  const profile = store.profile;

  const info = () => {
    const s = sel();
    const m = message();
    if (!s || !m || s.fieldNumber == null) return undefined;
    const segment = m.segments[s.segmentIndex];
    if (!segment) return undefined;
    return {
      segmentId: segment.id,
      segmentName: describeSegment(profile(), segment.id)?.name,
      field: describeField(profile(), segment.id, s.fieldNumber),
      fieldNumber: s.fieldNumber,
      phi: isPhiField(profile(), segment.id, s.fieldNumber),
    };
  };

  return (
    <div class="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <Show
        when={info()}
        fallback={<p class="text-slate-400">Select a field to see its HL7 definition.</p>}
      >
        {(i) => (
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sky-700">
                {i().segmentId}-{i().fieldNumber}
              </span>
              <span class="font-medium text-slate-800">{i().field?.name ?? "Unknown field"}</span>
              <Show when={i().phi}>
                <span class="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
                  PHI · {i().phi!.label}
                </span>
              </Show>
            </div>
            <div class="flex gap-4 text-xs text-slate-500">
              <Show when={i().segmentName}>
                <span>Segment: {i().segmentName}</span>
              </Show>
              <Show when={i().field?.datatype}>
                <span>Datatype: {i().field!.datatype}</span>
              </Show>
              <Show when={i().field?.optionality}>
                <span>Optionality: {i().field!.optionality}</span>
              </Show>
            </div>
            <Show when={i().field?.description}>
              <p class="mt-1 text-xs text-slate-600">{i().field!.description}</p>
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}
