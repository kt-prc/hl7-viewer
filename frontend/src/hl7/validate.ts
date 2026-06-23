import { Hl7Message, indexToFieldNumber, isSeparatorHeader } from "./types";
import { getField } from "./accessors";
import { ResolvedProfile, describeField, describeSegment } from "./dictionary";

export type IssueSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: IssueSeverity;
  message: string;
  /** 0-based segment index the issue points at, when applicable. */
  segmentIndex?: number;
  /** HL7 field number the issue points at, when applicable. */
  field?: number;
}

/** Minimal required-segment expectations for a few common message types. */
const REQUIRED_SEGMENTS: Record<string, string[]> = {
  ADT: ["MSH", "EVN", "PID"],
  ORU: ["MSH", "PID", "OBR", "OBX"],
  ORM: ["MSH", "PID", "ORC"],
  OML: ["MSH", "PID", "ORC"],
  ACK: ["MSH", "MSA"],
};

function messageCode(message: Hl7Message): string {
  const msh = message.segments.find((s) => s.id === "MSH");
  if (!msh) return "";
  // MSH-9 component 1 (message code) lives at fields index 7 for MSH.
  const field = getField(msh, 9);
  return field?.[0]?.[0]?.[0] ?? "";
}

/**
 * Structural validation. Deliberately conservative: it flags well-formedness and
 * obviously-missing required pieces without pretending to be a full conformance
 * profile. Every issue carries a location so the UI can jump to it.
 */
export function validateMessage(
  message: Hl7Message,
  profile: ResolvedProfile,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. MSH presence and encoding well-formedness.
  const mshIndex = message.segments.findIndex((s) => s.id === "MSH");
  if (mshIndex === -1) {
    issues.push({ severity: "error", message: "Message has no MSH header segment." });
  } else {
    const msh = message.segments[mshIndex];
    const encoding = msh.fields[0]?.[0]?.[0]?.[0] ?? msh.fields[0]?.[0]?.[0] ?? "";
    const enc = typeof encoding === "string" ? encoding : "";
    if (enc.length < 4) {
      issues.push({
        severity: "warning",
        message: `MSH-2 encoding characters look incomplete ("${enc}"); expected 4 (e.g. ^~\\&).`,
        segmentIndex: mshIndex,
        field: 2,
      });
    }
    if (!messageCode(message)) {
      issues.push({
        severity: "error",
        message: "MSH-9 (Message Type) is empty.",
        segmentIndex: mshIndex,
        field: 9,
      });
    }
    if (!(getField(msh, 10)?.[0]?.[0]?.[0])) {
      issues.push({
        severity: "warning",
        message: "MSH-10 (Message Control ID) is empty.",
        segmentIndex: mshIndex,
        field: 10,
      });
    }
  }

  // 2. Required segments for the detected message type.
  const code = messageCode(message);
  const required = REQUIRED_SEGMENTS[code];
  if (required) {
    const present = new Set(message.segments.map((s) => s.id));
    for (const id of required) {
      if (!present.has(id)) {
        issues.push({
          severity: "error",
          message: `${code} message is missing a required ${id} segment.`,
        });
      }
    }
  }

  // 3. Per-segment required-field checks driven by the active dictionary.
  message.segments.forEach((segment, segmentIndex) => {
    const def = describeSegment(profile, segment.id);
    if (!def) {
      issues.push({
        severity: "info",
        message: `Segment "${segment.id}" is not in the active dictionary (shown with generic positions).`,
        segmentIndex,
      });
      return;
    }
    for (const field of Object.values(def.fields)) {
      if (field.optionality !== "R") continue;
      // MSH-1/MSH-2 are intrinsic for separator headers; skip them.
      if (isSeparatorHeader(segment.id) && field.seq <= 2) continue;
      const value = getField(segment, field.seq);
      const text = value?.[0]?.flat().join("") ?? "";
      if (!text) {
        const label = describeField(profile, segment.id, field.seq)?.name ?? `field ${field.seq}`;
        issues.push({
          severity: "error",
          message: `${segment.id}-${field.seq} (${label}) is required but empty.`,
          segmentIndex,
          field: field.seq,
        });
      }
    }
  });

  return issues;
}

/** Validate a position label like "MSH-9" for the search bar / messages. */
export function formatIssueLocation(issue: ValidationIssue, segmentId?: string): string {
  if (issue.segmentIndex == null) return "message";
  const seg = segmentId ?? `segment ${issue.segmentIndex + 1}`;
  return issue.field != null ? `${seg}-${issue.field}` : seg;
}

/** Helper used by the parser-aware UI to compute a field number from an index. */
export { indexToFieldNumber };
