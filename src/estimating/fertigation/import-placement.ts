import { createHash } from "node:crypto";
import { AppError } from "../../platform/errors";
import { invalid } from "../../shared/validation";
import type { ImportPreview } from "./interchange";
import type { Evidence, Scope } from "./types";

/**
 * Explicit placement of held legacy fields on import (ADR-0044).
 *
 * A held standalone r02 preview can be confirmed only when every held path
 * has exactly one placement. Kept values are appended verbatim, labelled as
 * unverified r02 source values, to the notes of the native record their legacy
 * record mapped to, or to generated evidence references for project-level
 * values. Nothing is promoted to a native technical value and nothing is
 * dropped without an explicit, allowed disposition.
 */

import {
  bindingPaths,
  placeableSchemas,
  type Placement,
} from "./import-placement-rules";
export * from "./import-placement-rules";

export function parsePlacements(value: unknown): Placement[] {
  if (!Array.isArray(value) || value.length > 5000)
    return invalid("placements", "Provide at most 5,000 placements.");
  return value.map((item, i) => {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      Object.keys(item).sort().join() !== "disposition,path"
    )
      return invalid(
        `placements[${i}]`,
        "Each placement needs a path and a disposition.",
      );
    const { path, disposition } = item as Record<string, unknown>;
    if (typeof path !== "string" || !path || path.length > 400)
      return invalid(
        `placements[${i}].path`,
        "Use the held path exactly as previewed.",
      );
    if (
      disposition !== "keep_as_note" &&
      disposition !== "covered_by_discovery_binding"
    )
      return invalid(
        `placements[${i}].disposition`,
        "Use keep_as_note or covered_by_discovery_binding.",
      );
    return { path, disposition };
  });
}

const LINE_VALUE_LIMIT = 600;
const NOTE_LIMIT = 4000;

function valueText(value: unknown, sourceHash: string): string {
  const text =
    value === undefined
      ? "(value retained in the original file)"
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return text.length > LINE_VALUE_LIMIT
    ? `${text.slice(0, LINE_VALUE_LIMIT)}… (shortened; the full value is in the original file, SHA-256 ${sourceHash})`
    : text;
}

/** Deterministic identity for generated evidence, in the importer's UUID form. */
function derivedId(sourceHash: string, previewHash: string, index: number) {
  const hex = createHash("sha256")
    .update(`${sourceHash}\n${previewHash}\nplacement-evidence\n${index}`)
    .digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

type NotedRecord = { id: string; label: string; notes: string };

function findRecord(scope: Scope, id: string): NotedRecord | null {
  for (const value of Object.values(scope))
    if (Array.isArray(value))
      for (const row of value as unknown[])
        if (
          row &&
          typeof row === "object" &&
          (row as { id?: unknown }).id === id &&
          typeof (row as { notes?: unknown }).notes === "string"
        )
          return row as NotedRecord;
  return null;
}

const legacyCollections = new Set([
  "blocks",
  "cohorts",
  "mainlines",
  "valves",
  "sources",
  "water_samples",
  "pipes",
  "filters",
  "recipes",
  "stocks",
  "controllers",
  "io",
  "sensors",
  "strategies",
  "groups",
  "scenarios",
  "profiles",
  "evidence",
  "responsibilities",
  "commissioning",
  "issues",
]);

/** Legacy identity and field for a held path, or null for scope-level paths. */
function legacyTarget(
  path: string,
  identityMap: Record<string, string>,
): { legacyId: string; field: string } | null {
  const parts = path.split(".");
  if (legacyCollections.has(parts[0]) && parts.length >= 3)
    return { legacyId: parts[1], field: parts.slice(2).join(".") };
  if (parts.length >= 2 && Object.hasOwn(identityMap, parts[0]))
    return { legacyId: parts[0], field: parts.slice(1).join(".") };
  return null;
}

export function placeHeldImport(
  preview: ImportPreview,
  placements: Placement[],
): { scope: Scope; placements: Placement[] } {
  if (!placeableSchemas.includes(preview.source_schema))
    throw new AppError(
      422,
      "HeldFertigationImport",
      "Only standalone r02 files can place held fields. Reattach the original attachment bytes for a native export.",
    );
  const held = new Map(preview.losses.map((l) => [l.path, l]));
  const seen = new Set<string>();
  for (const p of placements) {
    if (!held.has(p.path))
      invalid("placements", `${p.path} is not a held field of this preview.`);
    if (seen.has(p.path)) invalid("placements", `${p.path} is placed twice.`);
    seen.add(p.path);
    if (
      p.disposition === "covered_by_discovery_binding" &&
      !(bindingPaths as readonly string[]).includes(p.path)
    )
      invalid(
        "placements",
        `${p.path} cannot be treated as covered by the Discovery binding; keep it as a note.`,
      );
  }
  const missing = [...held.keys()].filter((path) => !seen.has(path));
  if (missing.length)
    throw new AppError(
      422,
      "HeldFertigationImport",
      `Place every held field before creating a native revision; ${missing.length} remain.`,
    );

  const scope = structuredClone(preview.scope);
  const byRecord = new Map<string, string[]>();
  const loose: string[] = [];
  const kept = placements
    .filter((p) => p.disposition === "keep_as_note")
    .sort((a, b) => a.path.localeCompare(b.path));
  for (const p of kept) {
    const loss = held.get(p.path)!;
    const target = legacyTarget(p.path, preview.identity_map);
    const line = `Legacy r02 ${target ? target.field : p.path}: ${valueText(loss.value, preview.source_hash)} (unverified source value)`;
    const nativeId = target ? preview.identity_map[target.legacyId] : null;
    if (p.path.startsWith("hydraulics.")) {
      const field = p.path.slice("hydraulics.".length);
      byRecord.set("hydraulics", [
        ...(byRecord.get("hydraulics") ?? []),
        `Legacy r02 ${field}: ${valueText(loss.value, preview.source_hash)} (unverified source value)`,
      ]);
    } else if (nativeId && findRecord(scope, nativeId))
      byRecord.set(nativeId, [...(byRecord.get(nativeId) ?? []), line]);
    else loose.push(line);
  }

  const append = (current: string, lines: string[], label: string) => {
    let notes = current;
    for (const line of lines) {
      const next = notes ? `${notes}\n${line}` : line;
      if (next.length <= NOTE_LIMIT) notes = next;
      else loose.push(`${label}: ${line}`);
    }
    return notes;
  };
  for (const [id, lines] of byRecord) {
    if (id === "hydraulics")
      scope.hydraulics.notes = append(
        scope.hydraulics.notes,
        lines,
        "Pump and hydraulics",
      );
    else {
      const record = findRecord(scope, id)!;
      record.notes = append(record.notes, lines, record.label || "Record");
    }
  }

  // Remaining lines go to generated evidence references, each within the
  // native note limit.
  const chunks: string[][] = [];
  for (const line of loose) {
    const last = chunks.at(-1);
    const bounded = line.length > NOTE_LIMIT ? line.slice(0, NOTE_LIMIT) : line;
    if (last && [...last, bounded].join("\n").length <= NOTE_LIMIT)
      last.push(bounded);
    else chunks.push([bounded]);
  }
  const evidence: Evidence[] = chunks.map((lines, i) => ({
    id: derivedId(preview.source_hash, preview.preview_hash, i),
    label:
      chunks.length > 1
        ? `Legacy r02 source values (unverified) · part ${i + 1} of ${chunks.length}`
        : "Legacy r02 source values (unverified)",
    kind: "assumption",
    reference: "",
    source_revision: "Imported r02 file",
    sha256: preview.source_hash,
    captured_date: null,
    attribution: "Imported standalone r02 file",
    applicability:
      "Values placed on import under ADR-0044; not native technical values",
    notes: lines.join("\n"),
  }));
  scope.evidence = [...scope.evidence, ...evidence];
  return {
    scope,
    placements: [...placements].sort((a, b) => a.path.localeCompare(b.path)),
  };
}
