"use client";
import Link from "next/link";
import {
  PageHeader,
  ReadState,
  Stamp,
  Status,
  SummaryPair,
} from "./business-ui";
import { useCrmResource } from "./crm-state";
import { RecordPanel, RecordTabs } from "./record-ui";
import { useContactView } from "./contact-workspace";
import { DuplicateCandidates } from "./context-screens";
import type { Customer360, CustomerSection } from "../shared/customer-360";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "deals", label: "Deals & quotations" },
  { id: "orders", label: "Sales orders" },
  { id: "service", label: "Cases & service" },
  { id: "projects", label: "Projects" },
  { id: "sites", label: "Sites & equipment" },
  { id: "accounts", label: "Accounts" },
  { id: "activity", label: "Activity & documents" },
];
function SourceSection({
  title,
  value,
}: {
  title: string;
  value: CustomerSection;
}) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      <p>
        <Status value={value.state} /> · Source owner: {value.owner}
      </p>
      <p className="scope-note">{value.basis}</p>
      <p>
        <small>
          Read at <Stamp value={value.observed_at} />. Synthetic prototype data.
        </small>
      </p>
      {value.items.map((item) => (
        <article className="history-card" key={item.id}>
          <h3>
            <Link href={item.href}>{item.label}</Link>
          </h3>
          <p>{item.state}</p>
          {item.detail && <p>{item.detail}</p>}
          {"amount" in item && (
            <p>
              Source account balance:{" "}
              {item.amount === null
                ? "Unknown"
                : `${item.amount} ${item.currency}`}
              . Company: {item.company_id}.{" "}
              {item.source_as_at && (
                <>
                  Source as at <Stamp value={item.source_as_at} />.
                </>
              )}
            </p>
          )}
        </article>
      ))}
      {!value.items.length && value.state === "Complete" && (
        <p>No records in this permitted source scope.</p>
      )}
      {!value.items.length && value.state === "Partial" && (
        <p>
          No rows returned in this bounded view. It does not establish an empty
          source.
        </p>
      )}
      {value.next_cursor && (
        <p>More records are available in the owning workspace.</p>
      )}
    </section>
  );
}
export function CustomerWorkspace({ id }: { id: string }) {
  const r = useCrmResource<Customer360>(`customers/${id}/workspace`, true);
  const [tab, setTab] = useContactView(
      tabs.map((t) => t.id),
      "overview",
    ),
    o = r.data?.context;
  return (
    <div id="ppo-customer-360" className="cs-workspace">
      <Link href="/customers">← Customers</Link>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {o && r.data && (
        <>
          <PageHeader
            eyebrow={`CS-01 / ${o.display_number}`}
            title={o.display_name}
          />
          <div className="record-banner">
            <Status value={o.relationship_status} />
            <span>Version {o.version}</span>
            <span>Relationship owner: {o.owner_name ?? "Not recorded"}</span>
            <button className="secondary" onClick={r.reload}>
              Refresh sources
            </button>
          </div>
          <div className="actions">
            <Link
              className="button secondary"
              href={`/customers/${id}/development`}
            >
              Account development
            </Link>
            <Link
              className="button secondary"
              href={`/customers/${id}/stakeholders`}
            >
              Stakeholders & relationships
            </Link>
            <Link
              className="button secondary"
              href={`/work/new?${new URLSearchParams({ type: "Organisation", id, company: o.company_id })}`}
            >
              Create follow-up
            </Link>
          </div>
          <RecordTabs
            id="customer-360"
            label="Customer workspace"
            value={tab}
            onChange={setTab}
            tabs={tabs}
          />
          <RecordPanel id="customer-360" tab="overview" value={tab}>
            <dl className="context-grid">
              <SummaryPair label="Legal name">
                {o.legal_name ?? "Not recorded"}
              </SummaryPair>
              <SummaryPair label="Sector">{o.sector ?? "Unknown"}</SummaryPair>
              <SummaryPair label="Relationship notes">
                {o.notes ?? "Not supplied or restricted"}
              </SummaryPair>
            </dl>
            <p>
              Customer 360 brings together current permitted source records.
              Each source keeps its own decisions. An Organisation is not
              automatically an ERP debtor account.
            </p>
            <div className="actions">
              {o.can_edit && (
                <>
                  <Link
                    className="button secondary"
                    href={`/customers/new?${new URLSearchParams({ kind: "affiliation", parent: id, company: o.company_id, version: String(o.version) })}`}
                  >
                    Add contact affiliation
                  </Link>
                  <Link
                    className="button secondary"
                    href={`/customers/new?${new URLSearchParams({ kind: "site", parent: id, company: o.company_id })}`}
                  >
                    Create related site
                  </Link>
                </>
              )}
            </div>
            <h2>Source availability</h2>
            <dl className="context-grid">
              {Object.entries(r.data.sections).map(([key, value]) => (
                <SummaryPair key={key} label={value.owner}>
                  {value.state}
                </SummaryPair>
              ))}
            </dl>
            <DuplicateCandidates record={o} />
          </RecordPanel>
          <RecordPanel id="customer-360" tab="deals" value={tab}>
            <SourceSection title="Deals" value={r.data.sections.deals} />
            <SourceSection
              title="Estimates & quotations"
              value={r.data.sections.quotations}
            />
          </RecordPanel>
          <RecordPanel id="customer-360" tab="orders" value={tab}>
            <SourceSection
              title="Sales orders"
              value={r.data.sections.orders}
            />
          </RecordPanel>
          <RecordPanel id="customer-360" tab="service" value={tab}>
            <SourceSection title="Cases" value={r.data.sections.cases} />
            <SourceSection
              title="Work orders"
              value={r.data.sections.work_orders}
            />
          </RecordPanel>
          <RecordPanel id="customer-360" tab="projects" value={tab}>
            <SourceSection title="Projects" value={r.data.sections.projects} />
          </RecordPanel>
          <RecordPanel id="customer-360" tab="sites" value={tab}>
            <h2>Sites, Facilities & equipment</h2>
            <p>
              Permitted linked Sites, including historic relationships. Confirm
              the current operator, owner and bill payer in the Site workspace.
            </p>
            <p>
              <Link href={`/facilities?organisation_id=${id}`}>
                Open canonical Facilities through current Site relationships
              </Link>
            </p>
            {!o.sites.length && (
              <p>No Site relationships returned in your permitted scope.</p>
            )}
            {o.sites.map((s) => (
              <article className="history-card" key={s.id}>
                <h3>
                  <Link href={`/sites/${s.id}`}>
                    {s.display_name} · {s.display_number}
                  </Link>
                </h3>
                <p>{s.location_description}</p>
                {s.address && (
                  <p>{Object.values(s.address).filter(Boolean).join(", ")}</p>
                )}
                <ul className="facility-list">
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
                <p>
                  <Link href={`/sites/${s.id}`}>
                    Open Site, installed equipment and technical history
                  </Link>
                </p>
              </article>
            ))}
          </RecordPanel>
          <RecordPanel id="customer-360" tab="accounts" value={tab}>
            <SourceSection title="Accounts" value={r.data.sections.accounts} />
            <p>
              Finance owns account verification, balances and decisions. No
              consolidated balance is calculated here.
            </p>
          </RecordPanel>
          <RecordPanel id="customer-360" tab="activity" value={tab}>
            <SourceSection
              title="Activity"
              value={r.data.sections.activities}
            />
            <SourceSection
              title="Documents"
              value={r.data.sections.documents}
            />
          </RecordPanel>
        </>
      )}
    </div>
  );
}
