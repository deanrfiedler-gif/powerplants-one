"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlatformResource } from "./platform-resource";
import { ErrorNotice } from "./business-ui";
import { WorkDialog } from "../activities/components/client/my-work-ui";
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
              <dd>
                {t.submitted_at
                  ? new Date(t.submitted_at).toLocaleString("en-AU")
                  : "Not recorded"}
              </dd>
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
  return (
    <div className="sh-workspace">
      <header className="sh-heading">
        <div>
          <p className="sh-eyebrow">My Work</p>
          <h1>Reviews & handovers</h1>
          <p>
            Find the next source-owned decision, correction or receiving step.
          </p>
        </div>
        <SavedViewControls
          target="reviews"
          criteria={criteria}
          apply={(c) => {
            setCriteria(c);
          }}
        />
      </header>
      <nav className="sh-tabs" aria-label="Review perspectives">
        {reviewViews.map((v) => (
          <button
            key={v}
            aria-pressed={(criteria.view ?? "mine") === v}
            onClick={() => set({ view: v })}
          >
            {reviewViewLabels[v]}
            {data &&
              ["complete", "partial"].includes(data.state) &&
              ` (${data.counts[v]}${data.bounded || data.state === "partial" ? "+" : ""})`}
          </button>
        ))}
      </nav>
      <div className="sh-toolbar">
        <label>
          Find review work
          <input
            type="search"
            value={criteria.q ?? ""}
            maxLength={200}
            onChange={(e) => set({ q: e.target.value })}
          />
        </label>
        <label>
          Module
          <select
            value={criteria.module ?? ""}
            onChange={(e) => set({ module: e.target.value })}
          >
            <option value="">All permitted</option>
            {["Service", "Finance", "Engineering"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Kind
          <select
            value={criteria.kind ?? ""}
            onChange={(e) => set({ kind: e.target.value })}
          >
            <option value="">All kinds</option>
            <option>Review</option>
            <option>Handover</option>
          </select>
        </label>
        <label>
          Named owner
          <select
            value={criteria.owner_id ?? ""}
            onChange={(e) => set({ owner_id: e.target.value })}
          >
            <option value="">All permitted owners</option>
            {data?.owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="mw-button"
          onClick={() => {
            setCriteria({ view: criteria.view ?? "mine" });
          }}
        >
          Clear filters
        </button>
        <button className="mw-button" onClick={read.reload}>
          Refresh reviews
        </button>
      </div>
      <ErrorNotice error={read.error} />
      {read.loading && <p role="status">Loading permitted review sources…</p>}
      {data && (
        <>
          {data.state !== "complete" && (
            <p className="sh-notice" role="alert">
              {data.state === "denied"
                ? "You do not have access to these review sources."
                : `${data.state === "partial" ? "Partial sources" : "Sources unavailable"}: ${data.sources
                    .filter((s) => s.state === "unavailable")
                    .map((s) => s.module)
                    .join(", ")}. Counts are incomplete.`}{" "}
              <button onClick={read.reload}>Retry</button>
            </p>
          )}
          {["complete", "partial"].includes(data.state) && (
            <p role="status">
              {data.total} matching tasks
              {data.bounded ? " in the available source windows" : ""} · Oldest
              known submission first
            </p>
          )}
          <ul className="sh-register">
            {data.items.map((t) => (
              <li key={t.id} data-task-id={t.id}>
                <div>
                  <button className="sh-title" onClick={() => setSelected(t)}>
                    {t.title}
                  </button>
                  <p>
                    {t.reference} · {t.revision} · {t.module} · {t.kind} ·{" "}
                    {t.status}
                  </p>
                  <p>{t.context}</p>
                  <p>
                    {t.owner_name ?? "No named reviewer"} ·{" "}
                    {t.due ?? "Date needed"} ·{" "}
                    {t.submitted_at
                      ? `${Math.max(0, Math.floor((Date.parse(data.observed_at) - Date.parse(t.submitted_at)) / 86400000))} elapsed days since source submission/request`
                      : "Submission time not recorded"}
                  </p>
                  {t.return_reason && <p>Returned: {t.return_reason}</p>}
                </div>
                <button className="mw-button" onClick={() => setSelected(t)}>
                  Review detail
                </button>
              </li>
            ))}
          </ul>
          {!data.items.length && data.state === "complete" && (
            <p className="sh-empty">
              No permitted tasks match this perspective and its filters.
            </p>
          )}
          <div className="sh-actions">
            {page > 1 && (
              <button
                className="mw-button"
                onClick={() => setPage((p) => p - 1)}
              >
                Previous page
              </button>
            )}
            {data.has_more && (
              <button
                className="mw-button"
                onClick={() => setPage((p) => p + 1)}
              >
                Next page
              </button>
            )}
          </div>
          <p className="sh-muted">
            Observed {new Date(data.observed_at).toLocaleString("en-AU")}.{" "}
            {data.sources
              .filter((s) => s.bounded)
              .map((s) => `${s.module} uses a bounded source window.`)
              .join(" ")}{" "}
            My reviews includes eligible unassigned Finance review work;
            eligibility does not assign approval authority.
          </p>
        </>
      )}
      <p className="sh-muted">
        Connected: Service reports, Finance handoffs, Engineering change reviews
        and receiving requests. Estimating approval and Sales-to-delivery
        receiving tasks await persisted source contracts.
      </p>
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
