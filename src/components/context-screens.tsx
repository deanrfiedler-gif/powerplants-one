"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Field,
  Observed,
  PageHeader,
  ReadState,
  RecordLink,
  Stamp,
  Status,
  SummaryPair,
  useResource,
  type Envelope,
  type Option,
} from "./business-ui";
type Shared = Option & {
  version: number;
  company_id: string;
  site_id?: string;
  relationship_status?: string;
  owner_name?: string;
  can_edit?: boolean;
  legal_name?: string;
  sector?: string;
  notes?: string;
  email?: string;
  phone?: string;
  contact_preference?: string;
  active?: boolean;
  identity_status?: string;
  manufacturer?: string;
  model?: string;
  serial?: string;
  external_equipment_ref?: string;
  parent_asset_id?: string;
  facility_id?: string;
  timezone?: string;
  location_description?: string;
  address?: Record<string, string>;
  access_instructions?: string;
  biosecurity_notes?: string;
  contacts?: Contact[];
  affiliations?: Affiliation[];
  sites?: Shared[];
  mappings?: {
    id: string;
    mapping_status: string;
    is_current: boolean;
    valid_from: string;
    valid_to?: string;
  }[];
  parties?: Party[];
  primary_contact?: Contact;
  assets?: Envelope<Shared>;
  facilities?: Envelope<{
    id: string;
    name: string;
    parent_facility_id?: string;
  }>;
  configurations?: {
    id: string;
    revision: number;
    description: string;
    verification_status: string;
    is_current: boolean;
    valid_from: string;
    valid_to?: string;
  }[];
  locations?: {
    id: string;
    from_site_id?: string;
    to_site_id: string;
    effective_at: string;
    reason: string;
  }[];
};
type Contact = Option & {
  email?: string;
  phone?: string;
  role_label?: string;
  valid_from?: string;
  valid_to?: string;
};
type Affiliation = {
  id: string;
  organisation_id: string;
  display_number: string;
  display_name: string;
  role_label: string;
  valid_from: string;
  valid_to?: string;
};
type Party = {
  id: string;
  role: string;
  organisation_id: string;
  display_name: string;
  valid_from: string;
  valid_to?: string;
  is_current: boolean;
};
type History = {
  id: string;
  asset_id?: string;
  summary: string;
  kind: string;
  confidence: string;
  author_label: string;
  occurred_at: string;
  source_system?: string;
  source_id?: string;
  verification_status: string;
  site_label: string;
  operator_label?: string;
  asset_identity_status?: string;
};
const lists = {
  customers: {
    title: "Customers",
    singular: "Organisation",
    create: "customer",
    endpoint: "customers",
  },
  people: {
    title: "Contacts",
    singular: "Person",
    create: "person",
    endpoint: "people",
  },
  sites: {
    title: "Sites",
    singular: "Site",
    create: "site",
    endpoint: "sites",
  },
  equipment: {
    title: "Equipment",
    singular: "Asset",
    create: "asset",
    endpoint: "assets",
  },
} as const;
export function ContextList({
  section = "customers",
}: {
  section?: keyof typeof lists;
}) {
  const [q, setQ] = useState(""),
    [cursor, setCursor] = useState(""),
    info = lists[section],
    r = useResource<Envelope<Shared>>(
      `${info.endpoint}?${new URLSearchParams({ q, ...(cursor ? { cursor } : {}) })}`,
    );
  return (
    <>
      <PageHeader
        eyebrow="SC-02 / Customer context"
        title={info.title}
        description="Find the right organisation, person, site or equipment before recording work."
        action={
          <Link className="button" href={`/customers/new?kind=${info.create}`}>
            New {info.singular.toLowerCase()}
          </Link>
        }
      />
      <nav className="record-tabs" aria-label="Customer context sections">
        {Object.entries(lists).map(([key, v]) => (
          <Link
            key={key}
            href={`/${key}`}
            aria-current={key === section ? "page" : undefined}
          >
            {v.title}
          </Link>
        ))}
      </nav>
      <Field
        name="context-search"
        label={`Search ${info.title.toLowerCase()}`}
        value={q}
        onChange={(v) => {
          setQ(v);
          setCursor("");
        }}
        hint="Names remain separate records. Equipment search also checks reference, model and serial."
      />
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.error && (
        <>
          <Observed envelope={r.data} />
          {r.data.items.length === 0 ? (
            <p className="empty-state">
              No permitted records match this search.
            </p>
          ) : (
            <div className="record-grid">
              {r.data.items.map((o) => (
                <article className="record-card" key={o.id}>
                  <p className="eyebrow">
                    {o.display_number ?? "Shared contact identity"}
                  </p>
                  <h2>
                    <RecordLink type={info.singular} id={o.id}>
                      {o.display_name ?? o.description}
                    </RecordLink>
                  </h2>
                  {o.relationship_status && (
                    <Status value={o.relationship_status} />
                  )}{" "}
                  {o.identity_status && <Status value={o.identity_status} />}
                  <p>
                    {o.location_description ??
                      o.sector ??
                      o.contact_preference ??
                      o.model}
                  </p>
                  {o.owner_name && <p>Relationship owner: {o.owner_name}</p>}
                  {section === "people" && (
                    <small>One person can have several affiliations.</small>
                  )}
                  {section === "customers" && (
                    <small>
                      Independent relationship record · {o.display_number}
                    </small>
                  )}
                </article>
              ))}
            </div>
          )}
          <div className="actions">
            {cursor && (
              <button className="secondary" onClick={() => setCursor("")}>
                First page
              </button>
            )}
            {r.data.next_cursor && (
              <button onClick={() => setCursor(r.data!.next_cursor!)}>
                Next page
              </button>
            )}
            <button className="secondary" onClick={r.reload}>
              Refresh records
            </button>
          </div>
        </>
      )}
    </>
  );
}
function RelatedActivities({ type, id }: { type: string; id: string }) {
  const r = useResource<
    Envelope<{
      id: string;
      summary: string;
      status: string;
      owner_name: string;
      due_needed: boolean;
      due_at: string | null;
    }>
  >(`activities?${new URLSearchParams({ object_type: type, object_id: id })}`);
  return (
    <section className="detail-section">
      <h2>Owned follow-up</h2>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.error && (
        <>
          {r.data.items.length === 0 ? (
            <p>No permitted linked activities have been recorded.</p>
          ) : (
            r.data.items.map((a) => (
              <div className="history-card" key={a.id}>
                <Status value={a.status} />
                <h3>
                  <Link href={`/work/${a.id}`}>{a.summary}</Link>
                </h3>
                <p>
                  {a.owner_name} ·{" "}
                  {a.due_needed ? (
                    "Due date needed"
                  ) : (
                    <Stamp value={a.due_at} />
                  )}
                </p>
              </div>
            ))
          )}
          {r.data.next_cursor && (
            <Link href="/work">Open My Work for additional activities</Link>
          )}
        </>
      )}
    </section>
  );
}
function HistoryList({ path }: { path: string }) {
  const [cursor, setCursor] = useState(""),
    r = useResource<Envelope<History>>(
      `${path}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    );
  return (
    <section className="detail-section">
      <h2>Attributed technical history</h2>
      <p>
        Reported symptoms, suspected causes and attempted fixes retain their
        original attribution. A previous attempt is not proof of resolution.
      </p>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.error && (
        <>
          {r.data.items.length === 0 ? (
            <p>No permitted history has been recorded.</p>
          ) : (
            r.data.items.map((h) => (
              <article className="history-card" key={h.id}>
                <div className="card-top">
                  <Status value={h.kind} />
                  <Status value={h.confidence} />
                  <span>{h.verification_status}</span>
                </div>
                <p className="narrative">{h.summary}</p>
                <dl className="context-grid">
                  <SummaryPair label="Original author">
                    {h.author_label}
                  </SummaryPair>
                  <SummaryPair label="Occurred">
                    <Stamp value={h.occurred_at} />
                  </SummaryPair>
                  <SummaryPair label="Site at the time">
                    {h.site_label}
                  </SummaryPair>
                  <SummaryPair label="Operator at the time">
                    {h.operator_label ?? "Unknown"}
                  </SummaryPair>
                  <SummaryPair label="Identity at the time">
                    {h.asset_identity_status ??
                      "Unknown; later identity is not inferred"}
                  </SummaryPair>
                  <SummaryPair label="Source attribution">
                    {h.source_system
                      ? `${h.source_system} · ${h.source_id}`
                      : "Locally recorded; source not supplied"}
                  </SummaryPair>
                </dl>
              </article>
            ))
          )}
          <p className="scope-note">
            The original OEM note retains its historical wording. Current owned
            follow-up is shown in the activity section.
          </p>
          {r.data.next_cursor && (
            <button
              className="secondary"
              onClick={() => setCursor(r.data!.next_cursor!)}
            >
              Next history page
            </button>
          )}
        </>
      )}
    </section>
  );
}
function DuplicateCandidates({ record }: { record: Shared }) {
  const r = useResource<Envelope<Shared>>(
    `customers?q=${encodeURIComponent(record.display_name ?? "")}`,
  );
  return (
    <section className="detail-section">
      <h2>Possible duplicate organisations</h2>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.error && (
        <>
          {r.data.items.filter((x) => x.id !== record.id).length === 0 ? (
            <p>No other permitted matching names were found in this page.</p>
          ) : (
            r.data.items
              .filter((x) => x.id !== record.id)
              .map((x) => (
                <p key={x.id}>
                  <RecordLink type="Organisation" id={x.id}>
                    {x.display_name} · {x.display_number}
                  </RecordLink>{" "}
                  · {x.relationship_status}
                </p>
              ))
          )}
          <p>
            Review each identity and its relationships. Records are never merged
            automatically.
          </p>
        </>
      )}
    </section>
  );
}
export function ContextDetail({
  kind,
  id,
}: {
  kind: "Organisation" | "Person" | "Site" | "Asset";
  id: string;
}) {
  const path = {
      Organisation: "customers",
      Person: "people",
      Site: "sites",
      Asset: "assets",
    }[kind],
    r = useResource<Envelope<Shared>>(`${path}/${id}`),
    o = r.data?.items[0];
  const follow = o
    ? `/work/new?${new URLSearchParams({ type: kind, id: o.id, company: o.company_id, ...(kind === "Site" ? { site: o.id } : o.site_id ? { site: o.site_id } : {}) })}`
    : "";
  return (
    <>
      <Link href={kind === "Asset" ? "/equipment" : `/${path}`}>
        ←{" "}
        {kind === "Asset"
          ? "Equipment"
          : kind === "Person"
            ? "Contacts"
            : kind === "Site"
              ? "Sites"
              : "Customers"}
      </Link>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {o && (
        <>
          <PageHeader
            eyebrow={`${kind === "Site" || kind === "Asset" ? "SC-03" : "SC-02"} / ${o.display_number ?? "Shared person"}`}
            title={o.display_name ?? o.description ?? "Context"}
          />
          <div className="record-banner">
            {o.relationship_status && <Status value={o.relationship_status} />}{" "}
            {o.identity_status && <Status value={o.identity_status} />}
            <span>Version {o.version}</span>
            {o.owner_name && <span>Relationship owner: {o.owner_name}</span>}
          </div>
          {kind === "Organisation" && (
            <>
              <dl className="context-grid">
                <SummaryPair label="Legal name">
                  {o.legal_name ?? "Unknown"}
                </SummaryPair>
                <SummaryPair label="Sector">
                  {o.sector ?? "Unknown"}
                </SummaryPair>
                <SummaryPair label="Relationship notes">
                  {o.notes ?? "Not supplied or outside this view"}
                </SummaryPair>
              </dl>
              <div className="actions">
                <Link className="button" href={follow}>
                  Create follow-up
                </Link>
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
              <section className="detail-section">
                <h2>Contacts and affiliations</h2>
                {o.contacts?.length ? (
                  o.contacts.map((c) => (
                    <div
                      className="history-card"
                      key={`${c.id}:${c.valid_from}`}
                    >
                      <h3>
                        <RecordLink type="Person" id={c.id}>
                          {c.display_name}
                        </RecordLink>
                      </h3>
                      <p>
                        {c.role_label} · {c.valid_from?.slice(0, 10)} to{" "}
                        {c.valid_to?.slice(0, 10) ?? "open-ended"}
                      </p>
                      <p>
                        {c.email ?? "Email unknown"} ·{" "}
                        {c.phone ?? "Phone unknown"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No permitted affiliations are available.</p>
                )}
              </section>
              <section className="detail-section">
                <h2>Sites</h2>
                {o.sites?.length ? (
                  o.sites.map((s) => (
                    <p key={s.id}>
                      <RecordLink type="Site" id={s.id}>
                        {s.display_name} · {s.display_number}
                      </RecordLink>
                    </p>
                  ))
                ) : (
                  <p>No permitted site relationships are available.</p>
                )}
              </section>
              <section className="detail-section">
                <h2>ERP mapping status</h2>
                <p>
                  An organisation is not automatically an ERP debtor account.
                  Proposed mappings provide no financial release.
                </p>
                {o.mappings?.length ? (
                  o.mappings.map((m) => (
                    <p key={m.id}>
                      <Status value={m.mapping_status} /> ·{" "}
                      {m.is_current
                        ? "Current interval"
                        : Date.parse(m.valid_from) > Date.now()
                          ? "Future interval"
                          : "Historical interval"}{" "}
                      · <Stamp value={m.valid_from} /> to{" "}
                      {m.valid_to ? <Stamp value={m.valid_to} /> : "open-ended"}
                    </p>
                  ))
                ) : (
                  <p>No mapping is available in this view.</p>
                )}
              </section>
              <DuplicateCandidates record={o} />
            </>
          )}
          {kind === "Person" && (
            <>
              <dl className="context-grid">
                <SummaryPair label="Email">{o.email ?? "Unknown"}</SummaryPair>
                <SummaryPair label="Phone">{o.phone ?? "Unknown"}</SummaryPair>
                <SummaryPair label="Contact preference">
                  {o.contact_preference ?? "Unknown"}
                </SummaryPair>
                <SummaryPair label="Contact status">
                  {o.active ? "Active" : "Inactive"}
                </SummaryPair>
              </dl>
              <section className="detail-section">
                <h2>Affiliations for this shared person</h2>
                {o.affiliations?.length ? (
                  o.affiliations.map((a) => (
                    <article className="history-card" key={a.id}>
                      <RecordLink type="Organisation" id={a.organisation_id}>
                        {a.display_name} · {a.display_number}
                      </RecordLink>
                      <p>
                        {a.role_label} · {a.valid_from.slice(0, 10)} to{" "}
                        {a.valid_to?.slice(0, 10) ?? "open-ended"}
                      </p>
                    </article>
                  ))
                ) : (
                  <p>No affiliations are available in this scope.</p>
                )}
              </section>
            </>
          )}
          {kind === "Site" && (
            <>
              <div className="actions">
                <Link
                  className="button"
                  href={`/service/tickets/new?site=${id}`}
                >
                  Start service intake
                </Link>
                <Link className="button secondary" href={follow}>
                  Create follow-up
                </Link>
                {o.can_edit && (
                  <>
                    <Link
                      className="button secondary"
                      href={`/customers/new?${new URLSearchParams({ kind: "asset", site: id, company: o.company_id })}`}
                    >
                      Add equipment
                    </Link>
                    <Link
                      className="button secondary"
                      href={`/customers/new?${new URLSearchParams({ kind: "party", parent: id, company: o.company_id, version: String(o.version) })}`}
                    >
                      Add site relationship
                    </Link>
                    <Link
                      className="button secondary"
                      href={`/customers/new?${new URLSearchParams({ kind: "history", site: id, company: o.company_id, version: String(o.version) })}`}
                    >
                      Record technical context
                    </Link>
                  </>
                )}
              </div>
              <dl className="context-grid">
                <SummaryPair label="Location">
                  {o.location_description}
                </SummaryPair>
                <SummaryPair label="Timezone">{o.timezone}</SummaryPair>
                <SummaryPair label="Known address">
                  {o.address
                    ? Object.values(o.address).join(", ")
                    : "Unknown; address needs review before booking"}
                </SummaryPair>
                <SummaryPair label="Access information">
                  {o.access_instructions ?? "Unknown"}
                </SummaryPair>
                <SummaryPair label="Biosecurity / controls">
                  {o.biosecurity_notes ??
                    "Unknown; no dispatch control is approved here"}
                </SummaryPair>
                <SummaryPair label="Primary contact">
                  {o.primary_contact ? (
                    <RecordLink type="Person" id={o.primary_contact.id}>
                      {o.primary_contact.display_name}
                    </RecordLink>
                  ) : (
                    "Unknown"
                  )}
                </SummaryPair>
              </dl>
              <section className="detail-section">
                <h2>Operator, owner and billing parties</h2>
                {o.parties?.length ? (
                  o.parties.map((a) => (
                    <article className="history-card" key={a.id}>
                      <div className="card-top">
                        <Status value={a.role} />
                        <span>
                          {a.is_current
                            ? "Current"
                            : Date.parse(a.valid_from) > Date.now()
                              ? "Future"
                              : "Historical"}
                        </span>
                      </div>
                      <h3>
                        <RecordLink type="Organisation" id={a.organisation_id}>
                          {a.display_name}
                        </RecordLink>
                      </h3>
                      <p>
                        <Stamp value={a.valid_from} timezone={o.timezone} /> to{" "}
                        {a.valid_to ? (
                          <Stamp value={a.valid_to} timezone={o.timezone} />
                        ) : (
                          "open-ended"
                        )}
                      </p>
                    </article>
                  ))
                ) : (
                  <p>Site parties remain unknown.</p>
                )}
              </section>
              <section className="detail-section">
                <h2>Equipment and facilities</h2>
                {o.facilities?.items.map((f) => (
                  <p key={f.id}>
                    Facility: {f.name}
                    {f.parent_facility_id
                      ? ` · within ${o.facilities?.items.find((x) => x.id === f.parent_facility_id)?.name ?? "parent facility"}`
                      : ""}
                  </p>
                ))}
                <EquipmentTree records={o.assets?.items ?? []} />
                {o.assets?.next_cursor && (
                  <Link href="/equipment">Search additional equipment</Link>
                )}
              </section>
              <HistoryList path={`sites/${id}/history`} />
            </>
          )}
          {kind === "Asset" && (
            <>
              <div className="actions">
                {o.site_id && (
                  <RecordLink type="Site" id={o.site_id}>
                    Open current site
                  </RecordLink>
                )}
                <Link className="button secondary" href={follow}>
                  Create follow-up
                </Link>
              </div>
              {o.identity_status !== "Verified" && (
                <p className="scope-note">
                  Equipment identity is {o.identity_status?.toLowerCase()}.
                  Similar descriptions or serial candidates remain separate
                  assets. Identification questions do not authorise diagnostic
                  work.
                </p>
              )}
              <dl className="context-grid">
                <SummaryPair label="Manufacturer">
                  {o.manufacturer ?? "Unknown"}
                </SummaryPair>
                <SummaryPair label="Model">{o.model ?? "Unknown"}</SummaryPair>
                <SummaryPair label="Serial / candidate">
                  {o.serial ?? "Unknown; no serial inferred"}
                </SummaryPair>
                <SummaryPair label="External equipment reference">
                  {o.external_equipment_ref ?? "Not supplied"}
                </SummaryPair>
                <SummaryPair label="Parent equipment">
                  {o.parent_asset_id ? (
                    <RecordLink type="Asset" id={o.parent_asset_id}>
                      Open parent equipment
                    </RecordLink>
                  ) : (
                    "No parent recorded"
                  )}
                </SummaryPair>
              </dl>
              <section className="detail-section">
                <h2>Configuration snapshots</h2>
                {o.configurations?.map((c) => (
                  <article className="history-card" key={c.id}>
                    <h3>
                      Revision {c.revision} ·{" "}
                      {c.is_current
                        ? "Current"
                        : Date.parse(c.valid_from) > Date.now()
                          ? "Future"
                          : "Historical"}
                    </h3>
                    <Status value={c.verification_status} />
                    <p className="narrative">{c.description}</p>
                    <p>
                      <Stamp value={c.valid_from} /> to{" "}
                      {c.valid_to ? <Stamp value={c.valid_to} /> : "open-ended"}
                    </p>
                  </article>
                ))}
                <p>
                  Configurations remain review required. Supersession and full
                  equipment moves are later controlled workflows.
                </p>
              </section>
              <section className="detail-section">
                <h2>Retained location history</h2>
                {o.locations?.map((l) => (
                  <p key={l.id}>
                    <Stamp value={l.effective_at} /> · {l.reason} ·{" "}
                    <RecordLink type="Site" id={l.to_site_id}>
                      Destination site
                    </RecordLink>
                    {l.from_site_id && (
                      <>
                        {" "}
                        ·{" "}
                        <RecordLink type="Site" id={l.from_site_id}>
                          Previous site
                        </RecordLink>
                      </>
                    )}
                  </p>
                ))}
              </section>
              <HistoryList path={`assets/${id}/history`} />
            </>
          )}
          {kind !== "Person" && <RelatedActivities type={kind} id={id} />}
          <button className="secondary" onClick={r.reload}>
            Refresh context
          </button>
        </>
      )}
    </>
  );
}
function EquipmentTree({
  records,
  parent = null,
}: {
  records: Shared[];
  parent?: string | null;
}) {
  const roots = records.filter(
    (a) =>
      (a.parent_asset_id ?? null) === parent ||
      (!parent &&
        a.parent_asset_id &&
        !records.some((p) => p.id === a.parent_asset_id)),
  );
  return roots.length ? (
    <ul className="equipment-tree">
      {roots.map((a) => (
        <li key={a.id}>
          <RecordLink type="Asset" id={a.id}>
            {a.description} · {a.display_number}
          </RecordLink>{" "}
          <Status value={a.identity_status ?? "Unresolved"} />
          <EquipmentTree records={records} parent={a.id} />
        </li>
      ))}
    </ul>
  ) : parent ? null : (
    <p>No equipment is recorded in this permitted page.</p>
  );
}
