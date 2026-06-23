import {
  ComponentDef,
  DictionaryProfile,
  FieldDef,
  PhiCategory,
  PhiRule,
  ResolvedProfile,
  SegmentDef,
  resolveProfile,
} from "./profile";
import { baseV2x } from "./profiles/base-v2x";
import { auV24 } from "./profiles/au-v24";

/** All registered dictionary profiles. Add new dialects by appending here. */
export const PROFILES: DictionaryProfile[] = [baseV2x, auV24];

const byId = new Map(PROFILES.map((p) => [p.id, p]));

/** The default profile id. AU localisation, given the primary audience. */
export const DEFAULT_PROFILE_ID = "au-v24";

const resolvedCache = new Map<string, ResolvedProfile>();

export function resolveActiveProfile(id: string): ResolvedProfile {
  const cached = resolvedCache.get(id);
  if (cached) return cached;
  const profile = byId.get(id) ?? baseV2x;
  const resolved = resolveProfile(profile, (pid) => byId.get(pid));
  resolvedCache.set(id, resolved);
  return resolved;
}

/** Profiles formatted for a selector. */
export function profileOptions(): Array<{ id: string; label: string }> {
  return PROFILES.map((p) => ({ id: p.id, label: p.label }));
}

/* ----------------------------------------------------------------- lookups */

export function describeSegment(
  profile: ResolvedProfile,
  segmentId: string,
): SegmentDef | undefined {
  return profile.segments[segmentId];
}

export function describeField(
  profile: ResolvedProfile,
  segmentId: string,
  fieldNumber: number,
): FieldDef | undefined {
  return profile.segments[segmentId]?.fields[fieldNumber];
}

/**
 * Resolve the human name of a component within a field, e.g.
 * describeComponent(p, "PID", 5, 1) -> "Family Name". Falls back to undefined
 * when the field's datatype is primitive or unknown.
 */
export function describeComponent(
  profile: ResolvedProfile,
  segmentId: string,
  fieldNumber: number,
  componentNumber: number,
): ComponentDef | undefined {
  const field = describeField(profile, segmentId, fieldNumber);
  if (!field) return undefined;
  const datatype = profile.datatypes[field.datatype];
  return datatype?.components?.[componentNumber];
}

/** Human label for a position like "PID-5.1". */
export function describePosition(
  profile: ResolvedProfile,
  segmentId: string,
  fieldNumber: number,
  componentNumber?: number,
): string {
  const field = describeField(profile, segmentId, fieldNumber);
  if (!field) return `${segmentId}-${fieldNumber}`;
  if (componentNumber == null) return field.name;
  const comp = describeComponent(profile, segmentId, fieldNumber, componentNumber);
  return comp ? `${field.name} · ${comp.name}` : field.name;
}

/* --------------------------------------------------------------------- PHI */

/** All PHI rules in the profile, indexed for quick lookup by segment id. */
export function phiRulesForSegment(profile: ResolvedProfile, segmentId: string): PhiRule[] {
  return profile.phi.filter((r) => r.segment === segmentId);
}

export function isPhiField(
  profile: ResolvedProfile,
  segmentId: string,
  fieldNumber: number,
): PhiRule | undefined {
  return profile.phi.find((r) => r.segment === segmentId && r.field === fieldNumber);
}

export type { ResolvedProfile, SegmentDef, FieldDef, ComponentDef, PhiRule, PhiCategory };
