"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { readEstimatingWorkload } from "../estimating/workload";
import type { listEstimates } from "../estimating/reads";
import {
  workloadLabels,
  type WorkloadState,
} from "../estimating/workload-query";
import { useCrmResource } from "./crm-state";
import {
  ErrorNotice,
  PageHeader,
  Status,
  type StatusTone,
} from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { WorklistPanel } from "./crm-worklist-tools";
import { ProductIcon } from "./product-icons";
import "./estimating-workload.css";

type Workload = Awaited<ReturnType<typeof readEstimatingWorkload>>;
type Item = Workload["items"][number];
type Estimates = Awaited<ReturnType<typeof listEstimates>>;
type Layout = "panel" | "drawer" | "stack";

// ES-01 decisions (docs/decisions/es01-design-board.md). Readiness tone is scope
// evidence only: success never means a price is approved or a quotation issued.
const readinessTone: Record<WorkloadState, StatusTone> = {
  unstarted: "neutral",
  clarification: "attention",
  ready: "success",
  legacy: "neutral",
};
const readinessOrder: WorkloadState[] = [
  "unstarted",
  "clarification",
  "ready",
  "legacy",
];
const nextStep: Record<WorkloadState, string> = {
  unstarted: "Review the brief and establish discovery ownership.",
  clarification: "Resolve owned scope questions in the selected alternative.",
  ready: "Review the exact discovery basis before adopting manual costs.",
  legacy:
    "Review the saved manual basis or start explicit structured discovery.",
};
const filterKeys = ["q", "view", "owner", "sort"] as const;
// The persistent panel docks while the register keeps 1244 CSS px, which the
// standard shell reaches at a 1360 CSS px viewport (decision O1). Narrower
// areas open the same detail in a drawer; at 760 px and below (phones, tablet
// portrait and 200% zoom) cards carry the detail inline.
const panelWidth = 1244,
  stackWidth = 760;

const changed = (value: string) =>
  new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function useLayout(ref: RefObject<HTMLElement | null>): Layout | null {
  const [layout, setLayout] = useState<Layout | null>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = (width: number) =>
      setLayout(
        width >= panelWidth ? "panel" : width > stackWidth ? "drawer" : "stack",
      );
    // clientWidth and contentRect share unzoomed CSS px; bounding boxes do not.
    measure(node.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      measure(entry.contentRect.width),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return layout;
}

export function EstimatingWorkload() {
  const params = useSearchParams();
  const saved = params.get("tab") === "estimates";
  return (
    <div className="est-workload">
      <PageHeader
        variant="register"
        eyebrow="Estimating · Synthetic"
        title="Estimating intake & workload"
        description="Review opportunity briefs, scope readiness and the next estimating step. Saved costs retain their exact basis."
      />
      <nav className="est-workload-tabs" aria-label="Estimating registers">
        <Link aria-current={!saved ? "page" : undefined} href="/estimating">
          Workload
        </Link>
        <Link
          aria-current={saved ? "page" : undefined}
          href="/estimating?tab=estimates"
        >
          Saved estimates
        </Link>
      </nav>
      {saved ? <SavedEstimates /> : <WorkloadRegister />}
    </div>
  );
}

function WorkloadRegister() {
  const params = useSearchParams(),
    router = useRouter();
  const root = useRef<HTMLDivElement>(null),
    form = useRef<HTMLFormElement>(null);
  const layout = useLayout(root);
  const [chosen, setChosen] = useState<string | null>(null),
    [drawerOpen, setDrawerOpen] = useState(false),
    [expanded, setExpanded] = useState(false),
    [seenLayout, setSeenLayout] = useState(layout);
  // A layout change closes the drawer; the panel then shows the same record.
  if (seenLayout !== layout) {
    setSeenLayout(layout);
    if (drawerOpen) setDrawerOpen(false);
  }
  const regionId = useId();
  const query = new URLSearchParams();
  for (const key of filterKeys)
    if (params.has(key)) query.set(key, params.get(key)!);
  const data = useCrmResource<Workload>(`estimating/workload?${query}`, true);
  const view = (params.get("view") ?? "all") as WorkloadState | "all";
  const owner = params.get("owner") ?? "all",
    sort = params.get("sort") ?? "updated";
  const apply = (
    override?: Partial<Record<(typeof filterKeys)[number], string>>,
  ) => {
    const fields = new FormData(form.current!),
      next = new URLSearchParams();
    for (const key of filterKeys) {
      const value = (override?.[key] ?? String(fields.get(key) ?? "")).trim();
      if (value && !(key !== "q" && ["all", "updated"].includes(value)))
        next.set(key, value);
    }
    router.push(`/estimating${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const items = data.error == null ? (data.data?.items ?? []) : [];
  const current = items.find((i) => i.opportunity.id === chosen);
  const selected = layout === "panel" ? (current ?? items[0]) : undefined;
  const opened = layout === "drawer" && drawerOpen ? current : undefined;
  const counts = data.error == null ? data.data?.counts : undefined;
  const total = counts
    ? readinessOrder.reduce((sum, state) => sum + counts[state], 0)
    : undefined;
  return (
    <div
      className="est-workload-register"
      ref={root}
      data-layout={layout ?? undefined}
    >
      <form
        ref={form}
        role="search"
        aria-label="Filter workload"
        className="est-workload-filters"
        key={query.toString()}
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        <label className="est-workload-search">
          Search workload
          <input
            type="search"
            name="q"
            maxLength={100}
            defaultValue={params.get("q") ?? ""}
            placeholder="Customer, opportunity or brief"
          />
        </label>
        <button
          type="button"
          className="est-workload-toggle"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => setExpanded((open) => !open)}
        >
          <ProductIcon name="chevron" />
          <span>
            Readiness, owner and sort
            <small>
              {(view !== "all" && workloadLabels[view]) || "All readiness"} ·{" "}
              {owner === "mine" ? "My estimating work" : "All owners"} ·{" "}
              {sort === "customer" ? "Customer" : "Recently changed"}
            </small>
          </span>
        </button>
        <div
          id={regionId}
          className="est-workload-more"
          data-expanded={expanded || undefined}
        >
          <label className="est-workload-readiness-select">
            Scope readiness
            <select name="view" defaultValue={view}>
              <option value="all">All readiness states</option>
              {readinessOrder.map((id) => (
                <option key={id} value={id}>
                  {workloadLabels[id]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estimating owner
            <select name="owner" defaultValue={owner}>
              <option value="all">All permitted owners</option>
              <option value="mine">My estimating work</option>
            </select>
          </label>
          <label>
            Sort workload
            <select name="sort" defaultValue={sort}>
              <option value="updated">Recently changed</option>
              <option value="customer">Customer</option>
            </select>
          </label>
        </div>
        <div className="est-workload-actions">
          <Button type="submit" variant="primary">
            Apply filters
          </Button>
          <Link href="/estimating">Clear filters</Link>
        </div>
      </form>
      <div
        className="est-workload-segments"
        role="group"
        aria-labelledby={`${regionId}-readiness`}
      >
        <span id={`${regionId}-readiness`}>Scope readiness</span>
        <div className="view-switch">
          {(["all", ...readinessOrder] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => apply({ view: id })}
            >
              {id === "all" ? "All" : workloadLabels[id]}
              {counts && (
                <span className="est-workload-count">
                  {id === "all" ? total : counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <ErrorNotice error={data.error} />
      {data.error != null && (
        <section
          className="est-workload-failed"
          aria-label="Workload unavailable"
        >
          <p>
            The workload is unavailable. Refresh before relying on its contents.
          </p>
          <Button onClick={data.reload}>Try loading again</Button>
        </section>
      )}
      {data.loading && data.error == null && (
        <p role="status" className="est-workload-loading">
          Loading permitted estimating workload…
        </p>
      )}
      {data.data && data.error == null && (
        <>
          <p role="status" className="est-workload-summary">
            {items.length} permitted{" "}
            {items.length === 1 ? "opportunity" : "opportunities"} in this view.
          </p>
          <p className="est-workload-limit">
            Up to {data.data.candidate_limit} permitted opportunities matching
            the search and owner are examined, in the chosen sort order.
            Readiness filters and counts apply within that window; narrow the
            search to find older work. Closed Sales records appear only where an
            estimating workspace already exists.
          </p>
          {items.length ? (
            <div className="est-workload-split">
              <section
                className="est-workload-list"
                aria-label="Permitted opportunities"
              >
                {layout !== "stack" && (
                  <div className="est-workload-columns" aria-hidden="true">
                    <span>Opportunity</span>
                    <span>Readiness</span>
                    <span>Ownership</span>
                  </div>
                )}
                {items.map((item) => (
                  <WorkloadRow
                    key={item.opportunity.id}
                    item={item}
                    layout={layout}
                    selected={
                      (selected ?? opened)?.opportunity.id ===
                      item.opportunity.id
                    }
                    onSelect={() => {
                      setChosen(item.opportunity.id);
                      if (layout === "drawer") setDrawerOpen(true);
                    }}
                  />
                ))}
              </section>
              {selected && (
                <aside
                  className="est-workload-panel"
                  id="est-workload-detail"
                  aria-labelledby="est-workload-detail-title"
                >
                  <p className="est-workload-panel-label">
                    Selected opportunity
                  </p>
                  <WorkloadDetail
                    item={selected}
                    titleId="est-workload-detail-title"
                  />
                </aside>
              )}
            </div>
          ) : (
            <EmptyWorkload filtered={query.size > 0} />
          )}
        </>
      )}
      {opened && (
        <WorklistPanel
          title={opened.opportunity.title}
          onClose={() => setDrawerOpen(false)}
        >
          <WorkloadDetail item={opened} />
        </WorklistPanel>
      )}
      <section
        className="est-workload-boundaries"
        aria-labelledby={`${regionId}-policy`}
      >
        <h2 id={`${regionId}-policy`}>Intake authority and policy</h2>
        <dl>
          <dt>Intake acceptance</dt>
          <dd>Not configured</dd>
          <dt>Estimator allocation</dt>
          <dd>Not configured</dd>
          <dt>Return decisions</dt>
          <dd>Not configured</dd>
          <dt>Priority rules</dt>
          <dd>Not configured</dd>
          <dt>Required response date</dt>
          <dd>Unknown</dd>
        </dl>
        <p>
          A Sales action due date is shown separately and is not a quotation
          deadline. Discovery completeness is scope evidence; it does not
          approve a price or issue a quotation. Excel estimate import is not yet
          available; manual estimating continues through the existing estimate
          and discovery workflows.
        </p>
      </section>
    </div>
  );
}

function EmptyWorkload({ filtered }: { filtered: boolean }) {
  return (
    <section className="est-workload-empty">
      <span className="ppo-empty-icon" aria-hidden="true">
        <ProductIcon name={filtered ? "search" : "work"} />
      </span>
      <h2>
        {filtered
          ? "No workload matches these filters"
          : "No permitted estimating workload"}
      </h2>
      <p>
        {filtered
          ? "Clear the filters or search another customer or opportunity reference."
          : "Start from an existing Sales opportunity. An opportunity is a candidate brief; it has not been accepted for estimating merely by appearing here."}
      </p>
      <Link href={filtered ? "/estimating" : "/sales/opportunities"}>
        {filtered ? "Show all permitted workload" : "Open Sales opportunities"}
      </Link>
    </section>
  );
}

function discoverySummary(item: Item) {
  const workspace = item.workspace;
  const selected = workspace?.options.find(
    (o) => o.id === workspace.selected_option_id,
  );
  if (!workspace || !selected) return "No discovery workspace";
  const active = workspace.options.filter((o) => o.state === "Active").length;
  return `Option ${selected.label} · r${selected.revision} · ${active} ${active === 1 ? "alternative" : "alternatives"}`;
}

function Identity({ item }: { item: Item }) {
  return (
    <p className="est-workload-ref">
      <Link href={`/sales/opportunities/${item.opportunity.id}`}>
        {item.opportunity.display_number}
      </Link>{" "}
      · Sales source v{item.opportunity.version} ·{" "}
      {item.opportunity.close_outcome}
    </p>
  );
}

function WorkloadRow({
  item,
  layout,
  selected,
  onSelect,
}: {
  item: Item;
  layout: Layout | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const stacked = layout === "stack";
  return (
    <article
      className="est-workload-row"
      data-selected={selected || undefined}
      aria-label={`${item.opportunity.display_number} ${item.opportunity.title}`}
    >
      <div className="est-workload-cell">
        <Identity item={item} />
        {stacked ? (
          <h2>{item.opportunity.title}</h2>
        ) : (
          // The panel or drawer carries this record's heading; the row selects.
          <p className="est-workload-title">
            <button
              type="button"
              className="est-workload-select"
              {...(layout === "panel"
                ? {
                    "aria-pressed": selected,
                    "aria-controls": "est-workload-detail",
                  }
                : { "aria-haspopup": "dialog" as const })}
              onClick={onSelect}
            >
              {item.opportunity.title}
            </button>
          </p>
        )}
        <p>
          <strong>{item.customer}</strong> ·{" "}
          {item.site ?? "Site unknown or not required"}
        </p>
        {!stacked && (
          <p className="est-workload-muted">
            Changed {changed(item.updated_at)}
          </p>
        )}
      </div>
      {stacked ? (
        <WorkloadDetail item={item} inCard />
      ) : (
        <>
          <div className="est-workload-cell">
            <Status
              value={workloadLabels[item.state]}
              tone={readinessTone[item.state]}
            />
            <p className="est-workload-muted">{discoverySummary(item)}</p>
          </div>
          <div className="est-workload-cell">
            <p>
              <span className="sr-only">Estimating owner: </span>
              {item.estimating_owner ?? "Not allocated"}
            </p>
            <p className="est-workload-muted">Sales · {item.sales_owner}</p>
          </div>
        </>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="est-workload-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function WorkloadDetail({
  item,
  titleId,
  inCard = false,
}: {
  item: Item;
  titleId?: string;
  inCard?: boolean;
}) {
  const href = item.workspace
    ? `/estimating/discovery/${item.workspace.id}`
    : `/estimating/discovery/new?opportunity=${item.opportunity.id}`;
  return (
    <div className="est-workload-detail">
      {!inCard && (
        <header>
          <Identity item={item} />
          {titleId && <h2 id={titleId}>{item.opportunity.title}</h2>}
          <p>
            <strong>{item.customer}</strong> ·{" "}
            {item.site ?? "Site unknown or not required"}
          </p>
        </header>
      )}
      <p>
        <Status
          value={workloadLabels[item.state]}
          tone={readinessTone[item.state]}
        />
      </p>
      <p className="est-workload-need">{item.opportunity.need_summary}</p>
      <Section title="Next estimating step">
        <p>{nextStep[item.state]}</p>
        {item.workspace || item.can_start ? (
          <ButtonLink href={href} variant="primary">
            {item.workspace ? "Open discovery" : "Start discovery"}
          </ButtonLink>
        ) : (
          <p className="est-workload-notice">
            <ProductIcon name="info" />
            Estimating edit permission is required to start discovery.
          </p>
        )}
      </Section>
      <Section title="Ownership and dates">
        <dl>
          <dt>Estimating owner</dt>
          <dd>{item.estimating_owner ?? "Not allocated"}</dd>
          <dt>Sales owner</dt>
          <dd>{item.sales_owner}</dd>
          <dt>Required response</dt>
          <dd>Unknown</dd>
          <dt>Last changed</dt>
          <dd>{changed(item.updated_at)}</dd>
        </dl>
      </Section>
      <Section title="Discovery alternatives">
        {item.workspace ? (
          <ul>
            {item.workspace.options.map((o) => (
              <li key={o.id}>
                Option {o.label} · Discovery r{o.revision}
                <small>
                  {o.readiness === "Complete"
                    ? "Scope complete"
                    : o.readiness === "Incomplete"
                      ? "Scope incomplete"
                      : "Readiness not recorded"}
                  {o.state !== "Active" ? ` · ${o.state}` : ""}
                  {o.id === item.workspace!.selected_option_id
                    ? " · Selected"
                    : ""}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No discovery workspace.</p>
        )}
      </Section>
      <Section title="Saved estimates">
        {item.estimates.length ? (
          <ul>
            {item.estimates.map((e) => (
              <li key={e.id}>
                <Link href={`/estimating/estimates/${e.id}`}>
                  {e.display_number} · Saved estimate v{e.version}
                </Link>
                <small>
                  {e.discovery_revision === null
                    ? "Legacy manual basis"
                    : `Costed discovery r${e.discovery_revision}`}{" "}
                  · Draft
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No readable saved estimate. Unpriced scope is not zero.</p>
        )}
      </Section>
      {item.sales_handover_due && (
        <p className="est-workload-notice">
          <ProductIcon name="info" />
          Sales handover due · opportunity v
          {item.sales_handover_due.opportunity_version}. Receiving acceptance is
          not recorded.
        </p>
      )}
      <Section title="Sales context">
        {item.sales_action ? (
          <p>
            Next action: {item.sales_action.summary}
            <small>
              {item.sales_action.owner} · {item.sales_action.status} ·{" "}
              {item.sales_action.due_at
                ? `Due ${new Date(item.sales_action.due_at).toLocaleString("en-AU")}`
                : "Due date unknown"}
            </small>
          </p>
        ) : (
          <p>Sales next action unavailable under current access.</p>
        )}
        <p className="est-workload-muted">
          A Sales action date is not a quotation deadline.
        </p>
        <Link href={`/sales/opportunities/${item.opportunity.id}`}>
          Open Sales opportunity
        </Link>
      </Section>
    </div>
  );
}

function SavedEstimates() {
  const data = useCrmResource<Estimates>("estimating/estimates");
  return (
    <section className="est-saved-register" aria-labelledby="est-saved-heading">
      <h2 id="est-saved-heading" className="sr-only">
        Saved estimates
      </h2>
      <ErrorNotice error={data.error} />
      {data.error != null && (
        <section
          className="est-workload-failed"
          aria-label="Saved estimates unavailable"
        >
          <p>
            Saved estimates are unavailable. Refresh before relying on this
            register.
          </p>
          <Button onClick={data.reload}>Try loading again</Button>
        </section>
      )}
      {data.loading && data.error == null && (
        <p role="status" className="est-workload-loading">
          Loading permitted saved estimates…
        </p>
      )}
      {data.data && data.error == null && (
        <>
          <div className="est-saved-toolbar">
            <p role="status" className="est-workload-summary">
              Showing up to {data.data.limit} permitted estimates, most recently
              saved first.
            </p>
            {data.data.can_create && (
              <ButtonLink href="/estimating/new" variant="primary">
                New estimate
              </ButtonLink>
            )}
          </div>
          {data.data.items.length ? (
            <table className="est-saved-table">
              <thead>
                <tr>
                  <th scope="col">Estimate</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Version</th>
                  <th scope="col">Saved</th>
                  <th scope="col" className="est-amount">
                    Saved sell
                    <small>AUD, excluding tax</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.items.map((e) => (
                  <tr key={e.id}>
                    <th scope="row">
                      <Link href={`/estimating/estimates/${e.id}`}>
                        {e.title}
                      </Link>
                      <small>{e.display_number} · Draft</small>
                    </th>
                    <td data-label="Customer">{e.customer}</td>
                    <td data-label="Version">v{e.version}</td>
                    <td data-label="Saved">{changed(e.updated_at)}</td>
                    <td
                      data-label="Saved sell, AUD excluding tax"
                      className="est-amount"
                    >
                      {e.sell_total == null ? "Not estimated" : e.sell_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <section className="est-workload-empty">
              <span className="ppo-empty-icon" aria-hidden="true">
                <ProductIcon name="work" />
              </span>
              <h2>No saved estimates</h2>
              <p>
                Start from an existing opportunity and record the scope,
                assumptions and manual pricing basis.
              </p>
              <Link href="/sales/opportunities">Open Sales opportunities</Link>
            </section>
          )}
          <p className="est-workload-limit">
            Amounts are the saved manual sell total in AUD, excluding tax; tax
            is not calculated. An estimate without cost lines is not estimated,
            not zero.
          </p>
        </>
      )}
    </section>
  );
}
