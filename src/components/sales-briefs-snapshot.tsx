"use client";
import { useEffect, useRef, useState } from "react";
import { useCrmResource, denied } from "./crm-state";
import Link from "next/link";
import { WorklistMenu } from "./crm-worklist-tools";
import { useConversationsAction } from "./shell-conversations";
import { phoneMenuEvent } from "./shell-phone-header";
import { ShellIcon } from "./shell-icon";
import { Button, ButtonLink } from "./ui/button";
import { RecordPanel, RecordTabs } from "./record-ui";
import {
  briefHref,
  type ReceivingBrief,
  type ReceivingSnapshot,
} from "../sales/receiving-queue-model";
import { formatDateTime } from "../shell/date-format";
import { BriefIcon, BriefState } from "./sales-briefs-ui";
export function SalesBriefSnapshot({
  row,
  phone,
  rows,
  onSelect,
  onClose,
  onRefresh,
}: {
  row: ReceivingBrief;
  phone: boolean;
  rows: ReceivingBrief[];
  onSelect: (row: ReceivingBrief) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const conversations = useConversationsAction(phone);
  const [tab, setTab] = useState("clarification");
  const read = useCrmResource<ReceivingSnapshot>(
    `sales/handovers/receiving/${row.id}?revision=${row.revision}&token=${row.token}`,
    true,
  );
  useEffect(() => {
    const node = dialog.current,
      opener = document.activeElement as HTMLElement | null;
    const position = () =>
      node?.style.setProperty(
        "--sb-left",
        `${node.parentElement!.getBoundingClientRect().left}px`,
      );
    position();
    node?.showModal();
    window.addEventListener("resize", position);
    return () => {
      node?.close();
      window.removeEventListener("resize", position);
      opener?.focus({ preventScroll: true });
    };
  }, []);
  const d = read.error ? null : read.data,
    index = rows.findIndex((r) => r.id === row.id);
  const clarification =
    d?.history.filter((e) =>
      ["Clarify", "Answer", "Resolve"].includes(e.action),
    ) ?? [];
  const date = (value: string) => formatDateTime(value);
  return (
    <dialog
      ref={dialog}
      className="sb-snapshot"
      aria-label="Submitted Sales brief snapshot"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="sb-snapshot-controls">
        <Button
          variant="quiet"
          aria-label="Close brief snapshot"
          onClick={onClose}
        >
          {phone ? (
            <ShellIcon name="chevron-left" />
          ) : (
            <BriefIcon name="close" />
          )}
        </Button>
        <span className="sb-position">
          {index + 1} of {rows.length}
        </span>
        <Button
          variant="quiet"
          className="sb-snapshot-step"
          aria-label="Previous brief"
          disabled={index <= 0}
          onClick={() => onSelect(rows[index - 1])}
        >
          <BriefIcon name="previous" />
        </Button>
        <Button
          variant="quiet"
          className="sb-snapshot-step"
          aria-label="Next brief"
          disabled={index >= rows.length - 1}
          onClick={() => onSelect(rows[index + 1])}
        >
          <BriefIcon name="next" />
        </Button>
        {phone && (
          <WorklistMenu label="More snapshot actions" icon="more" choices>
            <button
              type="button"
              role="menuitem"
              data-menu-close
              onClick={() => {
                onClose();
                requestAnimationFrame(() =>
                  window.dispatchEvent(
                    new CustomEvent(phoneMenuEvent, {
                      detail: document.getElementById("shell-phone-menu"),
                    }),
                  ),
                );
              }}
            >
              Open menu
            </button>
            {conversations && (
              <Link
                role="menuitem"
                href="/conversations"
                aria-label={conversations.name}
              >
                Conversations
                {conversations.badge ? ` · ${conversations.badge}` : ""}
              </Link>
            )}
            <button
              className="sb-narrow-step"
              type="button"
              role="menuitem"
              data-menu-close
              disabled={index <= 0}
              onClick={() => onSelect(rows[index - 1])}
            >
              Previous brief
            </button>
            <button
              className="sb-narrow-step"
              type="button"
              role="menuitem"
              data-menu-close
              disabled={index >= rows.length - 1}
              onClick={() => onSelect(rows[index + 1])}
            >
              Next brief
            </button>
          </WorklistMenu>
        )}
      </div>
      {!d ? (
        <div className="sb-notice" role={read.error ? "alert" : "status"}>
          <h2>
            {read.error
              ? denied(read.error)
                ? "This brief is outside your access"
                : (read.error as { status: number }).status === 409
                  ? "This submitted brief changed"
                  : "The brief could not be loaded"
              : "Loading submitted brief…"}
          </h2>
          {!!read.error && (
            <>
              <p>
                Refresh the queue to review current permitted revisions. No
                receiving decision was recorded.
              </p>
              <Button onClick={onRefresh}>Refresh queue</Button>
              <Button onClick={read.reload}>Retry exact snapshot</Button>
            </>
          )}
        </div>
      ) : (
        <div className="sb-snapshot-body">
          <div className="sb-snapshot-record">
            <div className="sb-snapshot-scroll">
              <header>
                <h2>{d.brief.opportunity.title}</h2>
                <p className="sb-small">
                  {d.brief.opportunity.reference} · {d.brief.customer.name}
                </p>
                <span className="sb-tag">Sales brief r{d.brief.revision}</span>{" "}
                <BriefState row={d.brief} />
              </header>
              {d.brief.source_changed && (
                <p className="sb-warning" role="status">
                  {["Accepted", "Returned"].includes(d.brief.state)
                    ? "Source changed after this retained revision. Its receiving outcome is unchanged; review a successor before a new estimating link."
                    : "Source changed; renewed review required. Return for a corrected successor before acceptance."}
                </p>
              )}
              <section>
                <h3>Summary</h3>
                <Fact icon="customer" label="Customer and location">
                  {d.brief.customer.name} ·{" "}
                  {d.brief.site?.name ?? "Site not recorded"}
                </Fact>
                <Fact
                  icon="owner"
                  label={`Receiving owner · ${d.brief.sales_owner.name} submitted for Sales`}
                >
                  {d.brief.receiving_owner?.name ??
                    "Receiving owner not recorded"}
                </Fact>
                <Fact
                  icon="date"
                  label={
                    d.brief.requested_date
                      ? "Requested date"
                      : `Sales reason: ${d.brief.date_reason}`
                  }
                >
                  {d.brief.requested_date ?? "Date needed"}
                </Fact>
                <Fact
                  icon="activity"
                  label={
                    d.next_action?.owner
                      ? `Next Sales action · ${d.next_action.owner.name}`
                      : "Next Sales action"
                  }
                >
                  {d.next_action ? (
                    <>
                      {d.next_action.summary}
                      {d.next_action.due_at &&
                        ` · ${date(d.next_action.due_at)}`}
                    </>
                  ) : (
                    "Not recorded"
                  )}
                </Fact>
                <Fact
                  icon="clock"
                  label="Frozen at submission. A later Sales draft does not change it."
                >
                  Submitted {date(d.brief.submitted_at)}
                </Fact>
              </section>
              <section>
                <h3>Brief r{d.brief.revision}</h3>
                <Fact icon="problem" label="Customer problem">
                  {d.content.problem}
                </Fact>
                <Fact icon="scope" label="Included scope">
                  {d.content.included_scope}
                </Fact>
                <Fact icon="close" label="Exclusions">
                  {d.content.exclusions}
                </Fact>
                <details>
                  <summary>Outcome, assumptions and unknowns</summary>
                  <dl>
                    <dt>Desired outcome</dt>
                    <dd>{d.content.outcome}</dd>
                    <dt>Assumptions</dt>
                    <dd>{d.content.assumptions}</dd>
                    <dt>Unknowns</dt>
                    <dd>{d.content.unknowns}</dd>
                  </dl>
                </details>
              </section>
              <p className="sb-rule">
                Accepting records receiving evidence for revision r
                {d.brief.revision} only. It creates no estimate, quotation,
                order, project, work order or booking. A changed source requires
                return and a corrected successor. Linking an estimating
                workspace is a separate reviewed step on the brief.
              </p>
            </div>
          </div>
          <div className="sb-snapshot-activity">
            <div className="sb-tabs-card">
              <RecordTabs
                id="sales-brief"
                label="Submitted brief evidence"
                tabs={[
                  {
                    id: "clarification",
                    label: (
                      <>
                        <BriefIcon name="question" />
                        Clarification
                      </>
                    ),
                  },
                  {
                    id: "evidence",
                    label: (
                      <>
                        <BriefIcon name="files" />
                        Evidence
                      </>
                    ),
                  },
                ]}
                value={tab}
                onChange={setTab}
              />
              <RecordPanel id="sales-brief" tab="clarification" value={tab}>
                {clarification.map((e) => (
                  <article key={e.id}>
                    <strong>
                      {e.actor.name} ·{" "}
                      {e.action === "Clarify"
                        ? "Asked"
                        : e.action === "Answer"
                          ? "Answered"
                          : "Resolved"}
                    </strong>
                    <p>{e.note}</p>
                    <small>{date(e.recorded_at)}</small>
                  </article>
                ))}
                {!clarification.length && (
                  <p>No clarification recorded for this revision.</p>
                )}
                {d.brief.state === "ClarificationAnswered" && (
                  <p>
                    Review and resolve the exact answer on the brief page before
                    acceptance.
                  </p>
                )}
              </RecordPanel>
              <RecordPanel id="sales-brief" tab="evidence" value={tab}>
                {d.content.evidence.map((e) => (
                  <article key={`${e.kind}:${e.id}:${e.revision}`}>
                    <strong>
                      {e.kind === "DraftQuote"
                        ? "Draft quotation"
                        : "Service document"}{" "}
                      · revision {e.revision}
                    </strong>
                    <p>{e.purpose}</p>
                    <small>{e.id}</small>
                  </article>
                ))}
                {!d.content.evidence.length && (
                  <p>No document references submitted with this revision.</p>
                )}
                <p>
                  References identify the submitted source revision. Open the
                  brief for native evidence review.
                </p>
              </RecordPanel>
            </div>
            <h2>History</h2>
            <ol className="sb-history">
              {d.history.toReversed().map((e) => (
                <li key={e.id}>
                  <strong>
                    {e.action === "Submit"
                      ? `r${e.revision} submitted to Estimating`
                      : ((
                          {
                            Clarify: "Clarification requested",
                            Answer: "Clarification answered by Sales",
                            Resolve: "Clarification resolved",
                            Accept: "Accepted",
                            Return: "Returned",
                            Save: "Draft saved",
                            Create: "Brief prepared",
                            Successor: "Successor prepared",
                          } as Record<string, string>
                        )[e.action] ?? e.action)}
                  </strong>
                  <small>
                    {date(e.recorded_at)} · {e.actor.name}
                  </small>
                  {["Return", "Accept"].includes(e.action) && <p>{e.note}</p>}
                </li>
              ))}
            </ol>
          </div>
          <footer className="sb-snapshot-footer">
            <ButtonLink href={`/sales/opportunities/${d.brief.opportunity.id}`}>
              Open opportunity
            </ButtonLink>
            <ButtonLink href={briefHref(d.brief)} variant="primary">
              Open brief
            </ButtonLink>
          </footer>
        </div>
      )}
    </dialog>
  );
}
function Fact({
  icon,
  label,
  children,
}: {
  icon: Parameters<typeof BriefIcon>[0]["name"];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sb-fact">
      <BriefIcon name={icon} />
      <div>
        {children}
        <small>{label}</small>
      </div>
    </div>
  );
}
