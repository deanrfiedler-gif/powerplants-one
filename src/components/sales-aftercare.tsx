"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useId } from "react";
import { useRouter } from "next/navigation";
import type { readAftercare, listAftercare } from "../sales/aftercare-service";
import type { aftercareOptions } from "../sales/aftercare-options";
import type { ReviewDraft } from "../sales/aftercare-model";
import { useIdentity } from "./business-session";
import { useCrmResource } from "./crm-state";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  PageHeader,
  Stamp,
  Status,
  type Option,
} from "./business-ui";
import { Button } from "./ui/button";
import { RecordTabs, RecordPanel, useUnsavedChanges } from "./record-ui";
import { useRecoverableCommand } from "../shared/ui/use-recoverable-command";
type Detail = Awaited<ReturnType<typeof readAftercare>>;
type Choices = Awaited<ReturnType<typeof aftercareOptions>>;
function useAftercareCommand(id: string, reload: () => void) {
  const savedRef = useRef(reload);
  useEffect(() => {
    savedRef.current = reload;
  }, [reload]);
  const p = useIdentity(),
    command = useRecoverableCommand({
      key: `ppo-aftercare:${id}`,
      scope: p,
      transport: api,
      accepts: (e) =>
        e.path === "sales/aftercare" || e.path === `sales/aftercare/${id}`,
    });
  useEffect(() => {
    if (command.accepted) savedRef.current();
  }, [command.accepted]);
  return command;
}
function Recovery({
  command,
}: {
  command: ReturnType<typeof useAftercareCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      {command.pending && (
        <section role="status">
          <p>
            Outcome uncertain. Reconcile this original before another change.
          </p>
          <Button busy={command.busy} onClick={() => void command.recover()}>
            Check original result
          </Button>
          <Button busy={command.busy} onClick={() => void command.retry()}>
            Retry exact original
          </Button>
        </section>
      )}
      {command.saved && <p role="status">{command.saved}</p>}
    </>
  );
}
export function AftercareList() {
  const r = useCrmResource<Awaited<ReturnType<typeof listAftercare>>>(
      "sales/aftercare",
      true,
    ),
    [source, setSource] = useState(""),
    [filter, setFilter] = useState("All"),
    router = useRouter(),
    command = useAftercareCommand("create", r.reload);
  async function create() {
    const id = crypto.randomUUID(),
      receipt = await command.send(
        "sales/aftercare",
        {
          id,
          source_report_id: source,
          reason: "Open an aftercare review for an issued Service report",
        },
        "/sales/aftercare",
        "Aftercare record",
        id,
      );
    if (receipt) router.push(`/sales/aftercare/${id}`);
  }
  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Aftercare & renewal"
        description="Review customer outcomes, commitments and owned follow-up from an exact source event."
      />
      <p>
        No default review interval, satisfaction scale or competence standard is
        configured.
      </p>
      <Recovery command={command} />
      {r.loading && <p role="status">Loading aftercare…</p>}
      <ErrorNotice error={r.error} />
      {!!r.error && <Button onClick={r.reload}>Retry aftercare</Button>}
      {!r.error && r.data && (
        <>
          <section className="crm-panel">
            <h2>Plan aftercare</h2>
            <SelectField
              name="source_report_id"
              label="Issued Service report"
              value={source}
              onChange={setSource}
              options={r.data.sources}
            />
            <Button
              disabled={!source || !!command.pending || !command.ready}
              busy={command.busy}
              onClick={() => void create()}
            >
              Open aftercare review
            </Button>
            <p>
              Current eligible source: issued native Service report. Orders,
              agreements and delivered-project adapters are unavailable.
            </p>
          </section>
          <SelectField
            name="aftercare-filter"
            label="Worklist state"
            value={filter}
            onChange={setFilter}
            options={[
              "All",
              "Open",
              "ReviewCompleted",
              "Closed",
              "Date needed",
            ].map((id) => ({ id, display_name: id }))}
          />
          <p>
            {r.data.completeness} permitted population · As at{" "}
            <Stamp value={r.data.observed_at} />
          </p>
          {r.data.items
            .filter(
              (d) =>
                filter === "All" ||
                filter === d.record.state ||
                (filter === "Date needed" && !d.record.content.review.due_date),
            )
            .map((d) => (
              <article className="crm-panel" key={d.record.id}>
                <h2>
                  <Link href={`/sales/aftercare/${d.record.id}`}>
                    {d.customer.context.display_name} · Aftercare review
                  </Link>
                </h2>
                <p>
                  <Status value={d.record.state} /> ·{" "}
                  {d.record.content.review.due_date ?? "Date needed"}
                  {d.source_changed ? " · Source changed" : ""}
                </p>
                <p>
                  Review revision {d.record.revision} ·{" "}
                  {d.record.content.review.due_detail ||
                    "Review date basis needed"}
                </p>
              </article>
            ))}
          {!r.data.items.length && <p>No permitted aftercare records.</p>}
        </>
      )}
    </>
  );
}
export function AftercareDetail({ id }: { id: string }) {
  const r = useCrmResource<Detail>(`sales/aftercare/${id}`, true),
    options = useCrmResource<Choices>(`sales/aftercare/${id}/options`, true);
  return (
    <>
      {r.loading && <p role="status">Loading aftercare review…</p>}
      <ErrorNotice error={r.error} />
      {!!r.error && <Button onClick={r.reload}>Retry review</Button>}
      {options.loading && (
        <p role="status">
          Loading permitted people, equipment and follow-up choices…
        </p>
      )}
      <ErrorNotice error={options.error} />
      {!!options.error && (
        <Button onClick={options.reload}>Retry source choices</Button>
      )}
      {!r.error && r.data && (
        <AftercareWorkspace
          key={id}
          detail={r.data}
          choices={options.data}
          reload={r.reload}
        />
      )}
    </>
  );
}
function AftercareWorkspace({
  detail: d,
  choices,
  reload,
}: {
  detail: Detail;
  choices: Choices | null;
  reload: () => void;
}) {
  const row = d.record,
    x = row.content,
    [review, setReview] = useState(x.review),
    [dirty, setDirty] = useState(false),
    [baseVersion, setBaseVersion] = useState(row.version),
    [tab, setTab] = useState("review"),
    [reason, setReason] = useState(""),
    command = useAftercareCommand(row.id, reload);
  useEffect(() => {
    if (!dirty && row.version >= baseVersion) {
      let live = true;
      queueMicrotask(() => {
        if (live) {
          setReview(row.content.review);
          setBaseVersion(row.version);
        }
      });
      return () => {
        live = false;
      };
    }
  }, [row.version, row.content.review, dirty, baseVersion]);
  useEffect(() => {
    if (command.accepted) {
      let live = true;
      queueMicrotask(() => {
        if (live) {
          setDirty(false);
          setBaseVersion(command.accepted!.receipt.record_version);
        }
      });
      return () => {
        live = false;
      };
    }
  }, [command.accepted]);
  const refreshing = !!command.accepted && row.version < command.accepted.receipt.record_version;
  const blocked = command.busy || !!command.pending || !command.ready || refreshing;
  useUnsavedChanges(dirty, !!command.pending);
  const update = <K extends keyof ReviewDraft>(
    key: K,
    value: ReviewDraft[K],
  ) => {
    setReview((old) => ({ ...old, [key]: value }));
    setDirty(true);
  };
  const act = (action: string, data: Record<string, unknown> = {}) =>
    command.send(
      `sales/aftercare/${row.id}`,
      {
        action,
        data,
        expected_version: action === "SaveReview" ? baseVersion : row.version,
        reason: reason || `Record ${action} in synthetic aftercare`,
      },
      `/sales/aftercare/${row.id}`,
      action,
      row.id,
    );
  const opts = (values: string[]) =>
    values.map((id) => ({ id, display_name: id }));
  return (
    <>
      <Link href="/sales/aftercare">← Aftercare worklist</Link>
      <PageHeader
        eyebrow="Sales aftercare"
        title={d.customer.context.display_name}
        description={`Review revision ${row.revision} · Saved version ${row.version}`}
      />
      <p>
        <Status value={row.state} /> ·{" "}
        <Link href={`/customers/${row.organisation_id}`}>Customer 360</Link> ·{" "}
        <Link href={`/sites/${row.site_id}`}>Site</Link>
      </p>
      <Recovery command={command} />
      {refreshing && <p role="status">Loading the saved revision before the next action…</p>}
      {d.owner_conflict && (
        <p role="status">
          The aftercare account-owner assignment differs from Customer 360.
          Reconcile the source account owner and record the intended aftercare
          owners explicitly before completing the review.
        </p>
      )}
      {baseVersion !== row.version && dirty && (
        <section role="alert">
          <h2>Saved review changed</h2>
          <p>
            Your review draft is retained. Compare saved evidence before
            retrying.
          </p>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(row.content.review, null, 2)}
          </pre>
          <Button
            disabled={blocked}
            onClick={() => setBaseVersion(row.version)}
          >
            Use current version for deliberate retry
          </Button>
        </section>
      )}
      {d.source_changed && (
        <p role="alert">
          The source changed since preparation. Retain previous evidence and
          refresh preparation before completing a correction.
        </p>
      )}
      {dirty && <p role="status">Unsaved review changes</p>}
      <RecordTabs
        id="aftercare"
        label="Aftercare sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "review", label: "Customer review" },
          { id: "service", label: "Concerns & commitments" },
          { id: "training", label: "Training & follow-up" },
          { id: "commercial", label: "Maintenance & renewal" },
          { id: "history", label: "History & sources" },
        ]}
      />
      <Field
        name="aftercare-reason"
        label="Reason / evidence note for the next saved action"
        value={reason}
        onChange={setReason}
        multiline
        maxLength={1000}
      />
      <RecordPanel id="aftercare" tab="review" value={tab}>
        <section className="crm-panel">
          <h2>Plan and record the review</h2>
          <p>
            Customer acceptance, delivery, issue resolution, training,
            competence, opportunity creation and agreement activation remain
            separate source facts. A completed review sets only Review
            conducted.
          </p>
          <fieldset disabled={!d.can_manage || blocked || row.state !== "Open"}>
            <Field
              name="due_date"
              label="Review due date"
              type="date"
              value={review.due_date ?? ""}
              onChange={(v) => update("due_date", v || null)}
            />
            <SelectField
              name="due_basis"
              label="Date basis"
              value={review.due_basis}
              onChange={(v) =>
                update("due_basis", v as ReviewDraft["due_basis"])
              }
              options={opts([
                "UserChoice",
                "RecordedCommitment",
                "SourcedRule",
              ])}
            />
            <Field
              name="due_detail"
              label="Date choice / commitment / reason date needed"
              value={review.due_detail}
              onChange={(v) => update("due_detail", v)}
              multiline
            />
            {review.due_basis === "SourcedRule" && (
              <>
                <Field
                  name="rule_reference"
                  label="Exact rule source"
                  value={review.rule_reference}
                  onChange={(v) => update("rule_reference", v)}
                />
                <Field
                  name="rule_revision"
                  label="Exact rule revision"
                  value={review.rule_revision}
                  onChange={(v) => update("rule_revision", v)}
                />
              </>
            )}
            <Field
              name="review_date"
              label="Customer review date"
              type="date"
              value={review.review_date ?? ""}
              onChange={(v) => update("review_date", v || null)}
            />
            <Field
              name="method"
              label="Review method and evidence limits"
              value={review.method}
              onChange={(v) => update("method", v)}
              multiline
            />
            <h3>Participants and recorded roles</h3>
            {review.participants.map((v, i) => (
              <div key={i}>
                <SelectField
                  name={`participant-${i}`}
                  label="Participant"
                  value={v.person_id}
                  options={choices?.people ?? []}
                  onChange={(id) =>
                    update(
                      "participants",
                      review.participants.map((p, j) =>
                        i === j ? { ...p, person_id: id } : p,
                      ),
                    )
                  }
                />
                <Field
                  name={`role-${i}`}
                  label="Recorded role (does not imply signing authority)"
                  value={v.role}
                  onChange={(role) =>
                    update(
                      "participants",
                      review.participants.map((p, j) =>
                        i === j ? { ...p, role } : p,
                      ),
                    )
                  }
                />
                <Button
                  onClick={() =>
                    update(
                      "participants",
                      review.participants.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove participant
                </Button>
              </div>
            ))}
            <Button
              onClick={() =>
                update("participants", [
                  ...review.participants,
                  { person_id: "", role: "" },
                ])
              }
            >
              Add participant
            </Button>
            <h3>Feedback and evidence</h3>
            <p>Satisfaction: Not assessed. No rating scale is adopted.</p>
            {review.feedback.map((v, i) => (
              <div key={i}>
                <SelectField
                  name={`speaker-${i}`}
                  label="Speaker / attributed person"
                  value={v.person_id}
                  options={choices?.people ?? []}
                  onChange={(id) =>
                    update(
                      "feedback",
                      review.feedback.map((p, j) =>
                        i === j ? { ...p, person_id: id } : p,
                      ),
                    )
                  }
                />
                <SelectField
                  name={`basis-${i}`}
                  label="Statement basis"
                  value={v.basis}
                  options={opts([
                    "Quoted",
                    "Paraphrased",
                    "InternalInterpretation",
                  ])}
                  onChange={(basis) =>
                    update(
                      "feedback",
                      review.feedback.map((p, j) =>
                        i === j ? { ...p, basis: basis as typeof p.basis } : p,
                      ),
                    )
                  }
                />
                <Field
                  name={`statement-${i}`}
                  label="Statement and context"
                  multiline
                  value={v.statement}
                  onChange={(statement) =>
                    update(
                      "feedback",
                      review.feedback.map((p, j) =>
                        i === j ? { ...p, statement } : p,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <Button
              onClick={() =>
                update("feedback", [
                  ...review.feedback,
                  { person_id: "", basis: "Paraphrased", statement: "" },
                ])
              }
            >
              Add feedback
            </Button>
            {(
              [
                ["benefits", "Reported benefits"],
                ["concerns", "Concerns and questions"],
                ["next_steps", "Agreed next steps (or explicitly None)"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                name={key}
                label={label}
                multiline
                value={review[key]}
                onChange={(v) => update(key, v)}
              />
            ))}
            <h3>Shared follow-up Activities</h3>
            <p>
              <Link href="/work/new">Create an owned Activity</Link> linked to
              this customer or site, then refresh this page. Activity owners are
              independent of review ownership.
            </p>
            {choices?.activities.map((a) => (
              <label key={a.id}>
                <input
                  type="checkbox"
                  checked={review.activity_ids.includes(a.id)}
                  onChange={(e) =>
                    update(
                      "activity_ids",
                      e.target.checked
                        ? [...review.activity_ids, a.id]
                        : review.activity_ids.filter((id) => id !== a.id),
                    )
                  }
                />
                {a.display_name}
              </label>
            ))}
            <h3>Commitments</h3>
            {review.commitments.map((v, i) => (
              <div key={v.id}>
                <Field
                  name={`commitment-${i}`}
                  label="Commitment"
                  value={v.summary}
                  multiline
                  onChange={(summary) =>
                    update(
                      "commitments",
                      review.commitments.map((p, j) =>
                        i === j ? { ...p, summary } : p,
                      ),
                    )
                  }
                />
                <SelectField
                  name={`disposition-${i}`}
                  label="Disposition"
                  value={v.disposition}
                  options={opts([
                    "Open",
                    "Fulfilled",
                    "NotApplicable",
                    "CarriedAsOwnedAction",
                  ])}
                  onChange={(disposition) =>
                    update(
                      "commitments",
                      review.commitments.map((p, j) =>
                        i === j
                          ? {
                              ...p,
                              disposition: disposition as typeof p.disposition,
                            }
                          : p,
                      ),
                    )
                  }
                />
                <Field
                  name={`commitment-note-${i}`}
                  label="Disposition evidence"
                  value={v.note}
                  onChange={(note) =>
                    update(
                      "commitments",
                      review.commitments.map((p, j) =>
                        i === j ? { ...p, note } : p,
                      ),
                    )
                  }
                />
                <SelectField
                  name={`commitment-activity-${i}`}
                  label="Owned dated Activity"
                  value={v.activity_id ?? ""}
                  options={choices?.activities ?? []}
                  onChange={(activity_id) =>
                    update(
                      "commitments",
                      review.commitments.map((p, j) =>
                        i === j
                          ? { ...p, activity_id: activity_id || null }
                          : p,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <Button
              onClick={() =>
                update("commitments", [
                  ...review.commitments,
                  {
                    id: crypto.randomUUID(),
                    summary: "",
                    disposition: "Open",
                    note: "",
                    activity_id: null,
                  },
                ])
              }
            >
              Add commitment
            </Button>
          </fieldset>
          {d.can_manage && (
            <>
              {row.state === "Open" ? (
                <>
                  <Button
                    disabled={blocked}
                    onClick={() => void act("SaveReview", { review })}
                  >
                    Save review
                  </Button>
                  <Button
                    disabled={blocked || dirty}
                    onClick={() => void act("PrepareReview")}
                  >
                    Refresh review preparation
                  </Button>
                  <Button
                    disabled={
                      blocked ||
                      dirty ||
                      d.source_changed ||
                      !!d.blockers.length
                    }
                    onClick={() => void act("CompleteReview")}
                  >
                    Complete customer review
                  </Button>
                </>
              ) : (
                <Button
                  disabled={blocked || !reason.trim()}
                  onClick={() => void act("CorrectReview")}
                >
                  Open correction
                </Button>
              )}
              <p>
                {d.blockers.length
                  ? `Completion needs: ${d.blockers.join("; ")}`
                  : "Review fields complete; source and owned actions checked on the server."}
              </p>
              {row.state === "ReviewCompleted" && (
                <Button disabled={blocked} onClick={() => void act("Close")}>
                  Close aftercare record
                </Button>
              )}
            </>
          )}
          <ActionForm
            name="ChangeOwners"
            label="Change account and review owners"
            fields={[
              ["owner_id", "Account owner", "reviewOwner"],
              ["review_owner_id", "Review owner", "reviewOwner"],
            ]}
            choices={choices}
            d={d}
            disabled={blocked || !d.can_manage}
            act={act}
          />
        </section>
      </RecordPanel>
      <RecordPanel id="aftercare" tab="service" value={tab}>
        <section className="crm-panel">
          <h2>Service concerns and receiving</h2>
          <p>
            Preparation, submission, Service acceptance and Service resolution
            are distinct. Open case source: {d.customer.sections.cases.state} ·
            As at <Stamp value={d.customer.sections.cases.observed_at} />
          </p>
          {d.customer.sections.cases.items.map((c) => (
            <p key={c.id}>
              <Link href={c.href}>{c.label}</Link> · {c.state}
            </p>
          ))}
          <p>Commitments are edited with the saved Customer review.</p>
          <ActionForm
            name="LinkCase"
            label="Link an existing case"
            fields={[["id", "Existing case", "case"]]}
            choices={choices}
            d={d}
            disabled={blocked || !d.can_manage}
            act={act}
          />
          <ReferralForm
            kind="Service"
            d={d}
            choices={choices}
            blocked={blocked}
            act={act}
          />
        </section>
      </RecordPanel>
      <RecordPanel id="aftercare" tab="training" value={tab}>
        <section className="crm-panel">
          <h2>Training & documentation</h2>
          <p>
            Arrangement creates no booking. Attendance, delivery and assessment
            remain separate. No adopted competence standard exists; Not assessed
            is retained.
          </p>
          <ActionForm
            name="TrainingNeed"
            label="Record training or documentation need"
            fields={[
              ["need", "Training / documentation need", "text"],
              ["asset_id", "Equipment", "asset"],
              ["configuration", "Exact software / configuration basis", "text"],
              [
                "material_basis",
                "Exact material revision, applicability and missing / superseded guidance",
                "text",
              ],
            ]}
            choices={choices}
            d={d}
            disabled={blocked || !d.can_manage}
            act={act}
          />
          {x.training.map((t, index) => (
            <article key={index}>
              <h3>{t.need}</h3>
              <p>
                {t.configuration} · {t.material_basis}
              </p>
              <p>
                Arrangement: {t.arranged_on ?? "Not arranged"} · Attendance:{" "}
                {t.attendance || "Not recorded"} · Delivery:{" "}
                {t.delivery || "Not recorded"} · Assessment: {t.assessment}
              </p>
              <p>
                {t.method} · {t.limits}
              </p>
              {!t.arranged_on ? (
                <ActionForm
                  name="TrainingArrangement"
                  label="Confirm customer-agreed arrangement"
                  fields={[
                    ["date", "Customer-agreed date", "date"],
                    [
                      "note",
                      "Agreement evidence; scheduling owns any booking",
                      "text",
                    ],
                  ]}
                  fixed={{ index }}
                  choices={choices}
                  d={d}
                  disabled={blocked || !d.can_manage}
                  act={act}
                />
              ) : !t.attendance ? (
                <ActionForm
                  name="TrainingAttendance"
                  label="Record attendance"
                  fields={[["note", "Attendance evidence", "text"]]}
                  fixed={{ index }}
                  choices={choices}
                  d={d}
                  disabled={blocked || !d.can_manage}
                  act={act}
                />
              ) : !t.delivery ? (
                <ActionForm
                  name="TrainingDelivery"
                  label="Record training delivery"
                  fields={[
                    ["note", "Delivery evidence and limits", "text"],
                    ["activity_id", "Owned follow-up", "activity"],
                  ]}
                  fixed={{ index }}
                  choices={choices}
                  d={d}
                  disabled={blocked || !d.can_manage}
                  act={act}
                />
              ) : (
                <ActionForm
                  name="TrainingAssessment"
                  label="Record bounded assessment"
                  fields={[
                    ["assessment", "Assessment state", "assessment"],
                    ["method", "Method / observation", "text"],
                    [
                      "limits",
                      "Stated limits (no competence certification)",
                      "text",
                    ],
                  ]}
                  fixed={{ index }}
                  choices={choices}
                  d={d}
                  disabled={blocked || !d.can_manage}
                  act={act}
                />
              )}
            </article>
          ))}
          <p>
            Document requests use an owned Activity linked to the source
            customer/site and its document owner; document bytes remain
            source-owned.
          </p>
        </section>
      </RecordPanel>
      <RecordPanel id="aftercare" tab="commercial" value={tab}>
        <section className="crm-panel">
          <h2>Maintenance, renewal & upgrade discussion</h2>
          <p>
            {d.agreements.state}: {d.agreements.basis}. No agreement or renewal
            term is changed here.
          </p>
          <p>
            Existing CRM opportunities: {d.customer.sections.deals.state} · As
            at <Stamp value={d.customer.sections.deals.observed_at} />
          </p>
          {d.customer.sections.deals.items.map((o) => (
            <p key={o.id}>
              <Link href={o.href}>{o.label}</Link> · {o.state}
            </p>
          ))}
          <p>
            Open customer concerns remain:{" "}
            {x.review.concerns || "Not recorded; consult source cases"}
          </p>
          <ActionForm
            name="PrepareCommercial"
            label="Prepare commercial discussion"
            fields={[
              ["observation", "Source observation and evidence", "text"],
              ["need", "Identified customer need", "text"],
              ["assumptions", "Unresolved assumptions", "text"],
              [
                "existing_checked",
                "I reviewed the permitted existing-opportunity source",
                "check",
              ],
            ]}
            choices={choices}
            d={d}
            disabled={blocked || !d.can_manage}
            act={act}
          />
          <ActionForm
            name="LinkOpportunity"
            label="Link existing opportunity"
            fields={[
              ["id", "Opportunity", "opportunity"],
              ["existing_checked", "Existing opportunities reviewed", "check"],
            ]}
            choices={choices}
            d={d}
            disabled={blocked || !d.can_manage}
            act={act}
          />
          <ReferralForm
            kind="Crm"
            d={d}
            choices={choices}
            blocked={blocked}
            act={act}
          />
        </section>
      </RecordPanel>
      <RecordPanel id="aftercare" tab="history" value={tab}>
        <section className="crm-panel">
          <h2>Source freshness and retained history</h2>
          <p>
            Account owner from Customer 360:{" "}
            {d.customer.context.owner_name ?? "Unknown"}. Aftercare owner
            assignments are explicit workflow responsibilities; conflicting
            source owners require reconciliation in Customer 360.
          </p>
          {Object.entries(d.customer.sections).map(([key, s]) => (
            <p key={key}>
              {key}: {s.state} · {s.basis} · <Stamp value={s.observed_at} />
            </p>
          ))}
          <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {JSON.stringify(d.current_basis, null, 2)}
          </pre>
          {d.history.map((e) => (
            <details key={e.id}>
              <summary>
                {e.action} · revision {e.revision} · version {e.version}
              </summary>
              <p>
                {e.note} · {e.recorded_by} ·{" "}
                <Stamp value={String(e.recorded_at)} />
              </p>
              <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {JSON.stringify(e.content, null, 2)}
              </pre>
            </details>
          ))}
        </section>
      </RecordPanel>
    </>
  );
}
type Action = (
  action: string,
  data?: Record<string, unknown>,
) => Promise<unknown>;
type FieldSpec = readonly [
  string,
  string,
  (
    | "text"
    | "date"
    | "check"
    | "reviewOwner"
    | "serviceOwner"
    | "crmOwner"
    | "activity"
    | "case"
    | "opportunity"
    | "asset"
    | "assessment"
    | "outcome"
  ),
];
function ActionForm({
  name,
  label,
  fields,
  fixed = {},
  choices,
  d,
  disabled,
  act,
}: {
  name: string;
  label: string;
  fields: readonly FieldSpec[];
  fixed?: Record<string, unknown>;
  choices: Choices | null;
  d: Detail;
  disabled: boolean;
  act: Action;
}) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const formId = useId();
  useUnsavedChanges(Object.keys(data).length > 0);
  const pick = (type: FieldSpec[2]): Option[] =>
    type === "reviewOwner"
      ? (choices?.owners.filter((x) => x.review) ?? [])
      : type === "serviceOwner"
        ? (choices?.owners.filter((x) => x.service) ?? [])
        : type === "crmOwner"
          ? (choices?.owners.filter((x) => x.crm) ?? [])
          : type === "activity"
            ? (choices?.activities ?? [])
            : type === "asset"
              ? (choices?.assets ?? [])
              : type === "case"
                ? d.customer.sections.cases.items.map((x) => ({
                    id: x.id,
                    display_name: x.label,
                  }))
                : type === "opportunity"
                  ? d.customer.sections.deals.items.map((x) => ({
                      id: x.id,
                      display_name: x.label,
                    }))
                  : (type === "assessment"
                      ? ["Not assessed", "Assessed"]
                      : ["Accepted", "Returned", "Unknown"]
                    ).map((id) => ({ id, display_name: id }));
  return (
    <details className="crm-panel">
      <summary>{label}</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await act(name, { ...fixed, ...data });
          if (result) setData({});
        }}
      >
        <fieldset disabled={disabled}>
          {fields.map(([key, title, type]) =>
            type === "check" ? (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={data[key] === true}
                  onChange={(e) =>
                    setData((old) => ({ ...old, [key]: e.target.checked }))
                  }
                />
                {title}
              </label>
            ) : type === "text" || type === "date" ? (
              <Field
                key={key}
                name={`${formId}-${name}-${key}`}
                label={title}
                value={String(data[key] ?? "")}
                onChange={(value) =>
                  setData((old) => ({ ...old, [key]: value }))
                }
                multiline={type === "text"}
                type={type === "date" ? "date" : "text"}
              />
            ) : (
              <SelectField
                key={key}
                name={`${formId}-${name}-${key}`}
                label={title}
                value={String(data[key] ?? "")}
                onChange={(value) =>
                  setData((old) => ({ ...old, [key]: value }))
                }
                options={pick(type)}
              />
            ),
          )}
          <Button type="submit">{label}</Button>
        </fieldset>
      </form>
    </details>
  );
}
function ReferralForm({
  kind,
  d,
  choices,
  blocked,
  act,
}: {
  kind: "Service" | "Crm";
  d: Detail;
  choices: Choices | null;
  blocked: boolean;
  act: Action;
}) {
  const ref =
      kind === "Service"
        ? d.record.content.service_referral
        : d.record.content.crm_handover,
    canReceive = kind === "Service" ? d.can_receive_service : d.can_receive_crm;
  return (
    <section>
      <h3>{kind === "Service" ? "Service referral" : "CRM handover"}</h3>
      {ref && (
        <>
          <p>
            <Status value={ref.state} /> · revision {ref.revision}
          </p>
          <p>
            {ref.summary} · {ref.context} · {ref.impact}
          </p>
          <p>{ref.note}</p>
        </>
      )}
      {(!ref || ref.state === "Returned") && (
        <ActionForm
          name={`${ref ? "Revise" : "Prepare"}${kind}`}
          label={ref ? "Prepare corrected successor" : "Prepare exact handover"}
          fields={[
            [
              "summary",
              kind === "Service"
                ? "Reported symptom (no diagnosis)"
                : "Recorded need and scope",
              "text",
            ],
            [
              "context",
              "Exact site/equipment/configuration and when observed",
              "text",
            ],
            [
              "impact",
              "Reported impact / assumptions and source evidence",
              "text",
            ],
            [
              "receiving_owner_id",
              "Proposed receiving owner",
              kind === "Service" ? "serviceOwner" : "crmOwner",
            ],
            ["next_activity_id", "Owned next contact commitment", "activity"],
            [
              "duplicate_check",
              "I reviewed existing cases / opportunities",
              "check",
            ],
          ]}
          choices={choices}
          d={d}
          disabled={blocked || !d.can_manage}
          act={act}
        />
      )}{" "}
      {ref?.state === "Prepared" && (
        <Button
          disabled={blocked || !d.can_manage}
          onClick={() => void act(`Submit${kind}`)}
        >
          Submit exact handover
        </Button>
      )}
      {ref && ["Submitted", "Unknown"].includes(ref.state) && (
        <ActionForm
          name={`${kind}Outcome`}
          label="Record receiving outcome"
          fields={[
            ["outcome", "Receiving outcome", "outcome"],
            [
              "receiving_id",
              "Confirmed receiving record",
              kind === "Service" ? "case" : "opportunity",
            ],
            [
              "note",
              "Receiving evidence / return reason / unknown outcome",
              "text",
            ],
          ]}
          choices={choices}
          d={d}
          disabled={blocked || !canReceive}
          act={act}
        />
      )}
      <p>
        {kind === "Service"
          ? "Acceptance links the receiving case; it does not resolve the technical concern."
          : "Create any new opportunity through CRM's existing qualification controls, then confirm the receiving reference. Handover acceptance does not qualify or create a deal here."}
      </p>
    </section>
  );
}
