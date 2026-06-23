import { Field, Hl7Message, fieldNumberToIndex } from "./types";
import { serializeSegment } from "./serializer";
import { PhiCategory, ResolvedProfile } from "./dictionary";

export type DeidStrategy = "blank" | "placeholder" | "synthetic";

export interface DeidOptions {
  strategy: DeidStrategy;
  /** Which PHI categories to scrub. */
  categories: Set<PhiCategory>;
}

export interface DeidChange {
  segmentId: string;
  segmentIndex: number;
  field: number;
  category: PhiCategory;
  label: string;
}

export interface DeidResult {
  message: Hl7Message;
  /** What was scrubbed — positions only, never the original PHI values. */
  changes: DeidChange[];
}

export const ALL_PHI_CATEGORIES: PhiCategory[] = [
  "name",
  "id",
  "dob",
  "address",
  "phone",
  "account",
  "other",
];

export const CATEGORY_LABELS: Record<PhiCategory, string> = {
  name: "Names",
  id: "Identifiers (MRN, Medicare, IHI, DVA…)",
  dob: "Dates of birth",
  address: "Addresses",
  phone: "Phone / email",
  account: "Account numbers",
  other: "Other",
};

/**
 * Which 1-based components a category should scrub. A category mapped to "whole"
 * replaces the entire field; otherwise only the listed components are scrubbed so
 * structural metadata (identifier type codes, address city/state) is preserved.
 */
const CATEGORY_COMPONENTS: Record<PhiCategory, number[] | "whole"> = {
  name: [1, 2, 3], // family, given, middle
  id: [1], // mask the number, keep assigning authority / type
  account: [1],
  address: [1, 2], // street + other designation, keep city/state/postcode
  dob: "whole",
  phone: "whole",
  other: "whole",
};

function syntheticValue(category: PhiCategory, component: number, counter: number): string {
  switch (category) {
    case "name":
      return component === 1 ? "SURNAME" : component === 2 ? "GIVEN" : "";
    case "id":
    case "account":
      return `ANON${String(counter).padStart(6, "0")}`;
    case "dob":
      return "19000101";
    case "address":
      return component === 1 ? "1 ANON STREET" : "";
    case "phone":
      return "0000000";
    default:
      return "REDACTED";
  }
}

function scrubValue(
  strategy: DeidStrategy,
  category: PhiCategory,
  component: number,
  counter: number,
): string {
  if (strategy === "blank") return "";
  if (strategy === "placeholder") return "REDACTED";
  return syntheticValue(category, component, counter);
}

/** Apply scrubbing to a single field, returning a new Field. */
function scrubField(
  field: Field,
  category: PhiCategory,
  strategy: DeidStrategy,
  counter: number,
  onlyComponent?: number,
): Field {
  const target = onlyComponent ? [onlyComponent] : CATEGORY_COMPONENTS[category];

  if (target === "whole") {
    return [[[scrubValue(strategy, category, 1, counter)]]];
  }

  const components = new Set(target);
  return field.map((rep) =>
    rep.map((comp, ci) => {
      const componentNumber = ci + 1;
      if (!components.has(componentNumber)) return comp;
      return [scrubValue(strategy, category, componentNumber, counter)];
    }),
  );
}

/**
 * De-identify a message entirely in-browser, driven by the active profile's PHI
 * rules. Returns a new message plus a change report that lists positions only —
 * the original PHI never leaves the parsed model.
 */
export function deidentify(
  message: Hl7Message,
  profile: ResolvedProfile,
  options: DeidOptions,
): DeidResult {
  const changes: DeidChange[] = [];
  let counter = 0;

  const segments = message.segments.map((segment, segmentIndex) => {
    const rules = profile.phi.filter(
      (r) => r.segment === segment.id && options.categories.has(r.category),
    );
    if (rules.length === 0) return segment;

    let fields = segment.fields;
    let mutated = false;
    for (const rule of rules) {
      const idx = fieldNumberToIndex(segment.id, rule.field);
      if (idx < 0 || idx >= fields.length) continue;
      const existing = fields[idx];
      const hasContent = existing?.some((rep) => rep.some((comp) => comp.some(Boolean)));
      if (!hasContent) continue;

      counter += 1;
      const next = scrubField(existing, rule.category, options.strategy, counter, rule.component);
      if (!mutated) {
        fields = fields.slice();
        mutated = true;
      }
      fields[idx] = next;
      changes.push({
        segmentId: segment.id,
        segmentIndex,
        field: rule.field,
        category: rule.category,
        label: rule.label,
      });
    }

    if (!mutated) return segment;
    const updated = { ...segment, fields };
    return { ...updated, raw: serializeSegment(updated, message.delimiters) };
  });

  const newMessage: Hl7Message = {
    ...message,
    segments,
    raw: segments.map((s) => s.raw).join("\r"),
  };
  return { message: newMessage, changes };
}
