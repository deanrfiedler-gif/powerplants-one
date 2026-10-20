"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import {
  RegisterChip,
  RegisterTable,
} from "../../../components/ui/register-table";
import {
  WorklistMenu,
  WorklistPanel,
} from "../../../components/crm-worklist-tools";
import { Stamp, useResource } from "../../../components/business-ui";
import { navigateWithReview } from "../../../components/navigation-intent";
import { FontAwesomeGlyph } from "../../../components/font-awesome";
import { myWorkFontAwesome } from "../../../components/font-awesome-icons";
import { ShellIcon } from "../../../components/shell-icon";
import {
  changeQueues,
  changeQueueCounts,
  changeReasons,
  inChangeQueue,
  type ChangeQueue,
} from "../../changes-model";
import type { ChangesWorkspace } from "../../workspace-model";
import {
  plannerZones,
  reviewCriteria,
  safePlannerReturn,
} from "../../navigation";
import { ChangesFrame, useChangesWindow } from "./changes-frame.client";
import { ChangesReview, VisitTime } from "./changes-review.client";
import "../../../app/styles/changes-follow-up.css";

export function ChangesWorkspaceScreen() {
  const w = useChangesWindow(),
    criteria = reviewCriteria(new URLSearchParams(w.search.toString())),
    queue = criteria.queue as ChangeQueue;
  const focus = w.search.get("appointment_id"),
    exactQuery = new URLSearchParams(w.query);
  if (focus) exactQuery.set("appointment_id", focus);
  // Counts always use the selected period/site, independently of an exact handover.
  const period = useResource<ChangesWorkspace>("schedule/changes?" + w.query);
  const exact = useResource<ChangesWorkspace>(
    focus ? "schedule/changes?" + exactQuery : null,
  );
  const read = focus ? exact : period,
    data = !read.loading && !read.error ? read.data : null;
  const counts =
    !period.loading && !period.error && period.data
      ? changeQueueCounts(period.data.items)
      : undefined;
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const restore = useRef<string | null>(null);
  const items =
    data?.items.filter(
      (a) =>
        (focus || inChangeQueue(a, queue)) &&
        (!search ||
          [a.display_number, a.scope_summary, a.site_name, a.customer_name]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())),
    ) ?? [];
  const selected = criteria.selected,
    index = items.findIndex((a) => a.id === selected);
  const update = (values: Record<string, string>) =>
    navigateWithReview(() => w.update(values));
  const selectQueue = (q: ChangeQueue) =>
    update({ queue: q, selected_id: "", appointment_id: "" });
  const close = () =>
    navigateWithReview(() => {
      w.update({ selected_id: "" });
      restore.current = selected;
    });
  useEffect(() => {
    if (selected || !data || !restore.current) return;
    const target = [
      ...document.querySelectorAll<HTMLButtonElement>("button[data-visit-id]"),
    ].find(
      (b) => b.dataset.visitId === restore.current && b.getClientRects().length,
    );
    if (target) {
      target.focus();
      restore.current = null;
    }
  }, [selected, data]);
  const refresh = () => {
    period.reload();
    if (focus) exact.reload();
  };
  const returnTo = safePlannerReturn("/schedule/changes?" + w.search);
  const show = (id: string) => update({ selected_id: id });
  return (
    <ChangesFrame
      selected={focus ? undefined : queue}
      counts={counts}
      query={new URLSearchParams(w.search.toString())}
      onQueue={selectQueue}
      phoneHeader={{
        title: selected ? "Visit review" : "Changes",
        ...(!selected
          ? {
              filter: {
                open: () => setFilterOpen(true),
                applied: !!search || !!w.context.site,
              },
            }
          : {}),
        ...(selected
          ? {
              record: {
                position:
                  index >= 0 ? `${index + 1} of ${items.length}` : undefined,
                previous: {
                  label: "Previous visit",
                  disabled: index <= 0,
                  onSelect: () => show(items[index - 1].id),
                },
                next: {
                  label: "Next visit",
                  disabled: index < 0 || index >= items.length - 1,
                  onSelect: () => show(items[index + 1].id),
                },
                more: [{ label: "Return to review queue", onSelect: close }],
              },
            }
          : {}),
      }}
    >
      {filterOpen && (
        <WorklistPanel
          title="Search and filter visits"
          onClose={() => setFilterOpen(false)}
        >
          <div className="changes-filter-fields">
            <label>
              Search visits
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              Site
              <select
                value={w.context.site}
                onChange={(e) =>
                  update({
                    site_id: e.target.value,
                    resource_id: "",
                    appointment_id: "",
                    selected_id: "",
                  })
                }
              >
                <option value="">All permitted sites</option>
                {w.sites.data?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Display timezone
              <select
                value={w.context.zone}
                onChange={(e) => update({ timezone: e.target.value })}
              >
                {plannerZones.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </label>
          </div>
        </WorklistPanel>
      )}
      {selected ? (
        <ChangesReview
          key={selected}
          id={selected}
          returnTo={returnTo}
          initialTab={
            queue === "contact"
              ? "followup"
              : queue === "history"
                ? "history"
                : "request"
          }
          onSaved={refresh}
          onClose={close}
          previous={index > 0 ? () => show(items[index - 1].id) : undefined}
          next={
            index >= 0 && index < items.length - 1
              ? () => show(items[index + 1].id)
              : undefined
          }
        />
      ) : (
        <>
          <div className="changes-toolbar">
            <label className="changes-search">
              <ShellIcon name="search" />
              <input
                aria-label="Search visits"
                placeholder="Search visits"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="changes-queue-select">
              <span className="changes-sr">Queue</span>
              <select
                value={queue}
                onChange={(e) => selectQueue(e.target.value as ChangeQueue)}
              >
                {changeQueues.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
            <WorklistMenu
              label="Period"
              text={
                <>
                  <ShellIcon name="calendar" />
                  {w.context.day} · {w.days} days
                </>
              }
            >
              <label>
                Period starting
                <input
                  aria-label="Period starting"
                  type="date"
                  value={w.context.day}
                  onChange={(e) =>
                    e.target.value &&
                    update({
                      day: e.target.value,
                      selected_id: "",
                      appointment_id: "",
                    })
                  }
                />
              </label>
              <label>
                Horizon
                <select
                  aria-label="Horizon"
                  value={w.days}
                  onChange={(e) =>
                    update({
                      days: e.target.value,
                      selected_id: "",
                      appointment_id: "",
                    })
                  }
                >
                  {[7, 28, 90].map((n) => (
                    <option key={n} value={n}>
                      {n} days
                    </option>
                  ))}
                </select>
              </label>
            </WorklistMenu>
            <label className="changes-site">
              <span className="changes-sr">Site</span>
              <select
                aria-label="Site"
                value={w.context.site}
                onChange={(e) =>
                  update({
                    site_id: e.target.value,
                    resource_id: "",
                    appointment_id: "",
                    selected_id: "",
                  })
                }
              >
                <option value="">All permitted sites</option>
                {w.sites.data?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="changes-zone">
              <span className="changes-sr">Display timezone</span>
              <select
                aria-label="Display timezone"
                value={w.context.zone}
                onChange={(e) => update({ timezone: e.target.value })}
              >
                {plannerZones.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </label>
            <span className="changes-read">
              {data ? (
                <>
                  {items.length} of {data.items.length} · Read{" "}
                  <time dateTime={data.observed_at} title={data.observed_at}>
                    {new Intl.DateTimeFormat("en-AU", {
                      timeZone: w.context.zone,
                      hour: "2-digit",
                      minute: "2-digit",
                      hourCycle: "h23",
                    }).format(new Date(data.observed_at))}
                  </time>
                </>
              ) : (
                "Current results unconfirmed"
              )}
            </span>
            <Button aria-label="Refresh review" onClick={refresh}>
              <FontAwesomeGlyph
                icon={myWorkFontAwesome.refresh}
                fallback={<span aria-hidden="true">↻</span>}
              />
            </Button>
          </div>
          {!!w.sites.error && (
            <p className="changes-notice">
              Site options unavailable. Current access is still enforced.{" "}
              <Button onClick={w.sites.reload}>Retry sites</Button>
            </p>
          )}
          {focus && (
            <div className="changes-notice">
              <strong>Exact appointment handover</strong>
              <span>
                Date and queue filters do not hide this record. Menu counts
                still follow the selected period and site.
              </span>
              <Button
                onClick={() => update({ appointment_id: "", selected_id: "" })}
              >
                Return to review queue
              </Button>
            </div>
          )}
          {read.loading ? (
            <div className="changes-state" role="status">
              <h2>Loading visits…</h2>
              <p>Current results unconfirmed.</p>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="changes-skeleton" />
              ))}
            </div>
          ) : read.error ? (
            <div className="changes-state" role="alert">
              <h2>Could not load visits</h2>
              <p>
                No current results to show. Check your connection and current
                access, then try again.
              </p>
              <Button variant="primary" onClick={read.reload}>
                Retry loading
              </Button>
            </div>
          ) : data && !items.length ? (
            <div className="changes-state">
              <h2>
                No visits in {changeQueues.find((q) => q.id === queue)?.label}
              </h2>
              <p>
                {search
                  ? "No visits match this search."
                  : "No permitted visits match this queue in the selected period."}
              </p>
              <Button
                onClick={() => {
                  setSearch("");
                  selectQueue("history");
                }}
              >
                Show History / all visits
              </Button>
            </div>
          ) : (
            data && (
              <>
                <div className="changes-desktop-grid">
                  <RegisterTable caption="Changes and follow-up. Open a visit to review its booking, requests and follow-up.">
                    <thead>
                      <tr>
                        {[
                          "Visit",
                          "Work",
                          "Needs review because",
                          "Booked",
                          "Requested",
                          "Customer",
                          "Follow-up",
                          "Site",
                        ].map((h) => (
                          <th key={h} scope="col">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <button
                              className="changes-link"
                              data-visit-id={a.id}
                              onClick={() => show(a.id)}
                            >
                              {a.display_number}
                            </button>
                          </td>
                          <td>
                            <strong>{a.scope_summary}</strong>
                          </td>
                          <td>
                            <span className="changes-attention">
                              {changeReasons(a)[0] ||
                                "No outstanding review reason"}
                              {changeReasons(a).length > 1 &&
                                ` · +${changeReasons(a).length - 1} more`}
                            </span>
                          </td>
                          <td>
                            <VisitTime
                              start={a.start_at}
                              end={a.end_at}
                              zone={w.context.zone}
                            />
                          </td>
                          <td>
                            {a.requests
                              .filter((r) => r.status === "Pending")
                              .map((r) => (
                                <span key={r.id} className="changes-requested">
                                  <VisitTime
                                    start={r.proposed_start}
                                    end={r.proposed_end}
                                    zone={w.context.zone}
                                  />
                                </span>
                              ))}
                            {!a.requests.some((r) => r.status === "Pending") &&
                              "—"}
                          </td>
                          <td>
                            <RegisterChip
                              tone={
                                a.customer_commitment === "Changed"
                                  ? "attention"
                                  : "neutral"
                              }
                            >
                              {a.customer_commitment}
                            </RegisterChip>
                          </td>
                          <td>
                            {a.followups
                              .filter((f) =>
                                ["Open", "InProgress"].includes(f.status),
                              )
                              .map((f) => (
                                <span key={f.activity_id}>
                                  {f.summary}
                                  <small>
                                    {f.owner_name || "Owner unavailable"} ·{" "}
                                    {f.due_at ? (
                                      <Stamp
                                        value={f.due_at}
                                        timezone={w.context.zone}
                                      />
                                    ) : (
                                      "Due date needed"
                                    )}
                                  </small>
                                </span>
                              ))}
                          </td>
                          <td>{a.site_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </RegisterTable>
                </div>
                <ul className="changes-phone-list" aria-label="Review queue">
                  {items.map((a) => (
                    <li key={a.id}>
                      <button data-visit-id={a.id} onClick={() => show(a.id)}>
                        <strong>{a.scope_summary}</strong>
                        <span>
                          {a.display_number} · {a.site_name}
                        </span>
                        <span>
                          <VisitTime
                            start={a.start_at}
                            end={a.end_at}
                            zone={w.context.zone}
                          />
                        </span>
                        <span className="changes-attention">
                          {changeReasons(a).join(" · ") || a.status}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )
          )}
        </>
      )}
    </ChangesFrame>
  );
}
