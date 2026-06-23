import {
  Delimiters,
  DEFAULT_DELIMITERS,
  Field,
  Hl7Message,
  Segment,
  isSeparatorHeader,
} from "./types";
import { isMshLine, parseDelimiters } from "./delimiters";

/** Split raw text into non-empty segment lines, tolerant of \r, \n and \r\n. */
function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/).filter((line) => line.length > 0);
}

/** Parse a single field token into the repetition/component/subcomponent tree. */
export function parseField(token: string, d: Delimiters): Field {
  return token
    .split(d.repetition)
    .map((rep) => rep.split(d.component).map((comp) => comp.split(d.subcomponent)));
}

/** Parse one raw segment line into a Segment using the given delimiters. */
export function parseSegment(line: string, d: Delimiters): Segment {
  const tokens = line.split(d.field);
  const id = tokens[0];
  const rest = tokens.slice(1);
  const headerSegment = isSeparatorHeader(id);

  const fields: Field[] = rest.map((token, i) => {
    // For MSH/BHS/FHS the first token IS the encoding-characters string
    // (MSH-2). It contains the component/subcomponent characters literally and
    // must never be decomposed, so we store it as a single raw subcomponent.
    if (headerSegment && i === 0) return [[[token]]];
    return parseField(token, d);
  });

  return { id, fields, raw: line };
}

/**
 * Parse raw text into one or more HL7 messages.
 *
 * Each MSH line begins a new message. Delimiters are read per-message from its
 * own MSH header so files mixing standard and non-standard encoding characters
 * parse correctly. Any leading lines before the first MSH (e.g. a stray BHS
 * batch header, or junk) are collected into their own message so nothing is
 * silently dropped.
 */
export function parseMessages(text: string): Hl7Message[] {
  const lines = splitLines(text);
  if (lines.length === 0) return [];

  const messages: Hl7Message[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length === 0) return;
    const mshLine = current.find(isMshLine);
    const delimiters = mshLine ? parseDelimiters(mshLine) : { ...DEFAULT_DELIMITERS };
    const segments = current.map((line) => parseSegment(line, delimiters));
    messages.push({ segments, delimiters, raw: current.join("\r") });
    current = [];
  };

  for (const line of lines) {
    if (isMshLine(line) && current.length > 0) flush();
    current.push(line);
  }
  flush();

  return messages;
}

/** Convenience: parse text expected to contain exactly one message. */
export function parseMessage(text: string): Hl7Message | undefined {
  return parseMessages(text)[0];
}
