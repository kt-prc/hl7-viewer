import { describe, expect, it } from "vitest";
import { parseMessage } from "../src/hl7/parser";
import { validateMessage } from "../src/hl7/validate";
import { resolveActiveProfile } from "../src/hl7/dictionary";
import { ADT_A01 } from "./fixtures";

const profile = resolveActiveProfile("base-v2x");

describe("validateMessage", () => {
  it("passes a well-formed ADT message", () => {
    const msg = parseMessage(ADT_A01)!;
    const errors = validateMessage(msg, profile).filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });

  it("flags a missing MSH", () => {
    const msg = parseMessage("PID|1||MRN1||DOE^JANE")!;
    const issues = validateMessage(msg, profile);
    expect(issues.some((i) => /no MSH/.test(i.message))).toBe(true);
  });

  it("flags missing required segments for the message type", () => {
    // ORU requires OBR + OBX; this one has neither.
    const msg = parseMessage(
      "MSH|^~\\&|A|B|C|D|20260101||ORU^R01|1|P|2.4\rPID|1||MRN1||DOE^JANE",
    )!;
    const issues = validateMessage(msg, profile);
    expect(issues.some((i) => /missing a required OBR/.test(i.message))).toBe(true);
    expect(issues.some((i) => /missing a required OBX/.test(i.message))).toBe(true);
  });

  it("flags an empty required field", () => {
    // PV1-2 (Patient Class) is required; leave it empty.
    const msg = parseMessage(
      "MSH|^~\\&|A|B|C|D|20260101||ADT^A01|1|P|2.4\rEVN|A01|20260101\rPID|1||M||D^J\rPV1|1|",
    )!;
    const issues = validateMessage(msg, profile);
    expect(issues.some((i) => /PV1-2 .*required/.test(i.message))).toBe(true);
  });

  it("notes unknown segments as info", () => {
    const msg = parseMessage("MSH|^~\\&|A|B|C|D|20260101||ADT^A01|1|P|2.4\rZZZ|custom")!;
    const issues = validateMessage(msg, profile);
    expect(issues.some((i) => i.severity === "info" && /ZZZ/.test(i.message))).toBe(true);
  });
});
