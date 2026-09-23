import { AppError } from "../../platform/errors";
import { families } from "./definition";
import { legacyContract } from "./legacy-contract";

type Row = Record<string, unknown>;
const fail = (path: string, message: string): never => {
  throw new AppError(422, "InvalidFertigationImport", `${path}: ${message}`);
};
const object = (value: unknown, path: string): Row =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : fail(path, "expected an object.");
const text = (value: unknown, path: string) =>
  typeof value === "string" && value.length <= 20000
    ? value
    : fail(path, "expected bounded legacy text.");
const id = (value: unknown, path: string) =>
  typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value)
    ? value
    : fail(path, "invalid legacy identity.");
const date = (value: string, path: string) => {
  if (
    value &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value)
  )
    fail(path, "invalid date.");
};
const integer = (value: unknown, path: string, minimum = 0) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= minimum
    ? value
    : fail(path, "expected a whole number.");
const list = (value: unknown, path: string, limit = 5000): unknown[] =>
  Array.isArray(value) && value.length <= limit
    ? value
    : fail(path, `expected at most ${limit} records.`);

/** Strict issued-field contract. A schema-1 upgrade adds only r02's declared defaults.
 * It does not invent a new historical revision/date or native review signature. */
export function validateLegacyProject(value: unknown, depth = 0): Row {
  const input = object(value, "legacy"),
    source = structuredClone(input);
  if (source.schema_version !== 1 && source.schema_version !== 2)
    fail("schema_version", "use standalone schema 1 or 2.");
  const top = [
    "schema_version",
    "app_version",
    "project_id",
    "revision",
    "updated_at",
    "synthetic",
    "selected_scenario_id",
    "selected_profile_id",
    "curve_points",
    "system_curve_points",
    "snapshots",
    "activity",
    "review_history",
    "review",
    ...Object.keys(legacyContract),
  ];
  // r02's own "Download project" (exportProject) adds these two file-level
  // keys to every portable file. They describe the export, not the project.
  const exportMetadata = ["exported_at", "export_scope"];
  if (
    top.some((key) => !Object.hasOwn(source, key)) ||
    Object.keys(source).some(
      (key) => !top.includes(key) && !exportMetadata.includes(key),
    )
  )
    fail("legacy", "use the complete declared portable project fields.");
  for (const key of exportMetadata)
    if (Object.hasOwn(source, key)) text(source[key], key);
  id(source.project_id, "project_id");
  integer(source.revision, "revision", 1);
  text(source.app_version, "app_version");
  text(source.updated_at, "updated_at");
  if (typeof source.synthetic !== "boolean")
    fail("synthetic", "synthetic provenance must be explicit.");
  const records = new Map<string, Row[]>(),
    seen = new Set<string>();
  for (const [kind, contract] of Object.entries(legacyContract)) {
    const rows = (
      contract.singleton ? [source[kind]] : list(source[kind], kind)
    ).map((value, index) => {
      const row = object(value, `${kind}[${index}]`),
        path = `${kind}[${index}]`;
      const allowed = [
        ...Object.keys(contract.fields),
        ...(contract.singleton ? [] : ["id"]),
        ...(kind === "evidence" ? ["attachment"] : []),
      ];
      if (Object.keys(row).some((key) => !allowed.includes(key)))
        fail(path, "unsupported legacy record field.");
      if (!contract.singleton) {
        const key = id(row.id, `${path}.id`);
        if (seen.has(key)) fail(path, "duplicate legacy identity.");
        seen.add(key);
      }
      for (const [key, field] of Object.entries(contract.fields)) {
        if (
          !Object.hasOwn(row, key) &&
          source.schema_version === 1 &&
          field.added_in_schema_2
        )
          row[key] =
            field.type === "number"
              ? null
              : ["multi", "allocations"].includes(field.type)
                ? []
                : "";
        if (!Object.hasOwn(row, key))
          fail(`${path}.${key}`, "required issued legacy field is missing.");
        const v = row[key],
          f = `${path}.${key}`;
        if (field.type === "number") {
          if (
            v !== null &&
            (typeof v !== "number" ||
              !Number.isFinite(v) ||
              Math.abs(v) > 1e12 ||
              (!field.signed && v < 0) ||
              (field.integer && !Number.isSafeInteger(v)) ||
              (field.max !== undefined && v > field.max))
          )
            fail(f, "invalid legacy number.");
        } else if (field.type === "multi") {
          const values = list(v, f);
          if (
            values.some((x) => typeof x !== "string") ||
            new Set(values).size !== values.length
          )
            fail(f, "invalid or duplicate memberships.");
        } else if (field.type === "allocations") {
          const allocations = list(v, f);
          const cropIds = new Set<string>();
          for (const allocation of allocations) {
            const a = object(allocation, f);
            if (
              Object.keys(a).sort().join() !==
              ["cohort_id", "containers"].sort().join()
            )
              fail(f, "unsupported allocation fields.");
            const crop = id(a.cohort_id, f);
            if (cropIds.has(crop)) fail(f, "duplicate crop allocation.");
            cropIds.add(crop);
            integer(a.containers, `${f}.containers`);
          }
        } else {
          const s = text(v, f);
          if (field.type === "select" && s && !field.options?.includes(s))
            fail(f, "unsupported legacy option.");
          if (field.type === "date") date(s, f);
          if (
            field.type === "time" &&
            s &&
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(s)
          )
            fail(f, "invalid 24-hour time.");
        }
      }
      return row;
    });
    records.set(kind, rows);
  }
  for (const [kind, contract] of Object.entries(legacyContract))
    for (const row of records.get(kind)!) {
      for (const [key, field] of Object.entries(contract.fields))
        if (field.collection) {
          const values =
            field.type === "multi"
              ? (row[key] as string[])
              : row[key]
                ? [row[key]]
                : [];
          if (
            values.some(
              (value) =>
                !records.get(field.collection!)?.some((r) => r.id === value),
            )
          )
            fail(`${kind}.${key}`, "broken legacy relationship.");
        }
      if (kind === "valves")
        for (const allocation of row.allocations as Row[])
          if (
            !records.get("cohorts")!.some((c) => c.id === allocation.cohort_id)
          )
            fail("valves.allocations", "broken legacy crop relationship.");
      if (kind === "evidence" && row.attachment !== undefined) {
        const a = object(row.attachment, "attachment");
        if (
          Object.keys(a).some(
            (k) => !["name", "type", "size", "data"].includes(k),
          )
        )
          fail("attachment", "unsupported metadata.");
        text(a.name, "attachment.name");
        if (
          typeof a.data !== "string" ||
          !/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,[A-Za-z0-9+/]*={0,2}$/.test(
            a.data,
          )
        )
          fail("attachment.data", "unsupported original attachment.");
        const encoded = (a.data as string).split(",")[1];
        if (encoded.length % 4) fail("attachment.data", "malformed base64.");
        const bytes = Buffer.from(encoded, "base64");
        if (
          bytes.toString("base64") !== encoded ||
          bytes.length > 4 * 1024 * 1024 ||
          (a.size !== undefined && a.size !== bytes.length)
        )
          fail("attachment", "invalid decoded size or bytes.");
      }
    }
  if (
    records.get("profiles")!.length !== 5 ||
    families.some((f) => !records.get("profiles")!.some((p) => p.name === f))
  )
    fail("profiles", "retain all five named families.");
  if (
    records.get("scenarios")!.length < 1 ||
    records.get("scenarios")!.length > 20
  )
    fail("scenarios", "use one to twenty legacy scenarios.");
  for (const [key, kind] of [
    ["selected_scenario_id", "scenarios"],
    ["selected_profile_id", "profiles"],
  ])
    if (
      source[key] !== null &&
      (typeof source[key] !== "string" ||
        !records.get(kind)!.some((r) => r.id === source[key]))
    )
      fail(key, "invalid selected record.");
  for (const key of ["curve_points", "system_curve_points"]) {
    let previous = -1;
    for (const value of list(source[key], key, 2000)) {
      const p = object(value, key);
      if (
        Object.keys(p).some(
          (k) => !["q", "h", "efficiency", "power"].includes(k),
        )
      )
        fail(key, "unsupported curve field.");
      for (const k of ["q", "h", "efficiency", "power"]) {
        const v = p[k];
        if (
          ["efficiency", "power"].includes(k) &&
          (v === undefined || v === null)
        )
          continue;
        if (
          typeof v !== "number" ||
          !Number.isFinite(v) ||
          v < 0 ||
          v > (k === "efficiency" ? 100 : 1e12)
        )
          fail(key, "invalid curve value.");
      }
      if ((p.q as number) <= previous)
        fail(key, "curve flows must ascend without duplicates.");
      previous = p.q as number;
    }
  }
  const review = (value: unknown, current: boolean) => {
    const r = object(value, "review");
    text(r.name, "review.name");
    text(r.note, "review.note");
    integer(r.revision, "review.revision", 1);
    if (current) {
      text(r.role, "review.role");
      text(r.date, "review.date");
      if (r.revision !== source.revision)
        fail(
          "review",
          "current local acknowledgement must match its source revision.",
        );
    }
  };
  if (source.review !== null) review(source.review, true);
  for (const r of list(source.review_history, "review_history"))
    review(r, false);
  for (const value of list(source.activity, "activity")) {
    const r = object(value, "activity");
    text(r.action, "activity.action");
    text(r.date, "activity.date");
    integer(r.revision, "activity.revision", 1);
  }
  const snapshots = list(source.snapshots, "snapshots", depth ? 0 : 5);
  for (const value of snapshots) {
    const sn = object(value, "snapshot");
    id(sn.id, "snapshot.id");
    text(sn.name, "snapshot.name");
    text(sn.date, "snapshot.date");
    integer(sn.revision, "snapshot.revision", 1);
    validateLegacyProject(sn.data, depth + 1);
  }
  return source;
}
