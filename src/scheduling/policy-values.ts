// Pure JSON contract primitives. No clock, database reads or authority decisions.
import { createHash } from "node:crypto";
import { canonical } from "../platform/operations";
import {
  instant,
  invalid,
  narrative,
  uuid,
  version,
} from "../shared/validation";

export type Reader<T> = (value: unknown) => T;
export type Frozen<T> = T extends object
  ? { readonly [K in keyof T]: Frozen<T[K]> }
  : T;
export function freeze<T>(value: T): Frozen<T> {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value as Frozen<T>;
}
export function record<S extends Record<string, Reader<unknown>>>(shape: S) {
  return (value: unknown): { [K in keyof S]: ReturnType<S[K]> } => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))
    )
      invalid("payload", "An exact JSON object is required.");
    const entries = Object.getOwnPropertyDescriptors(value);
    if (
      Reflect.ownKeys(value).length !== Object.keys(shape).length ||
      Object.keys(shape).some(
        (key) => !entries[key] || !("value" in entries[key]),
      )
    )
      invalid(
        "payload",
        "Every contract field is required; unknown fields are refused.",
      );
    return Object.fromEntries(
      Object.entries(shape).map(([key, read]) => [
        key,
        read(entries[key].value),
      ]),
    ) as { [K in keyof S]: ReturnType<S[K]> };
  };
}
export const literal =
  <T extends string | number | boolean | null>(expected: T): Reader<T> =>
  (v) => {
    if (v !== expected) invalid("payload", `Expected ${expected}.`);
    return expected;
  };
export const nullable =
  <T>(read: Reader<T>): Reader<T | null> =>
  (v) =>
    v === null ? null : read(v);
export const id: Reader<string> = (v) => uuid(v, "id");
export const positive: Reader<number> = (v) => {
  const n = version(v);
  if (n > 2147483647)
    invalid("version", "Version exceeds the stored integer range.");
  return n;
};
export const utc: Reader<string> = (v) => instant(v, "instant");
export const textValue: Reader<string> = (v) => narrative(v, "text", 10000);
export const booleanValue: Reader<boolean> = (v) => {
  if (typeof v !== "boolean")
    invalid("payload", "An explicit boolean is required.");
  return v;
};
export const hashValue: Reader<string> = (v) => {
  if (typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v))
    invalid("hash", "An exact SHA-256 digest is required.");
  return v;
};
export const minutes: Reader<number> = (v) => {
  if (!Number.isSafeInteger(v) || Number(v) < 0 || Number(v) > 1440)
    invalid("minutes", "Use whole minutes from 0 to 1440.");
  return Number(v);
};
export const duration: Reader<number> = (v) => {
  const n = minutes(v);
  if (!n) invalid("max_visit_minutes", "Visit duration must be positive.");
  return n;
};
export const enumeration =
  <T extends string>(options: readonly T[]): Reader<T> =>
  (v) => {
    if (typeof v !== "string" || !options.includes(v as T))
      invalid("payload", "Unsupported contract value.");
    return v as T;
  };
// Arrays here are sets: normalize before hashing, refuse duplicates rather than deduplicating.
export const ordered =
  <T>(read: Reader<T>, key: (v: T) => string, max = 10000): Reader<T[]> =>
  (v) => {
    if (
      !Array.isArray(v) ||
      v.length > max ||
      Object.keys(v).length !== v.length ||
      Object.keys(v).some((key, index) => key !== String(index)) ||
      Reflect.ownKeys(v).length !== v.length + 1
    )
      invalid("population", "A complete bounded JSON array is required.");
    const rows = v
      .map(read)
      .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
    if (new Set(rows.map(key)).size !== rows.length)
      invalid("population", "Duplicate identities are refused.");
    return rows;
  };
export const reference = record({
  id,
  version: positive,
  content_hash: hashValue,
});
export type Reference = Frozen<ReturnType<typeof reference>>;
export const digest = (value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
export function equal(actual: unknown, expected: unknown, field = "binding") {
  if (canonical(actual) !== canonical(expected))
    invalid(field, "The exact content or binding does not match.");
}
export function span(start: string, end: string) {
  if (end <= start) invalid("interval", "Finish must follow start.");
}
