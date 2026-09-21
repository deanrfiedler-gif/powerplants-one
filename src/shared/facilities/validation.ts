import {
  fields,
  applicable,
  type Details,
  type Patch,
  type SourceInput,
} from "./definition";
import { invalid, object, uuid, dateOnly } from "../validation";

// Dedicated normalisation: legacy shared optionalText and command hashes stay unchanged.
export function text(
  value: unknown,
  key: string,
  max: number,
  multiline = false,
): string | null {
  if (value === null || (typeof value === "string" && !value.trim()))
    return null;
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (multiline
      ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
      : /[\u0000-\u001f\u007f]/
    ).test(value)
  )
    invalid(
      key,
      `Use at most ${max} characters${multiline ? "; line breaks are allowed" : " on one line"}.`,
    );
  return (value as string).trim();
}
export function decimal(
  value: unknown,
  key: string,
  scale: number,
  min: number,
  max: number,
): string {
  if (
    typeof value !== "string" ||
    !new RegExp(`^-?\\d+(?:\\.\\d{1,${scale}})?$`).test(value) ||
    !Number.isFinite(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    invalid(
      key,
      `Enter a base-10 number from ${min} to ${max}, with at most ${scale} decimal places.`,
    );
  // Remove insignificant zeros without binary floating-point rounding.
  const negative = (value as string).startsWith("-");
  const [whole, fraction = ""] = (value as string).replace(/^-/, "").split(".");
  const result = `${whole.replace(/^0+(?=\d)/, "")}${fraction.replace(/0+$/, "") ? `.${fraction.replace(/0+$/, "")}` : ""}`;
  return negative && Number(result) !== 0 ? `-${result}` : result;
}
export function siteToday(timezone: string, now = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    return ["year", "month", "day"]
      .map((k) => parts.find((p) => p.type === k)!.value)
      .join("-");
  } catch {
    invalid(
      "site_id",
      "The Site time zone is unavailable; review Site context before recording a date.",
    );
  }
}
export function observed(
  value: unknown,
  key: string,
  today: string,
): string | null {
  if (value === null || value === "") return null;
  const d = dateOnly(value, key);
  if (d > today)
    invalid(key, "The date cannot be in the future in the Site time zone.");
  return d;
}
export function sourceInput(value: unknown, key: string): SourceInput | null {
  if (value === null) return null;
  const raw = object(value, [
    "kind",
    "title",
    "note",
    "source_date",
    "id",
    "version",
  ]);
  if (raw.kind === "existing_source") {
    object(value, ["kind", "id", "version"]);
    if (raw.version !== 1) invalid(key, "Choose an exact source version (1).");
    return { kind: "existing_source", id: uuid(raw.id, key), version: 1 };
  }
  object(value, ["kind", "title", "note", "source_date"]);
  if (raw.kind !== "reported_note")
    invalid(key, "Choose a reported note or an existing supported source.");
  const title = text(raw.title, key, 200);
  if (!title) invalid(key, "A source title is required.");
  return {
    kind: "reported_note",
    title,
    note: raw.note === undefined ? null : text(raw.note, key, 2000, true),
    source_date:
      raw.source_date === undefined ||
      raw.source_date === null ||
      raw.source_date === ""
        ? null
        : dateOnly(raw.source_date, key),
  };
}
export function parsePatch(value: unknown, create = false): Patch {
  const raw = object(value, Object.keys(fields));
  const result: Patch = {};
  if (!Object.hasOwn(raw, "structure_type"))
    invalid("structure_type", "Choose a structure type explicitly.");
  if (create && !Object.hasOwn(raw, "name")) invalid("name", "Enter a name.");
  for (const [key, v] of Object.entries(raw)) {
    const f = fields[key];
    if (v === null || v === "" || (typeof v === "string" && !v.trim())) {
      result[key] = null;
      continue;
    }
    if (f.kind === "source") result[key] = sourceInput(v, key);
    else if (f.kind === "id") result[key] = uuid(v, key);
    else if (f.kind === "date") result[key] = dateOnly(v, key);
    else if (f.kind === "choice") {
      if (typeof v !== "string" || !Object.hasOwn(f.options!, v))
        invalid(key, "Choose a listed value.");
      result[key] = v as string;
    } else if (f.kind === "decimal") {
      result[key] = decimal(v, key, f.scale!, 0, f.max!);
      if (Number(result[key]) <= 0)
        invalid(
          key,
          "The measurement must be greater than zero; leave unknown values blank.",
        );
    } else if (f.kind === "integer") {
      if (
        typeof v !== "number" ||
        !Number.isSafeInteger(v) ||
        v < 1 ||
        v > f.max!
      )
        invalid(key, `Enter a whole number from 1 to ${f.max}.`);
      result[key] = v as number;
    } else result[key] = text(v, key, f.max!, f.kind === "note");
  }
  for (const k of [
    "structure_type",
    ...(create || Object.hasOwn(raw, "name") ? ["name"] : []),
  ])
    if (!result[k]) invalid(k, "This field is required.");
  return result;
}
export function mergeDetails(before: Details, patch: Patch, today: string) {
  const next = { ...before, ...patch } as Details;
  const clearing: string[] = [];
  for (const k of Object.keys(fields)) {
    next[k] ??= null;
    if (!applicable(k, next)) {
      if (patch[k] !== undefined && patch[k] !== null)
        invalid(
          k,
          "This field does not apply to the proposed structure, use or parent.",
        );
      if (before[k] !== null && before[k] !== undefined) clearing.push(k);
      next[k] = null;
    }
  }
  for (const [key, f] of Object.entries(fields)) {
    if (
      ((f.otherOf && applicable(key, next)) ||
        (key === "type_unknown_reason" && next.structure_type === "unknown")) &&
      !next[key]
    )
      invalid(key, "Describe this selection.");
    if (f.kind === "date" && next[key] && patch[key] !== undefined)
      observed(next[key], key, today);
  }
  if (next.parent_facility_id && !next.parent_relationship)
    invalid(
      "parent_relationship",
      "Choose how this area relates to its parent.",
    );
  const contextKeys = [
    "use",
    "crop",
    "season_label",
    "context_observed_on",
    "context_source",
  ];
  const contextChanged = contextKeys.some(
    (k) =>
      JSON.stringify(before[k] ?? null) !== JSON.stringify(next[k] ?? null),
  );
  if (contextChanged && !next.context_observed_on)
    invalid(
      "context_observed_on",
      "Record the observation date when changing growing context.",
    );
  return { next, clearing, contextChanged };
}
