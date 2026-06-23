/**
 * Dictionary profile types and layering.
 *
 * A profile names every segment/field/datatype it knows about and flags which
 * positions carry PHI. Profiles may `extends` another profile and shallow-overlay
 * it, so the AU localisation only needs to state its differences from generic
 * HL7 v2.x rather than redefine the whole standard.
 */

export type Optionality = "R" | "O" | "C" | "X" | "B" | "W";

export interface FieldDef {
  /** HL7 field number (1-based). */
  seq: number;
  name: string;
  /** Datatype id, e.g. "XPN", "ST", "CX". Used to resolve component names. */
  datatype: string;
  optionality?: Optionality;
  repeats?: boolean;
  description?: string;
}

export interface SegmentDef {
  id: string;
  name: string;
  description?: string;
  /** Keyed by HL7 field number. */
  fields: Record<number, FieldDef>;
}

export interface ComponentDef {
  /** 1-based component position. */
  pos: number;
  name: string;
  datatype?: string;
}

export interface DatatypeDef {
  id: string;
  name: string;
  /** Present for composite datatypes; keyed by 1-based position. */
  components?: Record<number, ComponentDef>;
}

export type PhiCategory =
  | "name"
  | "id"
  | "dob"
  | "address"
  | "phone"
  | "account"
  | "other";

export interface PhiRule {
  segment: string;
  /** HL7 field number. */
  field: number;
  /** Optional specific component (1-based); omitted means the whole field. */
  component?: number;
  category: PhiCategory;
  label: string;
}

export interface DictionaryProfile {
  id: string;
  label: string;
  version: string;
  /** Id of a profile this one extends and overlays. */
  extends?: string;
  segments: Record<string, SegmentDef>;
  datatypes: Record<string, DatatypeDef>;
  phi: PhiRule[];
}

/** A fully flattened profile with all `extends` ancestors merged in. */
export type ResolvedProfile = Omit<DictionaryProfile, "extends">;

function phiKey(rule: PhiRule): string {
  return `${rule.segment}-${rule.field}.${rule.component ?? "*"}`;
}

/** Merge a child profile over a resolved parent (child wins per key). */
function overlay(parent: ResolvedProfile, child: DictionaryProfile): ResolvedProfile {
  const segments: Record<string, SegmentDef> = { ...parent.segments };
  for (const [id, seg] of Object.entries(child.segments)) {
    const base = segments[id];
    segments[id] = base
      ? { ...base, ...seg, fields: { ...base.fields, ...seg.fields } }
      : seg;
  }

  const datatypes: Record<string, DatatypeDef> = { ...parent.datatypes };
  for (const [id, dt] of Object.entries(child.datatypes)) {
    const base = datatypes[id];
    datatypes[id] = base
      ? { ...base, ...dt, components: { ...base.components, ...dt.components } }
      : dt;
  }

  // Child PHI rules replace parent rules at the same position; new ones append.
  const byKey = new Map<string, PhiRule>();
  for (const rule of parent.phi) byKey.set(phiKey(rule), rule);
  for (const rule of child.phi) byKey.set(phiKey(rule), rule);

  return {
    id: child.id,
    label: child.label,
    version: child.version,
    segments,
    datatypes,
    phi: [...byKey.values()],
  };
}

/**
 * Flatten a profile's `extends` chain into a single resolved profile.
 * `lookup` resolves ancestor ids (the registry passes itself in).
 */
export function resolveProfile(
  profile: DictionaryProfile,
  lookup: (id: string) => DictionaryProfile | undefined,
): ResolvedProfile {
  const chain: DictionaryProfile[] = [];
  let current: DictionaryProfile | undefined = profile;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current); // ancestors first
    current = current.extends ? lookup(current.extends) : undefined;
  }

  const [root, ...rest] = chain;
  let resolved: ResolvedProfile = {
    id: root.id,
    label: root.label,
    version: root.version,
    segments: { ...root.segments },
    datatypes: { ...root.datatypes },
    phi: [...root.phi],
  };
  for (const child of rest) resolved = overlay(resolved, child);
  return resolved;
}
