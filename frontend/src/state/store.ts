import { createMemo, createRoot } from "solid-js";
import { createStore } from "solid-js/store";
import { Hl7Message, Segment } from "../hl7/types";
import { parseMessages, parseField } from "../hl7/parser";
import { serializeSegment, serializeMessages } from "../hl7/serializer";
import { setSubcomponent, replaceField, getField } from "../hl7/accessors";
import { resolveActiveProfile, DEFAULT_PROFILE_ID } from "../hl7/dictionary";
import { validateMessage } from "../hl7/validate";
import { searchMessage } from "../hl7/search";
import { DeidChange, DeidOptions, deidentify } from "../hl7/deidentify";

/** A path to a specific node in the active message, for selection + editing. */
export interface Selection {
  segmentIndex: number;
  fieldNumber?: number;
  /** 1-based repetition. */
  repetition?: number;
  /** 1-based component. */
  component?: number;
  /** 1-based subcomponent. */
  subcomponent?: number;
}

interface AppState {
  messages: Hl7Message[];
  activeIndex: number;
  profileId: string;
  selection: Selection | null;
  searchQuery: string;
  lastDeid: DeidChange[] | null;
}

const [state, setState] = createStore<AppState>({
  messages: [],
  activeIndex: 0,
  profileId: DEFAULT_PROFILE_ID,
  selection: null,
  searchQuery: "",
  lastDeid: null,
});

/** Recompute one segment's raw text and the message raw after a structural edit. */
function reserialize(message: Hl7Message): Hl7Message {
  const segments = message.segments.map((s) => ({
    ...s,
    raw: serializeSegment(s, message.delimiters),
  }));
  return { ...message, segments, raw: segments.map((s) => s.raw).join("\r") };
}

function updateActive(updater: (m: Hl7Message) => Hl7Message): void {
  setState("messages", state.activeIndex, (m) => (m ? updater(m) : m));
}

// Memos own their reactive graph in a root so they live for the app's lifetime.
const derived = createRoot(() => ({
  activeMessage: createMemo<Hl7Message | undefined>(() => state.messages[state.activeIndex]),
  profile: createMemo(() => resolveActiveProfile(state.profileId)),
  documentText: createMemo(() =>
    state.messages.length ? serializeMessages(state.messages, "\r") : "",
  ),
}));

const issues = createRoot(() =>
  createMemo(() => {
    const m = derived.activeMessage();
    return m ? validateMessage(m, derived.profile()) : [];
  }),
);

const matches = createRoot(() =>
  createMemo(() => {
    const m = derived.activeMessage();
    return m && state.searchQuery ? searchMessage(m, state.searchQuery) : [];
  }),
);

export const store = {
  state,

  // selectors
  activeMessage: derived.activeMessage,
  profile: derived.profile,
  documentText: derived.documentText,
  issues,
  matches,
  messageCount: () => state.messages.length,

  // input
  loadText(text: string): void {
    const messages = parseMessages(text);
    setState({ messages, activeIndex: 0, selection: null, searchQuery: "", lastDeid: null });
  },

  /**
   * Reparse the whole document from edited source text, preserving the active
   * index and search where still valid. Used by the live-editable paste box.
   */
  replaceDocument(text: string): void {
    const messages = parseMessages(text);
    const activeIndex = Math.min(state.activeIndex, Math.max(0, messages.length - 1));
    setState({ messages, activeIndex, selection: null, lastDeid: null });
  },

  clearAll(): void {
    setState({ messages: [], activeIndex: 0, selection: null, searchQuery: "", lastDeid: null });
  },

  setActiveIndex(index: number): void {
    setState({ activeIndex: index, selection: null, lastDeid: null });
  },

  setProfile(profileId: string): void {
    setState("profileId", profileId);
  },

  setSearchQuery(query: string): void {
    setState("searchQuery", query);
  },

  select(selection: Selection | null): void {
    setState("selection", selection);
  },

  // editing
  editValue(sel: Required<Pick<Selection, "segmentIndex" | "fieldNumber">> & Selection, value: string): void {
    updateActive((m) =>
      setSubcomponent(
        m,
        sel.segmentIndex,
        sel.fieldNumber,
        sel.repetition ?? 1,
        sel.component ?? 1,
        sel.subcomponent ?? 1,
        value,
      ),
    );
  },

  /** Replace a whole field by parsing typed text with the message delimiters. */
  setFieldText(segmentIndex: number, fieldNumber: number, text: string): void {
    updateActive((m) => replaceField(m, segmentIndex, fieldNumber, parseField(text, m.delimiters)));
  },

  /** Replace one component (1-based) within the first repetition of a field. */
  setComponentText(
    segmentIndex: number,
    fieldNumber: number,
    component: number,
    text: string,
  ): void {
    updateActive((m) => {
      const existing = getField(m.segments[segmentIndex], fieldNumber);
      const field = (existing ?? [[[""]]]).map((rep) => rep.map((c) => c.slice()));
      const rep = field[0] ?? (field[0] = [[""]]);
      while (rep.length < component) rep.push([""]);
      rep[component - 1] = text.split(m.delimiters.subcomponent);
      return replaceField(m, segmentIndex, fieldNumber, field);
    });
  },

  addSegmentAfter(index: number, id: string): void {
    const newSegment: Segment = { id: id.toUpperCase().slice(0, 4), fields: [], raw: "" };
    updateActive((m) => {
      const segments = m.segments.slice();
      segments.splice(index + 1, 0, newSegment);
      return reserialize({ ...m, segments });
    });
  },

  duplicateSegment(index: number): void {
    updateActive((m) => {
      const segments = m.segments.slice();
      const clone = structuredClone(segments[index]);
      segments.splice(index + 1, 0, clone);
      return reserialize({ ...m, segments });
    });
  },

  removeSegment(index: number): void {
    updateActive((m) => {
      const segments = m.segments.slice();
      segments.splice(index, 1);
      return reserialize({ ...m, segments });
    });
    setState("selection", null);
  },

  moveSegment(index: number, direction: -1 | 1): void {
    const target = index + direction;
    updateActive((m) => {
      if (target < 0 || target >= m.segments.length) return m;
      const segments = m.segments.slice();
      [segments[index], segments[target]] = [segments[target], segments[index]];
      return reserialize({ ...m, segments });
    });
  },

  deidentifyActive(options: DeidOptions): void {
    const m = derived.activeMessage();
    if (!m) return;
    const { message, changes } = deidentify(m, derived.profile(), options);
    setState("messages", state.activeIndex, message);
    setState("lastDeid", changes);
  },

  clearDeidReport(): void {
    setState("lastDeid", null);
  },
};
