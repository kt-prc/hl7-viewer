/**
 * HL7 v2.x data model.
 *
 * The hierarchy mirrors the encoding characters:
 *   Field        -> joined by the repetition separator (~)
 *   Repetition   -> joined by the component separator (^)
 *   Component    -> joined by the subcomponent separator (&)
 *   Subcomponent -> a raw string (escape sequences preserved verbatim)
 *
 * Strings are stored RAW (escape sequences such as \F\ \S\ \T\ \R\ \E\ are kept
 * intact) so that serialize(parse(x)) === x for well-formed input. Decoding is a
 * display-only concern (see escape.ts).
 */

export interface Delimiters {
  /** Field separator, usually "|". This is MSH-1 for MSH/BHS/FHS segments. */
  field: string;
  /** Component separator, usually "^". */
  component: string;
  /** Repetition separator, usually "~". */
  repetition: string;
  /** Escape character, usually "\". */
  escape: string;
  /** Subcomponent separator, usually "&". */
  subcomponent: string;
}

export const DEFAULT_DELIMITERS: Delimiters = {
  field: "|",
  component: "^",
  repetition: "~",
  escape: "\\",
  subcomponent: "&",
};

/** The raw encoding-characters string as it appears in MSH-2. */
export const DEFAULT_ENCODING_CHARACTERS = "^~\\&";

export type Subcomponent = string;
export type Component = Subcomponent[];
export type Repetition = Component[];
export type Field = Repetition[];

export interface Segment {
  /** 3-character (occasionally longer / Z-) segment identifier, e.g. "PID". */
  id: string;
  /**
   * Tokens after the segment id, split on the field separator.
   *
   * Field numbering is NOT simply `fields[n]`. For ordinary segments the HL7
   * field number is `index + 1`. For MSH/BHS/FHS the field separator itself is
   * field 1, so `fields[0]` is field 2 (the encoding characters) and the HL7
   * field number is `index + 2`. Use indexToFieldNumber/fieldNumberToIndex.
   */
  fields: Field[];
  /** Original raw segment text, exactly as parsed. */
  raw: string;
}

export interface Hl7Message {
  segments: Segment[];
  delimiters: Delimiters;
  /** Original raw message text, exactly as parsed. */
  raw: string;
}

/** Segments whose field 1 is the field separator itself (the "MSH off-by-one"). */
const SEPARATOR_HEADER_SEGMENTS = new Set(["MSH", "BHS", "FHS"]);

export function isSeparatorHeader(segmentId: string): boolean {
  return SEPARATOR_HEADER_SEGMENTS.has(segmentId);
}

/** Convert a 0-based index into `Segment.fields` to an HL7 field number. */
export function indexToFieldNumber(segmentId: string, index: number): number {
  return isSeparatorHeader(segmentId) ? index + 2 : index + 1;
}

/** Convert an HL7 field number to a 0-based index into `Segment.fields`. */
export function fieldNumberToIndex(segmentId: string, fieldNumber: number): number {
  return isSeparatorHeader(segmentId) ? fieldNumber - 2 : fieldNumber - 1;
}
