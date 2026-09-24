"use client";
import { EqField as Field } from "./equipment-controls";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, ReadState, Status } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { useCrmResource } from "./crm-state";
import { useContactView } from "./contact-workspace";
import { RecordPanel, RecordTabs } from "./record-ui";
import { EquipmentTimeline, EquipmentIdentityForm } from "./equipment-timeline";
import { EquipmentChangePanel } from "./equipment-forms";
import type { EquipmentRow } from "../equipment/model";
import { equipmentViews } from "../equipment/model";
import type { equipmentRegister, equipmentWorkspace } from "../equipment/reads";
import "../app/styles/equipment.css";

export function EquipmentNav() {
  return (
    <nav className="eq-nav" aria-label="Equipment workspaces">
      <Link href="/equipment">Installed base</Link>
      <Link href="/equipment/lookup">Identify equipment</Link>
      <Link href="/equipment/instruments">Instruments</Link>
      <Link href="/equipment/backups">Backups</Link>
      <Link href="/equipment/bulletins">Bulletins</Link>
      <Link href="/equipment/lifecycle">Support lifecycle</Link>
    </nav>
  );
}
export function EquipmentContext({ row }: { row: EquipmentRow }) {
  return (
    <div className="eq-context">
      <section>
        <h2>Equipment identity</h2>
        <dl>
          <dt>Asset reference</dt>
          <dd>
            <Link href={`/equipment/${row.id}`}>{row.display_number}</Link>
          </dd>
          <dt>Manufacturer / model</dt>
          <dd>
            {[row.manufacturer, row.model].filter(Boolean).join(" / ") ||
              "Not recorded"}
          </dd>
          <dt>Serial</dt>
          <dd>{row.serial ?? "Not recorded"}</dd>
          <dt>Identity</dt>
          <dd>
            <Status value={row.identity_status} />
          </dd>
          <dt>Lifecycle</dt>
          <dd>
            <Status value={row.lifecycle_status} />
          </dd>
        </dl>
        {row.identity_status !== "Verified" && (
          <p className="eq-notice">
            Equipment identity is {row.identity_status.toLowerCase()}. Similar
            descriptions or serial candidates remain separate assets.
            Identification questions do not authorise diagnostic work.
          </p>
        )}
      </section>
      <section>
        <h2>Installed location</h2>
        <dl>
          <dt>Customer / organisation</dt>
          <dd>
            {row.customers.length
              ? row.customers.map((c) => (
                  <span key={`${c.id}:${c.role}`}>
                    <Link href={`/customers/${c.id}`}>{c.name}</Link> · {c.role}
                    <br />
                  </span>
                ))
              : "Not recorded in permitted context"}
          </dd>
          <dt>Site</dt>
          <dd>
            <Link href={`/sites/${row.site_id}`}>{row.site_name}</Link>
          </dd>
          <dt>Site address</dt>
          <dd>
            {row.address
              ? Object.values(row.address).filter(Boolean).join(", ")
              : "Not recorded"}
          </dd>
          <dt>Physical Facility</dt>
          <dd>
            {row.facility_id ? (
              <Link href={`/facilities/${row.facility_id}`}>
                {row.installed_name}
              </Link>
            ) : (
              "Not recorded"
            )}
          </dd>
        </dl>
        <h3>Areas served</h3>
        {row.served.length ? (
          <ul>
            {row.served.map((f) => (
              <li key={f.id}>
                <Link href={`/facilities/${f.id}`}>{f.name}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No current served areas recorded.</p>
        )}
        <p className="eq-muted">
          Served areas are separate from the physical installed location.
        </p>
      </section>
    </div>
  );
}
export function EquipmentRegister() {
  const query = useSearchParams(),
    router = useRouter(),
    [search, setSearch] = useState(query.get("q") ?? "");
  const filters = new URLSearchParams();
  for (const k of [
    "q",
    "site_id",
    "installed_id",
    "served_id",
    "identity",
    "lifecycle",
    "page",
  ])
    if (query.get(k)) filters.set(k, query.get(k)!);
  const r = useCrmResource<Awaited<ReturnType<typeof equipmentRegister>>>(
    `equipment?${filters}`,
    true,
  );
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(filters);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.push(`/equipment?${next}`, { scroll: false });
  };
  return (
    <main id="ppo-equipment" className="eq-workspace">
      <PageHeader
        eyebrow="Equipment & installed base"
        title="Installed base"
        description="Find equipment by identity, customer, installed location or area served."
        action={
          <ButtonLink href="/equipment/lookup" variant="primary">
            Identify equipment
          </ButtonLink>
        }
      />
      <EquipmentNav />
      <form
        className="eq-filters"
        onSubmit={(e) => {
          e.preventDefault();
          change("q", search);
        }}
      >
        <Field
          name="equipment-search"
          label="Search installed base"
          value={search}
          onChange={setSearch}
          placeholder="Reference, serial, model, customer or area"
        />
        <Button type="submit">Search</Button>
        <label>
          Identity
          <select
            value={filters.get("identity") ?? ""}
            onChange={(e) => change("identity", e.target.value)}
          >
            <option value="">All identities</option>
            {["Verified", "Unresolved", "Disputed"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Lifecycle
          <select
            value={filters.get("lifecycle") ?? ""}
            onChange={(e) => change("lifecycle", e.target.value)}
          >
            <option value="">All lifecycle states</option>
            {["Active", "Removed", "Decommissioned"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <Button
          onClick={() => {
            setSearch("");
            router.push("/equipment");
          }}
        >
          Clear filters
        </Button>
      </form>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <p role="status">
            {r.data.total} matching equipment · {r.data.permitted_total} in your
            permitted installed base
          </p>
          {!r.data.items.length ? (
            <section className="eq-card">
              <h2>
                {r.data.permitted_total
                  ? "No equipment matches these filters"
                  : "No equipment in this view"}
              </h2>
              <p>Clear the filters or check the permitted Site context.</p>
            </section>
          ) : (
            <div className="eq-register" role="list">
              {r.data.items.map((a) => (
                <article className="eq-card" role="listitem" key={a.id}>
                  <header>
                    <Link href={`/equipment/${a.id}`}>
                      <strong>{a.display_number}</strong>
                      <h2>{a.description}</h2>
                    </Link>
                    <Status value={a.lifecycle_status} />
                  </header>
                  <p>
                    {[a.manufacturer, a.model, a.serial]
                      .filter(Boolean)
                      .join(" · ") ||
                      "Manufacturer, model and serial not recorded"}
                  </p>
                  <dl>
                    <dt>Customer</dt>
                    <dd>
                      {[...new Set(a.customers.map((c) => c.name))].join(
                        ", ",
                      ) || "Not recorded"}
                    </dd>
                    <dt>Installed</dt>
                    <dd>
                      {a.site_name} ·{" "}
                      {a.installed_name ?? "Facility not recorded"}
                    </dd>
                    <dt>Serves</dt>
                    <dd>
                      {a.served.map((f) => f.name).join(", ") ||
                        "No served areas recorded"}
                    </dd>
                    <dt>Identity</dt>
                    <dd>
                      <Status value={a.identity_status} />
                    </dd>
                  </dl>
                  <div className="eq-actions">
                    <Button onClick={() => change("site_id", a.site_id)}>
                      Same Site
                    </Button>
                    {a.facility_id && (
                      <Button
                        onClick={() => change("installed_id", a.facility_id!)}
                      >
                        Same installed Facility
                      </Button>
                    )}
                    {a.served.map((f) => (
                      <Button
                        key={f.id}
                        onClick={() => change("served_id", f.id)}
                      >
                        Serving {f.name}
                      </Button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="eq-actions">
            <Button
              disabled={r.data.page <= 1}
              onClick={() => change("page", String(r.data!.page - 1))}
            >
              Previous
            </Button>
            <span>Page {r.data.page}</span>
            <Button
              disabled={r.data.page * r.data.page_size >= r.data.total}
              onClick={() => change("page", String(r.data!.page + 1))}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
const tabLabels = {
  overview: "Overview",
  configuration: "Configuration",
  history: "Documents & service",
  lifecycle: "Movement & retirement",
  inspections: "Inspection & evidence",
  backups: "Backups",
  support: "Bulletins & support",
};
export function EquipmentWorkspace({ id }: { id: string }) {
  const r = useCrmResource<Awaited<ReturnType<typeof equipmentWorkspace>>>(
    `equipment/${id}`,
    true,
  );
  const [view, setView] = useContactView([...equipmentViews], "overview");
  const [visited, setVisited] = useState(() => new Set([view]));
  const opened = (tab: string) => view === tab || visited.has(tab);
  return (
    <main id="ppo-equipment" className="eq-workspace">
      <EquipmentNav />
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <PageHeader
            eyebrow={r.data.context.display_number}
            title={r.data.context.description}
            description={`Version ${r.data.context.version} · ${r.data.can_edit ? "Record maintenance available" : "Read only"}`}
          />
          <RecordTabs
            id="eq"
            label="Equipment record"
            tabs={equipmentViews.map((id) => ({ id, label: tabLabels[id] }))}
            value={view}
            onChange={(tab) => {
              setVisited((previous) => new Set([...previous, view, tab]));
              setView(tab);
            }}
          />
          <RecordPanel id="eq" tab="overview" value={view}>
            <EquipmentContext row={r.data.context} />
            <section className="eq-card">
              <h2>Relationships & retained dates</h2>
              <dl>
                <dt>Parent</dt>
                <dd>
                  {r.data.asset.parent_asset_id ? (
                    <Link href={`/equipment/${r.data.asset.parent_asset_id}`}>
                      Parent equipment
                    </Link>
                  ) : (
                    "No parent recorded"
                  )}
                </dd>
                <dt>Predecessor</dt>
                <dd>
                  {r.data.asset.predecessor_asset_id ? (
                    <Link
                      href={`/equipment/${r.data.asset.predecessor_asset_id}`}
                    >
                      Predecessor equipment
                    </Link>
                  ) : (
                    "No permitted predecessor recorded"
                  )}
                </dd>
                <dt>Installed / commissioned</dt>
                <dd>
                  {String(r.data.asset.installed_on ?? "Unknown").slice(0, 10)}{" "}
                  /{" "}
                  {String(r.data.asset.commissioned_on ?? "Unknown").slice(
                    0,
                    10,
                  )}
                </dd>
                <dt>Warranty interval</dt>
                <dd>
                  {String(r.data.asset.warranty_start ?? "Unknown").slice(
                    0,
                    10,
                  )}{" "}
                  to{" "}
                  {String(r.data.asset.warranty_end ?? "Unknown").slice(0, 10)}
                </dd>
              </dl>
              <p>
                Warranty dates are retained facts and are never transferred
                automatically by replacement.
              </p>
              {r.data.can_edit && opened("overview") && (
                <EquipmentIdentityForm data={r.data} saved={r.reload} />
              )}
            </section>
            <div className="eq-actions">
              <ButtonLink href={`/sites/${r.data.context.site_id}/readiness`}>
                Review Site readiness
              </ButtonLink>
              <ButtonLink href="/work">Open My Work</ButtonLink>
              <ButtonLink href={`/customers/new?kind=asset`}>
                Create equipment
              </ButtonLink>
            </div>
          </RecordPanel>
          <RecordPanel id="eq" tab="configuration" value={view}>
            <h2>Retained configuration revisions</h2>
            {r.data.asset.configurations.length ? (
              r.data.asset.configurations.map((c) => (
                <article className="eq-card" key={c.id}>
                  <h3>Revision {c.revision}</h3>
                  <p>{c.description}</p>
                  <p>
                    {c.verification_status} ·{" "}
                    {c.is_current
                      ? "Current recorded basis"
                      : "Historical basis"}
                  </p>
                  <small>
                    Effective {new Date(c.valid_from).toLocaleString("en-AU")}
                  </small>
                </article>
              ))
            ) : (
              <p>No configuration is recorded.</p>
            )}
            {opened("configuration") && (
              <EquipmentChangePanel id={id} configuration onSaved={r.reload} />
            )}
          </RecordPanel>
          <RecordPanel id="eq" tab="history" value={view}>
            <ButtonLink
              href={`/work/new?${new URLSearchParams({ type: "Asset", id, company: r.data.context.company_id, site: r.data.context.site_id })}`}
            >
              Create follow-up
            </ButtonLink>
            {opened("history") && <EquipmentTimeline id={id} />}
          </RecordPanel>
          <RecordPanel id="eq" tab="lifecycle" value={view}>
            <h2>Physical lifecycle</h2>
            <Status value={r.data.context.lifecycle_status} />
            {r.data.asset.locations.map((l) => (
              <article className="eq-card" key={l.id}>
                <p>{l.reason}</p>
                <p>{new Date(l.effective_at).toLocaleString("en-AU")}</p>
                <Link href={`/sites/${l.to_site_id}`}>
                  Open recorded destination Site
                </Link>
              </article>
            ))}
            {opened("lifecycle") && (
              <EquipmentChangePanel
                id={id}
                configuration={false}
                onSaved={r.reload}
              />
            )}
          </RecordPanel>
          <RecordPanel id="eq" tab="inspections" value={view}>
            {opened("inspections") && <EquipmentTimeline id={id} inspections />}
            <h2>Inspection context</h2>
            <p>
              Confirm the physical label and review Site readiness before
              selecting the owning inspection scope. A lookup does not verify
              identity or authorise work.
            </p>
            <div className="eq-actions">
              <ButtonLink href={`/sites/${r.data.context.site_id}/readiness`}>
                Site readiness
              </ButtonLink>
              <ButtonLink href="/engineering/commissioning">
                Commissioning inspections
              </ButtonLink>
              <ButtonLink href="/my-jobs">Assigned Service work</ButtonLink>
              <ButtonLink href="/equipment/instruments">
                Calibration evidence
              </ButtonLink>
            </div>
          </RecordPanel>
          <RecordPanel id="eq" tab="backups" value={view}>
            <ButtonLink href={`/equipment/backups?asset_id=${id}`}>
              Backup & recovery records
            </ButtonLink>
          </RecordPanel>
          <RecordPanel id="eq" tab="support" value={view}>
            <div className="eq-actions">
              <ButtonLink href={`/equipment/bulletins?asset_id=${id}`}>
                Bulletin applicability
              </ButtonLink>
              <ButtonLink href={`/equipment/lifecycle?asset_id=${id}`}>
                Support evidence
              </ButtonLink>
            </div>
          </RecordPanel>
        </>
      )}
    </main>
  );
}
