"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ErrorNotice, PageHeader } from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { useCrmResource, useCrmCommand } from "../../components/crm-state";
import { FactFields, Pick } from "./fields";
import {
  Text,
  StageFields,
  CaseFields,
  CheckFields,
  MoveButtons,
} from "./assessment-fields";
import {
  blankAssessment,
  blankStage,
  blankStageCase,
  blankConnection,
  topologies,
  type Assessment,
} from "./assessment-model";
import type { readAssessment } from "./assessment-service";
import "./screen.css";
type Detail = Awaited<ReturnType<typeof readAssessment>>;
export function AssessmentScreen({ id }: { id: string }) {
  const params = useSearchParams(),
    option = params.get("option"),
    [historyId, setHistoryId] = useState<string | null>(null);
  const path = "estimating/workspaces/" + id + "/nursery/assessments";
  const data = useCrmResource<Detail>(
    path +
      "?" +
      new URLSearchParams({
        ...(option ? { option_id: option } : {}),
        ...(historyId ? { revision_id: historyId } : {}),
      }),
  );
  return (
    <>
      <ErrorNotice error={data.error} />
      {data.loading && <p role="status">Loading technical assessment…</p>}
      {!!data.error && (
        <>
          <Button onClick={() => data.reload()}>Try loading again</Button>
          <p role="status">
            Refresh failed. Your draft and original save recovery are retained.
            Retry loading before a new save.
          </p>
        </>
      )}
      {data.data && (
        <Body
          key={data.data.reader_id + ":" + data.data.has_edit_permission}
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
function Body({
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
  setHistoryId: (v: string | null) => void;
}) {
  const d = data.data!,
    [editor, setEditor] = useState<{
      basis: Detail;
      proposal: Assessment;
    } | null>(null),
    [reason, setReason] = useState<string | null>(""),
    [accepted, setAccepted] = useState(0);
  const command = useCrmCommand((r) => {
    setAccepted(r.record_version);
    setEditor(null);
    setReason("");
    data.reload();
  }, "Saved assessment");
  const frozen = command.busy || command.uncertain;
  const changed =
    !!editor &&
    (editor.basis.workspace.version !== d.workspace.version ||
      editor.basis.current_source?.id !== d.current_source?.id);
  const input = editor?.proposal ?? d.proposal;
  const source =
    editor?.basis.current_source ??
    d.selected?.source_snapshot ??
    d.current_source;
  const set = (proposal: Assessment) => {
    if (editor) {
      setEditor({ ...editor, proposal });
      command.dirty();
    }
  };
  const start = (fresh: boolean) => {
    if (!d.current_source) return;
    setEditor({
      basis: structuredClone(d),
      proposal: fresh
        ? blankAssessment(d.current_source.study)
        : structuredClone(d.proposal!),
    });
    setReason("");
    command.dirty();
  };
  const report = d.selected?.result;
  return (
    <div className="nac-page">
      <PageHeader
        title="Automation technical assessment"
        description="Process, compatibility and capacity · N2"
        eyebrow="Estimating · Synthetic"
      />
      <Link href={`/estimating/discovery/${id}/nursery?option=${d.option.id}`}>
        Return to Automation discovery
      </Link>
      <p>
        Estimating study — not for fabrication. Internal review does not approve
        manufacturer ratings, publish Products or release a quotation.
      </p>
      {!d.current_source && (
        <p>Save Automation discovery before starting an assessment.</p>
      )}
      {d.discovery_changed && (
        <p role="status">
          Discovery changed. Review and save Automation discovery against the
          latest scope first.
        </p>
      )}
      {d.source_changed && (
        <p role="status">
          Automation discovery changed. This saved assessment retains its
          original source. Start a new assessment to use the latest source.
        </p>
      )}
      {source && (
        <section className="nac-context">
          <h2>Assessment basis</h2>
          <p>
            Alternative {d.option.label} · {source.discovery.effort} · Discovery{" "}
            {source.discovery.readiness}
          </p>
          <p>
            Saved assessment {d.selected?.version ?? "none"} · Rule edition{" "}
            {d.selected?.rule_edition ?? d.current_rule_edition}
          </p>
          <details>
            <summary>Exact source references</summary>
            <p>Nursery revision {source.id}</p>
            <p>Source hash {source.content_hash}</p>
            <p>Discovery revision {source.discovery.id}</p>
          </details>
        </section>
      )}
      {accepted > d.workspace.version ? (
        <p role="status">Save accepted. Loading the saved assessment…</p>
      ) : (
        <>
          <div className="nac-actions">
            {!editor && d.can_edit && !data.error && (
              <Button onClick={() => start(d.source_changed)}>
                {d.source_changed
                  ? "Start new assessment from latest source"
                  : "Edit assessment"}
              </Button>
            )}
            {editor && (
              <Button
                disabled={frozen}
                onClick={() => {
                  setEditor(null);
                  setReason("");
                  command.discard();
                }}
              >
                Cancel edits
              </Button>
            )}
            <label>
              Saved assessment history
              <select
                disabled={!!editor || frozen}
                value={historyId ?? ""}
                onChange={(e) => setHistoryId(e.target.value || null)}
              >
                <option value="">Current assessment</option>
                {d.history.map((r) => (
                  <option key={r.id} value={r.id}>
                    Revision {r.version}: {r.reason}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {changed && (
            <p role="alert">
              The saved basis changed. Your draft is retained; cancel and
              compare the current source before starting a new save.
            </p>
          )}
          {input && source && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  !editor ||
                  !editor.basis.current_source ||
                  frozen ||
                  changed ||
                  data.error ||
                  !d.can_edit ||
                  !reason?.trim()
                )
                  return;
                const b = editor.basis;
                void command.send(path, {
                  option_id: b.option.id,
                  nursery_revision_id: b.current_source!.id,
                  nursery_hash: b.current_source!.content_hash,
                  expected_workspace_version: b.workspace.version,
                  expected_revision_id: b.current_revision_id,
                  rule_edition: b.current_rule_edition,
                  proposal: editor.proposal,
                  reason,
                });
              }}
            >
              <fieldset disabled={!editor || frozen}>
                <legend>Technical study inputs</legend>
                <Text
                  label="Assessment name"
                  max={200}
                  value={input.name}
                  change={(name) => set({ ...input, name: name ?? "" })}
                />
                <Text
                  label="Assessment clarification owner"
                  max={120}
                  value={input.owner}
                  change={(owner) => set({ ...input, owner })}
                />
                <Pick
                  label="Line topology"
                  value={input.topology}
                  values={topologies}
                  change={(v) =>
                    set({ ...input, topology: v as Assessment["topology"] })
                  }
                />
                <p>
                  Only a complete sequential line can use minimum stage
                  capacity. Account for media supply, dispensing, potting,
                  planting and take-off, including manual and retained stages.
                  Equipment order defines flow; connections must match.
                </p>
                <h2>Ordered process stages</h2>
                <ol>
                  {input.stages.map((s) => (
                    <li key={s.id}>
                      {s.name} · {s.role} · {s.phase} · {s.disposition}
                    </li>
                  ))}
                </ol>
                {input.stages.map((s, i) => (
                  <details className="nac-card" key={s.id}>
                    <summary>
                      {i + 1}. {s.name}
                    </summary>
                    <StageFields
                      value={s}
                      change={(v) =>
                        set({
                          ...input,
                          stages: input.stages.map((x) =>
                            x.id === s.id ? v : x,
                          ),
                        })
                      }
                    />
                    <MoveButtons
                      index={i}
                      length={input.stages.length}
                      move={(to) => {
                        const stages = [...input.stages];
                        [stages[i], stages[to]] = [stages[to], stages[i]];
                        set({ ...input, stages });
                      }}
                      remove={() =>
                        set({
                          ...input,
                          stages: input.stages.filter((x) => x.id !== s.id),
                          scenarios: input.scenarios.map((c) => ({
                            ...c,
                            stages: c.stages.filter((x) => x.stage_id !== s.id),
                          })),
                          connections: input.connections.filter(
                            (c) => c.from_id !== s.id && c.to_id !== s.id,
                          ),
                        })
                      }
                    />
                  </details>
                ))}
                {input.stages.length < 20 && (
                  <Button
                    type="button"
                    onClick={() => {
                      const s = blankStage(crypto.randomUUID());
                      set({
                        ...input,
                        stages: [...input.stages, s],
                        scenarios: input.scenarios.map((c) => ({
                          ...c,
                          stages: [...c.stages, blankStageCase(s.id)],
                        })),
                      });
                    }}
                  >
                    Add process stage
                  </Button>
                )}
                <h2>Production scenario checks</h2>
                {input.scenarios.map((sc) => {
                  const original = source.study.scenarios.find(
                    (s) => s.id === sc.scenario_id,
                  );
                  return (
                    <details className="nac-card" key={sc.scenario_id}>
                      <summary>
                        {original?.name ?? "Missing source scenario"} ·{" "}
                        {original?.phase}
                      </summary>
                      <p>
                        Customer requirements are retained from the saved
                        Automation discovery. Revise them there before starting
                        a successor assessment.
                      </p>
                      <FactFields
                        label="Good-output fraction"
                        unit="0 to 1"
                        fact={sc.good_fraction}
                        change={(good_fraction) =>
                          set({
                            ...input,
                            scenarios: input.scenarios.map((x) =>
                              x === sc ? { ...x, good_fraction } : x,
                            ),
                          })
                        }
                      />
                      {input.stages.map((stage) => {
                        const c = sc.stages.find(
                          (c) => c.stage_id === stage.id,
                        );
                        return (
                          c && (
                            <details key={stage.id}>
                              <summary>
                                {stage.name} — scenario evidence
                              </summary>
                              <CaseFields
                                value={c}
                                change={(v) =>
                                  set({
                                    ...input,
                                    scenarios: input.scenarios.map((x) =>
                                      x === sc
                                        ? {
                                            ...x,
                                            stages: x.stages.map((y) =>
                                              y === c ? v : y,
                                            ),
                                          }
                                        : x,
                                    ),
                                  })
                                }
                              />
                            </details>
                          )
                        );
                      })}
                    </details>
                  );
                })}
                <h2>Directed interfaces and buffers</h2>
                {input.connections.map((c, i) => (
                  <details className="nac-card" key={c.id}>
                    <summary>
                      Connection {i + 1}:{" "}
                      {input.stages.find((s) => s.id === c.from_id)?.name} →{" "}
                      {input.stages.find((s) => s.id === c.to_id)?.name}
                    </summary>
                    {(["from_id", "to_id"] as const).map((k) => (
                      <label className="nac-field" key={k}>
                        {k === "from_id" ? "From stage" : "To stage"}
                        <select
                          value={c[k]}
                          onChange={(e) =>
                            set({
                              ...input,
                              connections: input.connections.map((x) =>
                                x === c ? { ...x, [k]: e.target.value } : x,
                              ),
                            })
                          }
                        >
                          {input.stages.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                    <fieldset>
                      <legend>Applies to scenarios</legend>
                      {source.study.scenarios.map((s) => (
                        <label key={s.id}>
                          <input
                            type="checkbox"
                            checked={c.scenario_ids.includes(s.id)}
                            onChange={(e) =>
                              set({
                                ...input,
                                connections: input.connections.map((x) =>
                                  x === c
                                    ? {
                                        ...x,
                                        scenario_ids: e.target.checked
                                          ? [...x.scenario_ids, s.id]
                                          : x.scenario_ids.filter(
                                              (id) => id !== s.id,
                                            ),
                                      }
                                    : x,
                                ),
                              })
                            }
                          />
                          {s.name}
                        </label>
                      ))}
                    </fieldset>
                    {c.checks.map((check, j) => (
                      <CheckFields
                        key={check.aspect}
                        value={check}
                        change={(v) =>
                          set({
                            ...input,
                            connections: input.connections.map((x) =>
                              x === c
                                ? {
                                    ...x,
                                    checks: x.checks.map((y, k) =>
                                      j === k ? v : y,
                                    ),
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                    ))}
                    <FactFields
                      label="Usable buffer positions"
                      unit="pots"
                      fact={c.buffer_positions}
                      change={(buffer_positions) =>
                        set({
                          ...input,
                          connections: input.connections.map((x) =>
                            x === c ? { ...x, buffer_positions } : x,
                          ),
                        })
                      }
                    />
                    <FactFields
                      label="Downstream demand"
                      unit="pots per minute"
                      fact={c.downstream_demand_per_minute}
                      change={(downstream_demand_per_minute) =>
                        set({
                          ...input,
                          connections: input.connections.map((x) =>
                            x === c
                              ? { ...x, downstream_demand_per_minute }
                              : x,
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        set({
                          ...input,
                          connections: input.connections.filter((x) => x !== c),
                        })
                      }
                    >
                      Remove connection
                    </Button>
                  </details>
                ))}
                {input.stages.length > 1 && input.connections.length < 40 && (
                  <Button
                    type="button"
                    onClick={() =>
                      set({
                        ...input,
                        connections: [
                          ...input.connections,
                          blankConnection(
                            crypto.randomUUID(),
                            input.stages[0].id,
                            input.stages[1].id,
                            input.scenarios.map((s) => s.scenario_id),
                          ),
                        ],
                      })
                    }
                  >
                    Add directed connection
                  </Button>
                )}
                {editor && (
                  <Text
                    label="Reason for saving this revision"
                    max={1000}
                    value={reason}
                    change={setReason}
                  />
                )}
              </fieldset>
              {editor && (
                <Button
                  type="submit"
                  disabled={
                    frozen ||
                    changed ||
                    !!data.error ||
                    !d.can_edit ||
                    !reason?.trim()
                  }
                >
                  Save and assess
                </Button>
              )}
            </form>
          )}
        </>
      )}
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
      {report && (
        <section>
          <h2>Saved assessment results</h2>
          <p>
            {report.technical_state} · {report.edition}
          </p>
          {editor && (
            <p>
              These results belong to the saved revision. Save the draft to
              calculate a new result.
            </p>
          )}
          {report.scenarios.map((s) => (
            <article key={s.scenario_id}>
              <h3>
                {
                  d.selected?.source_snapshot.study.scenarios.find(
                    (x) => x.id === s.scenario_id,
                  )?.name
                }{" "}
                · {s.phase}
              </h3>
              <p>
                {s.capacity_state} · Line rate{" "}
                {s.line_rate?.display ?? "Unknown"} pots/hour · Good output{" "}
                {s.good_output?.display ?? "Unknown"} pots/shift ·{" "}
                {s.target_state}
              </p>
              <p>
                Bottleneck:{" "}
                {s.bottleneck_stage_ids
                  .map(
                    (id) =>
                      d.selected?.proposal.stages.find((s) => s.id === id)
                        ?.name,
                  )
                  .join(", ") || "Not assessed"}
              </p>
            </article>
          ))}
          <h3>Clarifications and blockers</h3>
          <ul>
            {report.findings.map((f) => (
              <li key={f.key}>
                <strong>
                  {f.subject}: {f.message}
                </strong>{" "}
                {f.rule} · {f.gate} · Owner {f.owner ?? "Unassigned"}.{" "}
                {f.action}
              </li>
            ))}
          </ul>
          <h3>Saved study outputs</h3>
          <p>
            Exact retained revision outputs, including equipment quantities,
            interfaces and evidence.
          </p>
          {(["study", "clarifications"] as const).map((kind) => (
            <p key={kind}>
              <a
                href={`/api/v1/${path}/output?revision_id=${d.selected!.id}&kind=${kind}`}
              >
                Download{" "}
                {kind === "study"
                  ? "technical study"
                  : "internal clarifications"}
              </a>
            </p>
          ))}
        </section>
      )}
      <p>{d.handover}</p>
    </div>
  );
}
