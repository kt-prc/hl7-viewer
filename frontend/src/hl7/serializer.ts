import { Delimiters, Field, Hl7Message, Segment, isSeparatorHeader } from "./types";

export type LineEnding = "\r" | "\n" | "\r\n";

function serializeField(field: Field, d: Delimiters): string {
  return field
    .map((rep) => rep.map((comp) => comp.join(d.subcomponent)).join(d.component))
    .join(d.repetition);
}

export function serializeSegment(segment: Segment, d: Delimiters): string {
  const fieldStrings = segment.fields.map((field, i) => {
    // Mirror the parser: MSH-2 (the encoding characters) is stored raw and must
    // be emitted verbatim, not re-joined through the component machinery.
    if (isSeparatorHeader(segment.id) && i === 0) return field[0]?.[0]?.[0] ?? "";
    return serializeField(field, d);
  });
  return [segment.id, ...fieldStrings].join(d.field);
}

/**
 * Serialize a message back to raw HL7 text. The default segment terminator is
 * the HL7-correct carriage return; callers may request LF or CRLF for files
 * destined for tools that expect them.
 */
export function serializeMessage(message: Hl7Message, eol: LineEnding = "\r"): string {
  return message.segments
    .map((segment) => serializeSegment(segment, message.delimiters))
    .join(eol);
}

/** Serialize multiple messages, separating each with the chosen line ending. */
export function serializeMessages(messages: Hl7Message[], eol: LineEnding = "\r"): string {
  return messages.map((m) => serializeMessage(m, eol)).join(eol);
}
