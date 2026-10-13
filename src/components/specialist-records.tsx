"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "./business-ui";
import { ErrorNotice } from "./business-ui";
import { useCrmResource } from "./crm-state";
import { definition } from "../estimating/specialist/definition";
import type { Position } from "../estimating/specialist/types";
import { basePath, type Bench, type Detail, type HistoryRead, type Options, type Rebase } from "./specialist-types";
import { WorklistMenu } from "./crm-worklist-tools";
import { Dialog, Pill, Segmented, readable, runLabel } from "./specialist-ui";

// Definition review and Run history carry over from workbench r03 unchanged in
// behaviour (design board decision, section 3): source findings with their
// review notes, the parameter proposal, the provisional catalogue, immutable
// runs with exact evidence, copying a run to another alternative, archiving
// and the source rebase review. Only their presentation joins the board.
export function DefinitionView({ bench }: { bench: Bench }) {
  const { data, proposal: p, change, frozen, command, path } = bench,
    findings = [...definition.issues, ...definition.catalogue.quality];
  return (
    <div className="es08-view">
      <div className="es08-view-head">
        <div>
          <h2>Definition review</h2>
          <p>
            {definition.engine_version} · recovered source {definition.quantity_version} · {definition.part_version}. Review required: 142 compared fields, 21 untested options, 23 REV findings, 3 AUD findings and 12 WAS discrepancies. Commercial source values remain withheld.
          </p>
        </div>
        <Pill tone="warn">{findings.length} findings open</Pill>
      </div>
      <div className="es08-defgrid">
        <div className="es08-stack">
          <section className="es08-card" aria-labelledby="es08-findings-h">
            <div className="es08-card-head es08-card-head--stack">
              <h3 id="es08-findings-h">Source findings</h3>
              <label className="es08-mobile-filter es08-stack-label">Finding kind
                <select value={bench.findingFilter} onChange={e => bench.setFindingFilter(e.target.value)}>
                  {["All", "REV", "AUD", "WAS"].map(kind => <option key={kind} value={kind}>{kind === "All" ? "All findings" : kind} · {findings.filter(f => kind === "All" || f.id.startsWith(kind)).length}</option>)}
                </select>
              </label>
              <p className="es08-sub">Native exact arithmetic differs at three binary rounding boundaries; see the native definition evidence. Tests do not approve engineering.</p>
            </div>
            <ul className="es08-findings">
              {findings.filter(f => bench.findingFilter === "All" || f.id.startsWith(bench.findingFilter)).map((f) => (
                <li key={f.id}>
                  <details className="es08-details">
                    <summary>
                      <span className="es08-mono es08-strong">{f.id}</span>
                      <span>{f.title}</span>
                      {"priority" in f && <Pill tone={f.priority === "Critical" ? "danger" : f.priority === "High" ? "warn" : "neutral"}>{f.priority}</Pill>}
                      {data.reviews.some((r) => r.finding_id === f.id) && <Pill tone="ok">Reviewed</Pill>}
                    </summary>
                    <div className="es08-details-body">
                      <p>{"action" in f ? f.action : f.detail}</p>
                      {"source" in f && f.source && <p className="es08-mono es08-sub">Source {f.source}</p>}
                      {data.reviews
                        .filter((r) => r.finding_id === f.id)
                        .map((r, i) => (
                          <p key={i} className="es08-review-note">
                            <strong>{r.disposition}</strong>: {r.note} · Next: {r.next_action} · {readable(r.created_at)}
                          </p>
                        ))}
                      <FindingReview id={f.id} path={path} version={data.configuration.version} command={command} disabled={frozen} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>
          <section className="es08-card" aria-labelledby="es08-catalogue-h">
            <div className="es08-card-head">
              <h3 id="es08-catalogue-h">Provisional catalogue · {definition.catalogue.parts.length} identities</h3>
              <Pill tone="warn">MYOB mapping pending</Pill>
            </div>
            <details className="es08-details">
              <summary>Show the provisional part identities</summary>
              <div className="es08-table-scroll" tabIndex={0}>
                <table className="es08-table">
                  <thead>
                    <tr>
                      <th scope="col">Part</th>
                      <th scope="col">Exact source description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {definition.catalogue.parts.map((part) => (
                      <tr key={part.id}>
                        <td className="es08-mono">{part.id}</td>
                        <td>{part.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        </div>
        <div className="es08-stack">
          <section className="es08-card" aria-labelledby="es08-params-h">
            <div className="es08-card-head es08-card-head--stack">
              <h3 id="es08-params-h">Configuration parameter proposal</h3>
              <p className="es08-sub">Bound parameters feed the recovered rules; recorded-only parameters are retained for review.</p>
            </div>
            <div className="es08-table-scroll" tabIndex={0}>
              <table className="es08-table es08-parameter-table">
                <thead><tr><th>Parameter</th><th>Unit</th><th>Binding</th><th>Consumer</th><th>Default</th><th>Proposal</th></tr></thead>
                <tbody>{definition.catalogue.parameters.map(param => <tr key={param.id}>
                  <th scope="row" className="es08-mono">{param.id}</th><td>{param.unit}</td><td><Pill tone={param.bound ? "ok" : "neutral"}>{param.bound ? "Bound" : "Recorded only"}</Pill></td>
                  <td className="es08-mono">{param.consumer ?? "—"}</td><td className="es08-num">{param.default}</td>
                  <td><input id={`es08-parameter.${param.id}`} aria-label={`${param.id} proposal`} inputMode="decimal" disabled={frozen} value={p.parameters[param.id].raw} onChange={e => change(s => { s.parameters[param.id] = { raw: e.target.value, reason: bench.reason }; })} /></td>
                </tr>)}</tbody>
              </table>
            </div>
          </section>
          <section className="es08-card" aria-labelledby="es08-manifest-h">
            <h3 id="es08-manifest-h">Source manifest and retained hashes</h3>
            <dl className="es08-rows es08-rows--tight">
              {definition.source_files.map((s) => (
                <div key={s.path}>
                  <dt className="es08-mono">{s.path}</dt>
                  <dd className="es08-mono es08-hash">{s.sha256.slice(0, 16)}…</dd>
                </div>
              ))}
              <div>
                <dt>Bundle hash</dt>
                <dd className="es08-mono es08-hash">{definition.bundle_hash.slice(0, 16)}…</dd>
              </div>
            </dl>
          </section>
          <section className="es08-card" aria-labelledby="es08-source-h">
            <h3 id="es08-source-h">Saved source</h3>
            <p className="es08-sub">
              Discovery r{data.source.revision} ({data.source.scope_readiness}) · workspace v{data.source.workspace_version}
            </p>
            <SourceReview bench={bench} />
          </section>
        </div>
      </div>
    </div>
  );
}
function FindingReview({ id, path, version, command, disabled }: { id: string; path: string; version: number; command: Bench["command"]; disabled: boolean }) {
  const [note, setNote] = useState(""),
    [next, setNext] = useState("");
  return (
    <form
      className="es08-finding-form"
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(`${path}/finding`, "RecordSpecialistFindingReview", { expected_version: version, finding_id: id, note, next_action: next, disposition: "Reviewed; unresolved", reason: note });
      }}
    >
      <label>
        Review note
        <input value={note} disabled={disabled} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </label>
      <label>
        Next action (owned by current editor)
        <input disabled={disabled} value={next} onChange={(e) => setNext(e.target.value)} maxLength={1000} />
      </label>
      <button type="submit" className="ppo-button es08-button--sm" disabled={disabled || !note.trim() || !next.trim()}>
        Save review note
      </button>
    </form>
  );
}
export function ResolvedAdjustment({ bench, position, close }: { bench: Bench; position: Position; close: () => void }) {
  const { data, command, frozen } = bench,
    [quantity, setQuantity] = useState(position.effective_quantity?.display ?? ""),
    [reason, setReason] = useState("");
  if (!data.current_resolved?.snapshot.lines.some((l) => l.key === position.key) || position.row >= 383) return null;
  const send = async (remove: boolean) => {
    if (
      await command.send(`${basePath}/${data.configuration.id}/resolved`, "SaveSpecialistResolvedSet", {
        expected_version: data.configuration.version,
        resolved_set_id: data.current_resolved!.id,
        resolved_set_hash: data.current_resolved!.content_hash,
        reason,
        changes: [{ key: position.key, quantity: remove ? null : quantity, remove, reason }],
      })
    )
      close();
  };
  return (
    <section className="es08-adjust" aria-labelledby="es08-adjust-h">
      <h4 id="es08-adjust-h">Adjust the saved resolved line</h4>
      <p className="es08-sub">Creates a successor resolved set. The original run stays unchanged.</p>
      <div className="es08-edit-grid">
        <label>
          Quantity
          <input inputMode="decimal" disabled={frozen} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <label>
          Reason
          <input disabled={frozen} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
      </div>
      <div className="es08-record-actions">
        <button type="button" className="ppo-button es08-button--sm" disabled={frozen || !reason} onClick={() => void send(false)}>
          Save resolved adjustment
        </button>
        <button type="button" className="ppo-button es08-button--sm" disabled={frozen || !reason} onClick={() => void send(true)}>
          Omit saved line
        </button>
      </div>
    </section>
  );
}
export function HistoryView({ bench }: { bench: Bench }) {
  const { data, command, frozen } = bench,
    [before, setBefore] = useState<string | null>(null),
    [selected, setSelected] = useState<unknown>(null),
    [selectedRun, setSelectedRun] = useState<string | null>(null),
    [error, setError] = useState<unknown>(null),
    resource = useCrmResource<{ items: { id: string; sequence: number; created_at: string; created_by: string; evidence_hash: string; source_revision_id: string }[]; next_cursor: string | null }>(
      `${basePath}/${data.configuration.id}/history${before ? `?before=${before}` : ""}`,
      true,
    );
  async function inspect(id: string, download = false, print = false) {
    try {
      const result = await api<HistoryRead>(`${basePath}/${data.configuration.id}/history?run_id=${id}${download ? "&export=1" : ""}`);
      if (download) {
        const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })),
          link = document.createElement("a");
        link.href = url;
        link.download = `PPO-ES08-review-${id}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        setSelected(result);
        setSelectedRun(id);
        if (print) requestAnimationFrame(() => window.print());
      }
    } catch (e) {
      setSelected(null);
      setSelectedRun(null);
      setError(e);
    }
  }
  return (
    <div className="es08-view">
      <div className="es08-view-head">
        <div>
          <h2>Immutable run history</h2>
          <p>Every saved run keeps its exact inputs, calculation, decisions and evidence hash. A run is a design record; it is never rewritten.</p>
        </div>
        <div className="es08-view-actions">
          <CopyStudy bench={bench} />
          <button
            type="button"
            className="ppo-button es08-button--danger"
            disabled={frozen}
            onClick={() =>
              command.send(`${basePath}/${data.configuration.id}/archive`, "ArchiveSpecialistConfiguration", {
                expected_version: data.configuration.version,
                reason: "Archive configuration while retaining all runs and estimate contributions",
              })
            }
          >
            Archive configuration
          </button>
        </div>
      </div>
      <ErrorNotice error={resource.error} />
      <ErrorNotice error={error} />
      <div className="es08-defgrid">
        <section className="es08-card es08-table-card" aria-labelledby="es08-runs-h">
          <div className="es08-card-head">
            <h3 id="es08-runs-h">Saved runs</h3>
            <span className="es08-sub">{resource.data ? `${resource.data.items.length} shown` : "Loading…"}</span>
          </div>
          {resource.data?.items.length === 0 && <p className="es08-empty">No saved review runs yet. Save run R01 from Compare &amp; save.</p>}
          {!!resource.data?.items.length && (
            <div className="es08-table-scroll" tabIndex={0}>
              <table className="es08-table">
                <thead>
                  <tr>
                    <th scope="col">Run</th>
                    <th scope="col">Saved</th>
                    <th scope="col">Actor / source</th>
                    <th scope="col">Evidence</th>
                    <th scope="col">
                      <span className="es08-sr">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resource.data.items.map((r) => (
                    <tr key={r.id} data-selected={r.id === data.current_run?.id || undefined}>
                      <td className="es08-strong">
                        Run {runLabel(r.sequence)}
                        {r.id === data.current_run?.id && (
                          <>
                            {" "}
                            <Pill tone="ok">Current</Pill>
                          </>
                        )}
                      </td>
                      <td>{readable(r.created_at)}</td>
                      <td>
                        <div className="es08-mono">{r.created_by.slice(0, 8)}</div>
                        <div className="es08-mono es08-sub">{r.source_revision_id.slice(0, 8)}</div>
                      </td>
                      <td className="es08-mono es08-hash">{r.evidence_hash.slice(0, 16)}…</td>
                      <td className="es08-actions-cell es08-actions-cell--wrap">
                        <div>
                        <button type="button" className="ppo-button es08-button--sm" onClick={() => void inspect(r.id)}>
                          Inspect
                        </button>
                        <WorklistMenu label={`Run ${runLabel(r.sequence)} actions`} choices text="…" className="es08-run-menu">
                        <button role="menuitem" data-menu-close type="button" className="secondary crm-menu-choice" onClick={() => void inspect(r.id, true)}>
                          Export evidence
                        </button>
                        <button role="menuitem" data-menu-close
                          type="button"
                          className="secondary crm-menu-choice"
                          disabled={frozen}
                          onClick={() =>
                            command.send(`${basePath}/${data.configuration.id}/from-run`, "CreateSpecialistDraftFromRun", {
                              expected_version: data.configuration.version,
                              run_id: r.id,
                              reason: "Create a new draft proposal from this exact historical run; manual review required",
                            })
                          }
                        >
                          Create draft from run
                        </button>
                        </WorklistMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {resource.data?.next_cursor && (
            <div className="es08-card-foot">
              <button type="button" className="ppo-button es08-button--sm" onClick={() => setBefore(resource.data!.next_cursor)}>
                Earlier runs
              </button>
            </div>
          )}
        </section>
        <section className="es08-card" aria-labelledby="es08-adopt-h">
          <h3 id="es08-adopt-h">Estimate adoptions</h3>
          {data.adoptions.length === 0 && <p className="es08-sub">No run has been applied to an estimate.</p>}
          <ul className="es08-list">
            {data.adoptions.map((a) => (
              <li key={a.id}>
                <Link href={`/estimating/estimates/${a.estimate_id}?version_id=${a.estimate_version_id}`}>Exact estimate version {a.estimate_version_id.slice(0, 8)}</Link> · {readable(a.created_at)}
              </li>
            ))}
          </ul>
        </section>
      </div>
      {selected !== null && (
        <Dialog title="Exact saved review evidence" close={() => setSelected(null)} wide className="es08-dialog--evidence">
          <p className="es08-sub">Internal synthetic review evidence · exact saved run · engineering review remains open</p>
          <button type="button" className="ppo-button es08-button--sm" onClick={() => selectedRun && void inspect(selectedRun, false, true)}>
            Print this evidence
          </button>
          <pre className="es08-evidence">{JSON.stringify(selected, null, 2)}</pre>
        </Dialog>
      )}
    </div>
  );
}
function selectedCoverage(source: Options["sources"][number], value: string) {
  const system = source.configuration?.systems.find((s) => s.id === value);
  return system
    ? { kind: "StructuredSystem", system_id: system.id, area_ids: system.coverage.area_ids, facility_ids: source.facility_ids }
    : { kind: "FacilityScope", system_id: null, area_ids: [], facility_ids: source.facility_ids };
}
export function SourceReview({ bench }: { bench: Bench }) {
  const { data, command, frozen } = bench,
    [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ppo-button es08-button--sm" disabled={frozen} onClick={() => setOpen(true)}>
        Review source change
      </button>
      {open && <SourceReviewDialog data={data} command={command} disabled={frozen} close={() => setOpen(false)} />}
    </>
  );
}
function SourceReviewDialog({ data, command, disabled, close }: { data: Detail; command: Bench["command"]; disabled: boolean; close: () => void }) {
  const options = useCrmResource<Options>(`${basePath}/options?estimating_workspace_id=${data.configuration.estimating_workspace_id}`, true),
    [result, setResult] = useState<Rebase | null>(null),
    [error, setError] = useState<unknown>(null),
    [reason, setReason] = useState("Explicitly reviewed source revision and coverage"),
    [coverageChoice, setCoverageChoice] = useState("keep"),
    [fieldDecisions, setFieldDecisions] = useState<{ key: string; choice: "source" | "keep-entered"; reason: string }[]>([]);
  const source = options.data?.sources.find((s) => s.option_id === data.configuration.option_id);
  const body = {
    expected_version: data.configuration.version,
    revision_id: source?.revision_id,
    coverage: coverageChoice !== "keep" && source ? selectedCoverage(source, coverageChoice) : { kind: data.draft.binding.kind, system_id: data.draft.binding.system_id, area_ids: data.draft.binding.area_ids, facility_ids: data.draft.binding.facility_ids },
    field_decisions: fieldDecisions,
  };
  return (
    <Dialog title="Review source change" close={close} wide>
      <ErrorNotice error={options.error} />
      <ErrorNotice error={error} />
      <p className="es08-sub">
        Saved discovery r{data.source.revision} → latest permitted discovery r{source?.revision ?? "—"}. Rebase changes the draft source; it does not select an alternative or change saved costs.
      </p>
      <label className="es08-stack-label">
        Reason
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {source && (
        <label className="es08-stack-label">
          Destination coverage
          <select
            value={coverageChoice}
            onChange={(e) => {
              setCoverageChoice(e.target.value);
              setResult(null);
            }}
          >
            <option value="keep">Retain existing coverage (validated against destination)</option>
            <option value="FacilityScope">All Facilities in this saved source</option>
            {source.configuration?.systems
              .filter((s) => s.coverage.mode === "Defined" && s.coverage.area_ids.length > 0)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
      )}
      <div className="es08-record-actions">
        <button
          type="button"
          className="ppo-button"
          disabled={disabled || !source}
          onClick={async () => {
            try {
              setResult(await api<Rebase>(`${basePath}/${data.configuration.id}/source-preview`, body));
            } catch (e) {
              setError(e);
            }
          }}
        >
          Preview source rebase
        </button>
      </div>
      {result && (
        <>
          <p className="es08-mono es08-sub">
            Old scope {result.old_binding.content_hash.slice(0, 16)} → new scope {result.new_binding.content_hash.slice(0, 16)}
          </p>
          {result.changes.map((c) => (
            <div key={c.key} className="es08-field">
              <span id={`es08-rebase-${c.key}`} className="es08-field-label">
                {c.key}: {c.before} → {c.after ?? "Removed"}
              </span>
              <Segmented
                labelledBy={`es08-rebase-${c.key}`}
                size="sm"
                options={[{ value: "keep-entered", label: "Retain as entered" }, ...(c.after !== null ? [{ value: "source", label: "Use saved source" }] : [])]}
                value={fieldDecisions.find((d) => d.key === c.key)?.choice ?? ""}
                onChange={(x) => {
                  setFieldDecisions([...fieldDecisions.filter((d) => d.key !== c.key), { key: c.key, choice: x as "source" | "keep-entered", reason }]);
                  setResult(null);
                }}
              />
            </div>
          ))}
          <div className="es08-record-actions">
            <button
              type="button"
              className="ppo-button ppo-button--primary"
              disabled={disabled || result.changes.some((c) => !c.decision)}
              onClick={async () => {
                if (await command.send(`${basePath}/${data.configuration.id}/rebase`, "RebaseSpecialistSource", { ...body, reason, proposal_signature: result.proposal_signature })) close();
              }}
            >
              Apply source rebase
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
function CopyStudy({ bench }: { bench: Bench }) {
  const { data, command, frozen } = bench,
    [open, setOpen] = useState(false),
    options = useCrmResource<Options>(open ? `${basePath}/options` : null, true),
    [choice, setChoice] = useState(""),
    [name, setName] = useState("Copied Screen Systems proposal"),
    [copied, setCopied] = useState<string | null>(null),
    source = options.data?.sources.find((s) => s.option_id === choice);
  return (
    <>
      <button type="button" className="ppo-button" disabled={frozen || !data.current_run} onClick={() => setOpen(true)}>
        Copy saved run to another alternative
      </button>
      {copied && (
        <Link className="ppo-button" href={`/estimating/configurations/${copied}/configure`}>
          Open copied configuration
        </Link>
      )}
      {open && (
        <Dialog title="Copy to another alternative" close={() => setOpen(false)}>
          <p className="es08-sub">This creates a new configuration and draft. All manual quantities need review; no cost ownership or adoption is copied.</p>
          <ErrorNotice error={options.error} />
          <label className="es08-stack-label">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="es08-stack-label">
            Saved destination
            <select value={choice} onChange={(e) => setChoice(e.target.value)}>
              <option value="">Select an alternative…</option>
              {options.data?.sources
                .filter((s) => s.option_id !== data.configuration.option_id)
                .map((s) => (
                  <option key={s.option_id} value={s.option_id}>
                    {s.site} · {s.option_label} · r{s.revision}
                  </option>
                ))}
            </select>
          </label>
          <p className="es08-sub">Coverage: all {source?.facility_ids.length ?? 0} Facilities in the selected saved source, explicitly mapped as Facility scope.</p>
          <div className="es08-record-actions">
            <button
              type="button"
              className="ppo-button ppo-button--primary"
              disabled={frozen || !source || !name.trim() || !source.facility_ids.length}
              onClick={async () => {
                if (!source) return;
                const id = crypto.randomUUID();
                if (
                  await command.send(`${basePath}/${data.configuration.id}/copy`, "CopySpecialistConfiguration", {
                    id,
                    name,
                    reason: "Explicitly copy exact saved run into new alternative Facility scope; review required",
                    source_run_id: data.current_run!.id,
                    estimating_workspace_id: source.estimating_workspace_id,
                    option_id: source.option_id,
                    revision_id: source.revision_id,
                    expected_workspace_version: source.expected_workspace_version,
                    coverage: selectedCoverage(source, "FacilityScope"),
                  })
                ) {
                  setCopied(id);
                  setOpen(false);
                }
              }}
            >
              Create copied draft
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
