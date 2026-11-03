"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
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
import {
  PendingCommercialSave,
  CommercialState,
  useCommercialList,
} from "./ui-common";
import {
  kindLabel,
  noticeRelation,
  group,
  groupOrder,
  obligationOverdue,
  moneyLabel,
  recordHref,
  type DetailRead,
  type Finance,
  type Intent,
} from "./ui-model";
import "./ui.css";

const phoneQuery = "(max-width: 780px)";
const subscribePhone = (notify: () => void) => {
  const query = window.matchMedia(phoneQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const isPhone = () => window.matchMedia(phoneQuery).matches;
const serverPhone = () => false;
const compactQuery = "(max-width: 1100px)";
const subscribeCompact = (notify: () => void) => {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const isCompact = () => window.matchMedia(compactQuery).matches;

function BasisSources({ data }: { data: DetailRead }) {
  if (!data.source) return null;
  return (
    <section>
      <h2>Exact sources · retained snapshot</h2>
      <p>
        Source set: {data.source_status}. Newer source bytes never replace this
        snapshot silently.
      </p>
      <dl className="commercial-proposal">
        <dt>Won Sales handover</dt>
        <dd>Received handover and exact acceptance event retained</dd>
        <dt>Quotation issue</dt>
        <dd>
          <Link
            href={`/estimating/quotes/${data.source.input.quotation.revision_id}`}
          >
            Open retained quotation
          </Link>{" "}
          · exact issued output retained
        </dd>
        <dt>Customer response</dt>
        <dd>Reported Accepted · exact response event retained</dd>
        <dt>Contract document</dt>
        <dd>
          <Link href={`/documents/library/${data.source.input.document_id}`}>
            Open retained contract document
          </Link>{" "}
          · version {data.source.input.document_version} · exact reviewed
          revision retained
        </dd>
      </dl>
    </section>
  );
}

export function CommercialRecord({
  project,
  entry,
}: {
  project: string;
  entry: string;
}) {
  const router = useRouter();
  const phone = useSyncExternalStore(subscribePhone, isPhone, serverPhone);
  const compact = useSyncExternalStore(
    subscribeCompact,
    isCompact,
    serverPhone,
  );
  const [before, setBefore] = useState<number | null>(null),
    [tab, setTab] = useState("overview"),
    [intent, setIntent] = useState<Intent | null>(null),
    [blocked, setBlocked] = useState(false),
    [historyFilter, setHistoryFilter] = useState("All");
  const activeTab = !compact && tab === "details" ? "overview" : tab;
  const read = useResource<DetailRead>(
    `projects/${project}/commercial?id=${entry}${before ? `&before_version=${before}` : ""}`,
  );
  const data = read.data,
    row = data?.current,
    context = data?.context;
  const finance = useResource<Finance>(
    row?.kind === "Basis" ? `projects/${project}/commercial/finance` : null,
  );
  const siblings = useCommercialList(project);
  const ordered = (siblings.data?.items ?? [])
    .filter((item) => item.kind === row?.kind)
    .sort(
      (a, b) =>
        groupOrder.indexOf(
          group(a, context?.project.timezone, data?.observed_at),
        ) -
        groupOrder.indexOf(
          group(b, context?.project.timezone, data?.observed_at),
        ),
    );
  const position = ordered.findIndex((item) => item.id === entry);
  const canNavigate =
    !siblings.loading &&
    !siblings.error &&
    siblings.data?.completeness === "Complete" &&
    position >= 0;
  const historyCategory = (command: string) =>
    command === "Decide"
      ? "Decisions"
      : command === "Submit"
        ? "Submissions"
        : "Changes";
  const visibleHistory = (data?.history ?? []).filter(
    (event) =>
      historyFilter === "All" ||
      historyCategory(event.command) === historyFilter,
  );
  const historyDate = (value: string) =>
    new Date(value).toLocaleDateString("en-AU", {
      timeZone: context?.project.timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
  const navigation = row ? (
    <>
      <Button
        aria-label="Previous commercial record"
        disabled={!current || !!intent || !canNavigate || position === 0}
        onClick={() =>
          router.push(recordHref(project, ordered[position - 1].id))
        }
      >
        <span aria-hidden="true">‹</span>
      </Button>
      <Button
        aria-label="Next commercial record"
        disabled={
          !current || !!intent || !canNavigate || position + 1 >= ordered.length
        }
        onClick={() =>
          router.push(recordHref(project, ordered[position + 1].id))
        }
      >
        <span aria-hidden="true">›</span>
      </Button>
      <Button
        disabled={read.loading || !!intent}
        onClick={() => {
          setBefore(null);
          read.reload();
          siblings.reload();
          finance.reload();
        }}
      >
        Refresh
      </Button>
    </>
  ) : null;
  const prepareActions = row ? (
    <>
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
          {row.kind === "Obligation" &&
            ["Satisfied", "Waived"].includes(row.state) && (
              <Button onClick={() => start("Reopen")}>Reopen</Button>
            )}
          {row.kind === "Notice" && row.correction_status === "Latest" && (
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
    </>
  ) : null;
  const actions = row ? (
    <>
      {compact ? (
        <details className="commercial-record-more">
          <summary>More actions</summary>
          <div>
            {navigation}
            {prepareActions}
          </div>
        </details>
      ) : (
        <>
          {navigation}
          {prepareActions}
        </>
      )}
      {row.kind === "Basis" && data.source && (
        <ButtonLink
          href={`/estimating/quotes/${data.source.input.quotation.revision_id}`}
        >
          Open quotation
        </ButtonLink>
      )}
      {current &&
        row.kind === "Basis" &&
        row.state === "Approved" &&
        data.source_status === "Current" &&
        context?.can_prepare &&
        context.project.lifecycle === "Active" &&
        (context.project.coordinator_id === context.actor_id ||
          row.content.owner_id === context.actor_id) && (
          <Button
            variant="primary"
            onClick={() =>
              setIntent({ action: "Create", kind: "Variation", basis: row.id })
            }
          >
            New variation
          </Button>
        )}
      {row.basis_id && (
        <ButtonLink href={recordHref(project, row.basis_id)}>
          Open basis
        </ButtonLink>
      )}
      {current &&
        data.can_prepare &&
        row.kind === "Obligation" &&
        row.state === "Open" && (
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
    ...(phone ? [{ id: "details", label: "Details" }] : []),
    { id: "overview", label: "Overview" },
    ...(compact && !phone ? [{ id: "details", label: "Details" }] : []),
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
            {row.kind === "Notice" && (
              <>
                <dt>Record</dt>
                <dd>{noticeRelation(row)}</dd>
              </>
            )}
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
                  {row.kind === "Notice"
                    ? noticeRelation(row)
                    : "Open retained predecessor"}
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
    <div
      id="ppo-commercial-record-workspace"
      className="commercial-record-root"
      data-ppo-workspace="shared"
    >
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
            actions={phone ? null : actions}
            stickyAction={phone ? actions : undefined}
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
                  {row.kind === "Notice"
                    ? "Recorded evidence · no delivery verification"
                    : data.independent_review_required
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
                value={activeTab}
                onChange={setTab}
              />
            }
          >
            <RecordPanel id="commercial-record" tab="details" value={activeTab}>
              {facts}
            </RecordPanel>
            <RecordPanel
              id="commercial-record"
              tab="overview"
              value={activeTab}
            >
              {data.source_status === "Changed" && (
                <p className="commercial-banner" role="status">
                  The retained source changed. New use and decisions are held;
                  original evidence is retained.
                </p>
              )}
              {row.kind === "Notice" && (
                <p className="commercial-banner">
                  Recorded notice evidence only. This record sends nothing and
                  does not verify delivery.
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
              {row.kind === "Basis" && (
                <>
                  {row.state === "Approved" && (
                    <p className="commercial-banner">
                      Approved original basis. It cannot be edited or replaced.
                      Each approved variation is a separate signed change.
                    </p>
                  )}
                  <section>
                    <h2>Control values</h2>
                    <div className="commercial-amount-card">
                      <div className="commercial-basis-value">
                        <small>Original value</small>
                        <strong>
                          {finance.loading
                            ? "Loading"
                            : finance.data &&
                                !finance.error &&
                                (row.state !== "Approved" ||
                                  finance.data.basis_id === row.id)
                              ? moneyLabel(
                                  row.state === "Approved"
                                    ? finance.data.original_control_value
                                    : data.source?.amount,
                                  "Unavailable",
                                )
                              : "Unavailable"}
                        </strong>
                      </div>
                      {row.state === "Approved" && (
                        <>
                          <div>
                            <small>Approved changes</small>
                            <strong>
                              {finance.loading
                                ? "Loading"
                                : finance.data?.basis_id === row.id &&
                                    !finance.error
                                  ? moneyLabel(
                                      finance.data.approved_change_value,
                                      "Unavailable",
                                    )
                                  : "Unavailable"}
                            </strong>
                          </div>
                          <div>
                            <small>Adjusted value</small>
                            <strong>
                              {finance.loading
                                ? "Loading"
                                : finance.data?.basis_id === row.id &&
                                    !finance.error
                                  ? finance.data.status === "Held"
                                    ? "Held"
                                    : moneyLabel(
                                        finance.data.adjusted_control_value,
                                        "Unavailable",
                                      )
                                  : "Unavailable"}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                    <p>
                      Synthetic · AUD excluding GST · definition PJ05-FD08 v1.
                      Original value is the retained exact quotation value. Both
                      Finance read duties are required.
                    </p>
                    <ReadState
                      loading={finance.loading}
                      error={finance.error}
                      retry={finance.reload}
                    />
                  </section>
                  <BasisSources data={data} />
                </>
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
              {row.kind !== "Notice" && (
                <section>
                  <h2>
                    {row.kind === "Obligation" ? "Waiver decision" : "Decision"}
                  </h2>
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
              )}
            </RecordPanel>
            <RecordPanel
              id="commercial-record"
              tab="activities"
              value={activeTab}
            >
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
            <RecordPanel id="commercial-record" tab="history" value={activeTab}>
              <h2>History</h2>
              <div
                className="commercial-history-filters"
                aria-label="Filter loaded history"
              >
                {["All", "Changes", "Submissions", "Decisions"].map(
                  (filter) => (
                    <Button
                      key={filter}
                      aria-pressed={historyFilter === filter}
                      onClick={() => setHistoryFilter(filter)}
                    >
                      {filter} ·{" "}
                      {
                        (data.history ?? []).filter(
                          (event) =>
                            filter === "All" ||
                            historyCategory(event.command) === filter,
                        ).length
                      }
                    </Button>
                  ),
                )}
              </div>
              <p>
                Counts describe this loaded history page. Earlier versions
                remain available below.
              </p>
              {!visibleHistory.length && (
                <p>No matching events in this loaded history page.</p>
              )}
              {visibleHistory.map((event, index) => (
                <article className="commercial-history" key={event.version}>
                  {(index === 0 ||
                    historyDate(visibleHistory[index - 1].recorded_at) !==
                      historyDate(event.recorded_at)) && (
                    <div className="commercial-history-date">
                      {historyDate(event.recorded_at)} · site time
                    </div>
                  )}
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
                  <details>
                    <summary>
                      Recorded content · version {event.version}
                    </summary>
                    <dl>
                      <dt>Title</dt>
                      <dd>{event.content.title}</dd>
                      <dt>Scope / detail</dt>
                      <dd>{event.content.detail}</dd>
                      <dt>Clause</dt>
                      <dd>{event.content.clause}</dd>
                      {row.kind === "Variation" && (
                        <>
                          <dt>Requested</dt>
                          <dd>{moneyLabel(event.content.requested_amount)}</dd>
                          <dt>Priced</dt>
                          <dd>
                            {moneyLabel(
                              event.content.priced_amount,
                              "Not priced",
                            )}
                          </dd>
                          <dt>Date impact</dt>
                          <dd>{event.content.date_impact ?? "Not assessed"}</dd>
                        </>
                      )}
                      {event.content.evidence && (
                        <>
                          <dt>Evidence</dt>
                          <dd>{event.content.evidence}</dd>
                        </>
                      )}
                    </dl>
                  </details>
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
              <RecordPanel
                id="commercial-record"
                tab="sources"
                value={activeTab}
              >
                <BasisSources data={data} />
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
            siblings.reload();
            finance.reload();
            if (id !== entry) router.push(recordHref(project, id));
            else read.reload();
          }}
        />
      )}
    </div>
  );
}
