"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ErrorNotice } from "./business-ui";
import { denied, useCrmCommand } from "./crm-state";
import type { ImportPreview } from "../estimating/fertigation/interchange";
import { PORTABLE_BYTES } from "../estimating/fertigation/portable-limits";
import {
  bindingPaths,
  placeableSchemas,
  proposedPlacement,
  type PlacementDisposition,
} from "../estimating/fertigation/import-placement-rules";
import type { Scope } from "../estimating/fertigation/types";
function mappedLabel(scope: Scope, id: string) {
  for (const value of Object.values(scope)) {
    if (!Array.isArray(value)) continue;
    for (const row of value)
      if (
        row &&
        typeof row === "object" &&
        "id" in row &&
        row.id === id &&
        "label" in row &&
        typeof row.label === "string"
      )
        return row.label;
  }
  return "Project or nested record";
}
const familyNames: Record<string, string> = {
  project: "Project narrative",
  blocks: "Block geometry",
  cohorts: "Crop groups",
  mainlines: "Mainlines",
  valves: "Valves",
  groups: "Operating groups",
  scenarios: "Scenarios",
  hydraulics: "Pump and hydraulics",
  pipes: "Pipes",
  filters: "Filters",
  recipes: "Recipes",
  stocks: "Stock channels",
  controllers: "Controllers",
  io: "I/O banks",
  sensors: "Sensors",
  strategies: "Strategies",
  evidence: "Evidence",
  responsibilities: "Responsibilities",
  commissioning: "Commissioning",
  alarms: "Alarm register",
  history: "History and acknowledgements",
  system_curve_points: "System curve",
  source: "File",
};
/** Held fields grouped for placement; project identity stands alone because
 * only it may be left to the Discovery binding (ADR-0044). */
function heldFamily(path: string, identities: Record<string, string>) {
  if ((bindingPaths as readonly string[]).includes(path))
    return "Project identity";
  const head = path.split(".")[0];
  if (familyNames[head]) return familyNames[head];
  return Object.hasOwn(identities, head) ? "Controls and signals" : "Other";
}
const shortValue = (value: unknown) => {
  const text =
    value === undefined
      ? "retained in the file"
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
};
type Source = {
  name: string;
  estimating_workspace_id: string;
  option_id: string;
  revision_id: string;
  expected_workspace_version: number;
  coverage: {
    system_id: string | null;
    area_ids: string[];
    facility_ids: string[];
  };
};
type Preview = ImportPreview & { proposal_signature: string };
export function FertigationImport({
  source,
  disabled,
  onPendingChange,
  onImported,
}: {
  source: Source;
  disabled: boolean;
  onPendingChange?: (v: boolean) => void;
  onImported?: (scopeId: string) => void;
}) {
  const router = useRouter(),
    [raw, setRaw] = useState(""),
    [name, setName] = useState(""),
    [mappingPage, setMappingPage] = useState(0),
    [preview, setPreview] = useState<{
      value: Preview;
      sourceKey: string;
      raw: string;
      id: string;
    } | null>(null),
    [error, setError] = useState<unknown>(null),
    [reading, setReading] = useState(false),
    [placements, setPlacements] = useState<
      Record<string, PlacementDisposition>
    >({}),
    [reviewed, setReviewed] = useState(false);
  const generation = useRef(0),
    command = useCrmCommand(
      (receipt) =>
        onImported
          ? onImported(receipt.record_id)
          : router.push(`/estimating/fertigation/${receipt.record_id}`),
      "No import saved",
      onPendingChange,
    );
  const sourceKey = JSON.stringify(source),
    current =
      preview && preview.sourceKey === sourceKey && preview.raw === raw
        ? preview
        : null,
    busy = disabled || reading || command.busy || command.uncertain;
  const mappings = current
    ? Object.entries(current.value.identity_map).sort(([a], [b]) =>
        a.localeCompare(b),
      )
    : [];
  const placeable =
    !!current?.value.held &&
    placeableSchemas.includes(current.value.source_schema);
  const placementFor = (path: string) =>
    placements[path] ?? proposedPlacement(path);
  const families = new Map<string, ImportPreview["losses"]>();
  if (placeable)
    for (const loss of current!.value.losses) {
      const family = heldFamily(loss.path, current!.value.identity_map);
      families.set(family, [...(families.get(family) ?? []), loss]);
    }
  if (denied(error) || denied(command.error))
    return <ErrorNotice error={error ?? command.error} />;
  async function inspect() {
    const turn = ++generation.current;
    setReading(true);
    setError(null);
    setPreview(null);
    setMappingPage(0);
    setPlacements({});
    setReviewed(false);
    const id = crypto.randomUUID();
    try {
      const value = await api<Preview>(
        "estimating/fertigation/import-preview",
        { ...source, id, raw_json: raw },
      );
      if (turn === generation.current)
        setPreview({ value, sourceKey, raw, id });
    } catch (e) {
      if (turn === generation.current) setError(e);
    } finally {
      if (turn === generation.current) setReading(false);
    }
  }
  return (
    <section className="fn-section" aria-label="Import portable scope">
      <h2>Import a portable scope</h2>
      <p>
        Choose a native or standalone JSON file, or a native valve-register CSV.
        CSV contains a limited valve projection; full scope interchange uses
        JSON. Preview the identity mapping and any unsupported content before
        creating a separate native draft against the selected saved Discovery
        source.
      </p>
      <ErrorNotice error={error ?? command.error} />
      <label htmlFor="fn-import-file">Portable scope JSON or valve CSV</label>
      <input
        id="fn-import-file"
        type="file"
        accept="application/json,text/csv,.json,.csv"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          const turn = ++generation.current;
          setPreview(null);
          setMappingPage(0);
          setError(null);
          setRaw("");
          setName("");
          if (!file) return;
          if (file.size > PORTABLE_BYTES) {
            setError({
              message: "The portable file exceeds the 8 MiB import limit.",
            });
            return;
          }
          setReading(true);
          try {
            const text = await file.text();
            if (turn === generation.current) {
              setRaw(text);
              setName(file.name);
              command.dirty();
            }
          } catch {
            if (turn === generation.current)
              setError({ message: "The selected file could not be read." });
          } finally {
            if (turn === generation.current) setReading(false);
          }
        }}
      />
      <p>
        {name} · {command.status}
      </p>
      <button
        type="button"
        disabled={busy || !raw}
        onClick={() => void inspect()}
      >
        Preview import mapping
      </button>
      {current && (
        <>
          <p>
            {current.value.source_schema} · Original SHA-256{" "}
            <code style={{ overflowWrap: "anywhere" }}>
              {current.value.source_hash}
            </code>{" "}
            · {Object.keys(current.value.identity_map).length} remapped
            identities
          </p>
          <details>
            <summary>Review identity mapping ({mappings.length})</summary>
            <p>
              Original identities are shown beside the proposed native
              identities. Labels are imported text, not verified canonical
              records. Project and nested allocation identities may have no
              separate label. Only the displayed page is rendered.
            </p>
            <div className="fn-table-scroll">
              <table aria-label="Import identity mapping">
                <thead>
                  <tr>
                    <th>Imported record label</th>
                    <th>Original identity</th>
                    <th>New native identity</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings
                    .slice(mappingPage * 25, mappingPage * 25 + 25)
                    .map(([original, native]) => (
                      <tr key={original}>
                        <td>{mappedLabel(current.value.scope, native)}</td>
                        <td>
                          <code>{original}</code>
                        </td>
                        <td>
                          <code>{native}</code>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p>
              {mappings.length ? mappingPage * 25 + 1 : 0}–
              {Math.min(mappingPage * 25 + 25, mappings.length)} of{" "}
              {mappings.length} mappings
            </p>
            <div className="fn-actions">
              <button
                type="button"
                disabled={mappingPage === 0}
                onClick={() => setMappingPage((p) => p - 1)}
              >
                Previous mappings
              </button>
              <button
                type="button"
                disabled={(mappingPage + 1) * 25 >= mappings.length}
                onClick={() => setMappingPage((p) => p + 1)}
              >
                Next mappings
              </button>
            </div>
          </details>
          <ul>
            {current.value.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {current.value.held && (
            <p role="alert">
              Import held: supported mappings are incomplete. The original file
              has not been changed.
              {placeable && " Place each held field below to continue."}
            </p>
          )}
          {placeable ? (
            <section
              aria-labelledby="fn-placement-title"
              className="fn-placement"
            >
              <h3 id="fn-placement-title">
                Place {current.value.losses.length} held legacy fields
              </h3>
              <p>
                Kept values are added to the notes of the record they describe,
                or to a generated evidence reference, as unverified r02 source
                values. Nothing becomes a native technical value, and the
                placements are retained with the import.
              </p>
              <div className="fn-table-scroll">
                <table aria-label="Held legacy fields">
                  <thead>
                    <tr>
                      <th scope="col">Legacy data</th>
                      <th scope="col">From the file</th>
                      <th scope="col">Placement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...families.entries()].map(([family, losses]) => {
                      const bindingOnly = losses.every((l) =>
                        (bindingPaths as readonly string[]).includes(l.path),
                      );
                      const value = placementFor(losses[0].path);
                      return (
                        <tr key={family}>
                          <th scope="row">
                            {family}
                            <small>
                              {losses.length}{" "}
                              {losses.length === 1 ? "field" : "fields"}
                            </small>
                          </th>
                          <td>
                            {losses.slice(0, 3).map((l) => (
                              <small key={l.path}>
                                {l.path.split(".").at(-1)}:{" "}
                                {shortValue(l.value)}
                              </small>
                            ))}
                            {losses.length > 3 && (
                              <small>and {losses.length - 3} more</small>
                            )}
                          </td>
                          <td>
                            <select
                              aria-label={`Placement for ${family}`}
                              value={value}
                              disabled={busy}
                              onChange={(e) => {
                                const next = e.target
                                  .value as PlacementDisposition;
                                setPlacements((p) => ({
                                  ...p,
                                  ...Object.fromEntries(
                                    losses.map((l) => [l.path, next]),
                                  ),
                                }));
                                setReviewed(false);
                              }}
                            >
                              <option value="keep_as_note">
                                Keep as source note
                              </option>
                              {bindingOnly && (
                                <option value="covered_by_discovery_binding">
                                  Covered by the Discovery binding
                                </option>
                              )}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <label className="fn-check">
                <input
                  type="checkbox"
                  checked={reviewed}
                  disabled={busy}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                I have reviewed where each of the {current.value.losses.length}{" "}
                held fields goes
              </label>
            </section>
          ) : (
            <ul>
              {current.value.losses.map((l, i) => (
                <li key={i}>
                  {l.path}: {l.reason}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            disabled={busy || (current.value.held && !(placeable && reviewed))}
            onClick={() =>
              void command.send("estimating/fertigation/import", {
                ...source,
                id: current.id,
                raw_json: raw,
                proposal_signature: current.value.proposal_signature,
                ...(placeable
                  ? {
                      placements: current.value.losses.map((l) => ({
                        path: l.path,
                        disposition: placementFor(l.path),
                      })),
                    }
                  : {}),
                reason:
                  "Explicitly import reviewed portable scope as a new native draft",
              })
            }
          >
            Confirm import as new native draft
          </button>
        </>
      )}
      {command.uncertain && (
        <button
          type="button"
          disabled={command.busy}
          onClick={() => void command.reconcile()}
        >
          Confirm original import
        </button>
      )}
    </section>
  );
}
