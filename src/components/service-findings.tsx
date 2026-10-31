"use client";
import Link from "next/link";
import { useRef, useState, useEffect, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { usePublishPageDescription } from "../shell/page-description";
import { RecordIdentity } from "../shell/record-identity";
import { usePhoneHeader } from "../shell/phone-header";
import { Button, ButtonLink } from "./ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import { WorklistChoice } from "./crm-worklist-tools";
import { RecordTabs, RecordPanel } from "./record-ui";
import {
  ReadState,
  Stamp,
  useResource,
  friendly,
  type Envelope,
} from "./business-ui";
import {
  FindingsMenu,
  findingViews,
  type FindingView,
} from "./service-findings-menu";
import { FindingActionEditor } from "./service-findings-action";
import type { Finding, FindingSource } from "../service/findings/model";
import type { readFindings, readFinding } from "../service/findings/reads";
import type { readNextAction } from "../service/findings/next-action";
import type { ActivityHistoryEvent } from "../activities/activities";
import "./service-findings.css";

export const findingSourceLabels: Record<FindingSource, string> = {
  inspection: "Inspection",
  incident: "Incident corrective action",
  completion: "Remaining work",
  response: "Customer response",
  schedule: "Scheduling follow-up",
};
export function findingState(row: Finding) {
  return row.overdue
    ? "Overdue"
    : ((
        {
          NeedsOwner: "Needs an owner",
          WaitingReview: "Waiting on review",
          FollowUpCompleted: "Ready to close",
        } as Record<string, string>
      )[row.state] ?? friendly(row.state));
}
function State({ row }: { row: Finding }) {
  return (
    <RegisterChip
      tone={
        row.overdue
          ? "negative"
          : row.state === "NeedsOwner" || row.state === "WaitingReview"
            ? "attention"
            : row.state === "Closed" || row.state === "FollowUpCompleted"
              ? "positive"
              : "neutral"
      }
    >
      {findingState(row)}
    </RegisterChip>
  );
}
function Due({ row }: { row: Finding }) {
  return row.action?.due_at ? (
    <Stamp value={row.action.due_at} timezone={row.site.timezone} />
  ) : (
    <>None</>
  );
}
type Register = Awaited<ReturnType<typeof readFindings>>;
type Detail = Awaited<ReturnType<typeof readFinding>>;
type Action = Awaited<ReturnType<typeof readNextAction>>;

export function FindingsScreen() {
  const search = useSearchParams(),
    initial = search.get("view");
  const [view, setView] = useState<FindingView>(
      findingViews.find((v) => v.id === initial)?.id ?? "open",
    ),
    [q, setQ] = useState(""),
    [owner, setOwner] = useState(""),
    [source, setSource] = useState(""),
    [site, setSite] = useState(""),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [menuOpen, setMenuOpen] = useState(true);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen),
    opener = useRef<HTMLElement | null>(null),
    guard = useRef<() => boolean>(() => true);
  const params = new URLSearchParams({
    view,
    q,
    offset: String(offset),
    limit: "25",
  });
  if (owner) params.set("owner_id", owner);
  if (source) params.set("source", source);
  if (site) params.set("site_id", site);
  const r = useResource<Register>(`service/findings?${params}`),
    available = !r.loading && !r.error && !!r.data;
  const data = available ? r.data : null,
    rows = data?.items ?? [];
  const change = (fn: () => void) => {
    if (!guard.current()) return;
    setSelected(null);
    setOffset(0);
    fn();
  };
  const choose = (v: FindingView) =>
    change(() => {
      setView(v);
      menu.closeOverlay();
    });
  const inspect = (id: string) => {
    if (!guard.current()) return;
    opener.current = document.activeElement as HTMLElement;
    setSelected(id);
  };
  const close = () => {
    if (!guard.current()) return;
    setSelected(null);
    requestAnimationFrame(
      () => opener.current?.isConnected && opener.current.focus(),
    );
  };
  usePublishPageDescription(
    "Findings and follow-up",
    "Review permitted findings across five native sources. Counts cover the authorised candidate window only. Each finding closes in its own source; next actions are owned My Work activities.",
  );
  const countLabel = data
    ? `${data.total} in this authorised candidate window`
    : "Current results unconfirmed";
  return (
    <SecondaryMenuFrame
      id="ppo-findings"
      name="Service review"
      menuId="findings-menu"
      contentId="findings-content"
      state={menu}
      attributes={{ "data-ppo-workspace": "shared" }}
      message="Synthetic findings. Source records control closure."
      phoneHeader={{ title: "Findings", count: data?.total }}
      menu={
        <nav aria-label="Service review views">
          <ul>
            <li>
              <Link href="/service/reports">Service reports</Link>
            </li>
          </ul>
          <FindingsMenu view={view} counts={data?.counts} onSelect={choose} />
        </nav>
      }
    >
      <div className="sv07-workspace">
        <h1 className="sr-only">Findings and follow-up</h1>
        <div className="sv07-toolbar">
          <label className="sv07-search">
            <span className="sr-only">Search findings</span>
            <input
              type="search"
              placeholder="Search findings"
              value={q}
              maxLength={200}
              onChange={(e) => change(() => setQ(e.target.value))}
            />
          </label>
          <div className="sv07-phone-view">
            <WorklistChoice
              label="Finding view"
              value={view}
              options={findingViews.map((v) => ({ id: v.id, label: v.label }))}
              onChange={(v) => choose(v as FindingView)}
            />
          </div>
          <WorklistChoice
            label="Owner"
            prefix="Owner: "
            value={owner}
            options={[
              { id: "", label: "Anyone" },
              ...(data?.options.owners ?? []),
            ]}
            onChange={(v) => change(() => setOwner(v))}
          />
          <WorklistChoice
            label="Source"
            prefix="Source: "
            value={source}
            options={[
              { id: "", label: "All" },
              ...Object.entries(findingSourceLabels).map(([id, label]) => ({
                id,
                label,
              })),
            ]}
            onChange={(v) => change(() => setSource(v))}
          />
          <WorklistChoice
            label="Site"
            prefix="Site: "
            value={site}
            options={[{ id: "", label: "All" }, ...(data?.options.sites ?? [])]}
            onChange={(v) => change(() => setSite(v))}
          />
          <Button variant="quiet" onClick={() => change(() => r.reload())}>
            Refresh
          </Button>
        </div>
        <p className="sv07-count" role="status">
          {countLabel}
          {data && (
            <>
              {" "}
              · As at <Stamp value={data.as_of} />
            </>
          )}
          {data?.completeness === "Partial" &&
            " · Partial read; some permissions changed"}
        </p>
        {view === "follow_up_completed" && (
          <p className="sv07-notice">
            Ready to close means the follow-up is completed. The source reviewer
            must still check and satisfy the source's closure rules.
          </p>
        )}
        {view === "closed" && (
          <p className="sv07-notice">
            Closed findings · no date cutoff. Counts cover this window, not all
            history.
          </p>
        )}
        <ReadState loading={r.loading} error={r.error} retry={r.reload} />
        {available && (
          <>
            <div className="sv07-desktop">
              <RegisterTable
                caption="Findings by source record. Open a row to inspect its next action and closure rules."
                empty={
                  !rows.length && (
                    <RegisterEmpty title="No permitted findings in this window">
                      {data?.next_offset !== null
                        ? "Continue to the next window; the selected view can be empty here."
                        : "Change the view or filters to see other permitted findings."}
                    </RegisterEmpty>
                  )
                }
              >
                <thead>
                  <tr>
                    {[
                      "Source record",
                      "What remains",
                      "State",
                      "Owner",
                      "Due",
                      "Next action",
                      "Closes when",
                      "Source",
                      "Equipment",
                      "Site",
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      data-inspected={row.id === selected || undefined}
                    >
                      <td>
                        <button
                          className="sv07-open"
                          onClick={() => inspect(row.id)}
                        >
                          {row.source_record.reference}
                        </button>
                      </td>
                      <td className="ppo-register-wrap">{row.what_remains}</td>
                      <td>
                        <State row={row} />
                      </td>
                      <td>
                        {row.state === "NeedsOwner"
                          ? "Unassigned"
                          : (row.action?.owner_name ?? "Unassigned")}
                      </td>
                      <td>
                        <Due row={row} />
                      </td>
                      <td className="ppo-register-wrap">
                        {row.action?.summary ?? "Not set"}
                      </td>
                      <td className="ppo-register-wrap">{row.closes_when}</td>
                      <td>{findingSourceLabels[row.source]}</td>
                      <td>{row.equipment?.reference ?? "Not recorded"}</td>
                      <td>{row.site.name}</td>
                    </tr>
                  ))}
                </tbody>
              </RegisterTable>
            </div>
            <div className="sv07-phone-list">
              {rows.map((row) => (
                <button
                  key={row.id}
                  className="sv07-phone-row"
                  onClick={() => inspect(row.id)}
                >
                  <strong>{row.what_remains}</strong>
                  <span>
                    <Due row={row} />
                  </span>
                  <small>
                    {row.source_record.reference} ·{" "}
                    {findingSourceLabels[row.source]}
                  </small>
                  <span>
                    <State row={row} /> ·{" "}
                    {row.state === "NeedsOwner"
                      ? "Unassigned"
                      : (row.action?.owner_name ?? "Unassigned")}
                  </span>
                </button>
              ))}
              {!rows.length && (
                <RegisterEmpty title="No permitted findings in this window">
                  Change the view or continue to the next window.
                </RegisterEmpty>
              )}
            </div>
            <RegisterFooter>
              <Button
                variant="quiet"
                disabled={!offset}
                onClick={() => {
                  if (guard.current()) {
                    setSelected(null);
                    setOffset(Math.max(0, offset - 25));
                  }
                }}
              >
                Previous window
              </Button>
              <span>Candidate window {Math.floor(offset / 25) + 1}</span>
              <Button
                variant="quiet"
                disabled={data?.next_offset == null}
                onClick={() => {
                  if (guard.current()) {
                    setSelected(null);
                    setOffset(data!.next_offset!);
                  }
                }}
              >
                Next window
              </Button>
            </RegisterFooter>
          </>
        )}
        {selected && available && (
          <FindingSnapshot
            key={selected}
            id={selected}
            ids={rows.map((r) => r.id)}
            onSelect={inspect}
            onClose={close}
            guard={guard}
            onSaved={r.reload}
          />
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
function FindingSnapshot({
  id,
  ids,
  onSelect,
  onClose,
  guard,
  onSaved,
}: {
  id: string;
  ids: string[];
  onSelect: (id: string) => void;
  onClose: () => void;
  guard: RefObject<() => boolean>;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState("action"),
    panel = useRef<HTMLDivElement>(null);
  const r = useResource<Detail>(`service/findings/${id}`),
    action = useResource<Action>(`service/findings/${id}/next-action`);
  const available = !r.loading && !r.error && !action.loading && !action.error;
  const row = available ? action.data?.item : null;
  const history = useResource<
    Envelope<ActivityHistoryEvent> & { owners: Record<string, string> }
  >(row?.action ? `activities/${row.action.id}/history` : null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  usePhoneHeader(
    row
      ? {
          title: row.what_remains,
          record: {
            position: `${ids.indexOf(id) + 1} of ${ids.length}`,
            more: [{ label: "Back to findings", onSelect: onClose }],
          },
        }
      : null,
  );
  const index = ids.indexOf(id),
    recurrence = r.data?.item.recurrence;
  const saved = () => {
    r.reload();
    action.reload();
    history.reload();
    onSaved();
  };
  return (
    <div
      className="sv07-snapshot"
      ref={panel}
      role="region"
      aria-label="Finding snapshot"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="sv07-snapshot-nav">
        <Button variant="quiet" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="quiet"
          disabled={index <= 0}
          onClick={() => onSelect(ids[index - 1])}
        >
          Previous finding
        </Button>
        <Button
          variant="quiet"
          disabled={index < 0 || index >= ids.length - 1}
          onClick={() => onSelect(ids[index + 1])}
        >
          Next finding
        </Button>
        <small>
          {index + 1} of {ids.length}
        </small>
      </div>
      <ReadState
        loading={r.loading || action.loading}
        error={r.error || action.error}
        retry={() => {
          r.reload();
          action.reload();
        }}
      />
      {row && action.data && (
        <>
          <RecordIdentity reference={row.source_record.reference} title={row.what_remains} />
          <header className="sv07-detail-heading">
            <h2>{row.what_remains}</h2>
            <p>
              {row.source_record.reference} · {findingSourceLabels[row.source]}{" "}
              · {row.equipment?.reference ?? "Equipment not recorded"}
            </p>
            <State row={row} />{" "}
            <span>
              {row.action?.owner_name ?? "Unassigned"} · <Due row={row} />
            </span>
          </header>
          <section className="sv07-remains">
            <h3>What remains</h3>
            <p>{row.what_remains}</p>
            <p>{friendly(row.native_state)}</p>
            <p>
              {row.site.name} · {row.work_order.reference}
            </p>
          </section>
          <section className="sv07-closes">
            <h3>What closes it</h3>
            <p>{row.closes_when}</p>
            <p className="sv07-notice">
              Findings never close here. Each one closes in its own record, when
              that record's rules are met; refresh this list afterwards.
            </p>
          </section>
          <div className="sv07-action-side">
            <RecordTabs
              id="finding-tabs"
              label="Finding details"
              tabs={[
                { id: "action", label: "Next action" },
                {
                  id: "recurrence",
                  label: `Recurrence · ${recurrence?.earlier.length ?? 0}`,
                },
                { id: "history", label: "History" },
              ]}
              value={tab}
              onChange={setTab}
            />
            <RecordPanel id="finding-tabs" tab="action" value={tab}>
              <FindingActionEditor
                key={id}
                data={action.data}
                guard={guard}
                onSaved={saved}
                onRevoked={() => {
                  action.reload();
                  r.reload();
                }}
              />
            </RecordPanel>
            <RecordPanel id="finding-tabs" tab="recurrence" value={tab}>
              <h3>Recurrence</h3>
              <p>
                Same equipment and failed check within 90 days. Recurrence
                informs the next action; it never reopens or closes a finding.
              </p>
              {recurrence?.basis === "NoStableFaultKey" ? (
                <p>
                  No comparable equipment-bound fault key is recorded for this
                  source. Recurrence cannot be assessed from its title.
                </p>
              ) : !recurrence?.earlier.length ? (
                <p>No earlier permitted match found.</p>
              ) : (
                <ol>
                  {recurrence.earlier.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href}>{item.reference}</Link>
                      <p>
                        <Stamp
                          value={item.occurred_at}
                          timezone={row.site.timezone}
                        />{" "}
                        · {friendly(item.state)}
                      </p>
                      <p>{item.correction ?? "Correction not recorded"}</p>
                    </li>
                  ))}
                </ol>
              )}
              {recurrence?.partial && (
                <p>
                  Partial recurrence window; at most 50 permitted earlier
                  candidates are checked.
                </p>
              )}
            </RecordPanel>
            <RecordPanel id="finding-tabs" tab="history" value={tab}>
              <FindingHistory history={history} timezone={row.site.timezone} />
            </RecordPanel>
            <div className="sv07-history-below">
              <FindingHistory history={history} timezone={row.site.timezone} />
            </div>
          </div>
          <footer className="sv07-detail-actions">
            <ButtonLink variant="secondary" href={row.source_record.href}>
              Open{" "}
              {row.source === "completion" || row.source === "response"
                ? "report"
                : row.source === "inspection"
                  ? "inspection"
                  : row.source === "incident"
                    ? "incident"
                    : "visit"}
            </ButtonLink>
            {row.action && (
              <ButtonLink href={row.action.href}>Open follow-up</ButtonLink>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
function FindingHistory({
  history,
  timezone,
}: {
  history: ReturnType<
    typeof useResource<
      Envelope<ActivityHistoryEvent> & { owners: Record<string, string> }
    >
  >;
  timezone: string;
}) {
  return (
    <>
      <h3>Next-action history</h3>
      <p>Newest first. Source history remains in the owning record.</p>
      <ReadState
        loading={history.loading}
        error={history.error}
        retry={history.reload}
      />
      {!history.loading && !history.error && (
        <ol>
          {history.data?.items.map((event) => (
            <li key={event.id}>
              <strong>{friendly(event.command)}</strong>
              <p>
                {event.actor_name} ·{" "}
                <Stamp value={event.occurred_at} timezone={timezone} />
              </p>
              <p>{event.reason}</p>
              {["owner_id", "due_at", "summary", "required_evidence"]
                .filter(
                  (key) =>
                    JSON.stringify(event.before?.[key]) !==
                    JSON.stringify(event.after?.[key]),
                )
                .map((key) => (
                  <p key={key}>
                    {friendly(key)}:{" "}
                    {String(
                      key === "owner_id"
                        ? (history.data?.owners[String(event.before?.[key])] ??
                            "Not set")
                        : (event.before?.[key] ?? "Not set"),
                    )}{" "}
                    →{" "}
                    {String(
                      key === "owner_id"
                        ? (history.data?.owners[String(event.after?.[key])] ??
                            "Not set")
                        : (event.after?.[key] ?? "Not set"),
                    )}
                  </p>
                ))}
            </li>
          )) ?? <li>No next action recorded.</li>}
        </ol>
      )}
    </>
  );
}
