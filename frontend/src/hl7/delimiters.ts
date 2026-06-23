import { Delimiters, DEFAULT_DELIMITERS } from "./types";

/**
 * Derive the active delimiters from an MSH (or BHS/FHS) header line.
 *
 * MSH-1 is the single character immediately after the segment id ("MSH"), and
 * MSH-2 is the run of encoding characters up to the next field separator. Any
 * missing encoding characters fall back to the HL7 defaults, so a truncated
 * "MSH|^~" still yields sensible escape/subcomponent separators.
 */
export function parseDelimiters(headerLine: string): Delimiters {
  if (headerLine.length < 4) return { ...DEFAULT_DELIMITERS };

  const field = headerLine[3];
  const afterField = headerLine.slice(4);
  const end = afterField.indexOf(field);
  const encoding = end === -1 ? afterField : afterField.slice(0, end);

  return {
    field,
    component: encoding[0] ?? DEFAULT_DELIMITERS.component,
    repetition: encoding[1] ?? DEFAULT_DELIMITERS.repetition,
    escape: encoding[2] ?? DEFAULT_DELIMITERS.escape,
    subcomponent: encoding[3] ?? DEFAULT_DELIMITERS.subcomponent,
  };
}

/** True if a line looks like the start of a new message (an MSH header). */
export function isMshLine(line: string): boolean {
  return line.startsWith("MSH") && line.length >= 4;
}
