"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Field, ErrorNotice, PageHeader } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { useCrmResource, useCrmCommand } from "../../components/crm-state";
import type { readNursery } from "./service";
import {
  fields,
  blankScenario,
  applicability,
  selections,
  responsibilities,
  findings,
  type Study,
} from "./model";
import "./screen.css";
import { Pick, FactFields } from "./fields";
type Detail = Awaited<ReturnType<typeof readNursery>>;
export function NurseryScreen({ id }: { id: string }) {
  const params = useSearchParams(),
    option = params.get("option"),
    [historyId, setHistoryId] = useState<string | null>(null);
  const path = `estimating/workspaces/${id}/nursery`;
  const data = useCrmResource<Detail>(
    `${path}?${new URLSearchParams({ ...(option ? { option_id: option } : {}), ...(historyId ? { revision_id: historyId } : {}) })}`,
  );
  return (
    <>
      {data.loading && (
        <p role="status">Loading permitted Automation discovery…</p>
      )}
      <ErrorNotice error={data.error} />
      {!!data.error && (
        <Button onClick={() => data.reload()}>Try loading again</Button>
      )}
      {data.data && !!data.error && (
        <p role="status">
          Refresh failed. Your draft and original save recovery are retained.
          Retry loading before a new save.
        </p>
      )}
      {data.data && (
        <NurseryBody
          key={data.data.reader_id + ":" + data.data.can_edit}
          id={id}
          path={path}
          data={data}
          historyId={historyId}
          setHistoryId={setHistoryId}
        />
      )}
    </>
  );
}
function NurseryBody({
  id,
  path,
  data,
  historyId,
  setHistoryId,
}: {
  id: string;
  path: string;
  data: ReturnType<typeof useCrmResource<Detail>>;
  historyId: string | null;
  setHistoryId: (id: string | null) => void;
}) {
  const [editor, setEditor] = useState<{ basis: Detail; study: Study } | null>(
      null,
    ),
    [reason, setReason] = useState(""),
    [accepted, setAccepted] = useState(0);
  const command = useCrmCommand((r) => {
    setAccepted(r.record_version);
    setEditor(null);
    setReason("");
    data.reload();
  }, "Saved study");
  const d = data.data,
    frozen = command.busy || command.uncertain;
  const set = (study: Study) => {
    if (editor) {
      setEditor({ ...editor, study });
      command.dirty();
    }
  };
  const study = editor?.study ?? d?.proposal;
  const displaySource = editor?.basis.source ?? d?.selected_source;
  const changed =
    !!editor &&
    !!d &&
    (editor.basis.workspace.version !== d.workspace.version ||
      editor.basis.source.id !== d.source.id);
  const loadingSaved = !!d && accepted > d.workspace.version;
  return (
    <div className="nac-page">
      <PageHeader
        title="Automation Configurator"
        description="Equipment discovery and production scenarios · N1"
        eyebrow="Estimating · Synthetic"
      />
      <Link href={`/estimating/discovery/${id}`}>Return to Discovery</Link>
      {d && study && displaySource && (
        <>
          <section className="nac-context">
            <h2>{editor ? "Source for this edit" : "Saved scope"}</h2>
            <p>
              Alternative {d.option.label} · {displaySource.effort} · Discovery{" "}
              {displaySource.readiness}
            </p>
            <p>
              Nursery revision {d.selected?.version ?? "not yet saved"} ·
              Equipment review pending · Technical suitability not assessed
            </p>
            <p>
              Saving here does not complete Discovery, approve a machine or
              create a priced estimate.
            </p>
            {d.source_changed && (
              <p role="status">
                Discovery changed since this study was saved. Saved history
                retains its original source. Editing starts from current
                Discovery; review the source and system binding before saving.
              </p>
            )}
            {d.catalogue_changed && (
              <p role="status">
                Equipment sources changed. Review the current catalogue before
                saving a successor.
              </p>
            )}
            <details>
              <summary>Exact source references</summary>
              <p>Company {d.workspace.company_id}</p>
              <p>Discovery revision {displaySource.id}</p>
              <p>Site {displaySource.site_id ?? "Not recorded"}</p>
              <p>
                Saved study source{" "}
                {d.selected?.source_revision_id ?? "Not saved"}
              </p>
            </details>
          </section>
          {loadingSaved ? (
            <p role="status">Save accepted. Loading the saved study…</p>
          ) : (
            <>
              <div className="nac-actions">
                {!editor && d.can_edit && (
                  <Button
                    onClick={() => {
                      setEditor({
                        basis: d,
                        study: structuredClone(d.proposal),
                      });
                      setReason("");
                      command.dirty();
                    }}
                  >
                    Edit discovery
                  </Button>
                )}
                {editor && (
                  <Button
                    disabled={frozen}
                    onClick={() => {
                      setEditor(null);
                      command.discard();
                    }}
                  >
                    Cancel edits
                  </Button>
                )}
                {!editor && (
                  <label>
                    Saved revision
                    <select
                      value={historyId ?? ""}
                      onChange={(e) => setHistoryId(e.target.value || null)}
                    >
                      <option value="">Current</option>
                      {d.history.map((r) => (
                        <option key={r.id} value={r.id}>
                          Revision {r.version} · {r.reason}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {changed && (
                <p role="alert">
                  The saved workspace changed while you were editing. Your draft
                  is retained. Cancel to load the latest version and compare
                  before saving again.
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editor && !changed && !data.error && !frozen)
                    void command.send(path, {
                      option_id: editor.basis.option.id,
                      source_revision_id: editor.basis.source.id,
                      source_hash: editor.basis.source.hash,
                      expected_workspace_version:
                        editor.basis.workspace.version,
                      expected_revision_id: editor.basis.current_revision_id,
                      catalogue_hash: editor.basis.catalogue_hash,
                      proposal: editor.study,
                      reason,
                    });
                }}
              >
                <fieldset
                  disabled={!editor || frozen || loadingSaved}
                  className="nac-editor"
                >
                  <legend>Discovery details</legend>
                  <Field
                    name="study-name"
                    label="Study name"
                    value={study.name}
                    onChange={(name) => set({ ...study, name })}
                  />
                  <Pick
                    label="Project type"
                    value={study.project_type}
                    values={[
                      "Unknown",
                      "Replacement",
                      "ConnectedLine",
                      "StagedRetrofit",
                    ]}
                    change={(v) =>
                      set({
                        ...study,
                        project_type: v as Study["project_type"],
                      })
                    }
                  />
                  <label className="nac-field">
                    Discovery system
                    <select
                      value={study.system_id ?? ""}
                      onChange={(e) =>
                        set({ ...study, system_id: e.target.value || null })
                      }
                    >
                      <option value="">Not yet bound</option>
                      {study.system_id &&
                        !displaySource.systems.some(
                          (s) => s.id === study.system_id,
                        ) && (
                          <option value={study.system_id}>
                            Previous system {study.system_id} — select a current
                            system or clear the binding
                          </option>
                        )}
                      {displaySource.systems.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    name="current-process"
                    label="Current process and intended change"
                    maxLength={1000}
                    value={study.current_process ?? ""}
                    onChange={(current_process) =>
                      set({
                        ...study,
                        current_process: current_process || null,
                      })
                    }
                  />
                  <h2>Equipment candidates</h2>
                  <p>
                    Shortlisting is not a suitability decision. No approved
                    limits or published Product Variants are assigned.
                  </p>
                  {(editor
                    ? editor.basis.current_catalogue
                    : d.catalogue
                  ).entries.map((e) => (
                    <article className="nac-card" key={e.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={study.candidate_ids.includes(e.id)}
                          onChange={(event) =>
                            set({
                              ...study,
                              candidate_ids: event.target.checked
                                ? [...study.candidate_ids, e.id]
                                : study.candidate_ids.filter((x) => x !== e.id),
                            })
                          }
                        />
                        {e.supplier} {e.model}
                      </label>
                      <p>{e.note}</p>
                      <a href={e.source_url} target="_blank" rel="noreferrer">
                        Supplier reference: {e.model}
                      </a>
                      {e.source_claims.map((claim, i) => (
                        <p key={i}>
                          {claim.source_section}: {claim.topic} {claim.value} —
                          unreviewed
                        </p>
                      ))}
                    </article>
                  ))}
                  <h2>Production scenarios</h2>
                  <p>
                    Capture each crop/container/media combination. Unknown is
                    distinct from zero. Future phases remain separate.
                  </p>
                  {study.scenarios.length === 0 && (
                    <p>No production scenarios recorded.</p>
                  )}
                  {study.scenarios.map((s, i) => (
                    <details key={s.id} open className="nac-card">
                      <summary>
                        {s.name} · {s.phase}
                      </summary>
                      <Field
                        name={s.id + "-name"}
                        label={`Scenario ${i + 1} name`}
                        maxLength={120}
                        value={s.name}
                        onChange={(name) =>
                          set({
                            ...study,
                            scenarios: study.scenarios.map((x) =>
                              x.id === s.id ? { ...x, name } : x,
                            ),
                          })
                        }
                      />
                      <Pick
                        label={`Scenario ${i + 1} phase`}
                        value={s.phase}
                        values={["Current", "Future"]}
                        change={(v) =>
                          set({
                            ...study,
                            scenarios: study.scenarios.map((x) =>
                              x.id === s.id
                                ? { ...x, phase: v as "Current" | "Future" }
                                : x,
                            ),
                          })
                        }
                      />
                      {fields.map((f) => (
                        <FactFields
                          key={f.key}
                          label={f.label}
                          unit={f.unit}
                          fact={s.facts[f.key]}
                          change={(fact) =>
                            set({
                              ...study,
                              scenarios: study.scenarios.map((x) =>
                                x.id === s.id
                                  ? {
                                      ...x,
                                      facts: { ...x.facts, [f.key]: fact },
                                    }
                                  : x,
                              ),
                            })
                          }
                        />
                      ))}
                      <Button
                        type="button"
                        onClick={() =>
                          set({
                            ...study,
                            scenarios: study.scenarios.filter(
                              (x) => x.id !== s.id,
                            ),
                          })
                        }
                      >
                        Remove scenario {i + 1}
                      </Button>
                    </details>
                  ))}
                  {study.scenarios.length < 20 && (
                    <Button
                      type="button"
                      onClick={() =>
                        set({
                          ...study,
                          scenarios: [
                            ...study.scenarios,
                            blankScenario(crypto.randomUUID()),
                          ],
                        })
                      }
                    >
                      Add production scenario
                    </Button>
                  )}
                  <h2>Site and enabling requirements</h2>
                  <FactFields
                    label="Site, utilities and access"
                    fact={study.site_requirements}
                    change={(site_requirements) =>
                      set({ ...study, site_requirements })
                    }
                  />
                  <h2>Delivery scope</h2>
                  <p>
                    Applicability, selection and responsibility are independent.
                    All coverage remains pending review. No hours or prices are
                    calculated here.
                  </p>
                  {study.delivery.map((item, i) => {
                    const update = (patch: Partial<typeof item>) =>
                      set({
                        ...study,
                        delivery: study.delivery.map((x, j) =>
                          j === i ? { ...x, ...patch } : x,
                        ),
                      });
                    return (
                      <fieldset className="nac-card" key={item.kind}>
                        <legend>{item.kind}</legend>
                        <div className="nac-grid">
                          <Pick
                            label={item.kind + " applicability"}
                            value={item.applicability}
                            values={applicability}
                            change={(v) =>
                              update({
                                applicability: v as typeof item.applicability,
                              })
                            }
                          />
                          <Pick
                            label={item.kind + " selection"}
                            value={item.selection}
                            values={selections}
                            change={(v) =>
                              update({ selection: v as typeof item.selection })
                            }
                          />
                          <Pick
                            label={item.kind + " responsibility"}
                            value={item.responsibility}
                            values={responsibilities}
                            change={(v) =>
                              update({
                                responsibility: v as typeof item.responsibility,
                              })
                            }
                          />
                        </div>
                        <Field
                          name={item.kind + "-basis"}
                          label={item.kind + " scope and coverage evidence"}
                          maxLength={500}
                          value={item.basis ?? ""}
                          onChange={(basis) => update({ basis: basis || null })}
                        />
                        <Field
                          name={item.kind + "-owner"}
                          label={item.kind + " clarification owner"}
                          value={item.owner ?? ""}
                          maxLength={120}
                          onChange={(owner) => update({ owner: owner || null })}
                        />
                        <Field
                          name={item.kind + "-next"}
                          label={item.kind + " next action"}
                          value={item.next_action ?? ""}
                          maxLength={500}
                          onChange={(next_action) =>
                            update({ next_action: next_action || null })
                          }
                        />
                      </fieldset>
                    );
                  })}
                  {editor && (
                    <Field
                      name="reason"
                      label="Reason for saving this revision"
                      value={reason}
                      maxLength={1000}
                      required
                      onChange={setReason}
                    />
                  )}
                </fieldset>
                {editor && (
                  <Button
                    type="submit"
                    disabled={
                      frozen || changed || !!data.error || !reason.trim()
                    }
                  >
                    Save discovery revision
                  </Button>
                )}
              </form>
              <p role="status">{command.status}</p>
              <ErrorNotice error={command.error} />
              {command.uncertain && (
                <Button
                  disabled={command.busy}
                  onClick={() => void command.reconcile()}
                >
                  Confirm original save outcome
                </Button>
              )}
              <section>
                <h2>Clarifications</h2>
                <p>
                  These are discovery follow-ups, not a technical pass or CPQ
                  readiness assessment.
                </p>
                <ul>
                  {findings(study).map((f) => (
                    <li key={f.key}>
                      <strong>{f.subject}:</strong> {f.message} Owner:{" "}
                      {f.owner ?? "Unassigned"}. {f.action}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2>Next stages</h2>
                {!editor && d.selected && (
                  <Link
                    href={`/estimating/discovery/${id}/nursery/assessment?option=${d.option.id}`}
                  >
                    Open technical assessment
                  </Link>
                )}
                <p>{d.handover}</p>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
