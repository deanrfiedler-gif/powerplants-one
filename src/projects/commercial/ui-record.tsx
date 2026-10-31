"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReadState, Stamp, useResource } from "../../components/business-ui";
import { Button, ButtonLink } from "../../components/ui/button";
import {
  SharedRecord,
  RecordFactSection,
} from "../../components/ui/shared-record";
import { RecordTabs, RecordPanel } from "../../components/record-ui";
import { WorklistPanel } from "../../components/crm-worklist-tools";
import { RecordIdentity } from "../../shell/record-identity";
import { CommercialCommand } from "./ui-command";
import { PendingCommercialSave, CommercialState } from "./ui-common";
import {
  kindLabel,
  obligationOverdue,
  moneyLabel,
  recordHref,
  type DetailRead,
  type Intent,
} from "./ui-model";
import "./ui.css";

export function CommercialRecord({
  project,
  entry,
}: {
  project: string;
  entry: string;
}) {
  const router = useRouter();
  const [before, setBefore] = useState<number | null>(null),
    [tab, setTab] = useState("overview"),
    [intent, setIntent] = useState<Intent | null>(null),
    [blocked, setBlocked] = useState(false);
  const read = useResource<DetailRead>(
    `projects/${project}/commercial?id=${entry}${before ? `&before_version=${before}` : ""}`,
  );
  const data = read.data,
    row = data?.current,
    context = data?.context;
  const current = !!row && !read.loading && !read.error;
  const openActions =
    data?.current_actions?.filter(
      (a) => !["Completed", "Cancelled"].includes(a.state),
    ) ?? [];
  const start = (action: Intent["action"]) => {
    if (row)
      setIntent({
        action,
        kind: row.kind,
        row,
        basis: row.basis_id ?? undefined,
      });
  };
  const actions = row ? (
    <>
      <Button
        disabled={read.loading || !!intent}
        onClick={() => {
          setBefore(null);
          read.reload();
        }}
      >
        Refresh
      </Button>
      {row.basis_id && (
        <ButtonLink href={recordHref(project, row.basis_id)}>
          Open basis
        </ButtonLink>
      )}
      {current && data.can_prepare && (
        <>
          {((row.kind === "Basis" &&
            ["Draft", "Returned"].includes(row.state)) ||
            (row.kind === "Variation" &&
              ["Requested", "Assessed", "Rejected", "Disputed"].includes(
                row.state,
              )) ||
            (row.kind === "Obligation" && row.state === "Open")) && (
            <Button onClick={() => start("Revise")}>Revise</Button>
          )}
          {((row.kind === "Basis" &&
            ["Draft", "Returned"].includes(row.state)) ||
            (row.kind === "Variation" && row.state === "Assessed") ||
            (row.kind === "Obligation" && row.state === "Open")) && (
            <Button onClick={() => start("Submit")}>
              {row.kind === "Obligation"
                ? "Request waiver"
                : "Submit for review"}
            </Button>
          )}
          {["Basis", "Variation"].includes(row.kind) &&
            !["Approved", "Withdrawn"].includes(row.state) && (
              <Button onClick={() => start("Withdraw")}>Withdraw</Button>
            )}
          {row.kind === "Obligation" && row.state === "Open" && (
            <Button
              variant="primary"
              onClick={() =>
                openActions.length || !row.content.evidence
                  ? setBlocked(true)
                  : start("Satisfy")
              }
            >
              Mark satisfied
            </Button>
          )}
          {row.kind === "Obligation" &&
            ["Satisfied", "Waived"].includes(row.state) && (
              <Button onClick={() => start("Reopen")}>Reopen</Button>
            )}
          {row.kind === "Notice" && (
            <Button
              onClick={() =>
                setIntent({
                  action: "Create",
                  kind: "Notice",
                  row,
                  basis: row.basis_id!,
                  predecessor: row.id,
                })
              }
            >
              Correct evidence
            </Button>
          )}
          {row.kind === "Variation" && row.state === "Approved" && (
            <Button
              onClick={() =>
                setIntent({
                  action: "Create",
                  kind: "Variation",
                  basis: row.basis_id!,
                  predecessor: row.id,
                })
              }
            >
              New signed adjustment
            </Button>
          )}
        </>
      )}
      {row.state === "Submitted" && (
        <Button
          variant="primary"
          disabled={
            !current || !data.can_decide || data.source_status !== "Current"
          }
          onClick={() => start("Decide")}
        >
          Record decision
        </Button>
      )}
    </>
  ) : null;
  const tabs = [
    { id: "details", label: "Details" },
    { id: "overview", label: "Overview" },
    {
      id: "activities",
      label: `Activities${data?.current_actions ? ` · ${data.current_actions.length}` : ""}`,
    },
    { id: "history", label: "History" },
    ...(row?.kind === "Basis" ? [{ id: "sources", label: "Sources" }] : []),
  ];
  const facts =
    row && context ? (
      <>
        <RecordFactSection title={kindLabel(row.kind)}>
          <dl>
            <dt>State</dt>
            <dd>
              <CommercialState row={row} />
            </dd>
            <dt>Clause</dt>
            <dd>{row.content.clause}</dd>
            <dt>Owner</dt>
            <dd>{row.owner_name}</dd>
            <dt>Version</dt>
            <dd>{row.version}</dd>
            <dt>Latest change</dt>
            <dd>
              <Stamp value={row.recorded_at} /> · {row.recorded_by_name}
            </dd>
            <dt>Predecessor</dt>
            <dd>
              {row.predecessor_id ? (
                <Link href={recordHref(project, row.predecessor_id)}>
                  Open retained predecessor
                </Link>
              ) : (
                "None"
              )}
            </dd>
          </dl>
        </RecordFactSection>
        <RecordFactSection title="Project">
          <dl>
            <dt>Project</dt>
            <dd>
              <Link href={`/projects/${project}`}>{context.project.title}</Link>
            </dd>
            <dt>Reference</dt>
            <dd>{context.project.display_number}</dd>
            <dt>Site</dt>
            <dd>{context.project.site_name}</dd>
            <dt>Customer</dt>
            <dd>{context.project.customer_name}</dd>
            <dt>Coordinator</dt>
            <dd>{context.project.coordinator_name}</dd>
            <dt>Lifecycle</dt>
            <dd>{context.project.lifecycle}</dd>
          </dl>
        </RecordFactSection>
        {row.basis_id && (
          <RecordFactSection title="Original basis">
            <Link href={recordHref(project, row.basis_id)}>
              Open approved commercial basis
            </Link>
          </RecordFactSection>
        )}
      </>
    ) : null;
  return (
    <div className="commercial-record-root">
      {context && !intent && (
        <PendingCommercialSave
          context={context}
          onRecover={() => setIntent({ action: "Create", kind: "Variation" })}
        />
      )}
      <ReadState
        loading={read.loading}
        error={read.error}
        retry={read.reload}
        retained={!!row}
      />
      {row && context && (
        <>
          <RecordIdentity
            reference={kindLabel(row.kind)}
            title={row.content.title}
          />
          <SharedRecord
            id="ppo-commercial-record"
            title={row.content.title}
            reference={kindLabel(row.kind)}
            status={
              <>
                <CommercialState row={row} />
                {obligationOverdue(
                  row,
                  context.project.timezone,
                  new Date(data.observed_at),
                ) && <span>Overdue</span>}
              </>
            }
            statusPlacement="title"
            meta={
              <>
                {row.content.clause} · version {row.version} · {row.owner_name}{" "}
                · {context.project.title}
              </>
            }
            actions={actions}
            sourcesLabel="Commercial source and review facts"
            sources={
              <>
                <strong>
                  {kindLabel(row.kind)} facts · v{row.version}
                </strong>
                <span>Source {data.source_status?.toLowerCase()}</span>
                {row.kind === "Variation" && (
                  <span>
                    Priced {moneyLabel(row.content.priced_amount, "not priced")}
                  </span>
                )}
                <span>
                  {data.independent_review_required
                    ? "You authored or submitted a proposal version"
                    : "Independent review duties apply"}
                </span>
              </>
            }
            facts={facts}
            tabs={
              <RecordTabs
                id="commercial-record"
                label="Commercial record views"
                tabs={tabs}
                value={tab}
                onChange={setTab}
              />
            }
          >
            <RecordPanel id="commercial-record" tab="details" value={tab}>
              {facts}
            </RecordPanel>
            <RecordPanel id="commercial-record" tab="overview" value={tab}>
              {data.source_status === "Changed" && (
                <p className="commercial-banner" role="status">
                  The retained source changed. New use and decisions are held;
                  original evidence is retained.
                </p>
              )}
              {row.state === "Submitted" && (
                <p className="commercial-banner">
                  {data.independent_review_required
                    ? "You wrote or submitted a version of this proposal. A different reviewer must decide it."
                    : "Waiting for an independent commercial decision on this exact version."}{" "}
                  Control values update after approval.
                </p>
              )}
              {row.kind === "Variation" && (
                <section>
                  <h2>Amounts · version {row.version}</h2>
                  <div className="commercial-amount-card">
                    <div>
                      <small>Requested</small>
                      <strong>
                        {moneyLabel(row.content.requested_amount)}
                      </strong>
                    </div>
                    <div>
                      <small>Priced</small>
                      <strong>
                        {moneyLabel(row.content.priced_amount, "Not priced")}
                      </strong>
                    </div>
                    <div>
                      <small>Approved</small>
                      <strong>
                        {row.state === "Approved"
                          ? moneyLabel(row.content.priced_amount)
                          : "Not decided"}
                      </strong>
                    </div>
                  </div>
                  <p>Synthetic · AUD excluding GST · signed amounts</p>
                </section>
              )}
              <section>
                <h2>
                  {row.kind === "Variation" ? "Proposal" : "Recorded content"} ·
                  version {row.version}
                </h2>
                <dl className="commercial-proposal">
                  <dt>Title</dt>
                  <dd>{row.content.title}</dd>
                  <dt>Scope / detail</dt>
                  <dd>{row.content.detail}</dd>
                  <dt>Clause</dt>
                  <dd>{row.content.clause}</dd>
                  {row.kind === "Variation" && (
                    <>
                      <dt>Date impact</dt>
                      <dd>
                        {row.content.date_impact ?? "Not assessed"} · a proposal
                        only; the schedule and forecasts are unchanged.
                      </dd>
                    </>
                  )}
                  {row.kind === "Obligation" && (
                    <>
                      <dt>Due date</dt>
                      <dd>{row.content.due_date ?? "Date needed"}</dd>
                    </>
                  )}
                  {row.kind === "Notice" && (
                    <>
                      <dt>Reported occurrence</dt>
                      <dd>
                        <Stamp value={row.content.occurred_at} />
                      </dd>
                    </>
                  )}
                  {["Obligation", "Notice"].includes(row.kind) && (
                    <>
                      <dt>Evidence</dt>
                      <dd>{row.content.evidence ?? "Evidence needed"}</dd>
                    </>
                  )}
                  <dt>Reason</dt>
                  <dd>{row.reason}</dd>
                  <dt>Note</dt>
                  <dd>{row.note}</dd>
                </dl>
              </section>
              <section>
                <h2>Decision</h2>
                <p>
                  {row.command === "Decide"
                    ? `${row.state} · ${row.recorded_by_name}`
                    : "A commercial reviewer who did not write or submit any proposal version decides. Earlier decisions remain in History."}
                </p>
                {row.command === "Decide" && (
                  <p>
                    {row.note} · <Stamp value={row.recorded_at} />
                  </p>
                )}
              </section>
            </RecordPanel>
            <RecordPanel id="commercial-record" tab="activities" value={tab}>
              <h2>Linked Activities</h2>
              <p>
                Activities keep their own lifecycle. Completing one does not
                satisfy an obligation automatically.
              </p>
              {data.current_actions?.map((a) => (
                <article key={a.id}>
                  <Link href={`/work/${a.id}`}>Open linked Activity</Link> ·{" "}
                  {a.state} · current version {a.version}
                </article>
              ))}
              {!data.current_actions?.length && <p>No linked Activities.</p>}
            </RecordPanel>
            <RecordPanel id="commercial-record" tab="history" value={tab}>
              <h2>History</h2>
              {data.history?.map((event) => (
                <article className="commercial-history" key={event.version}>
                  <h3>
                    {event.command} · <CommercialState row={event} /> · version{" "}
                    {event.version}
                  </h3>
                  <p>
                    <Stamp value={event.recorded_at} /> ·{" "}
                    {event.recorded_by_name}
                  </p>
                  <p>Reason: {event.reason}</p>
                  <p>Note: {event.note}</p>
                </article>
              ))}
              <div className="commercial-actions">
                {data.next_before_version && (
                  <Button
                    disabled={!current}
                    onClick={() => setBefore(data.next_before_version!)}
                  >
                    Earlier history
                  </Button>
                )}
                {before && (
                  <Button disabled={!current} onClick={() => setBefore(null)}>
                    Latest history
                  </Button>
                )}
              </div>
            </RecordPanel>
            {row.kind === "Basis" && (
              <RecordPanel id="commercial-record" tab="sources" value={tab}>
                <h2>Retained sources</h2>
                <p>
                  The exact received handover, accepted quotation and reviewed
                  contract are retained. Newer source bytes are never adopted
                  silently.
                </p>
                <dl className="commercial-proposal">
                  <dt>Contract</dt>
                  <dd>
                    <Link
                      href={`/documents/library/${data.source?.input.document_id}`}
                    >
                      Open retained contract document
                    </Link>{" "}
                    · version {data.source?.input.document_version}
                  </dd>
                  <dt>Quotation</dt>
                  <dd>
                    <Link
                      href={`/estimating/quotes/${data.source?.input.quotation.revision_id}`}
                    >
                      Open retained quotation
                    </Link>
                  </dd>
                  <dt>Source status</dt>
                  <dd>{data.source_status}</dd>
                </dl>
              </RecordPanel>
            )}
          </SharedRecord>
        </>
      )}
      {blocked && row && (
        <WorklistPanel
          title="Cannot mark satisfied"
          onClose={() => setBlocked(false)}
        >
          <p>
            {openActions.length
              ? "Complete or cancel every linked Activity before satisfying or waiving this obligation."
              : "Record satisfaction evidence with Revise before marking this obligation satisfied."}
          </p>
          {openActions.map((a) => (
            <p key={a.id}>
              <Link href={`/work/${a.id}`}>Open linked Activity</Link> ·{" "}
              {a.state}
            </p>
          ))}
        </WorklistPanel>
      )}
      {intent && context && (
        <CommercialCommand
          intent={intent}
          context={context}
          onClose={() => setIntent(null)}
          onSaved={(id) => {
            setIntent(null);
            setBefore(null);
            if (id !== entry) router.push(recordHref(project, id));
            else read.reload();
          }}
        />
      )}
    </div>
  );
}
