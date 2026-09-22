"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ErrorNotice } from "./business-ui";
import { denied, useCrmCommand } from "./crm-state";
import type { ImportPreview } from "../estimating/fertigation/interchange";
import { PORTABLE_BYTES } from "../estimating/fertigation/portable-limits";
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
    [reading, setReading] = useState(false);
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
  if (denied(error) || denied(command.error))
    return <ErrorNotice error={error ?? command.error} />;
  async function inspect() {
    const turn = ++generation.current;
    setReading(true);
    setError(null);
    setPreview(null);
    setMappingPage(0);
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
            </p>
          )}
          <ul>
            {current.value.losses.map((l, i) => (
              <li key={i}>
                {l.path}: {l.reason}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy || current.value.held}
            onClick={() =>
              void command.send("estimating/fertigation/import", {
                ...source,
                id: current.id,
                raw_json: raw,
                proposal_signature: current.value.proposal_signature,
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
