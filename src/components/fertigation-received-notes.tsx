"use client";
import Link from "next/link";
import type { ReceivedFertigation } from "../estimating/fertigation/receiving-reads";
import { ErrorNotice } from "./business-ui";
import { useCrmResource } from "./crm-state";

export function FertigationReceivedNotes({
  items,
}: {
  items: ReceivedFertigation[];
}) {
  if (!items.length) return null;
  return (
    <section
      className="est-panel"
      aria-label="Accepted fertigation scoping notes"
    >
      <h2>Accepted fertigation scoping notes</h2>
      <p>
        These exact saved studies were received as manual scoping notes.
        Technical suitability and supplier confirmation remain unresolved.
        Quantities do not create estimate lines or prices.
      </p>
      {items.map((item) => (
        <details key={item.id}>
          <summary>
            {item.reference} · r{item.revision} · {item.name}
            {!item.scope_current || !item.source_current
              ? " · Historical accepted binding"
              : ""}
          </summary>
          <p>
            <Link
              href={`/estimating/fertigation/${item.scope_id}?revision_id=${item.revision_id}`}
            >
              Open this exact saved scope
            </Link>
          </p>
          <p>
            Production context:{" "}
            {item.production_context.tags.join(", ").replaceAll("_", " ")} ·{" "}
            {item.production_context.hydraulic_arrangement.replaceAll("_", " ")}
          </p>
          <dl>
            {Object.entries(item.quantities).map(([key, result]) => (
              <div key={key}>
                <dt>{key.replaceAll("_", " ")}</dt>
                <dd>
                  {result.state === "known"
                    ? `${result.value} ${result.unit}`
                    : result.state.replaceAll("_", " ")}
                  {result.reason ? ` · ${result.reason}` : ""}
                </dd>
              </div>
            ))}
          </dl>
          <p>
            Open findings: {item.open_findings.length} · Recorded actions:{" "}
            {item.actions.length}. Not adopted for costing.
          </p>
          {item.open_findings.length > 0 && (
            <ul>
              {item.open_findings.slice(0, 20).map((f) => (
                <li key={f.id}>{f.message}</li>
              ))}
            </ul>
          )}
          {item.actions.length > 0 && (
            <ul>
              {item.actions.slice(0, 20).map((a) => (
                <li key={a.id}>
                  {a.label} · {a.status} · {a.owner || "Owner unassigned"}
                </li>
              ))}
            </ul>
          )}
          {(item.open_findings.length > 20 || item.actions.length > 20) && (
            <p>
              Open the exact saved scope for the complete findings and actions.
            </p>
          )}
          <details>
            <summary>Exact received basis</summary>
            <dl className="est-hashes">
              <dt>Discovery revision</dt>
              <dd>{item.source_revision_id}</dd>
              <dt>Scope content hash</dt>
              <dd>{item.content_hash}</dd>
              <dt>Accepted handover hash</dt>
              <dd>{item.handover_hash}</dd>
            </dl>
          </details>
        </details>
      ))}
    </section>
  );
}
export function FertigationReceivedNotesResource({
  workspaceId,
  revisionId,
}: {
  workspaceId: string;
  revisionId: string;
}) {
  const data = useCrmResource<{ items: ReceivedFertigation[] }>(
    `estimating/workspaces/${workspaceId}/fertigation?revision_id=${revisionId}`,
  );
  return (
    <>
      <ErrorNotice error={data.error} />
      {data.loading && <p role="status">Loading permitted received notes…</p>}
      {data.data && <FertigationReceivedNotes items={data.data.items} />}
    </>
  );
}
