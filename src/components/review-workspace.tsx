"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlatformResource } from "./platform-resource";
import { ErrorNotice } from "./business-ui";
import { Icon, WorkDialog } from "../activities/components/client/my-work-ui";
import { Foot, PageHead } from "../activities/components/client/my-work-views";
import { formatDate, formatTimestamp } from "../shell/date-format";
import { SavedViewControls } from "./saved-view-controls";
import type { reviewInbox, reviewTarget } from "../reviews/service";
import {
  reviewViews,
  reviewViewLabels,
  type ReviewTask,
} from "../reviews/model";
type Inbox = Awaited<ReturnType<typeof reviewInbox>>;
function ReviewPreview({
  task,
  close,
}: {
  task: ReviewTask;
  close: () => void;
}) {
  const [version, setVersion] = useState(task.version);
  const read = usePlatformResource<Awaited<ReturnType<typeof reviewTarget>>>(
    `reviews/preview?${new URLSearchParams({ id: task.id, version: String(version) })}`,
  );
  const t = read.data?.item;
  return (
    <WorkDialog drawer title="Review & handover detail" onClose={close}>
      <ErrorNotice error={read.error} />
      {read.loading && (
        <p role="status">Checking the current source revision and access…</p>
      )}
      {read.error && (
        <button className="mw-button" onClick={read.reload}>
          Retry source
        </button>
      )}
      {read.data?.stale ? (
        <div role="alert">
          <p>
            The source changed while selected. Review its current copy before
            opening.
          </p>
          <button
            className="mw-button"
            onClick={() => setVersion(read.data!.item.version)}
          >
            Refresh current revision
          </button>
        </div>
      ) : (
        t && (
          <>
            <p className="sh-eyebrow">
              {t.module} · {t.kind} · {t.reference}
            </p>
            <h2>{t.title}</h2>
            <p>{t.context}</p>
            <dl className="sh-facts">
              <dt>Source revision</dt>
              <dd>{t.revision}</dd>
              <dt>Source status</dt>
              <dd>{t.status}</dd>
              <dt>Owner / reviewer</dt>
              <dd>
                {t.owner_name ??
                  "No named reviewer recorded; source permissions apply"}
              </dd>
              <dt>Submitted / requested</dt>
              <dd>{t.submitted_at ? formatTimestamp(t.submitted_at) : "Not recorded"}</dd>
              <dt>Due</dt>
              <dd>{t.due ?? "Date needed"}</dd>
              <dt>Return reason</dt>
              <dd>
                {t.return_reason ??
                  (t.returned
                    ? "See the source workflow for permitted correction detail"
                    : "Not returned")}
              </dd>
            </dl>
            <Link className="mw-button mw-button-primary" href={t.href}>
              Open source workflow
            </Link>
            <p className="sh-muted">
              Opening makes no decision. The source rechecks permission,
              revision and its own approval or receiving rules. Use Back to
              return to this queue.
            </p>
          </>
        )
      )}
    </WorkDialog>
  );
}
export function ReviewWorkspace() {
  const router = useRouter(),
    params = useSearchParams();
  const criteria: Record<string, string> = {
    view: params.get("view") ?? "mine",
  };
  for (const field of ["q", "module", "kind", "owner_id"]) {
    const value = params.get(field);
    if (value) criteria[field] = value;
  }
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [selected, setSelected] = useState<ReviewTask | null>(null);
  const navigate = (values: Record<string, string>, nextPage = 1) => {
    const next = new URLSearchParams(
      Object.entries(values).filter(([, value]) => !!value),
    );
    if (nextPage > 1) next.set("page", String(nextPage));
    router.replace(`/work/reviews?${next}`, { scroll: false });
    setSelected(null);
  };
  const setCriteria = (values: Record<string, string>) => navigate(values);
  const setPage = (update: (page: number) => number) =>
    navigate(criteria, update(page));
  const query = new URLSearchParams({ ...criteria, page: String(page) }),
    read = usePlatformResource<Inbox>(`reviews?${query}`),
    data = read.data;
  const set = (patch: Record<string, string>) => {
    setCriteria({ ...criteria, ...patch });
    setSelected(null);
  };
  const counted = !!data && ["complete", "partial"].includes(data.state);
  // A count is exact unless a source window is full; a partial read is called out in the alert,
  // so its tabs show no count rather than a number that looks complete.
  const tabCount = (v: (typeof reviewViews)[number]) => {
    if (!data || data.state !== "complete") return null;
    const n = data.counts[v];
    return `${n}${data.bounded && n > 0 ? "+" : ""}`;
  };
  const filtered = !!(criteria.q || criteria.module || criteria.kind || criteria.owner_id);
  const clear = () => setCriteria({ view: criteria.view ?? "mine" });
  return (
    <div className="mw-page mw-reviews" aria-busy={read.loading}>
      <PageHead title="Reviews & handovers" lede="Reviews, corrections and handovers waiting for you or your team.">
        <SavedViewControls
          target="reviews"
          criteria={criteria}
          apply={(c) => {
            setCriteria(c);
          }}
        />
      </PageHead>
      <nav className="sh-tabs mw-review-tabs" aria-label="Review perspectives">
        {reviewViews.map((v) => {
          const count = tabCount(v);
          return (
            <button key={v} type="button" aria-pressed={(criteria.view ?? "mine") === v} onClick={() => set({ view: v })}>
              {reviewViewLabels[v]}
              {count !== null && <span className="mw-count">{count}</span>}
            </button>
          );
        })}
      </nav>
      <div className="mw-filterbar" role="search" aria-label="Find reviews">
        <div className="mw-field mw-field-inline mw-field-search">
          <label htmlFor="rv-q">Find</label>
          <input id="rv-q" type="search" maxLength={200} placeholder="Title, reference or site" value={criteria.q ?? ""} onChange={(e) => set({ q: e.target.value })} />
        </div>
        <div className="mw-field mw-field-inline">
          <label htmlFor="rv-area">Area</label>
          <select id="rv-area" value={criteria.module ?? ""} onChange={(e) => set({ module: e.target.value })}>
            <option value="">All areas</option>
            {["Service", "Finance", "Engineering", "Customers & sites", "Equipment"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="mw-field mw-field-inline">
          <label htmlFor="rv-kind">Type</label>
          <select id="rv-kind" value={criteria.kind ?? ""} onChange={(e) => set({ kind: e.target.value })}>
            <option value="">All types</option>
            <option value="Review">Reviews</option>
            <option value="Handover">Handovers</option>
          </select>
        </div>
        <div className="mw-field mw-field-inline">
          <label htmlFor="rv-owner">Owner</label>
          <select id="rv-owner" value={criteria.owner_id ?? ""} onChange={(e) => set({ owner_id: e.target.value })}>
            <option value="">Anyone I can see</option>
            {data?.owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="mw-button mw-button-quiet" onClick={clear}>
          Clear filters
        </button>
        <button type="button" className="mw-button mw-button-quiet" onClick={read.reload}>
          <Icon name="refresh" />
          Refresh
        </button>
      </div>
      <ErrorNotice error={read.error} />
      {read.loading && (
        <div className={data ? "mw-refreshing" : "mw-skeleton"} role="status">
          Loading reviews…
        </div>
      )}
      {data && (
        <>
          {data.state !== "complete" && (
            <div className="mw-notice mw-notice-attention" role="alert">
              {data.state === "denied"
                ? "You do not have access to these review sources."
                : `${data.state === "partial" ? "Some areas could not be read" : "Sources unavailable"}: ${data.sources
                    .filter((s) => s.state === "unavailable")
                    .map((s) => s.module)
                    .join(", ")}. Counts are incomplete.`}{" "}
              <button type="button" className="mw-link" onClick={read.reload}>
                Retry
              </button>
            </div>
          )}
          {counted && (
            <section className="mw-panel" aria-label="Review work" >
              <header className="mw-panel-head">
                <div>
                  <h2 role="status">
                    {data.total}
                    {data.bounded ? "+" : ""} matching tasks
                  </h2>
                  <p>Oldest first</p>
                </div>
              </header>
              {data.items.length ? (
                <ul className="sh-register">
                  {data.items.map((t) => {
                    const days = t.submitted_at ? Math.max(0, Math.floor((Date.parse(data.observed_at) - Date.parse(t.submitted_at)) / 86400000)) : null;
                    return (
                      <li key={t.id} data-task-id={t.id}>
                        <div>
                          <button type="button" className="sh-title" onClick={() => setSelected(t)}>
                            {t.title}
                          </button>
                          <p>
                            {t.reference} · {t.revision} · {t.module} · {t.kind} · {t.status}
                          </p>
                          <p>{t.context}</p>
                          <p>
                            {t.owner_name ?? "No named reviewer"} · {t.due ?? "Date needed"} ·{" "}
                            {t.submitted_at
                              ? `Submitted ${formatDate(t.submitted_at)} · ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}`
                              : "Submission date not recorded"}
                          </p>
                          {t.return_reason && <p>Returned: {t.return_reason}</p>}
                        </div>
                        <button type="button" className="mw-button" onClick={() => setSelected(t)}>
                          Review detail
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : data.state === "complete" ? (
                filtered ? (
                  <p className="mw-panel-note">
                    Nothing matches these filters.{" "}
                    <button type="button" className="mw-link" onClick={clear}>
                      Clear filters
                    </button>
                  </p>
                ) : (criteria.view ?? "mine") === "mine" ? (
                  <div className="mw-empty-state">
                    <Icon name="check" />
                    <strong>Nothing is waiting for your review</strong>
                    <p>When a service report, Finance handover or engineering change needs you, it will appear here, oldest first.</p>
                    <button type="button" className="mw-link" onClick={() => set({ view: "all" })}>
                      See everything you can view
                    </button>
                  </div>
                ) : (
                  <p className="mw-panel-note">Nothing here yet.</p>
                )
              ) : null}
              {(page > 1 || data.has_more) && (
                <footer className="mw-panel-foot">
                  {page > 1 && (
                    <button type="button" className="mw-button" onClick={() => setPage((p) => p - 1)}>
                      Previous page
                    </button>
                  )}
                  {data.has_more && (
                    <button type="button" className="mw-button" onClick={() => setPage((p) => p + 1)}>
                      Next page
                    </button>
                  )}
                </footer>
              )}
            </section>
          )}
        </>
      )}
      <p className="mw-panel-note mw-review-note">Seeing a review here does not mean you can approve it. Estimate approvals and won-deal receiving are not listed here yet.</p>
      <Foot
        observed={data?.observed_at}
        stale={!!read.error}
        note={
          <details className="mw-sources">
            <summary>About these sources</summary>
            <p>
              Lists service reports, Finance handovers, engineering change reviews, site survey reviews, and equipment evidence and receiving requests. Service reads its 200 most recently updated
              reports; a count marked + means more may be waiting beyond them. My reviews also shows unassigned Finance and survey reviews you are eligible to take, which does not make you their approver.
            </p>
          </details>
        }
      />
      {selected && (
        <ReviewPreview
          key={selected.id}
          task={selected}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}
