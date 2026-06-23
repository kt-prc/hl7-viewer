import { describe, expect, it } from "vitest";
import { parseMessage, parseMessages } from "../src/hl7/parser";
import { serializeMessage } from "../src/hl7/serializer";
import {
  getComponent,
  getFieldText,
  getMessageType,
  findSegment,
} from "../src/hl7/accessors";
import { indexToFieldNumber, fieldNumberToIndex } from "../src/hl7/types";
import { ADT_A01, MULTI_MESSAGE, CUSTOM_DELIMITERS } from "./fixtures";

describe("parseMessages", () => {
  it("splits a file into one message per MSH", () => {
    const msgs = parseMessages(MULTI_MESSAGE);
    expect(msgs).toHaveLength(2);
    expect(getMessageType(msgs[0])).toBe("ADT^A01");
    expect(getMessageType(msgs[1])).toBe("ORU^R01");
  });

  it("tolerates \\r, \\n and \\r\\n line endings", () => {
    const a = parseMessages(ADT_A01.replace(/\r/g, "\n"));
    const b = parseMessages(ADT_A01.replace(/\r/g, "\r\n"));
    expect(a[0].segments.map((s) => s.id)).toEqual(["MSH", "EVN", "PID", "PV1"]);
    expect(b[0].segments).toHaveLength(4);
  });

  it("ignores blank lines", () => {
    const msg = parseMessage("MSH|^~\\&|A\r\r\rEVN|A01\r")!;
    expect(msg.segments.map((s) => s.id)).toEqual(["MSH", "EVN"]);
  });
});

describe("field numbering (MSH off-by-one)", () => {
  it("maps MSH indexes shifted by the separator field", () => {
    expect(fieldNumberToIndex("MSH", 2)).toBe(0); // MSH-2 is the first stored token
    expect(fieldNumberToIndex("MSH", 9)).toBe(7);
    expect(indexToFieldNumber("MSH", 0)).toBe(2);
    expect(fieldNumberToIndex("PID", 3)).toBe(2);
    expect(indexToFieldNumber("PID", 2)).toBe(3);
  });

  it("reads MSH-9 / MSH-10 at the right positions", () => {
    const msg = parseMessage(ADT_A01)!;
    const msh = findSegment(msg, "MSH")!;
    expect(getFieldText(msh, 9, msg.delimiters)).toBe("ADT^A01");
    expect(getComponent(msh, 10, 1, msg.delimiters)).toBe("MSG00001");
  });
});

describe("structure decomposition", () => {
  it("parses repetitions, components and subcomponents", () => {
    const msg = parseMessage(ADT_A01)!;
    const pid = findSegment(msg, "PID")!;
    // PID-3 has two repetitions (MR and Medicare number)
    const pid3 = pid.fields[fieldNumberToIndex("PID", 3)];
    expect(pid3).toHaveLength(2);
    expect(pid3[0][0][0]).toBe("MRN12345");
    expect(pid3[0][4][0]).toBe("MR");
    expect(pid3[1][3][0]).toBe("AUSHIC");
    // PID-5 family/given name
    expect(getComponent(pid, 5, 1, msg.delimiters)).toBe("DOE");
    expect(getComponent(pid, 5, 2, msg.delimiters)).toBe("JANE");
  });
});

describe("custom delimiters", () => {
  it("honours non-standard encoding characters from MSH", () => {
    const msg = parseMessage(CUSTOM_DELIMITERS)!;
    expect(msg.delimiters.field).toBe("#");
    expect(msg.delimiters.component).toBe("@");
    expect(getMessageType(msg)).toBe("ADT@A01");
    const pid = findSegment(msg, "PID")!;
    expect(getComponent(pid, 5, 1, msg.delimiters)).toBe("DOE");
  });
});

describe("round-trip", () => {
  for (const [name, text] of [
    ["ADT_A01", ADT_A01],
    ["CUSTOM_DELIMITERS", CUSTOM_DELIMITERS],
  ] as const) {
    it(`serialize(parse(${name})) is lossless`, () => {
      const msg = parseMessage(text)!;
      expect(serializeMessage(msg)).toBe(text);
    });
  }

  it("round-trips every message in a multi-message file", () => {
    const msgs = parseMessages(MULTI_MESSAGE);
    const out = msgs.map((m) => serializeMessage(m)).join("\r");
    // Both messages normalise their internal separators to \r.
    expect(out).toBe(MULTI_MESSAGE.replace(/\n/g, "\r"));
  });
});
