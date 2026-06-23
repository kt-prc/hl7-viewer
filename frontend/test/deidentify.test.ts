import { describe, expect, it } from "vitest";
import { parseMessage } from "../src/hl7/parser";
import { serializeMessage } from "../src/hl7/serializer";
import { deidentify, ALL_PHI_CATEGORIES } from "../src/hl7/deidentify";
import { getComponent, getFieldText, findSegment } from "../src/hl7/accessors";
import { resolveActiveProfile } from "../src/hl7/dictionary";
import { ADT_A01 } from "./fixtures";

const au = resolveActiveProfile("au-v24");
const allCategories = new Set(ALL_PHI_CATEGORIES);

describe("deidentify", () => {
  it("scrubs patient name, DOB and identifiers with the blank strategy", () => {
    const msg = parseMessage(ADT_A01)!;
    const { message, changes } = deidentify(msg, au, {
      strategy: "blank",
      categories: allCategories,
    });

    const pid = findSegment(message, "PID")!;
    expect(getComponent(pid, 5, 1, message.delimiters)).toBe(""); // family name gone
    expect(getFieldText(pid, 7, message.delimiters)).toBe(""); // DOB gone
    expect(changes.some((c) => c.field === 5 && c.category === "name")).toBe(true);
    expect(changes.some((c) => c.field === 7 && c.category === "dob")).toBe(true);
  });

  it("masks the ID number but keeps the assigning authority/type (synthetic)", () => {
    const msg = parseMessage(ADT_A01)!;
    const { message } = deidentify(msg, au, {
      strategy: "synthetic",
      categories: allCategories,
    });
    const pid = findSegment(message, "PID")!;
    // PID-3 rep 1: number scrubbed, type code "MR" preserved.
    expect(getComponent(pid, 3, 1, message.delimiters)).toMatch(/^ANON/);
    expect(getComponent(pid, 3, 5, message.delimiters)).toBe("MR");
  });

  it("leaves no original PHI in the serialized output", () => {
    const msg = parseMessage(ADT_A01)!;
    const { message } = deidentify(msg, au, {
      strategy: "synthetic",
      categories: allCategories,
    });
    const out = serializeMessage(message);
    expect(out).not.toContain("DOE");
    expect(out).not.toContain("JANE");
    expect(out).not.toContain("19850312");
    expect(out).not.toContain("MRN12345");
    expect(out).not.toContain("2950500011"); // Medicare number
  });

  it("respects the selected category subset", () => {
    const msg = parseMessage(ADT_A01)!;
    const { message } = deidentify(msg, au, {
      strategy: "blank",
      categories: new Set(["name"]),
    });
    const pid = findSegment(message, "PID")!;
    expect(getComponent(pid, 5, 1, message.delimiters)).toBe(""); // name scrubbed
    expect(getFieldText(pid, 7, message.delimiters)).toBe("19850312"); // DOB untouched
  });

  it("does not mutate the original message", () => {
    const msg = parseMessage(ADT_A01)!;
    const before = serializeMessage(msg);
    deidentify(msg, au, { strategy: "blank", categories: allCategories });
    expect(serializeMessage(msg)).toBe(before);
  });
});
