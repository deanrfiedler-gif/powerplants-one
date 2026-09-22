import { AppError } from "../../platform/errors";
import { uuid } from "../../shared/validation";
import {
  blankScope,
  blankArea,
  blankCropGroup,
  blankMaster,
  blankSource,
  blankValve,
} from "./definition";
import { PORTABLE_BYTES } from "./portable-limits";
import type { Scope, Valve, Allocation } from "./types";

export const valveCsvHeaders = [
  "format",
  "valve_id",
  "label",
  "phase",
  "intent",
  "master_id",
  "source_id",
  "flow_basis",
  "measured_flow_m3h",
  "design_flow_m3h",
  "allocation_id",
  "area_id",
  "crop_group_id",
  "container_count",
  "served_area_m2",
  "flow_share_fraction",
  "projection_limits",
] as const;
const fail = (message: string): never => {
  throw new AppError(422, "InvalidFertigationImport", message);
};

/** Bounded RFC-4180-style cells: quotes are structural, never best-effort repaired. */
export function parseValveCsv(text: string): string[][] {
  if (Buffer.byteLength(text, "utf8") > PORTABLE_BYTES || text.includes("\0"))
    fail(
      "CSV exceeds the bounded portable contract or contains a NUL character.",
    );
  const input = text.replace(/^\uFEFF/, ""),
    rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    mode: "start" | "plain" | "quoted" | "closed" = "start";
  const finishCell = () => {
    if (cell.length > 20000) fail("CSV cell exceeds 20,000 characters.");
    row.push(cell);
    if (row.length > 30) fail("CSV has too many columns.");
    cell = "";
    mode = "start";
  };
  const finishRow = () => {
    finishCell();
    rows.push(row);
    row = [];
    if (rows.length > 5001) fail("CSV supports at most 5,000 allocation rows.");
  };
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (mode === "quoted") {
      if (c === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else mode = "closed";
      } else cell += c;
      continue;
    }
    if (c === ",") {
      finishCell();
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      finishRow();
      continue;
    }
    if (mode === "closed")
      fail("Unexpected characters after a closing CSV quote.");
    if (c === '"') {
      if (mode !== "start") fail("Unexpected quote in an unquoted CSV cell.");
      mode = "quoted";
    } else {
      cell += c;
      mode = "plain";
    }
  }
  if (mode === "quoted") fail("Unclosed CSV quote.");
  if (cell || row.length || mode === "closed") finishRow();
  return rows;
}

/** Import the declared native valve-register projection as a new incomplete draft.
 * Missing related register details remain explicit identity-only placeholders, never canonical facts. */
export function mapValveCsv(
  text: string,
  allocate: (original: string) => string,
): { scope: Scope; warnings: string[] } {
  const rows = parseValveCsv(text),
    header = rows.shift() ?? fail("CSV headers are missing.");
  if (
    new Set(header).size !== header.length ||
    header.length !== valveCsvHeaders.length ||
    valveCsvHeaders.some((k) => !header.includes(k))
  )
    fail(
      "Use the exact PPO-FERT-VALVES-r01 export headers; unknown, duplicate or omitted columns are not accepted.",
    );
  if (!rows.length) fail("The valve CSV needs at least one data row.");
  const scope = blankScope(),
    kinds = new Map<string, string>(),
    valves = new Map<
      string,
      { value: Valve; input: string; hasAllocation: boolean }
    >(),
    allocationIds = new Set<string>();
  const warnings = [
    "This is a valve-register projection, not full-project interchange. Emitter details, controls, evidence and omitted related-register facts remain unknown; no synthetic or operational provenance is inferred.",
    "Related IDs are remapped to explicitly incomplete scope-owned placeholders. They do not map canonical Organisation, Site, Facility or Asset records; select the authorised Discovery source separately.",
  ];
  const identity = (original: string, kind: string): string | null => {
    if (!original) return null;
    uuid(original, `csv.${kind}_id`);
    const previous = kinds.get(original);
    if (previous && previous !== kind)
      fail("A CSV identity is used by different record types.");
    kinds.set(original, kind);
    return allocate(original);
  };
  const related = (
    original: string,
    kind: "master" | "source" | "area" | "crop",
  ): string | null => {
    const id = identity(original, kind);
    if (!id) return null;
    const note =
      "Imported identity-only relationship from a valve CSV. Confirm the missing register facts and phase before using dependent calculations.";
    if (kind === "master" && !scope.masters.some((r) => r.id === id))
      scope.masters.push({
        ...blankMaster(id),
        label: `Imported master ${original}`,
        notes: note,
      });
    if (kind === "source" && !scope.sources.some((r) => r.id === id))
      scope.sources.push({
        ...blankSource(id),
        label: `Imported source ${original}`,
        notes: note,
      });
    if (kind === "area" && !scope.areas.some((r) => r.id === id))
      scope.areas.push({
        ...blankArea(id),
        label: `Imported area ${original}`,
        notes: note,
      });
    if (kind === "crop" && !scope.crop_groups.some((r) => r.id === id))
      scope.crop_groups.push({
        ...blankCropGroup(id),
        label: `Imported crop group ${original}`,
        notes: note,
      });
    return id;
  };
  const number = (value: string, field: string): number | null => {
    if (value === "") return null;
    if (
      !/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) ||
      !Number.isFinite(Number(value))
    )
      fail(
        `${field}: use a finite non-negative CSV number or an empty unknown cell.`,
      );
    return Number(value);
  };
  for (const [index, cells] of rows.entries()) {
    if (cells.length !== header.length)
      fail(`CSV row ${index + 2} has a different column count.`);
    const r = Object.fromEntries(header.map((h, i) => [h, cells[i]]));
    if (r.format !== "PPO-FERT-VALVES-r01")
      fail("Unsupported native valve CSV format.");
    const id =
      identity(r.valve_id, "valve") ??
      fail("Every CSV valve needs its stable UUID.");
    if (!r.label.trim()) fail("Every CSV valve needs its label.");
    if (
      !["unknown", "existing", "proposed", "future", "excluded"].includes(
        r.phase,
      ) ||
      !["unknown", "retain", "replace", "new", "inspect"].includes(r.intent) ||
      ![
        "unknown",
        "emitter_inventory",
        "measured",
        "design_allowance",
      ].includes(r.flow_basis)
    )
      fail("CSV phase, intent or flow basis is invalid.");
    const valveFields = [
        "valve_id",
        "label",
        "phase",
        "intent",
        "master_id",
        "source_id",
        "flow_basis",
        "measured_flow_m3h",
        "design_flow_m3h",
        "projection_limits",
      ],
      fingerprint = JSON.stringify(valveFields.map((k) => r[k]));
    const previous = valves.get(r.valve_id);
    if (previous && previous.input !== fingerprint)
      fail(
        "Repeated valve rows disagree about the same physical valve; resolve the conflict before import.",
      );
    const valve = previous?.value ?? {
      ...blankValve(id),
      label: r.label,
      phase: r.phase as Valve["phase"],
      intent: r.intent as Valve["intent"],
      master_id: related(r.master_id, "master"),
      source_id: related(r.source_id, "source"),
      flow_basis: r.flow_basis as Valve["flow_basis"],
      measured_flow_m3h: number(r.measured_flow_m3h, "measured_flow_m3h"),
      design_flow_m3h: number(r.design_flow_m3h, "design_flow_m3h"),
      notes: `Imported CSV projection declaration (unverified source text): ${r.projection_limits}`,
    };
    if (previous && !previous.hasAllocation)
      fail(
        "A valve row without allocations cannot be repeated with service allocations.",
      );
    if (!previous) {
      valves.set(r.valve_id, {
        value: valve,
        input: fingerprint,
        hasAllocation: !!r.allocation_id,
      });
      scope.valves.push(valve);
    }
    if (!r.allocation_id) {
      if (
        previous ||
        [
          "area_id",
          "crop_group_id",
          "container_count",
          "served_area_m2",
          "flow_share_fraction",
        ].some((k) => r[k] !== "")
      )
        fail(
          "An empty allocation cannot be duplicated or contain service quantities/references.",
        );
      continue;
    }
    const allocationId = identity(r.allocation_id, "allocation")!;
    if (allocationIds.has(allocationId))
      fail("Duplicate CSV allocation identity.");
    allocationIds.add(allocationId);
    const allocation: Allocation = {
      id: allocationId,
      area_id: related(r.area_id, "area"),
      crop_group_id: related(r.crop_group_id, "crop"),
      container_count: number(r.container_count, "container_count"),
      served_area_m2: number(r.served_area_m2, "served_area_m2"),
      flow_share_fraction: number(r.flow_share_fraction, "flow_share_fraction"),
    };
    valve.allocations.push(allocation);
  }
  if (scope.valves.some((v) => v.flow_basis === "emitter_inventory"))
    warnings.push(
      "Emitter-inventory valves lack emitter details in this CSV projection. Their flow remains unknown until those details are explicitly captured.",
    );
  return { scope, warnings };
}
