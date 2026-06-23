import { describe, expect, it } from "vitest";
import {
  describeComponent,
  describeField,
  describePosition,
  isPhiField,
  resolveActiveProfile,
} from "../src/hl7/dictionary";

const base = resolveActiveProfile("base-v2x");
const au = resolveActiveProfile("au-v24");

describe("base dictionary lookups", () => {
  it("names fields and components", () => {
    expect(describeField(base, "PID", 5)?.name).toBe("Patient Name");
    expect(describeField(base, "MSH", 9)?.name).toBe("Message Type");
    expect(describeComponent(base, "PID", 5, 1)?.name).toBe("Family Name");
    expect(describeComponent(base, "MSH", 9, 2)?.name).toBe("Trigger Event");
  });

  it("formats positions", () => {
    expect(describePosition(base, "PID", 5, 1)).toBe("Patient Name · Family Name");
    expect(describePosition(base, "PID", 7)).toBe("Date/Time of Birth");
  });

  it("flags PHI", () => {
    expect(isPhiField(base, "PID", 5)?.category).toBe("name");
    expect(isPhiField(base, "PID", 7)?.category).toBe("dob");
    expect(isPhiField(base, "PID", 2)).toBeUndefined();
  });
});

describe("AU profile overlay (extends base)", () => {
  it("inherits base definitions not overridden", () => {
    // PID-5 is not redefined by AU, so it comes from base.
    expect(describeField(au, "PID", 5)?.name).toBe("Patient Name");
    expect(describeComponent(au, "PID", 5, 1)?.name).toBe("Family Name");
    // Datatypes are inherited too.
    expect(describeComponent(au, "MSH", 9, 1)?.name).toBe("Message Code");
  });

  it("overrides fields where AU differs", () => {
    expect(describeField(au, "PID", 3)?.description).toMatch(/IHI/);
    expect(describeField(au, "PID", 19)?.description).toMatch(/Not used in Australia/);
  });

  it("refines PHI labelling for AU identifiers", () => {
    expect(isPhiField(au, "PID", 3)?.label).toMatch(/Medicare \/ IHI \/ DVA/);
    // AU adds a PID-19 PHI rule that base does not have.
    expect(isPhiField(base, "PID", 19)?.label).toBe("SSN");
    expect(isPhiField(au, "PID", 19)?.label).toMatch(/unused in AU/);
  });
});
