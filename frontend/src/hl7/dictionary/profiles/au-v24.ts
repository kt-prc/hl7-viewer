import { DictionaryProfile, FieldDef, PhiRule, SegmentDef } from "../profile";

/**
 * AU localisation of HL7 v2.4 — informed by the AS 4700 series (4700.1 referral
 * & discharge, 4700.2 pathology/diagnostics) and HL7 Australia conventions.
 *
 * This is a CURATED, best-effort overlay (full AS 4700 text is paywalled). It
 * extends `base-v2x` and only states AU differences: localised field meanings,
 * the AU healthcare identifiers carried in PID-3 / provider name fields, and AU
 * PHI flags. Refine entries against your authoritative AS 4700 copies as needed.
 */

/**
 * Assigning-authority / identifier-type codes seen in AU messages, surfaced in
 * tooltips so a reader can tell a Medicare number from an IHI at a glance.
 * (Reference data, not message content.)
 */
export const AU_ASSIGNING_AUTHORITIES: Record<string, string> = {
  AUSHIC: "Australian Health Insurance Commission (Medicare / IHI)",
  AUSDVA: "Dept. of Veterans' Affairs",
  AUSHICPR: "Medicare provider number authority",
};

export const AU_IDENTIFIER_TYPES: Record<string, string> = {
  MC: "Medicare card number",
  NI: "Individual Healthcare Identifier (IHI)",
  NIIP: "Individual Healthcare Identifier (IHI)",
  DVA: "DVA file number",
  MR: "Medical record number",
  PI: "Patient internal identifier",
  NPI: "HPI-I (Healthcare Provider Identifier – Individual)",
  NOI: "HPI-O (Healthcare Provider Identifier – Organisation)",
};

function override(seq: number, name: string, datatype: string, description: string): FieldDef {
  return { seq, name, datatype, description };
}

const segments: Record<string, SegmentDef> = {
  // Only the fields that differ from base are listed; the overlay merges them
  // onto the inherited PID definition.
  PID: {
    id: "PID",
    name: "Patient Identification (AU)",
    fields: {
      3: override(
        3,
        "Patient Identifier List",
        "CX",
        "AU identifiers: MRN (MR), Medicare card (MC, AUSHIC), IHI (NI, AUSHIC), DVA (DVA, AUSDVA). 16-digit IHIs begin 800360.",
      ),
      19: override(
        19,
        "SSN Number – Patient",
        "ST",
        "Not used in Australia (no SSN). Australian identifiers belong in PID-3.",
      ),
    },
  },
  // Provider identifiers in AU carry HPI-I / Medicare provider numbers.
  PV1: {
    id: "PV1",
    name: "Patient Visit (AU)",
    fields: {
      7: override(
        7,
        "Attending Doctor",
        "XCN",
        "AU: may carry HPI-I (NPI) or Medicare provider number (assigning authority AUSHICPR).",
      ),
    },
  },
  ORC: {
    id: "ORC",
    name: "Common Order (AU)",
    fields: {
      12: override(
        12,
        "Ordering Provider",
        "XCN",
        "AU: HPI-I (NPI) and/or Medicare provider number (AUSHICPR).",
      ),
    },
  },
};

// AU-specific PHI: refine PID-3 labelling and flag AU healthcare identifiers.
const phi: PhiRule[] = [
  {
    segment: "PID",
    field: 3,
    category: "id",
    label: "Patient identifiers (MRN / Medicare / IHI / DVA)",
  },
  { segment: "PID", field: 19, category: "id", label: "SSN field (unused in AU)" },
];

export const auV24: DictionaryProfile = {
  id: "au-v24",
  label: "AU localisation (HL7 v2.4 / AS 4700)",
  version: "2.4",
  extends: "base-v2x",
  segments,
  datatypes: {},
  phi,
};
