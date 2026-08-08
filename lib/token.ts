// Shareable link encoding.
//
// Requirements from README/Privacy:
//   * Short and opaque — no JSON blob that leaks the model shape.
//   * Server-readable — lives in the path (/r/<token>), not the URL fragment, so
//     Open Graph tags can be rendered server-side.
//   * Forward-compatible — a link made before a new field existed still opens;
//     every missing value defaults rather than trusting the payload.
//   * Carries the resolved city, never the six-digit pincode, the age is coarse
//     enough to be non-identifying, and the salary is never stored.
//
// The payload is a positional array (so keys never appear) serialised to JSON and
// base64url-encoded. Positional + defaulting is what buys forward-compatibility:
// appending a new slot never breaks an old token.

import { Answers, DebtEntry, defaultAnswers } from "./cost-model";

// Bump when the slot order changes in a non-appending way. Old versions still
// decode via defaults; this only guards against a genuine reshuffle.
const VERSION = 1;

type Packed = (string | number)[];

function packDebt(d: DebtEntry): [number, string, string] {
  return [d.on ? 1 : 0, digits(d.emi), digits(d.yrs)];
}

function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function b64urlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(input, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

export function encodeAnswers(a: Answers): string {
  const packed: Packed = [
    VERSION,
    digits(a.age),
    a.cityKey || "",
    a.roof,
    a.commute,
    a.foodBase,
    a.foodFun,
    a.bills,
    a.body,
    ...packDebt(a.d.edu),
    ...packDebt(a.d.vehicle),
    ...packDebt(a.d.card),
    ...packDebt(a.d.other),
    a.t.out ? 1 : 0,
    a.t.trip ? 1 : 0,
    a.t.save ? 1 : 0,
  ];
  return b64urlEncode(JSON.stringify(packed));
}

function readDebt(p: Packed, i: number, fallback: DebtEntry): DebtEntry {
  if (p[i] === undefined) return fallback;
  return {
    on: p[i] === 1 || p[i] === "1",
    emi: p[i + 1] !== undefined ? String(p[i + 1]) : fallback.emi,
    yrs: p[i + 2] !== undefined ? String(p[i + 2]) : fallback.yrs,
  };
}

function num(v: string | number | undefined, fallback: number): number {
  if (v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

/** Decode a token back to Answers, defaulting anything missing or malformed. */
export function decodeAnswers(token: string): Answers {
  const def = defaultAnswers();
  try {
    const p = JSON.parse(b64urlDecode(token)) as Packed;
    if (!Array.isArray(p)) return def;
    return {
      age: p[1] !== undefined ? String(p[1]) : def.age,
      cityKey: p[2] !== undefined && p[2] !== "" ? String(p[2]) : "",
      roof: num(p[3], def.roof),
      commute: num(p[4], def.commute),
      foodBase: num(p[5], def.foodBase),
      foodFun: num(p[6], def.foodFun),
      bills: num(p[7], def.bills),
      body: num(p[8], def.body),
      d: {
        edu: readDebt(p, 9, def.d.edu),
        vehicle: readDebt(p, 12, def.d.vehicle),
        card: readDebt(p, 15, def.d.card),
        other: readDebt(p, 18, def.d.other),
      },
      t: {
        out: p[21] !== undefined ? p[21] === 1 || p[21] === "1" : def.t.out,
        trip: p[22] !== undefined ? p[22] === 1 || p[22] === "1" : def.t.trip,
        save: p[23] !== undefined ? p[23] === 1 || p[23] === "1" : def.t.save,
      },
    };
  } catch {
    return def;
  }
}
