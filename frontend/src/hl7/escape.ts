import { Delimiters } from "./types";

/**
 * Decode HL7 escape sequences for DISPLAY ONLY. The stored model keeps raw text
 * so round-tripping is lossless; this turns \F\ \S\ \T\ \R\ \E\ and \Xdd..\ /
 * \.br\ into their literal meaning for human-readable rendering.
 */
export function decodeEscapes(value: string, d: Delimiters): string {
  const esc = d.escape;
  if (!value.includes(esc)) return value;

  let out = "";
  let i = 0;
  while (i < value.length) {
    if (value[i] !== esc) {
      out += value[i++];
      continue;
    }
    const end = value.indexOf(esc, i + 1);
    if (end === -1) {
      // Unterminated escape — emit the rest literally.
      out += value.slice(i);
      break;
    }
    const code = value.slice(i + 1, end);
    out += expandEscape(code, d);
    i = end + 1;
  }
  return out;
}

function expandEscape(code: string, d: Delimiters): string {
  switch (code[0]) {
    case "F":
      return d.field;
    case "S":
      return d.component;
    case "T":
      return d.subcomponent;
    case "R":
      return d.repetition;
    case "E":
      return d.escape;
    case "X": {
      // Hex character data, e.g. \X0D\.
      const hex = code.slice(1);
      if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) return "";
      let s = "";
      for (let j = 0; j < hex.length; j += 2) {
        s += String.fromCharCode(parseInt(hex.slice(j, j + 2), 16));
      }
      return s;
    }
    default:
      // Formatting codes like \.br\, \H\, \N\ — strip in plain-text rendering.
      return code.startsWith(".") ? "\n" : "";
  }
}
