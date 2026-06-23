import { For, Show, createSignal, type JSX } from "solid-js";
import { ArrowUp, ArrowDown, CopyPlus, Trash2, ChevronRight, ChevronDown } from "lucide-solid";
import { store, type Selection } from "../state/store";
import { Delimiters, Field, Hl7Message, Segment, indexToFieldNumber } from "../hl7/types";
import {
  describeComponent,
  describeField,
  describeSegment,
  isPhiField,
} from "../hl7/dictionary";

function fieldToText(field: Field, d: Delimiters): string {
  return field
    .map((rep) => rep.map((comp) => comp.join(d.subcomponent)).join(d.component))
    .join(d.repetition);
}

function componentText(field: Field, component: number, d: Delimiters): string {
  return (field[0]?.[component - 1] ?? []).join(d.subcomponent);
}

/** The editable, dictionary-annotated tree — the primary editing surface. */
export default function StructuredView(props: { message: Hl7Message }) {
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set());
  const [collapsed, setCollapsed] = createSignal<Set<number>>(new Set());
  const profile = store.profile;
  const sel = () => store.state.selection;

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleCollapse = (index: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });

  return (
    <div class="h-full overflow-auto bg-white dark:bg-slate-900">
      <For each={props.message.segments}>
        {(segment, si) => (
          <SegmentBlock
            segment={segment}
            segmentIndex={si()}
            message={props.message}
            expanded={expanded()}
            toggle={toggle}
            collapsed={collapsed().has(si())}
            onToggleCollapse={() => toggleCollapse(si())}
            selected={sel()}
            profile={profile()}
          />
        )}
      </For>
    </div>
  );
}

function SegmentBlock(props: {
  segment: Segment;
  segmentIndex: number;
  message: Hl7Message;
  expanded: Set<string>;
  toggle: (key: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  selected: Selection | null;
  profile: ReturnType<typeof store.profile>;
}) {
  const def = () => describeSegment(props.profile, props.segment.id);
  const d = props.message.delimiters;

  return (
    <div class="border-b border-slate-200 dark:border-slate-700">
      <div class="sticky top-0 z-10 flex items-center justify-between gap-2 bg-prc-50 px-2 py-1.5 dark:bg-slate-800">
        <button
          class="flex min-w-0 items-center gap-2 text-left"
          title={props.collapsed ? "Expand segment" : "Collapse segment"}
          onClick={props.onToggleCollapse}
        >
          <span class="grid h-5 w-5 shrink-0 place-items-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <Show when={props.collapsed} fallback={<ChevronDown size={15} />}>
              <ChevronRight size={15} />
            </Show>
          </span>
          <span class="font-mono text-sm font-bold text-prc-600 dark:text-prc-100">
            {props.segment.id}
          </span>
          <span class="truncate text-sm text-slate-500 dark:text-slate-400">
            {def()?.name ?? "Unknown segment"}
          </span>
          <Show when={props.collapsed}>
            <span class="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
              ({props.segment.fields.length} fields)
            </span>
          </Show>
        </button>
        <div class="flex items-center gap-0.5 text-xs">
          <SegBtn title="Move up" onClick={() => store.moveSegment(props.segmentIndex, -1)}>
            <ArrowUp size={14} />
          </SegBtn>
          <SegBtn title="Move down" onClick={() => store.moveSegment(props.segmentIndex, 1)}>
            <ArrowDown size={14} />
          </SegBtn>
          <SegBtn title="Duplicate" onClick={() => store.duplicateSegment(props.segmentIndex)}>
            <CopyPlus size={14} />
          </SegBtn>
          <SegBtn title="Delete segment" onClick={() => store.removeSegment(props.segmentIndex)} danger>
            <Trash2 size={14} />
          </SegBtn>
        </div>
      </div>

      <Show when={!props.collapsed}>
      <div class="divide-y divide-slate-100 dark:divide-slate-800">
        <For each={props.segment.fields}>
          {(field, fi) => {
            const fieldNumber = indexToFieldNumber(props.segment.id, fi());
            const key = `${props.segmentIndex}-${fieldNumber}`;
            const fdef = () => describeField(props.profile, props.segment.id, fieldNumber);
            const phi = () => isPhiField(props.profile, props.segment.id, fieldNumber);
            const dtComponents = () => {
              const dt = fdef()?.datatype;
              return dt ? props.profile.datatypes[dt]?.components : undefined;
            };
            const hasComponents = () =>
              !!dtComponents() || (field[0]?.length ?? 0) > 1;
            const repCount = field.length;
            const isSelected = () =>
              props.selected?.segmentIndex === props.segmentIndex &&
              props.selected?.fieldNumber === fieldNumber;

            return (
              <div
                classList={{
                  "px-3 py-1.5": true,
                  "bg-warm-50 dark:bg-slate-800": isSelected(),
                }}
                onClick={() =>
                  store.select({ segmentIndex: props.segmentIndex, fieldNumber })
                }
              >
                <div class="flex items-center gap-2">
                  <button
                    class="w-6 shrink-0 text-left text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    classList={{ invisible: !hasComponents() }}
                    title="Show components"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.toggle(key);
                    }}
                  >
                    {props.expanded.has(key) ? "▾" : "▸"}
                  </button>
                  <span
                    class="w-20 shrink-0 font-mono text-xs text-prc-600 dark:text-prc-100"
                    title={fdef()?.datatype ? `Datatype: ${fdef()?.datatype}` : undefined}
                  >
                    {props.segment.id}-{fieldNumber}
                  </span>
                  <span
                    class="w-56 shrink-0 truncate text-xs text-slate-600 dark:text-slate-300"
                    title={fdef()?.description}
                  >
                    {fdef()?.name ?? <span class="italic text-slate-400">unknown</span>}
                    <Show when={fdef()?.optionality === "R"}>
                      <span class="ml-1 text-coral-500" title="Required">*</span>
                    </Show>
                  </span>
                  <Show when={phi()}>
                    <span
                      class="shrink-0 rounded bg-warm-100 px-1.5 py-0.5 text-[10px] font-medium text-coral-600 dark:bg-coral-600/20 dark:text-coral-500"
                      title={phi()!.label}
                    >
                      PHI
                    </span>
                  </Show>
                  <input
                    class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-0.5 font-mono text-sm text-slate-800 hover:border-slate-200 focus:border-prc-400 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-slate-600 dark:focus:bg-slate-900"
                    value={fieldToText(field, d)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      store.setFieldText(props.segmentIndex, fieldNumber, e.currentTarget.value)
                    }
                  />
                  <Show when={repCount > 1}>
                    <span class="shrink-0 text-[10px] text-slate-400" title="Repetitions">
                      ×{repCount}
                    </span>
                  </Show>
                </div>

                <Show when={props.expanded.has(key) && hasComponents()}>
                  <div class="ml-8 mt-1 flex flex-col gap-1 border-l-2 border-slate-100 pl-3 dark:border-slate-700">
                    <For each={field[0] ?? []}>
                      {(_comp, ci) => {
                        const compNum = ci() + 1;
                        const cdef = () =>
                          describeComponent(props.profile, props.segment.id, fieldNumber, compNum);
                        return (
                          <div class="flex items-center gap-2">
                            <span class="w-20 shrink-0 font-mono text-[11px] text-slate-400">
                              .{compNum}
                            </span>
                            <span class="w-52 shrink-0 truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {cdef()?.name ?? ""}
                            </span>
                            <input
                              class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-0.5 font-mono text-xs text-slate-800 hover:border-slate-200 focus:border-prc-400 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-slate-600 dark:focus:bg-slate-900"
                              value={componentText(field, compNum, d)}
                              onChange={(e) =>
                                store.setComponentText(
                                  props.segmentIndex,
                                  fieldNumber,
                                  compNum,
                                  e.currentTarget.value,
                                )
                              }
                            />
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>

      <div class="px-3 py-1">
        <AddSegmentInline segmentIndex={props.segmentIndex} />
      </div>
      </Show>
    </div>
  );
}

function SegBtn(props: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: JSX.Element;
}) {
  return (
    <button
      classList={{
        "grid h-6 w-6 place-items-center rounded transition-colors": true,
        "text-slate-500 hover:bg-coral-500 hover:text-white": props.danger,
        "text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100":
          !props.danger,
      }}
      title={props.title}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick();
      }}
    >
      {props.children}
    </button>
  );
}

function AddSegmentInline(props: { segmentIndex: number }) {
  const [id, setId] = createSignal("");
  return (
    <form
      class="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (id().trim()) {
          store.addSegmentAfter(props.segmentIndex, id().trim());
          setId("");
        }
      }}
    >
      <input
        class="w-24 rounded border border-slate-200 bg-transparent px-2 py-0.5 font-mono text-xs uppercase text-slate-700 focus:border-prc-400 focus:outline-none dark:border-slate-700 dark:text-slate-200"
        placeholder="+ SEG"
        maxLength={4}
        value={id()}
        onInput={(e) => setId(e.currentTarget.value)}
      />
      <Show when={id().trim()}>
        <button class="text-xs text-prc-600 hover:underline dark:text-prc-100" type="submit">
          add segment below
        </button>
      </Show>
    </form>
  );
}
