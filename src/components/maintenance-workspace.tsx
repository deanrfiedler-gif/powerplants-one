"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, ReadState, Status, Field, friendly } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { RecordPanel, RecordTabs } from "./record-ui";
import { useCrmResource } from "./crm-state";
import {
  MaForm,
  f,
  baseContext,
  ownerField,
  sourceField,
  agreementFields,
  planFields,
  assessmentFields,
  type MaOptions,
  type MaField,
} from "./maintenance-forms";
import { MaintenanceActions } from "./maintenance-record-actions";
import type { Family } from "../maintenance/context";
import type { register, workspace, options } from "../maintenance/reads";
import "../app/styles/maintenance.css";

export const maPages: Record<
  Family,
  { title: string; path: string; scope: string }
> = {
  agreements: {
    title: "Service agreements",
    path: "maintenance/agreements",
    scope: "MA-01",
  },
  coverage: {
    title: "Coverage & entitlement",
    path: "maintenance/coverage",
    scope: "MA-02",
  },
  plans: {
    title: "Maintenance plans",
    path: "maintenance/plans",
    scope: "MA-03",
  },
  due: { title: "Due maintenance", path: "maintenance/due", scope: "MA-04" },
  renewals: {
    title: "Renewals & relationship review",
    path: "maintenance/renewals",
    scope: "MA-05",
  },
  cases: { title: "Warranty cases", path: "warranty/cases", scope: "MA-06" },
  recovery: {
    title: "Supplier recovery",
    path: "warranty/supplier-recovery",
    scope: "MA-07",
  },
};
export type MaWorkspace = Awaited<ReturnType<typeof workspace>>;
function recordFacts(family: Family, detail: MaWorkspace) {
  const revision = (
    detail.sources.revisions as
      { content: Record<string, unknown> }[] | undefined
  )?.[0];
  const row =
    revision?.content ?? (detail.row as unknown as Record<string, unknown>);
  const keys: Record<Family, string[]> = {
    agreements: [
      "effective_from",
      "effective_to",
      "service_scope",
      "exclusions",
      "response_terms",
      "charging_basis",
      "responsibilities",
      "source",
    ],
    plans: [
      "task_set_reference",
      "task_set_revision",
      "interval",
      "anchor",
      "timezone",
      "window_months",
      "tolerance",
      "effective_from",
      "interval_source",
      "tasks",
    ],
    due: ["original_due", "target_date", "timezone", "state"],
    coverage: [
      "event_date",
      "status",
      "basis",
      "cause",
      "review_due",
      "next_action",
    ],
    renewals: [
      "review_from",
      "next_date",
      "next_action",
      "proposal",
      "customer_response",
    ],
    cases: ["event_date", "symptoms", "next_review", "next_action", "source"],
    recovery: [
      "scope",
      "claimed_minor",
      "approved_minor",
      "credited_minor",
      "unrecovered_minor",
      "currency",
      "tax_basis",
      "due_date",
    ],
  };
  return Object.fromEntries(keys[family].map((key) => [key, row[key]]));
}
export const pick = (v: Record<string, unknown>, fields: MaField[]) =>
  Object.fromEntries(fields.map((f) => [f.key, v[f.key] ?? null]));
export function MaintenanceNav() {
  const path = usePathname();
  return (
    <nav className="ma-nav" aria-label="Maintenance and warranty workspaces">
      {Object.entries(maPages).map(([key, page]) => (
        <Link
          key={key}
          href={`/${page.path}`}
          aria-current={path?.startsWith(`/${page.path}`) ? "page" : undefined}
        >
          {page.title}
        </Link>
      ))}
    </nav>
  );
}
export function EvidenceValue({ value }: { value: unknown }) {
  if (value == null || value === "") return <>Not established</>;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (Array.isArray(value))
    return value.length ? (
      <ul className="ma-evidence-list">
        {value.map((x, i) => (
          <li key={i}>
            <EvidenceValue value={x} />
          </li>
        ))}
      </ul>
    ) : (
      <>None recorded</>
    );
  if (typeof value === "object")
    return (
      <dl className="ma-facts">
        {Object.entries(value as Record<string, unknown>)
          .filter(
            ([k]) => !["workspace_id", "synthetic", "updated_by"].includes(k),
          )
          .map(([key, v]) => (
            <div key={key}>
              <dt>{friendly(key)}</dt>
              <dd>
                <EvidenceValue value={v} />
              </dd>
            </div>
          ))}
      </dl>
    );
  return <>{String(value)}</>;
}
function ReceivingLinks({ sources }: { sources: Record<string, unknown> }) {
  const requests = (sources.requests ?? []) as {
    id: string;
    ticket_id: string;
  }[];
  const claims = (sources.claims ?? []) as { id: string; reference: string }[];
  return (
    <div className="ma-context">
      {requests.map((r) => (
        <ButtonLink key={r.id} href={`/service/tickets/${r.ticket_id}`}>
          Open original Service request
        </ButtonLink>
      ))}
      {claims.map((c) => (
        <ButtonLink key={c.id} href={`/warranty/supplier-recovery/${c.id}`}>
          {c.reference}
        </ButtonLink>
      ))}
    </div>
  );
}
export function SourceCard({
  title,
  value,
  open = false,
}: {
  title: string;
  value: unknown;
  open?: boolean;
}) {
  return (
    <details className="ma-source" open={open}>
      <summary>{title}</summary>
      <EvidenceValue value={value} />
    </details>
  );
}
function optionBuckets(
  data: Awaited<ReturnType<typeof options>> | null,
): MaOptions {
  if (!data) return {};
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => Array.isArray(v)),
  ) as MaOptions;
}
function CreateRecord({
  family,
  onSaved,
}: {
  family: Family;
  onSaved: (id: string) => void;
}) {
  const o = useCrmResource<Awaited<ReturnType<typeof options>>>(
    "maintenance/options",
    true,
  );
  const opts = optionBuckets(o.data),
    common = [baseContext[0], ownerField];
  const company = (v: Record<string, unknown>) =>
    opts.customers?.find((o) => o.id === v.customer_id)?.company_id;
  const settings: Partial<
    Record<
      Family,
      {
        fields: MaField[];
        build: (v: Record<string, unknown>) => Record<string, unknown>;
      }
    >
  > = {
    agreements: {
      fields: [...common, ...agreementFields],
      build: (v) => ({
        id: crypto.randomUUID(),
        company_id: company(v),
        ...pick(v, common),
        content: pick(v, agreementFields),
      }),
    },
    coverage: {
      fields: [
        ...baseContext,
        ...assessmentFields.filter((x) => x.key !== "owner_id"),
      ],
      build: (v) => ({
        id: crypto.randomUUID(),
        company_id: company(v),
        ...pick(
          v,
          baseContext.filter((x) => x.key !== "owner_id"),
        ),
        assessment: pick(v, assessmentFields),
      }),
    },
    plans: {
      fields: [...baseContext, ...planFields],
      build: (v) => ({
        id: crypto.randomUUID(),
        company_id: company(v),
        ...pick(v, baseContext),
        content: pick(v, planFields),
      }),
    },
    renewals: {
      fields: [
        f("agreement_revision_id", "Agreement revision", "select", {
          bucket: "agreements",
        }),
        baseContext[1],
        ownerField,
        f("review_from", "Renewal review window begins", "date"),
        f("next_date", "Next action date", "date"),
        f("next_action", "Next action", "textarea"),
      ],
      build: (v) => ({ id: crypto.randomUUID(), ...v }),
    },
    cases: {
      fields: [
        ...baseContext,
        f("event_date", "Reported failure date", "date"),
        f(
          "symptoms",
          "Observed symptoms (cause assessed separately)",
          "textarea",
        ),
        sourceField,
        f("next_review", "Next review", "date"),
        f("next_action", "Next action", "textarea"),
      ],
      build: (v) => ({ id: crypto.randomUUID(), company_id: company(v), ...v }),
    },
    recovery: {
      fields: [
        f("case_id", "Warranty case", "select", { bucket: "cases" }),
        f("expected_case_version", "Observed case version", "number"),
        f("assessment_id", "Exact current assessment", "select", {
          bucket: "assessments",
        }),
        f("supplier_id", "Supplier", "select", { bucket: "customers" }),
        f("scope", "Exact claim scope", "textarea"),
        f("claimed_minor", "Claimed amount in minor units", "number", {
          hint: "Use the minor-unit scale of the named currency. No currency conversion is performed.",
        }),
        f("currency", "Currency code"),
        f("tax_basis", "Tax basis", "select", {
          options: ["ExcludingTax", "IncludingTax", "NotApplicable"],
        }),
        ownerField,
        f("due_date", "Recovery review due", "date"),
      ],
      build: (v) => ({ id: crypto.randomUUID(), ...v }),
    },
  };
  const setting = settings[family];
  if (!setting) return null;
  return (
    <>
      <ReadState loading={o.loading} error={o.error} retry={o.reload} />
      {o.data && (
        <MaForm
          title={`Create ${family === "cases" ? "warranty case" : family === "coverage" ? "assessment" : family === "recovery" ? "supplier claim" : family === "renewals" ? "renewal review" : family === "plans" ? "maintenance plan" : "agreement"}`}
          path={maPages[family].path}
          fields={setting.fields}
          build={setting.build}
          options={opts}
          onSaved={(r) => onSaved(r.record_id)}
        />
      )}
    </>
  );
}
export function MaintenanceRegister({ family }: { family: Family }) {
  const router = useRouter(),
    params = useSearchParams(),
    page = maPages[family],
    query = params.toString();
  const r = useCrmResource<Awaited<ReturnType<typeof register>>>(
    `${page.path}${query ? `?${query}` : ""}`,
    true,
  );
  const [create, setCreate] = useState(false);
  const change = (key: string, value: string) => {
    const q = new URLSearchParams(params);
    if (value) q.set(key, value);
    else q.delete(key);
    if (key !== "page") q.delete("page");
    router.push(`/${page.path}?${q}`);
  };
  return (
    <div
      id={
        family === "cases" || family === "recovery"
          ? "ppo-warranty"
          : "ppo-maintenance"
      }
      className="ma-workspace"
    >
      <MaintenanceNav />
      <PageHeader
        eyebrow={page.scope}
        title={page.title}
        description="Sourced obligations, owned reviews and separate receiving decisions."
        variant="register"
        action={
          r.data?.can_create && family !== "due" ? (
            <Button onClick={() => setCreate((v) => !v)}>
              {create ? "Close create panel" : "New record"}
            </Button>
          ) : undefined
        }
      />
      <form className="ma-filters" onSubmit={(e) => e.preventDefault()}>
        <Field
          name="ma-search"
          label="Search permitted records"
          value={params.get("q") ?? ""}
          onChange={(v) => change("q", v)}
        />
        <label>
          State
          <select
            value={params.get("state") ?? ""}
            onChange={(e) => change("state", e.target.value)}
          >
            <option value="">All states</option>
            {r.data?.states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Order
          <select
            value={params.get("sort") ?? "due"}
            onChange={(e) => change("sort", e.target.value)}
          >
            <option value="due">Next date</option>
            <option value="customer">Customer</option>
            <option value="reference">Reference</option>
          </select>
        </label>
        <Button variant="quiet" onClick={() => router.push(`/${page.path}`)}>
          Clear filters
        </Button>
      </form>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <div className="ma-snapshot">
            <span>
              <strong>{r.data.total}</strong> permitted records
            </span>
            <span>
              <strong>{r.data.filtered}</strong> matching filters
            </span>
            <span>{r.data.completeness}</span>
          </div>
          {!r.data.can_create && (
            <p className="ma-notice">
              Read-only for this identity. Decisions require current action
              permissions.
            </p>
          )}
          {create && r.data.can_create && (
            <CreateRecord
              family={family}
              onSaved={(id) => router.push(`/${page.path}/${id}`)}
            />
          )}
          <div className="ma-register">
            {r.data.items.map((x) => (
              <article key={x.id}>
                <header>
                  <Link href={x.href}>{x.reference}</Link>
                  <Status value={x.state} />
                </header>
                <h2>
                  <Link href={x.href}>{x.title}</Link>
                </h2>
                <p>
                  {x.customer} · {x.site}
                </p>
                {x.asset && <p>{x.asset}</p>}
                <dl>
                  <dt>Owner</dt>
                  <dd>{x.owner}</dd>
                  <dt>Next date</dt>
                  <dd>{x.due ?? "Not established"}</dd>
                </dl>
                {x.next_action && <p>{x.next_action}</p>}
                {x.coverage && <p>Coverage: {friendly(x.coverage)}</p>}
                {x.customer_outcome && (
                  <p>Customer: {friendly(x.customer_outcome)}</p>
                )}
                {x.recovery && <p>Supplier recovery: {friendly(x.recovery)}</p>}
              </article>
            ))}
          </div>
          {!r.data.items.length && (
            <p role="status">
              {r.data.total
                ? "No records match these filters. Clear filters to see permitted records."
                : "No permitted records have been recorded yet."}
            </p>
          )}
          <nav className="ma-pagination" aria-label="Worklist pages">
            <Button
              disabled={r.data.page <= 1}
              onClick={() => change("page", String(r.data!.page - 1))}
            >
              Previous
            </Button>
            <span>Page {r.data.page}</span>
            <Button
              disabled={r.data.page * 30 >= r.data.filtered}
              onClick={() => change("page", String(r.data!.page + 1))}
            >
              Next
            </Button>
          </nav>
        </>
      )}
      {family === "due" && (
        <p className="ma-notice">
          Generate due obligations from a reviewed{" "}
          <Link href="/maintenance/plans">maintenance plan</Link>. A due
          occurrence is not a booking.
        </p>
      )}
      {family === "recovery" && (
        <p className="ma-notice">
          Warranty returns are not yet connected to Supply receiving. Supplier approval,
          physical-return evidence, Finance credit links and cash recovery are
          separate.
        </p>
      )}
    </div>
  );
}
export function MaintenanceRecord({
  family,
  id,
}: {
  family: Family;
  id: string;
}) {
  const page = maPages[family],
    params = useSearchParams(),
    router = useRouter();
  const r = useCrmResource<MaWorkspace>(`${page.path}/${id}`, true),
    o = useCrmResource<Awaited<ReturnType<typeof options>>>(
      "maintenance/options",
      true,
    );
  const tabs =
    family === "cases"
      ? [
          { id: "evidence", label: "Failure & evidence" },
          { id: "coverage", label: "Coverage assessment" },
          { id: "resolution", label: "Resolution plan" },
          { id: "customer", label: "Customer outcome" },
          { id: "supplier", label: "Supplier recovery" },
          { id: "history", label: "History" },
        ]
      : [
          { id: "record", label: "Record & sources" },
          { id: "actions", label: "Decisions & handovers" },
          { id: "history", label: "History" },
        ];
  const tab = tabs.some((t) => t.id === params.get("view"))
    ? params.get("view")!
    : tabs[0].id;
  const select = (value: string) => {
    const q = new URLSearchParams(params);
    q.set("view", value);
    router.push(`/${page.path}/${id}?${q}`);
  };
  return (
    <div
      id={
        family === "cases" || family === "recovery"
          ? "ppo-warranty"
          : "ppo-maintenance"
      }
      className="ma-workspace"
    >
      <MaintenanceNav />
      <ButtonLink href={`/${page.path}`}>
        Back to {page.title.toLowerCase()}
      </ButtonLink>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <PageHeader
            eyebrow={`${page.scope} · ${r.data.heading.reference}`}
            title={r.data.heading.title}
            description={`${r.data.heading.customer} · ${r.data.heading.site}`}
          />
          <div className="ma-context">
            <Status value={r.data.heading.state} />
            <span>Owner: {r.data.heading.owner}</span>
            <span>Next review: {r.data.heading.due ?? "Not established"}</span>
            <span>Record version {r.data.row.version}</span>
          </div>
          {r.data.heading.customer_outcome && (
            <p>
              Customer: {r.data.heading.customer_outcome} · Supplier:{" "}
              {r.data.heading.recovery ?? "No claim recorded"}
            </p>
          )}
          <RecordTabs
            id="ma-record"
            label="Record views"
            tabs={tabs}
            value={tab}
            onChange={select}
          />
          {tabs.map((t) => (
            <RecordPanel key={t.id} id="ma-record" tab={t.id} value={tab}>
              {t.id === "history" ? (
                <>
                  <h2>Retained decision history</h2>
                  {r.data!.history.map((e) => (
                    <SourceCard
                      key={e.id}
                      title={`${e.version} · ${friendly(e.action)} · ${new Date(e.created_at).toLocaleString("en-AU")}`}
                      value={{
                        reason: e.reason,
                        actor: e.created_by,
                        ...e.content,
                      }}
                    />
                  ))}
                </>
              ) : (
                <>
                  {(t.id === "record" || t.id === "evidence") && (
                    <>
                      <SourceCard
                        title="Current record facts"
                        value={recordFacts(family, r.data!)}
                        open
                      />
                      <SourceCard
                        title="Retained record identity"
                        value={r.data!.row}
                      />
                      {r.data!.sources.asset && (
                        <SourceCard
                          title="Canonical Equipment — independent dates and location"
                          value={r.data!.sources.asset}
                          open
                        />
                      )}
                    </>
                  )}
                  {Object.entries(r.data!.sources)
                    .filter(
                      ([key]) =>
                        t.id === "record" ||
                        (t.id === "evidence" && key === "evidence") ||
                        (t.id === "coverage" && key === "assessments") ||
                        (t.id === "resolution" &&
                          ["plans", "requests", "results"].includes(key)) ||
                        (t.id === "customer" &&
                          ["updates", "responses"].includes(key)) ||
                        (t.id === "supplier" && key === "claims"),
                    )
                    .map(([key, value]) => (
                      <SourceCard
                        key={key}
                        title={friendly(key)}
                        value={value}
                      />
                    ))}
                  {["record", "resolution", "supplier"].includes(t.id) && (
                    <ReceivingLinks sources={r.data!.sources} />
                  )}
                  <MaintenanceActions
                    family={family}
                    detail={r.data!}
                    tab={t.id}
                    options={optionBuckets(o.data)}
                    onSaved={() => {
                      r.reload();
                      o.reload();
                    }}
                  />
                  {family === "cases" && t.id === "supplier" && (
                    <ButtonLink href="/warranty/supplier-recovery">
                      Open supplier recovery worklist
                    </ButtonLink>
                  )}
                </>
              )}
            </RecordPanel>
          ))}
          <p className="ma-notice">
            Coverage, work authority, booking, customer resolution and Finance
            treatment retain separate decisions. No external transaction or
            message is sent.
          </p>
        </>
      )}
    </div>
  );
}
