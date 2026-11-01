"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { useCrmResource } from "./crm-state";
import { Button, ButtonLink } from "./ui/button";
import { RegisterTable, RegisterChip } from "./ui/register-table";
import { RecordTabs, RecordPanel, useFocusFallback } from "./record-ui";
import { WorklistMenu, WorklistPanel } from "./crm-worklist-tools";
import { ProductIcon } from "./product-icons";
import { SiteReadiness, SitesReadState } from "./sites-register";
import { FacilityRegister } from "./facility-register";
import { SitePrimaryContact } from "./site-primary-contact";
import { RelatedActivities } from "./context-screens";
import { ReadState, type Envelope } from "./business-ui";
import { usePhoneHeader } from "../shell/phone-header";
import { usePublishRecordIdentity } from "../shell/record-identity";
import {
  formatDateTime,
  formatRange,
  zoneDisplayName,
} from "../shell/date-format";
import type { SiteRow, SitesData, SiteWorkSource } from "../shared/sites-model";
import type { EquipmentRow } from "../equipment/model";

type Overview = {
  site: SiteRow;
  sources: SiteWorkSource[];
  observed_at: string;
};
export function SiteWorkspace({ id }: { id: string }) {
  const resource = useCrmResource<Overview>(`sites/${id}/overview`, true);
  usePublishRecordIdentity(
    resource.data?.site.display_number ?? null,
    resource.data?.site.display_name ?? "Site",
  );
  return (
    <div id="ppo-sites" data-module-layout="full-bleed">
      <div className="site-record">
        <SitesReadState
          loading={resource.loading}
          error={resource.error}
          retry={resource.reload}
        />
        {resource.data && (
          <LoadedSite key={id} data={resource.data} reload={resource.reload} />
        )}
      </div>
    </div>
  );
}
function LoadedSite({ data, reload }: { data: Overview; reload: () => void }) {
  const { site: s, sources } = data,
    router = useRouter(),
    params = useSearchParams();
  const tabs = ["overview", "areas", "equipment", "work", "history"];
  const requested = params.get("tab") ?? "overview";
  const tab = tabs.includes(requested) ? requested : "overview";
  const [details, setDetails] = useState(false);
  const followUps = useRef<HTMLDivElement>(null),
    workHeading = useRef<HTMLHeadingElement>(null);
  useFocusFallback(followUps, workHeading);
  const from = new URLSearchParams(params.get("from") ?? ""),
    population = new URLSearchParams();
  for (const key of [
    "view",
    "q",
    "customer_id",
    "readiness",
    "sort",
    "direction",
  ])
    if (from.has(key)) population.set(key, from.get(key)!);
  const neighbours = useCrmResource<SitesData>(
    `sites/register?${population}`,
    true,
  ).data;
  const index = neighbours?.items.findIndex((row) => row.id === s.id) ?? -1;
  const recordHref = (id: string) =>
    `/sites/${id}?${new URLSearchParams({ from: from.toString(), ...(params.has("department") ? { department: params.get("department")! } : {}) })}`;
  const previous = index > 0 ? neighbours?.items[index - 1] : undefined;
  const next = index >= 0 ? neighbours?.items[index + 1] : undefined;
  const readiness = `/sites/${s.id}/readiness`,
    request = `/service/tickets/new?site=${s.id}`;
  const position =
    index >= 0 && neighbours && !neighbours.next_cursor
      ? `${index + 1} of ${neighbours.total}`
      : s.display_number;
  usePhoneHeader({
    record: {
      position,
      previous: {
        label: "Previous site",
        disabled: !previous,
        onSelect: () => previous && router.push(recordHref(previous.id)),
      },
      next: {
        label: "Next site",
        disabled: !next,
        onSelect: () => next && router.push(recordHref(next.id)),
      },
      more: [
        { label: "Access & readiness", onSelect: () => router.push(readiness) },
        { label: "Site details and parties", onSelect: () => setDetails(true) },
        {
          label: "Back to sites",
          onSelect: () => router.push(`/sites?${from}`),
        },
      ],
    },
  });
  const maps = s.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`
    : null;
  const changeTab = (value: string) => {
    const query = new URLSearchParams(params);
    query.set("tab", value);
    router.replace(`?${query}`, { scroll: false });
  };
  const workCount = sources.reduce(
    (sum, source) => sum + source.items.length,
    0,
  );
  const more = (
    <WorklistMenu label="Site actions" icon="more" choices>
      <Link role="menuitem" href={readiness}>
        Access & readiness
      </Link>
      <Button
        variant="quiet"
        role="menuitem"
        data-menu-close
        onClick={() => setDetails(true)}
      >
        Site details and parties
      </Button>
      <Link role="menuitem" href={`/surveys?context_id=${s.id}`}>
        Site surveys & as-found
      </Link>
      {s.can_follow_up && (
        <Link
          role="menuitem"
          href={`/work/new?type=Site&id=${s.id}&company=${s.company_id}&site=${s.id}`}
        >
          Create owned follow-up
        </Link>
      )}
      <Link role="menuitem" href={`/sites?${from}`}>
        Back to sites
      </Link>
    </WorklistMenu>
  );
  const nextVisit = s.next_visit ? (
    <>
      <Link href={`/service/appointments/${s.next_visit.id}`}>
        {s.next_visit.display_number}
      </Link>
      <RegisterChip tone="neutral">{s.next_visit.status}</RegisterChip>
      <small>
        {formatRange(s.next_visit.start_at, s.next_visit.end_at, s.timezone)}
      </small>
    </>
  ) : (
    <p>
      {s.visits_state === "Restricted"
        ? "Visit access restricted"
        : "No upcoming visit in the permitted records."}
    </p>
  );
  const access = (
    <>
      <div className="site-access-row">
        <ProductIcon name="sites" />
        <div>
          <strong>{s.address ?? "Address not recorded"}</strong>
          <p>Confirm the arrival point with the site contact.</p>
        </div>
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer">
            Maps
            <span className="sr-only"> (opens external maps in a new tab)</span>
          </a>
        )}
      </div>
      <div className="site-access-row">
        <ProductIcon name="info" />
        <div>
          <strong>Access instructions</strong>
          <p>{s.access_instructions ?? "Not recorded"}</p>
        </div>
      </div>
      <div className="site-access-row">
        <ProductIcon name="warning" />
        <div>
          <strong>Biosecurity controls</strong>
          <p>{s.biosecurity_notes ?? "Unknown — check before the visit"}</p>
        </div>
      </div>
      <div className="site-access-row">
        <ProductIcon name="person" />
        <div>
          <strong>
            {s.primary_contact ? (
              <Link href={`/people/${s.primary_contact.id}`}>
                {s.primary_contact.name}
              </Link>
            ) : (
              "Primary contact not recorded"
            )}
          </strong>
          <p>Primary contact</p>
        </div>
        {s.primary_contact?.phone && (
          <a href={`tel:${s.primary_contact.phone.replace(/[^+0-9]/g, "")}`}>
            Call
          </a>
        )}
      </div>
    </>
  );
  return (
    <>
      <header className="site-record-header">
        <div>
          <div className="site-title">
            <h1>{s.display_name}</h1>
            <SiteReadiness site={s} />
          </div>
          <p className="site-record-meta">
            <span title={`Previous reference: ${s.legacy_display_number}`}>
              {s.display_number}
            </span>{" "}
            · {s.customers[0]?.name ?? "Customer not recorded"} ·{" "}
            {s.location_description ?? "Location not recorded"}
            <span className="site-desktop-meta">
              {" "}
              · {s.primary_contact?.name ??
                "Primary contact not recorded"} ·{" "}
              {zoneDisplayName(s.timezone, data.observed_at)}
              {s.last_visit &&
                ` · Last visit ${formatDateTime(s.last_visit.end_at, s.timezone)}`}
            </span>
          </p>
        </div>
        <div className="site-header-actions">
          <div className="site-position">
            <Link href={`/sites?${from}`}>{position}</Link>
            <Button
              variant="quiet"
              aria-label="Previous site"
              disabled={!previous}
              onClick={() => previous && router.push(recordHref(previous.id))}
            >
              <ProductIcon name="collapse" />
            </Button>
            <Button
              variant="quiet"
              aria-label="Next site"
              disabled={!next}
              onClick={() => next && router.push(recordHref(next.id))}
            >
              <ProductIcon name="expand" />
            </Button>
          </div>
          <ButtonLink href={readiness} variant="secondary">
            Access & readiness
          </ButtonLink>
          {s.can_request && (
            <ButtonLink href={request} variant="primary">Start service request</ButtonLink>
          )}
          {more}
        </div>
      </header>
      <div className="site-before">
        <strong>Before the next visit</strong>
        {[
          ["Address", s.address_recorded],
          ["Access instructions", !!s.access_instructions],
          ["Biosecurity controls", s.biosecurity_recorded],
          ["Primary contact", !!s.primary_contact],
        ].map(([label, known]) => (
          <span key={String(label)} title={`${label}: ${known ? "recorded" : "unknown"}`}>
            <ProductIcon name={known ? "check" : "warning"} />
            {label}
            {known ? label === "Address" ? " recorded" : "" : " unknown"}
          </span>
        ))}
        <Link href={readiness}>
          <ProductIcon name="warning" />
          Readiness in CS-06
        </Link>
        <span>
          <ProductIcon name="info" />
          Delivery basis not verified
        </span>
      </div>
      <div className="site-record-body">
        <aside className="site-facts" aria-label="Site facts">
          <section>
            <h2>Site</h2>
            <dl>
              <div>
                <dt>Location</dt>
                <dd>{s.location_description ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Time zone</dt>
                <dd>{zoneDisplayName(s.timezone, data.observed_at)}</dd>
              </div>
              {s.customers.map((c, i) => (
                <div key={`${c.id}-${c.role}-${i}`}>
                  <dt>{c.role === "BillingParty" ? "Billing party" : c.role}</dt>
                  <dd>
                    <Link href={`/customers/${c.id}`}>{c.name}</Link>
                  </dd>
                </div>
              ))}
              <div>
                <dt>Address</dt>
                <dd>{s.address ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Facilities</dt>
                <dd>
                  <button onClick={() => changeTab("areas")}>
                    {s.areas} areas
                  </button>
                </dd>
              </div>
              <div>
                <dt>Equipment</dt>
                <dd>
                  <button onClick={() => changeTab("equipment")}>
                    {s.equipment} items
                  </button>
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <h2>Access and biosecurity</h2>
            <dl>
              <div>
                <dt>Contact</dt>
                <dd>
                  {s.primary_contact ? (
                    <Link href={`/people/${s.primary_contact.id}`}>
                      {s.primary_contact.name}
                    </Link>
                  ) : (
                    "Not recorded"
                  )}
                </dd>
              </div>
              <div>
                <dt>Surveys</dt>
                <dd>
                  <Link href={`/surveys?context_id=${s.id}`}>
                    Site surveys & as-found
                  </Link>
                </dd>
              </div>
              <div>
                <dt>Equipment</dt>
                <dd>
                  <Link href={`/equipment?site_id=${s.id}`}>
                    {s.equipment} items
                  </Link>
                </dd>
              </div>
            </dl>
            <p className="site-facts-note">
              Access: {s.access_instructions ?? "Not recorded"}. Biosecurity:{" "}
              {s.biosecurity_notes ?? "Unknown"}.
            </p>
          </section>
          <section>
            <h2>Next visit</h2>
            <div className="site-next">{nextVisit}</div>
          </section>
        </aside>
        <div className="site-record-main">
          <RecordTabs
            id="site-record"
            label="Site sections"
            value={tab}
            onChange={changeTab}
            tabs={[
              { id: "overview", label: "Overview" },
              {
                id: "areas",
                label: (
                  <>
                    Facilities & areas <span>{s.areas}</span>
                  </>
                ),
              },
              {
                id: "equipment",
                label: (
                  <>
                    Equipment <span>{s.equipment}</span>
                  </>
                ),
              },
              { id: "work", label: "Work and visits" },
              { id: "history", label: "History" },
            ]}
          />
          <div className="site-tab-content">
            <RecordPanel id="site-record" tab="overview" value={tab}>
              <section className="site-card site-readiness-card">
                <div className="site-card-heading">
                  <ProductIcon name="warning" />
                  <div>
                    <h2>
                      {s.next_visit
                        ? "Site readiness for the next visit"
                        : "Site readiness"}
                    </h2>
                    <p>
                      Customer readiness confirmation (P4) is not available.
                      Check Access & readiness before visiting.
                    </p>
                  </div>
                  <RegisterChip tone="attention">Check in CS-06</RegisterChip>
                </div>
                {s.next_visit && (
                  <div className="site-card-row">
                    <ProductIcon name="calendar" />
                    <div>
                      <strong>
                        {formatRange(
                          s.next_visit.start_at,
                          s.next_visit.end_at,
                          s.timezone,
                        )}
                      </strong>
                      <small>
                        {s.next_visit.display_number} · {s.next_visit.status}
                      </small>
                    </div>
                    <Link href={`/service/appointments/${s.next_visit.id}`}>
                      Open
                    </Link>
                  </div>
                )}
                <div className="site-card-row">
                  <ProductIcon name="person" />
                  <div>
                    <strong>
                      {s.primary_contact
                        ? `Check with ${s.primary_contact.name}`
                        : "Check site access and readiness"}
                    </strong>
                    <small>
                      Access, biosecurity and the current visit context
                    </small>
                  </div>
                  <Link href={readiness} aria-label="Access & readiness">Readiness</Link>
                </div>
                <footer>
                  <ProductIcon name="info" />
                  Readiness is checked in Access & readiness (CS-06), not
                  confirmed on this page.
                </footer>
              </section>
              <section className="site-phone-access site-card">
                <div className="site-card-heading">
                  <div>
                    <h2>Access and biosecurity</h2>
                    <p>Before you go</p>
                  </div>
                </div>
                {access}
                <footer>
                  Access details do not establish readiness or authority to
                  work.
                </footer>
              </section>
              <section className="site-open-work">
                <h2>
                  Work at this site <small>permitted records only</small>
                </h2>
                <WorkRows sources={sources} />
                {!workCount &&
                  sources.every((x) => x.state === "Available") && (
                    <p>No work recorded in this permitted view.</p>
                  )}
              </section>
              <p className="site-map-note">
                <ProductIcon name="info" />
                Address handoff only: open it in external maps, then confirm the
                arrival point with the contact. Delivery instructions are not
                separately verified.
              </p>
            </RecordPanel>
            <RecordPanel id="site-record" tab="areas" value={tab}>
              {tab === "areas" && (
                <Suspense fallback={<p>Loading facilities…</p>}>
                  <FacilityRegister fixedSite={s.id} />
                </Suspense>
              )}
            </RecordPanel>
            <RecordPanel id="site-record" tab="equipment" value={tab}>
              {tab === "equipment" && <SiteEquipment site={s} />}
            </RecordPanel>
            <RecordPanel id="site-record" tab="work" value={tab}>
              <h2 ref={workHeading} tabIndex={-1}>Work and visits</h2>
              <p>
                Current permitted source records. Open the source for its
                complete history and controls.
              </p>
              <WorkRows sources={sources} />
              <div ref={followUps}>
                {tab === "work" && sources.some(source => source.name === "Follow-ups" && ["Available", "Partial"].includes(source.state)) && <RelatedActivities type="Site" id={s.id} live />}
              </div>
            </RecordPanel>
            <RecordPanel id="site-record" tab="history" value={tab}>
              {tab === "history" && <SiteHistory id={s.id} />}
            </RecordPanel>
          </div>
        </div>
      </div>
      <footer className="site-phone-actions">
        {more}
        <ButtonLink
          href={readiness}
          variant="secondary"
          className="site-footer-readiness"
        >
          Readiness
        </ButtonLink>
        {s.can_request && (
          <ButtonLink href={request} variant="primary">Service request</ButtonLink>
        )}
      </footer>
      {details && (
        <WorklistPanel
          title="Site details and parties"
          onClose={() => setDetails(false)}
        >
          <p>{s.display_number}</p>
          <p>
            Previous reference: {s.legacy_display_number}. Both references find
            this site.
          </p>
          <div className="site-detail-access">{access}</div>
          {s.can_edit && (
            <>
              <SitePrimaryContact
                id={s.id}
                version={s.version}
                onSaved={reload}
              />
              <ButtonLink
                variant="secondary"
                href={`/customers/new?kind=party&parent=${s.id}&company=${s.company_id}&version=${s.version}`}
              >
                Add site party
              </ButtonLink>
              <ButtonLink
                variant="secondary"
                href={`/customers/new?kind=history&site=${s.id}&company=${s.company_id}&version=${s.version}`}
              >
                Record technical context
              </ButtonLink>
            </>
          )}
          <SiteParties id={s.id} />
        </WorklistPanel>
      )}
    </>
  );
}
function WorkRows({ sources }: { sources: SiteWorkSource[] }) {
  return (
    <div className="site-card site-work-rows">
      {sources.map((source) => (
        <div key={source.name}>
          {source.state !== "Available" && (
            <p className="site-source-state" role="status">
              {source.name}:{" "}
              {source.state === "Partial"
                ? "Showing the first permitted records; open the source for more."
                : source.state === "Restricted"
                  ? "Access restricted"
                  : "Could not load this source. Refresh the site to retry."}
            </p>
          )}
          {source.items.map((item) => (
            <div className="site-card-row" key={item.id}>
              <ProductIcon
                name={
                  item.kind === "Visit"
                    ? "calendar"
                    : item.kind === "Work order"
                      ? "service"
                      : "work"
                }
              />
              <div>
                <strong>
                  {item.reference ? `${item.reference} · ` : ""}
                  {item.title}
                </strong>
                <small>
                  {item.kind} · {item.detail}
                </small>
              </div>
              <Link href={item.href}>
                Open<span className="sr-only"> {item.title}</span>
              </Link>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
function SiteEquipment({ site }: { site: SiteRow }) {
  const resource = useCrmResource<{ items: EquipmentRow[]; total: number }>(
    `equipment?site_id=${site.id}`,
    true,
  );
  const items = resource.data?.items.slice(0, 6) ?? [];
  const groups = [
    ...new Set(
      items.map((item) => item.installed_name ?? "Installation not recorded"),
    ),
  ];
  return (
    <>
      <h2>Equipment at this site</h2>
      <p>
        Installed in and Serves are different relationships. Equipment can serve
        areas other than its installation location.
      </p>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      <div className="site-equipment">
        <RegisterTable
          variant="panel"
          caption="Site equipment grouped by installation location. Installed in and Serves are separate."
        >
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Installed in</th>
              <th>Serves</th>
              <th>Identity</th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group}>
              <tr className="site-equipment-group">
                <th colSpan={4} scope="rowgroup">
                  {group}
                </th>
              </tr>
              {items
                .filter(
                  (item) =>
                    (item.installed_name ?? "Installation not recorded") ===
                    group,
                )
                .map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/equipment/${item.id}`} title={item.display_number}>
                        {item.description}
                      </Link>
                    </td>
                    <td>
                      {item.facility_id ? (
                        <Link href={`/facilities/${item.facility_id}`}>
                          {item.installed_name}
                        </Link>
                      ) : (
                        "Not recorded"
                      )}
                    </td>
                    <td>
                      {item.served.length
                        ? item.served.map((f, i) => (
                            <span key={f.id}>
                              {i > 0 && ", "}
                              <Link href={`/facilities/${f.id}`}>{f.name}</Link>
                            </span>
                          ))
                        : "Not recorded"}
                    </td>
                    <td>
                      <RegisterChip
                        tone={
                          item.identity_status === "Verified"
                            ? "positive"
                            : "attention"
                        }
                      >
                        {item.identity_status === "Unresolved"
                          ? "Unconfirmed"
                          : item.identity_status}
                      </RegisterChip>
                    </td>
                  </tr>
                ))}
            </tbody>
          ))}
        </RegisterTable>
      </div>
      {resource.data && !items.length && (
        <p>No equipment in the permitted records.</p>
      )}
      {resource.data && resource.data.total > items.length && (
        <ButtonLink variant="quiet" href={`/equipment?site_id=${site.id}`}>
          Show {resource.data.total - items.length} more
        </ButtonLink>
      )}
      <p className="site-map-note">
        <ProductIcon name="info" />
        An unconfirmed identity remains a separate equipment record. It does not
        authorise diagnostic work.
      </p>
      {site.can_edit && (
        <div className="site-secondary-actions">
          <ButtonLink
            variant="secondary"
            href={`/customers/new?kind=asset&site=${site.id}&company=${site.company_id}`}
          >
            Add equipment
          </ButtonLink>
          <ButtonLink
            variant="secondary"
            href={`/customers/new?kind=history&site=${site.id}&company=${site.company_id}&version=${site.version}`}
          >
            Record technical context
          </ButtonLink>
        </div>
      )}
    </>
  );
}
function SiteHistory({ id }: { id: string }) {
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const resource = useCrmResource<
    Envelope<{
      id: string;
      kind: string;
      summary: string;
      occurred_at: string;
      author_label: string;
      verification_status: string;
    }>
  >(
    `sites/${id}/history?limit=25${cursors.at(-1) ? `&cursor=${encodeURIComponent(cursors.at(-1)!)}` : ""}`,
    true,
  );
  return (
    <>
      <h2>Technical history</h2>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data?.items.map((h) => (
        <article className="site-history-row" key={h.id}>
          <h3>
            {h.kind} · {h.verification_status}
          </h3>
          <p>{h.summary}</p>
          <small>
            {formatDateTime(h.occurred_at)} · {h.author_label}
          </small>
        </article>
      ))}
      {resource.data && !resource.data.items.length && (
        <p>No technical history in the permitted records.</p>
      )}
      <div className="site-secondary-actions">
        <Button
          variant="quiet"
          disabled={cursors.length === 1}
          onClick={() => setCursors((c) => c.slice(0, -1))}
        >
          Previous
        </Button>
        <Button
          variant="quiet"
          disabled={!resource.data?.next_cursor}
          onClick={() => setCursors((c) => [...c, resource.data!.next_cursor])}
        >
          Next
        </Button>
      </div>
    </>
  );
}
function SiteParties({ id }: { id: string }) {
  const resource = useCrmResource<
    Envelope<{
      parties: {
        id: string;
        role: string;
        organisation_id: string;
        display_name: string;
        is_current: boolean;
        valid_from: string;
        valid_to: string | null;
      }[];
    }>
  >(`sites/${id}`, true);
  return (
    <>
      <h3>Current and historical site parties</h3>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {resource.data?.items[0]?.parties.map((p) => (
        <p key={p.id}>
          <Link href={`/customers/${p.organisation_id}`}>{p.display_name}</Link>{" "}
          · {p.role} · {p.is_current ? "Current" : "Historical"}
          <small>
            From {formatDateTime(p.valid_from)}
            {p.valid_to ? ` to ${formatDateTime(p.valid_to)}` : ""}
          </small>
        </p>
      ))}
    </>
  );
}
