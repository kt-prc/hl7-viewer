import { Hl7Message, indexToFieldNumber } from "./types";
import { serializeSegment } from "./serializer";

export interface SearchMatch {
  segmentIndex: number;
  /** HL7 field number when the match is field-scoped. */
  fieldNumber?: number;
  /** A short snippet of the matching value. */
  snippet: string;
}

const POSITION_RE = /^([A-Za-z][A-Za-z0-9]{2})-(\d+)(?:\.(\d+))?$/;

/**
 * Search a message. A query like "PID-3" or "OBX-5.1" is treated as a positional
 * lookup; anything else is a case-insensitive free-text search across every
 * field value. Returns located matches the UI can highlight and jump to.
 */
export function searchMessage(message: Hl7Message, rawQuery: string): SearchMatch[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const position = query.match(POSITION_RE);
  if (position) return positionalSearch(message, position);
  return freeTextSearch(message, query.toLowerCase());
}

function positionalSearch(
  message: Hl7Message,
  [, segId, fieldStr, compStr]: RegExpMatchArray,
): SearchMatch[] {
  const targetSeg = segId.toUpperCase();
  const fieldNumber = Number(fieldStr);
  const component = compStr ? Number(compStr) : undefined;
  const d = message.delimiters;
  const matches: SearchMatch[] = [];

  message.segments.forEach((segment, segmentIndex) => {
    if (segment.id !== targetSeg) return;
    const field = fieldNumberToField(message, segmentIndex, fieldNumber);
    if (!field) return;
    const rep = field[0] ?? [];
    const snippet =
      component != null
        ? (rep[component - 1] ?? []).join(d.subcomponent)
        : rep.map((c) => c.join(d.subcomponent)).join(d.component);
    matches.push({ segmentIndex, fieldNumber, snippet });
  });

  return matches;
}

function fieldNumberToField(message: Hl7Message, segmentIndex: number, fieldNumber: number) {
  const segment = message.segments[segmentIndex];
  // Reuse the index mapping by scanning fields with their computed numbers.
  for (let i = 0; i < segment.fields.length; i++) {
    if (indexToFieldNumber(segment.id, i) === fieldNumber) return segment.fields[i];
  }
  return undefined;
}

function freeTextSearch(message: Hl7Message, needle: string): SearchMatch[] {
  const matches: SearchMatch[] = [];
  message.segments.forEach((segment, segmentIndex) => {
    segment.fields.forEach((field, i) => {
      const text = field
        .map((rep) => rep.map((comp) => comp.join("")).join(""))
        .join("");
      if (text.toLowerCase().includes(needle)) {
        matches.push({
          segmentIndex,
          fieldNumber: indexToFieldNumber(segment.id, i),
          snippet: snippetAround(serializeFieldText(message, segmentIndex, i), needle),
        });
      }
    });
  });
  return matches;
}

function serializeFieldText(message: Hl7Message, segmentIndex: number, fieldIndex: number): string {
  const segment = message.segments[segmentIndex];
  const d = message.delimiters;
  const field = segment.fields[fieldIndex];
  return field
    .map((rep) => rep.map((comp) => comp.join(d.subcomponent)).join(d.component))
    .join(d.repetition);
}

function snippetAround(text: string, needle: string): string {
  const idx = text.toLowerCase().indexOf(needle);
  if (idx === -1) return text.slice(0, 60);
  const start = Math.max(0, idx - 20);
  const end = Math.min(text.length, idx + needle.length + 20);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

/** Count of segments matching a free-text needle (for the search summary). */
export function rawMatchCount(message: Hl7Message, needle: string): number {
  if (!needle.trim()) return 0;
  const lower = needle.toLowerCase();
  return message.segments.filter((s) =>
    serializeSegment(s, message.delimiters).toLowerCase().includes(lower),
  ).length;
}
