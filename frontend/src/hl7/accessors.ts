import {
  Delimiters,
  Field,
  Hl7Message,
  Segment,
  fieldNumberToIndex,
} from "./types";
import { serializeSegment } from "./serializer";

/** Get the Field at an HL7 field number (1-based), or undefined. */
export function getField(segment: Segment, fieldNumber: number): Field | undefined {
  const index = fieldNumberToIndex(segment.id, fieldNumber);
  if (index < 0) return undefined;
  return segment.fields[index];
}

/** First repetition's flat text for a field number (components joined). */
export function getFieldText(segment: Segment, fieldNumber: number, d: Delimiters): string {
  const field = getField(segment, fieldNumber);
  if (!field) return "";
  return field[0]?.map((comp) => comp.join(d.subcomponent)).join(d.component) ?? "";
}

/** Value of a single component (1-based comp) within the first repetition. */
export function getComponent(
  segment: Segment,
  fieldNumber: number,
  componentNumber: number,
  d: Delimiters,
): string {
  const field = getField(segment, fieldNumber);
  const comp = field?.[0]?.[componentNumber - 1];
  return comp ? comp.join(d.subcomponent) : "";
}

/** Find the first segment with the given id. */
export function findSegment(message: Hl7Message, id: string): Segment | undefined {
  return message.segments.find((s) => s.id === id);
}

/** All segments with the given id. */
export function findSegments(message: Hl7Message, id: string): Segment[] {
  return message.segments.filter((s) => s.id === id);
}

/**
 * The message type from MSH-9, formatted "MSG^TRIGGER^STRUCTURE" with empty
 * trailing parts trimmed (e.g. "ADT^A01"). Empty string if absent.
 */
export function getMessageType(message: Hl7Message): string {
  const msh = findSegment(message, "MSH");
  if (!msh) return "";
  return getFieldText(msh, 9, message.delimiters).replace(/\^+$/, "");
}

/** MSH-10 message control id. */
export function getControlId(message: Hl7Message): string {
  const msh = findSegment(message, "MSH");
  return msh ? getComponent(msh, 10, 1, message.delimiters) : "";
}

/** A short human label for a message, used in the message list. */
export function getMessageLabel(message: Hl7Message, index: number): string {
  const type = getMessageType(message);
  const control = getControlId(message);
  const parts = [type || "(no MSH)", control].filter(Boolean);
  return parts.length ? parts.join("  ·  ") : `Message ${index + 1}`;
}

/**
 * Immutably set a single subcomponent value, returning a new message. Positions
 * are 1-based HL7 numbers; the field/repetition/component/subcomponent trees are
 * grown with empty entries as needed so editing a not-yet-present position works.
 */
export function setSubcomponent(
  message: Hl7Message,
  segmentIndex: number,
  fieldNumber: number,
  repetition: number,
  component: number,
  subcomponent: number,
  value: string,
): Hl7Message {
  const segments = message.segments.map((seg, si) => {
    if (si !== segmentIndex) return seg;
    const fieldIndex = fieldNumberToIndex(seg.id, fieldNumber);
    if (fieldIndex < 0) return seg;

    const fields = seg.fields.slice();
    while (fields.length <= fieldIndex) fields.push([[[""]]]);

    const field = fields[fieldIndex].map((rep) => rep.map((comp) => comp.slice()));
    while (field.length < repetition) field.push([[""]]);
    const rep = field[repetition - 1];
    while (rep.length < component) rep.push([""]);
    const comp = rep[component - 1];
    while (comp.length < subcomponent) comp.push("");
    comp[subcomponent - 1] = value;

    fields[fieldIndex] = field;
    return { ...seg, fields };
  });

  return reserialize({ ...message, segments }, segmentIndex);
}

/** Immutably replace an entire Field (by HL7 field number), growing as needed. */
export function replaceField(
  message: Hl7Message,
  segmentIndex: number,
  fieldNumber: number,
  field: Field,
): Hl7Message {
  const segments = message.segments.map((seg, si) => {
    if (si !== segmentIndex) return seg;
    const fieldIndex = fieldNumberToIndex(seg.id, fieldNumber);
    if (fieldIndex < 0) return seg;
    const fields = seg.fields.slice();
    while (fields.length <= fieldIndex) fields.push([[[""]]]);
    fields[fieldIndex] = field;
    return { ...seg, fields };
  });
  return reserialize({ ...message, segments }, segmentIndex);
}

/** Re-derive the `raw` text of one segment (and the message) after an edit. */
function reserialize(message: Hl7Message, changedSegmentIndex: number): Hl7Message {
  const segments = message.segments.map((seg, i) =>
    i === changedSegmentIndex
      ? { ...seg, raw: serializeSegment(seg, message.delimiters) }
      : seg,
  );
  return { ...message, segments, raw: segments.map((s) => s.raw).join("\r") };
}
