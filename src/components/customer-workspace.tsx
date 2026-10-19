"use client";
import Link from "next/link";
import { formatCivilDay, formatDateTime } from "../shell/date-format";
const Stamp = ({ value }: { value: string }) => (
  <time dateTime={value}>
    {value.length === 10 ? formatCivilDay(value) : formatDateTime(value)}
  </time>
);
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useState } from "react";
import { ReadState, Status, SummaryPair } from "./business-ui";
import { useCrmResource } from "./crm-state";
import { RecordPanel, RecordTabs } from "./record-ui";
import { OrganisationCorrection } from "./organisation-correction";
import { DuplicateCandidates } from "./duplicate-candidates";
import { ButtonLink } from "./ui/button";
import {
  SharedRecord,
  RecordFactSection,
  RecordSourceState,
} from "./ui/shared-record";
import { RegisterTable } from "./ui/register-table";
import { WorklistChoice, WorklistMenu } from "./crm-worklist-tools";
import { organisationReturn } from "../shared/organisation-register-model";
import type {
  Customer360,
  CustomerRecordLink,
  CustomerSection,
} from "../shared/customer-360";

const tabs = [
  "overview",
  "sales",
  "service",
  "sites",
  "projects",
  "accounts",
  "activity",
].map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1) }));
const sourceLabels = {
  deals: "Deals",
  quotations: "Quotations",
  orders: "Sales orders",
  cases: "Requests",
  work_orders: "Work orders",
  projects: "Projects",
  accounts: "Accounts",
  activities: "Follow-ups",
  documents: "Documents",
};
type SourceKey = keyof Customer360["sections"];
const available = (s: CustomerSection) =>
  ["Complete", "Partial"].includes(s.state);
function ItemDetail({ item }: { item: CustomerRecordLink }) {
  return (
    <>
      {item.detail && <span>{item.detail}</span>}
      {item.due_at && (
        <>
          {" "}
          · <Stamp value={item.due_at} />
        </>
      )}
      {"amount" in item && (
        <span>
          {" "}
          Source account balance:{" "}
          {item.amount === null ? "Unknown" : `${item.amount} ${item.currency}`}
          . Company: {item.company_id}.{" "}
          {item.source_as_at && (
            <>
              Source as at <Stamp value={item.source_as_at} />.
            </>
          )}
        </span>
      )}
    </>
  );
}
function SourceList({
  title,
  source,
  retry,
}: {
  title: string;
  source: CustomerSection;
  retry: () => void;
}) {
  const rows = available(source)
    ? source.items.filter((i) => i.open_state !== "Closed")
    : [];
  return (
    <section className="org-source-list">
      <header>
        <h3>{title}</h3>
        <span>
          {source.state === "Not configured" ? "Not connected" : source.state}
        </span>
      </header>
      {!available(source) ? (
        <RecordSourceState title={title} state={source.state} retry={retry}>
          <p>{source.basis}</p>
        </RecordSourceState>
      ) : (
        <>
          <div className="org-work-rows">
            {rows.map((item) => (
              <article key={item.id}>
                <div>
                  <Link href={item.href}>{item.label}</Link>
                  <small>
                    {item.state}
                    {!item.open_state && " · Open status unconfirmed"}
                  </small>
                  <small>
                    <ItemDetail item={item} />
                  </small>
                </div>
                <Link href={item.href} aria-label={`Open ${item.label}`}>
                  Open
                </Link>
              </article>
            ))}
          </div>
          {!rows.length && (
            <p>
              {source.state === "Complete"
                ? "No matching records in this permitted source scope."
                : "No matching rows in this bounded view. The source may have further records."}
            </p>
          )}
          <details>
            <summary>Source scope and read time</summary>
            <p>{source.basis}</p>
            <p>
              {source.owner} · Read at <Stamp value={source.observed_at} />
            </p>
            {source.next_cursor && (
              <p>More records are available in the owning workspace.</p>
            )}
          </details>
        </>
      )}
    </section>
  );
}
function OpenWork({
  sections,
  retry,
}: {
  sections: Customer360["sections"];
  retry: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sources: SourceKey[] = [
    "deals",
    "quotations",
    "cases",
    "work_orders",
    "projects",
  ];
  return (
    <section className="org-open-work" data-expanded={expanded}>
      <div className="org-work-rows">
        {sources.flatMap((key) => {
          const source = sections[key];
          if (!available(source))
            return [
              <RecordSourceState
                key={key}
                title={sourceLabels[key]}
                state={source.state}
                retry={retry}
              >
                <p>{source.basis}</p>
              </RecordSourceState>,
            ];
          return source.items
            .filter((item) => item.open_state !== "Closed")
            .map((item) => (
              <article key={`${key}:${item.id}`}>
                <div>
                  <Link href={item.href}>{item.label}</Link>
                  <small>
                    {sourceLabels[key]} · {item.state}
                    {!item.open_state && " · Open status unconfirmed"}
                  </small>
                  <small>
                    <ItemDetail item={item} />
                  </small>
                </div>
                <Link href={item.href} aria-label={`Open ${item.label}`}>
                  Open
                </Link>
              </article>
            ));
        })}
      </div>
      <button
        type="button"
        className="secondary"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Show fewer records" : "Show all returned work"}
      </button>
      <details>
        <summary>Source scope and read times</summary>
        {sources.map((key) => (
          <div key={key}>
            <strong>
              {sourceLabels[key]} · {sections[key].state}
            </strong>
            <p>{sections[key].basis}</p>
            <p>
              Read at <Stamp value={sections[key].observed_at} />
            </p>
            {available(sections[key]) &&
              !sections[key].items.some((i) => i.open_state !== "Closed") && (
                <p>
                  {sections[key].state === "Complete"
                    ? "No matching permitted records."
                    : "No matching rows returned; the bounded source may have further records."}
                </p>
              )}
          </div>
        ))}
      </details>
    </section>
  );
}
function SourceTable({
  group,
  sections,
  type,
  status,
  change,
  retry,
}: {
  group: SourceKey[];
  sections: Customer360["sections"];
  type: string;
  status: string;
  change: (values: Record<string, string>) => void;
  retry: () => void;
}) {
  const chosen = group.includes(type as SourceKey) ? type : "all";
  return (
    <>
      <div className="org-source-filters">
        <div aria-label="Record type" className="org-type-chips">
          <button
            type="button"
            className="secondary"
            aria-pressed={chosen === "all"}
            onClick={() => change({ type: "" })}
          >
            All
          </button>
          {group.map((key) => (
            <button
              type="button"
              className="secondary"
              key={key}
              aria-pressed={chosen === key}
              onClick={() => change({ type: key })}
            >
              {sourceLabels[key]}
              {available(sections[key])
                ? ` (${sections[key].items.length}${sections[key].state === "Partial" ? "+" : ""})`
                : ""}
            </button>
          ))}
        </div>
        <WorklistChoice
          label="Status"
          prefix="Status: "
          value={status}
          onChange={(value) => change({ status: value })}
          options={[
            { id: "all", label: "All statuses" },
            { id: "open", label: "Open or awaiting a decision" },
            { id: "closed", label: "Closed" },
          ]}
        />
      </div>
      <p className="org-scope-note">
        Counts cover returned permitted records. Saved estimates are identified
        separately from Draft quotation revisions. Unknown open/closed status
        remains explicit; no amounts are totalled.
      </p>
      <div className="org-source-table">
        <RegisterTable
          variant="panel"
          caption="Permitted source records grouped by type"
        >
          <thead>
            <tr>
              <th>Record</th>
              <th>Stage or value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {group
              .filter((key) => chosen === "all" || chosen === key)
              .map((key) => {
                const source = sections[key],
                  rows = available(source)
                    ? source.items.filter(
                        (i) =>
                          status === "all" ||
                          i.open_state ===
                            (status === "open" ? "Open" : "Closed"),
                      )
                    : [];
                return (
                  <Fragment key={key}>
                    <tr className="org-source-group">
                      <th colSpan={3} scope="rowgroup">
                        {sourceLabels[key]} ·{" "}
                        {source.state === "Not configured"
                          ? "Not connected"
                          : source.state}
                      </th>
                    </tr>
                    {!available(source) ? (
                      <tr>
                        <td colSpan={3}>
                          <RecordSourceState
                            title={sourceLabels[key]}
                            state={source.state}
                            retry={retry}
                          >
                            <p>{source.basis}</p>
                          </RecordSourceState>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {rows.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <Link href={item.href}>{item.label}</Link>
                              {item.record_kind && (
                                <small>{item.record_kind}</small>
                              )}
                            </td>
                            <td>
                              <ItemDetail item={item} />
                            </td>
                            <td>{item.state}</td>
                          </tr>
                        ))}
                        {!rows.length && (
                          <tr>
                            <td colSpan={3}>
                              No matching rows in this returned source scope.
                            </td>
                          </tr>
                        )}
                        {status !== "all" &&
                          source.items.some((i) => !i.open_state) && (
                            <tr>
                              <td colSpan={3}>
                                Some returned records do not establish
                                open/closed status. Choose All statuses to
                                inspect them.
                              </td>
                            </tr>
                          )}
                        <tr>
                          <td colSpan={3}>
                            <details>
                              <summary>Source scope and read time</summary>
                              <p>{source.basis}</p>
                              <p>
                                {source.owner} · Read at{" "}
                                <Stamp value={source.observed_at} />
                              </p>
                            </details>
                          </td>
                        </tr>
                      </>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </RegisterTable>
      </div>
    </>
  );
}
export function CustomerWorkspace({ id }: { id: string }) {
  const r = useCrmResource<Customer360>(`customers/${id}/workspace`, true),
    params = useSearchParams(),
    router = useRouter(),
    o = r.data?.context;
  const [copyMessage, setCopyMessage] = useState(""),
    [correcting, setCorrecting] = useState(false);
  const oldTab = params.get("view") ?? params.get("tab"),
    requested = oldTab === "deals" || oldTab === "orders" ? "sales" : oldTab;
  const tab = tabs.some((t) => t.id === requested) ? requested! : "overview";
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) {
      if (key === "tab") {
        next.set("view", value);
        next.delete("tab");
      } else if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/customers/${id}?${next}`, { scroll: false });
  }
  const back = organisationReturn(params.get("from"));
  if (!o || !r.data)
    return (
      <div className="org-record-state">
        <h1>Organisation</h1>
        <Link href={back}>Back to organisations</Link>
        <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      </div>
    );
  const sections = r.data.sections;
  const follow = `/work/new?${new URLSearchParams({ type: "Organisation", id, company: o.company_id })}`;
  const currentSites = o.sites.filter((s) =>
    s.relationships?.some((r) => r.is_current),
  );
  const primary = o.contacts?.find(
    (c) =>
      currentSites.some((s) => s.primary_contact_id === c.id) &&
      c.valid_from <= r.data!.observed_at.slice(0, 10) &&
      (!c.valid_to || c.valid_to > r.data!.observed_at.slice(0, 10)),
  );
  const sourceSummary = (Object.keys(sourceLabels) as SourceKey[]).map(
    (key) => (
      <span key={key} data-source-state={sections[key].state}>
        {sourceLabels[key]}:{" "}
        {sections[key].state === "Not configured"
          ? "Not connected"
          : sections[key].state}
      </span>
    ),
  );
  const primaryContact = (
    <section className="org-primary-contact">
      <h2>Primary contact</h2>
      {primary ? (
        <>
          <Link href={`/people/${primary.id}`}>{primary.display_name}</Link>
          <p>{primary.role_label} · recorded at a current linked site</p>
          {primary.phone && (
            <a href={`tel:${primary.phone.replace(/[^+0-9]/g, "")}`}>
              {primary.phone} · Call
            </a>
          )}
          {primary.email && (
            <a href={`mailto:${primary.email}`}>{primary.email} · Email</a>
          )}
          <small>
            Calls and email open your own apps. Nothing is sent or logged here.
          </small>
        </>
      ) : (
        <p>
          No current primary contact is available in this permitted view. Open
          Sites or People to confirm.
        </p>
      )}
    </section>
  );
  return (
    <SharedRecord
      id="ppo-customer-360"
      title={o.display_name}
      reference={o.display_number}
      status={<Status value={o.relationship_status} />}
      meta={
        <>
          <span>{o.sector ?? "Sector unknown"}</span>
          <span>{o.owner_name ?? "Owner not recorded"}</span>
          <span>Version {o.version}</span>
        </>
      }
      actions={
        <>
          <ButtonLink href={back}>Back to organisations</ButtonLink>
          <ButtonLink href={`/customers/${id}/development`}>
            Account development
          </ButtonLink>
          <ButtonLink variant="primary" href={follow}>
            Create follow-up
          </ButtonLink>
          <WorklistMenu label="Organisation actions" text="…">
            <Link
              className="org-phone-account"
              href={`/customers/${id}/development`}
            >
              Account development
            </Link>
            <Link href={`/customers/${id}/stakeholders`}>
              Stakeholders &amp; relationships
            </Link>
            <button
              type="button"
              className="secondary"
              data-menu-close
              onClick={r.reload}
            >
              Refresh sources
            </button>
            <button
              type="button"
              className="secondary"
              data-menu-close
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href).then(
                  () => setCopyMessage("Link copied."),
                  () => setCopyMessage("Copy the address from your browser."),
                );
              }}
            >
              Copy link
            </button>
            {o.can_edit && (
              <button
                type="button"
                className="secondary"
                data-menu-close
                onClick={() => setCorrecting(true)}
              >
                Correct details
              </button>
            )}
          </WorklistMenu>
          <span role="status">{copyMessage}</span>
        </>
      }
      sources={
        <>
          <strong>Sources for this customer</strong>
          {sourceSummary}
        </>
      }
      facts={
        <>
          <RecordFactSection title="Identity">
            <dl>
              {[
                ["Legal name", o.legal_name ?? "Not recorded"],
                ["Reference", o.display_number],
                ["Status", o.relationship_status],
                ["Sector", o.sector ?? "Unknown"],
                ["Relationship owner", o.owner_name ?? "Not recorded"],
                ["Company", o.company_name ?? o.company_id],
              ].map(([label, value]) => (
                <SummaryPair label={label} key={label}>
                  {value}
                </SummaryPair>
              ))}
            </dl>
            <p>An organisation is not automatically an ERP debtor account.</p>
          </RecordFactSection>
          <RecordFactSection title="Sites">
            {currentSites.map((site) => (
              <article key={site.id}>
                <Link href={`/sites/${site.id}`}>{site.display_name}</Link>
                <p>
                  {site.relationships
                    ?.filter((r) => r.is_current)
                    .map((r) => r.role)
                    .join(" · ")}
                </p>
                <small>Readiness: open Site to confirm</small>
              </article>
            ))}
            {!currentSites.length && (
              <p>No current site returned in your permitted scope.</p>
            )}
            <Link href={`/facilities?organisation_id=${id}`}>
              Facilities and growing areas
            </Link>
          </RecordFactSection>
          <RecordFactSection title="People">
            {o.contacts?.map((c) => (
              <article key={c.relationship_id}>
                <Link href={`/people/${c.id}`}>{c.display_name}</Link>
                <p>
                  {c.role_label}
                  {c.valid_to && (
                    <>
                      {" "}
                      · Relationship ends <Stamp value={c.valid_to} />
                    </>
                  )}
                </p>
              </article>
            ))}
            {!o.contacts?.length && (
              <p>No affiliations returned in your permitted scope.</p>
            )}
            {o.can_edit && (
              <ButtonLink
                href={`/customers/new?${new URLSearchParams({ kind: "affiliation", parent: id, company: o.company_id, version: String(o.version) })}`}
              >
                Add contact affiliation
              </ButtonLink>
            )}
          </RecordFactSection>
        </>
      }
      tabs={
        <RecordTabs
          id="customer-360"
          label="Customer workspace"
          value={tab}
          onChange={(value) => change({ tab: value, type: "", status: "" })}
          tabs={tabs}
        />
      }
      stickyAction={
        <ButtonLink variant="primary" href={follow}>
          Create follow-up
        </ButtonLink>
      }
    >
      {correcting && (
        <OrganisationCorrection
          current={o}
          reload={r.reload}
          close={() => setCorrecting(false)}
        />
      )}
      <RecordPanel id="customer-360" tab="overview" value={tab}>
        <div className="org-phone-contact">{primaryContact}</div>
        <h2>Open work</h2>
        <p className="org-scope-note">
          Each source keeps its own decisions. Unconfirmed open status is
          labelled; restricted or unavailable sources are never counted as zero.
        </p>
        <OpenWork sections={sections} retry={r.reload} />
        <SourceList
          title="Owned follow-ups"
          source={sections.activities}
          retry={r.reload}
        />
        <RecordFactSection title="Relationship notes">
          <p>{o.notes ?? "Not supplied or restricted"}</p>
        </RecordFactSection>
        <DuplicateCandidates record={o} />
      </RecordPanel>
      <RecordPanel id="customer-360" tab="sales" value={tab}>
        <h2>Sales</h2>
        <p>
          As at <Stamp value={r.data.observed_at} />
        </p>
        <SourceTable
          group={["deals", "quotations", "orders"]}
          sections={sections}
          type={params.get("type") ?? (oldTab === "orders" ? "orders" : "all")}
          status={params.get("status") ?? "all"}
          change={change}
          retry={r.reload}
        />
        <div className="org-handover">
          <ButtonLink
            href={`/sales/opportunities/new?${new URLSearchParams({ organisation_id: id, company_id: o.company_id })}`}
          >
            Create deal
          </ButtonLink>
          <Link href="/sales/opportunities">Open in Deals</Link>
        </div>
      </RecordPanel>
      <RecordPanel id="customer-360" tab="service" value={tab}>
        <h2>Service</h2>
        <SourceTable
          group={["cases", "work_orders"]}
          sections={sections}
          type={params.get("type") ?? "all"}
          status={params.get("status") ?? "all"}
          change={change}
          retry={r.reload}
        />
        <RecordSourceState title="Visits" state="Not configured">
          <p>
            A customer-linked visits read is not connected here. Confirm visits
            in the Service planner.
          </p>
          <Link href="/schedule">Open Service planner</Link>
        </RecordSourceState>
      </RecordPanel>
      <RecordPanel id="customer-360" tab="projects" value={tab}>
        <h2>Projects</h2>
        <SourceTable
          group={["projects"]}
          sections={sections}
          type="all"
          status={params.get("status") ?? "all"}
          change={change}
          retry={r.reload}
        />
      </RecordPanel>
      <RecordPanel id="customer-360" tab="sites" value={tab}>
        <h2>Sites, Facilities &amp; equipment</h2>
        <p>
          Current relationships are stated separately from history. Confirm
          operator, owner and billing party in the Site workspace.
        </p>
        <Link href={`/facilities?organisation_id=${id}`}>
          Open canonical Facilities through current Site relationships
        </Link>
        {!o.sites.length && (
          <p>No Site relationships returned in your permitted scope.</p>
        )}
        {o.sites.map((s) => (
          <RecordFactSection key={s.id} title={s.display_name}>
            <Link href={`/sites/${s.id}`}>{s.display_number}</Link>
            <p>
              {s.relationships?.map((rel, i) => (
                <span key={i}>
                  {rel.role} · {rel.is_current ? "Current" : "Historical"}{" "}
                </span>
              ))}
            </p>
            <p>{s.location_description}</p>
            {s.address && (
              <p>{Object.values(s.address).filter(Boolean).join(", ")}</p>
            )}
            <ul>
              {s.facilities.items.map((f) => (
                <li key={f.id}>
                  <Link href={`/facilities/${f.id}`}>{f.name}</Link>
                  {f.parent_facility_id && (
                    <small>
                      {f.parent_relationship === "physically_within"
                        ? "Within"
                        : "Grouped under"}{" "}
                      {s.facilities.items.find(
                        (x) => x.id === f.parent_facility_id,
                      )?.name ?? "a related Facility"}
                    </small>
                  )}
                </li>
              ))}
            </ul>
            <Link href={`/sites/${s.id}`}>
              Open Site, installed equipment and technical history
            </Link>
          </RecordFactSection>
        ))}
        {o.can_edit && (
          <ButtonLink
            href={`/customers/new?${new URLSearchParams({ kind: "site", parent: id, company: o.company_id })}`}
          >
            Create related site
          </ButtonLink>
        )}
      </RecordPanel>
      <RecordPanel id="customer-360" tab="accounts" value={tab}>
        <h2>Accounts</h2>
        <SourceTable
          group={["accounts"]}
          sections={sections}
          type="all"
          status={params.get("status") ?? "all"}
          change={change}
          retry={r.reload}
        />
        <p>
          Finance owns account verification, balances and decisions. No
          consolidated balance is calculated here.
        </p>
      </RecordPanel>
      <RecordPanel id="customer-360" tab="activity" value={tab}>
        <h2>Activity</h2>
        <SourceTable
          group={["activities", "documents"]}
          sections={sections}
          type={params.get("type") ?? "all"}
          status={params.get("status") ?? "all"}
          change={change}
          retry={r.reload}
        />
      </RecordPanel>
    </SharedRecord>
  );
}
