"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { readEstimatingWorkload } from "../estimating/workload";
import { workloadLabels } from "../estimating/workload-query";
import { useCrmResource } from "./crm-state";
import { ErrorNotice, PageHeader, Status } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { EstimateList } from "./estimating-screens";
import "./estimating-workload.css";

type Workload = Awaited<ReturnType<typeof readEstimatingWorkload>>;
type Item = Workload["items"][number];

export function EstimatingWorkload() {
  const params = useSearchParams(),
    router = useRouter();
  const saved = params.get("tab") === "estimates";
  const query = new URLSearchParams();
  for (const key of ["q", "view", "owner", "sort"])
    if (params.has(key)) query.set(key, params.get(key)!);
  const data = useCrmResource<Workload>(
    saved ? null : `estimating/workload?${query}`,
    true,
  );
  return (
    <div className="est-screen est-workload">
      <PageHeader
        variant="register"
        eyebrow="Estimating · Synthetic"
        title="Estimating intake & workload"
        description="Review opportunity briefs, scope readiness and the next estimating step. Saved costs retain their exact basis."
      />
      <nav className="est-workload-nav" aria-label="Estimating registers">
        <Link aria-current={!saved ? "page" : undefined} href="/estimating">
          Intake & workload
        </Link>
        <Link
          aria-current={saved ? "page" : undefined}
          href="/estimating?tab=estimates"
        >
          Saved estimates
        </Link>
        <Link href="/estimating/configurations">Specialist configurations</Link>
      </nav>
      {saved ? (
        <EstimateList />
      ) : (
        <>
          <form
            className="est-workload-filters"
            key={query.toString()}
            onSubmit={(event) => {
              event.preventDefault();
              const fields = new FormData(event.currentTarget),
                next = new URLSearchParams();
              for (const key of ["q", "view", "owner", "sort"]) {
                const value = String(fields.get(key) ?? "").trim();
                if (value) next.set(key, value);
              }
              router.push(`/estimating?${next}`, { scroll: false });
            }}
          >
            <label>
              Search workload
              <input
                type="search"
                name="q"
                maxLength={100}
                defaultValue={params.get("q") ?? ""}
                placeholder="Customer, opportunity or brief"
              />
            </label>
            <details className="est-workload-advanced">
              <summary>Readiness, owner and sort</summary>
              <div>
                <label>
                  Scope readiness
                  <select
                    name="view"
                    defaultValue={params.get("view") ?? "all"}
                  >
                    <option value="all">All readiness states</option>
                    {Object.entries(workloadLabels).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Estimating owner
                  <select
                    name="owner"
                    defaultValue={params.get("owner") ?? "all"}
                  >
                    <option value="all">All permitted owners</option>
                    <option value="mine">My estimating work</option>
                  </select>
                </label>
                <label>
                  Sort workload
                  <select
                    name="sort"
                    defaultValue={params.get("sort") ?? "updated"}
                  >
                    <option value="updated">Recently changed</option>
                    <option value="customer">Customer</option>
                  </select>
                </label>
              </div>
            </details>
            <Button type="submit" variant="primary">
              Apply filters
            </Button>
            <Link href="/estimating">Clear filters</Link>
          </form>
          <ErrorNotice error={data.error} />
          {data.loading && (
            <p role="status">Loading permitted estimating workload…</p>
          )}
          {data.error != null && (
            <div>
              <p>
                The workload is unavailable. Refresh before relying on its
                contents.
              </p>
              <Button onClick={data.reload}>Try loading again</Button>
            </div>
          )}
          {data.data && (
            <>
              <p role="status">
                {data.data.items.length} permitted{" "}
                {data.data.items.length === 1 ? "opportunity" : "opportunities"}{" "}
                in this view.
              </p>
              <p className="est-workload-limit">
                Bounded view of up to {data.data.candidate_limit} matching
                opportunities. Readiness filters apply within that window.
                Narrow the search to find older work. Closed Sales records
                appear only where an estimating workspace already exists.
              </p>
              {data.data.items.length ? (
                <div className="est-workload-rows">
                  {data.data.items.map((item) => (
                    <WorkloadRow key={item.opportunity.id} item={item} />
                  ))}
                </div>
              ) : (
                <section className="est-panel">
                  <h2>
                    {query.size
                      ? "No workload matches these filters"
                      : "No permitted estimating workload"}
                  </h2>
                  <p>
                    {query.size
                      ? "Clear the filters or search another customer or opportunity reference."
                      : "Start from an existing Sales opportunity. An opportunity is a candidate brief; it has not been accepted for estimating merely by appearing here."}
                  </p>
                  <Link
                    href={query.size ? "/estimating" : "/sales/opportunities"}
                  >
                    {query.size
                      ? "Show all permitted workload"
                      : "Open Sales opportunities"}
                  </Link>
                </section>
              )}
            </>
          )}
          <section
            className="est-panel est-workload-boundaries"
            aria-label="Intake authority and policy"
          >
            <h2>Intake authority and policy</h2>
            <p>
              Intake acceptance, estimator allocation, return decisions and
              priority rules: <strong>Not configured</strong>. Required response
              date: <strong>Unknown</strong>. A Sales action due date is shown
              separately and is not a quotation deadline.
            </p>
            <p>
              Discovery completeness is scope evidence. It does not approve a
              price or issue a quotation. Excel estimate import is not yet
              available; manual estimating is available through the existing
              estimate and discovery workflows.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function WorkloadRow({ item: item }: { item: Item }) {
  const selected = item.workspace?.options.find(
    (o) => o.id === item.workspace?.selected_option_id,
  );
  const href = item.workspace
    ? `/estimating/discovery/${item.workspace.id}`
    : `/estimating/discovery/new?opportunity=${item.opportunity.id}`;
  return (
    <article
      className="est-panel est-workload-row"
      aria-label={`${item.opportunity.display_number} ${item.opportunity.title}`}
    >
      <div className="est-workload-brief">
        <p className="est-eyebrow">
          <Link href={`/sales/opportunities/${item.opportunity.id}`}>
            {item.opportunity.display_number}
          </Link>{" "}
          · Sales source v{item.opportunity.version} ·{" "}
          {item.opportunity.close_outcome}
        </p>
        <h2>{item.opportunity.title}</h2>
        <p>
          <strong>{item.customer}</strong> ·{" "}
          {item.site ?? "Site unknown or not required"}
        </p>
        <p className="est-narrative">{item.opportunity.need_summary}</p>
        <p>
          <Status value={workloadLabels[item.state]} />
        </p>
      </div>
      <div className="est-workload-context">
        <dl>
          <dt>Estimating owner</dt>
          <dd>{item.estimating_owner ?? "Not allocated"}</dd>
          <dt>Sales owner</dt>
          <dd>{item.sales_owner}</dd>
          <dt>Required response</dt>
          <dd>Unknown</dd>
        </dl>
        {selected && (
          <p>
            Selected {selected.label} · Discovery r{selected.revision} ·{" "}
            {item.workspace!.options.filter((o) => o.state === "Active").length}{" "}
            active alternatives
          </p>
        )}
        {item.sales_handover_due && (
          <p>
            Sales handover due · opportunity v
            {item.sales_handover_due.opportunity_version}. Receiving acceptance
            is not recorded.
          </p>
        )}
        {item.sales_action ? (
          <p>
            Sales next action: {item.sales_action.summary} ·{" "}
            {item.sales_action.owner} · {item.sales_action.status} ·{" "}
            {item.sales_action.due_at
              ? new Date(item.sales_action.due_at).toLocaleString("en-AU")
              : "Due date unknown"}
          </p>
        ) : (
          <p>Sales next action unavailable under current access.</p>
        )}
      </div>
      <div className="est-workload-next">
        <h3>Next estimating step</h3>
        <p>
          {item.state === "unstarted"
            ? "Review the brief and establish discovery ownership."
            : item.state === "clarification"
              ? "Resolve owned scope questions in the selected alternative."
              : item.state === "legacy"
                ? "Review the saved manual basis or start explicit structured discovery."
                : "Review the exact discovery basis before adopting manual costs."}
        </p>
        {item.workspace || item.can_start ? (
          <ButtonLink href={href}>
            {item.workspace ? "Open discovery" : "Start discovery"}
          </ButtonLink>
        ) : (
          <p>Estimating edit permission is required to start discovery.</p>
        )}
        {item.estimates.map((e) => (
          <p key={e.id}>
            <Link href={`/estimating/estimates/${e.id}`}>
              {e.display_number} · Saved estimate v{e.version}
            </Link>
            <br />
            <small>
              {e.discovery_revision === null
                ? "Legacy manual basis"
                : `Costed discovery r${e.discovery_revision}`}{" "}
              · Draft
            </small>
          </p>
        ))}
        {!!item.workspace && !item.estimates.length && (
          <p>No readable saved estimate. Unpriced scope is not zero.</p>
        )}
      </div>
    </article>
  );
}
