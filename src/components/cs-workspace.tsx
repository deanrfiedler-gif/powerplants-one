"use client";
import { useState } from "react";
import Link from "next/link";
import { SavedViewControls } from "./saved-view-controls";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Field,
  SelectField,
  ReadState,
  ValidationFields,
  type Envelope,
} from "./business-ui";
import { useCrmResource, useCrmCommand } from "./crm-state";
import { RecordTabs, RecordPanel, LocalDateTimeField } from "./record-ui";
import { useContactView } from "./contact-workspace";
import {
  ContentEditor,
  CommandStatus,
  MultiChoice,
  type CsOptions,
} from "./cs-forms";
import type { readCs, listCs } from "../shared/cs/service";
import type {
  CsKind,
  CsRow,
  CsContent,
  ReadinessContent,
  SurveyContent,
  PlanContent,
} from "../shared/cs/model";
import "../app/styles/customers.css";
type Workspace = Awaited<ReturnType<typeof readCs>>;
const scopeId = (kind: CsKind) =>
  kind === "Readiness"
    ? "ppo-readiness"
    : kind === "Survey"
      ? "ppo-survey"
      : "ppo-account-development";
const titles = {
  Readiness: "Site access & horticultural readiness",
  Survey: "Site survey & as-found",
  AccountPlan: "Account development & visit plan",
};
const sections = {
  Readiness: [
    ["overview", "Overview"],
    ["requirements", "Requirements"],
    ["evidence", "Visitor, biosecurity & evidence"],
    ["windows", "Work windows"],
    ["preparation", "Visit preparation"],
    ["history", "Review & history"],
  ],
  Survey: [
    ["overview", "Survey scope"],
    ["observations", "Measurements & observations"],
    ["photos", "Photos & evidence"],
    ["follow-up", "Missing information & follow-up"],
    ["review", "Review & handover"],
    ["history", "History"],
  ],
  AccountPlan: [
    ["overview", "Account context"],
    ["objectives", "Relationship objectives"],
    ["visits", "Planned visits"],
    ["actions", "Next actions"],
    ["history", "Reviews & history"],
  ],
} as const;
const boundary = {
  Readiness:
    "Recorded preparation does not authorise work, confirm a booking, reserve resources, issue a pack or clear dispatch.",
  Survey:
    "Review records the as-found brief. It does not certify design suitability, capacity, Site safety or work authority.",
  AccountPlan:
    "Relationship planning has no health score or forecast formula. Planned visits are proposals; Scheduling owns real appointments and resources.",
};
function ContextLink({ kind, id }: { kind: CsKind; id: string }) {
  return (
    <Link href={`/${kind === "AccountPlan" ? "customers" : "sites"}/${id}`}>
      Open {kind === "AccountPlan" ? "Customer" : "Site"}
    </Link>
  );
}
export function CsLanding({
  kind,
  contextId,
}: {
  kind: CsKind;
  contextId: string;
}) {
  const r = useCrmResource<Awaited<ReturnType<typeof listCs>>>(
    `cs/${kind}?context_id=${contextId}`,
    true,
  );
  if (r.data?.items[0] && kind !== "Survey")
    return <CsWorkspace kind={kind} id={r.data.items[0].id} />;
  return (
    <div id={scopeId(kind)} className="cs-workspace">
      <PageHeader
        eyebrow="Customers, contacts & sites"
        title={titles[kind]}
        description={boundary[kind]}
      />
      <ContextLink kind={kind} id={contextId} />
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <p>
            No{" "}
            {kind === "Readiness"
              ? "readiness record"
              : "account development plan"}{" "}
            is recorded in this context.
          </p>
          <CreateCs kind={kind} contextId={contextId} onSaved={r.reload} />
        </>
      )}
    </div>
  );
}
function CreateCs({
  kind,
  contextId,
  onSaved,
}: {
  kind: CsKind;
  contextId: string;
  onSaved?: () => void;
}) {
  const options = useCrmResource<CsOptions>(
      `cs/${kind}/options?context_id=${contextId}`,
      true,
    ),
    router = useRouter();
  const [name, setName] = useState(""),
    [owner, setOwner] = useState(""),
    [reason, setReason] = useState("");
  const command = useCrmCommand((receipt) => {
    if (kind === "Survey") router.push(`/surveys/${receipt.record_id}`);
    else onSaved?.();
  });
  return (
    <>
      <ReadState
        loading={options.loading}
        error={options.error}
        retry={options.reload}
      />
      {options.data &&
        (options.data.can_create ? (
          <form
            className="cs-form detail-section"
            onSubmit={(e) => {
              e.preventDefault();
              void command.send(`cs/${kind}`, {
                id: crypto.randomUUID(),
                context_id: contextId,
                name,
                owner_id: owner,
                reason,
              });
            }}
          >
            <h2>
              Start{" "}
              {kind === "Survey"
                ? "a survey"
                : kind === "Readiness"
                  ? "Site readiness"
                  : "an account plan"}
            </h2>
            <p>Context: {String(options.data.context.name)}</p>
            <ValidationFields error={command.error}>
              <fieldset disabled={command.busy || command.uncertain}>
                <Field
                  name="name"
                  label="Name"
                  value={name}
                  onChange={(v) => {
                    setName(v);
                    command.dirty();
                  }}
                  required
                />
                <SelectField
                  name="owner_id"
                  label="Accountable owner"
                  value={owner}
                  options={options.data.owners.edit}
                  onChange={(v) => {
                    setOwner(v);
                    command.dirty();
                  }}
                  required
                />
                <Field
                  name="reason"
                  label="Reason"
                  value={reason}
                  onChange={(v) => {
                    setReason(v);
                    command.dirty();
                  }}
                  required
                />
                <button>Create draft</button>
              </fieldset>
            </ValidationFields>
            <CommandStatus command={command} />
          </form>
        ) : (
          <p>Creation is restricted in this context.</p>
        ))}
    </>
  );
}
export function SurveyRegister({ siteId = "" }: { siteId?: string }) {
  const [site, setSite] = useState(siteId),
    [creating, setCreating] = useState(false), [cursor,setCursor]=useState("");
  const r = useCrmResource<Awaited<ReturnType<typeof listCs>>>(
      `cs/Survey?${new URLSearchParams({...(site?{context_id:site}:{}),...(cursor?{cursor}:{}),limit:"30"})}`,
      true,
    ),
    sites = useCrmResource<
      Envelope<{ id: string; name?: string; display_name?: string }>
    >("sites?limit=100", true);
  return (
    <div id="ppo-survey" className="cs-workspace">
      <PageHeader
        eyebrow="CS-08 · Customers, contacts & sites"
        title="Site surveys & as-found briefs"
        description="Retain the exact scope, original evidence and reviewed revision for each handover."
      />
      <SavedViewControls
        target="surveys"
        criteria={{ site_id: site }}
        apply={(criteria) => {
          setSite(criteria.site_id ?? "");
          setCursor("");
          setCreating(false);
        }}
      />
      <SelectField
        name="site_id"
        label="Site"
        value={site}
        options={(sites.data?.items ?? []).map((s) => ({
          id: s.id,
          display_name: s.name ?? s.display_name ?? "Site",
        }))}
        onChange={(v) => {
          setSite(v);
          setCursor("");
          setCreating(false);
        }}
        empty="All permitted Sites"
      />
      <ReadState
        loading={sites.loading}
        error={sites.error}
        retry={sites.reload}
      />
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <p>{r.data.completeness} · current permitted survey register</p>
          {(cursor||r.data.next_cursor)&&<nav className="cs-actions" aria-label="Survey pages">{cursor&&<button className="secondary" onClick={()=>setCursor("")}>First page</button>}{r.data.next_cursor&&<button className="secondary" onClick={()=>setCursor(r.data!.next_cursor!)}>Next page</button>}</nav>}
          {r.data.items.length ? (
            <div className="cs-cards">
              {r.data.items.map((s) => (
                <article className="detail-section" key={s.id}>
                  <h2>
                    <Link href={`/surveys/${s.id}`}>{s.name}</Link>
                  </h2>
                  <p>
                    {s.state} · revision {s.revision} · {s.owner_name}
                  </p>
                  <Link href={`/sites/${s.site_id}`}>Open Site</Link>
                </article>
              ))}
            </div>
          ) : (
            <p>No surveys returned in the selected context.</p>
          )}
        </>
      )}
      {site ? (
        <>
          <button className="secondary" onClick={() => setCreating((v) => !v)}>
            {creating ? "Close new survey" : "New survey at selected Site"}
          </button>
          {creating && <CreateCs key={site} kind="Survey" contextId={site} />}
        </>
      ) : (
        <p>Select an exact Site to start a survey.</p>
      )}
    </div>
  );
}
function Fact({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value === null || value === undefined || value === ""
          ? "Not recorded"
          : String(value)}
      </dd>
    </div>
  );
}
function name(
  options: { id: string; display_name: string }[],
  id: string | null,
  empty = "Site",
) {
  return id
    ? (options.find((x) => x.id === id)?.display_name ?? "Unavailable choice")
    : empty;
}
function ContentView({
  content,
  kind,
  view,
  options,
  evidenceStatus = {},
}: {
  content: CsContent;
  kind: CsKind;
  view: string;
  options: CsOptions;
  evidenceStatus?: Record<string, string>;
}) {
  if (kind === "Readiness") {
    const r = content as ReadinessContent;
    return (
      <>
        {(view === "overview" || view === "requirements") && (
          <section className="detail-section">
            <h2>Requirements</h2>
            <p>
              Facility type and hierarchy do not establish readiness. Site
              applicability is explicitly recorded.
            </p>
            {r.requirements.length ? (
              r.requirements.map((x) => (
                <article className="cs-entry" key={x.id}>
                  <h3>{x.title}</h3>
                  <dl className="summary-grid">
                    <Fact label="Evidence" value={x.kind} />
                    <Fact
                      label="Applies to"
                      value={name(options.facilities, x.facility_id)}
                    />
                    <Fact
                      label="Activity"
                      value={
                        x.activity === "*"
                          ? "Explicitly all activities"
                          : x.activity
                      }
                    />
                    <Fact label="Source revision" value={x.revision} />
                    <Fact label="Source" value={x.source} />
                  </dl>
                </article>
              ))
            ) : (
              <p>No requirements recorded. Readiness is unknown.</p>
            )}
          </section>
        )}
        {view === "evidence" && (
          <section className="detail-section">
            <h2>Captured evidence</h2>
            <p>
              Capture and review are separate. The history identifies
              independent reviews of exact evidence.
            </p>
            {r.evidence.length ? (
              r.evidence.map((x) => (
                <article className="cs-entry" key={x.id}>
                  <h3>
                    {r.requirements.find((q) => q.id === x.requirement_id)
                      ?.title ?? "Retained requirement"}{" "}
                    · revision {x.requirement_revision}
                  </h3>
                  <dl className="summary-grid">
                    <Fact
                      label="Exact target"
                      value={name(options.facilities, x.facility_id)}
                    />
                    <Fact
                      label="Individual visitor"
                      value={name(options.people, x.person_id, "Not recorded")}
                    />
                    <Fact label="Activity" value={x.activity} />
                    <Fact label="Captured" value={x.captured_on} />
                    <Fact
                      label="Evidence review"
                      value={
                        evidenceStatus[x.id] ??
                        "See the exact retained review event"
                      }
                    />
                    <Fact label="Valid through" value={x.expires_on} />
                    <Fact label="Source" value={x.source} />
                  </dl>
                </article>
              ))
            ) : (
              <p>No evidence captured.</p>
            )}
          </section>
        )}
        {view === "windows" && (
          <section className="detail-section">
            <h2>Recorded work windows</h2>
            <p>
              All times use {String(options.context.timezone)}. No recorded
              window means access is unknown.
            </p>
            {r.windows.length ? (
              r.windows.map((x) => (
                <article className="cs-entry" key={x.id}>
                  <h3>{name(options.facilities, x.facility_id)}</h3>
                  <p>
                    {x.from_date} to {x.to_date}; seasonal {x.season_from} to{" "}
                    {x.season_to}; {x.start_time}–{x.end_time}
                  </p>
                  <p>
                    Activity: {x.activity} · {x.source}
                  </p>
                </article>
              ))
            ) : (
              <p>No work windows recorded.</p>
            )}
          </section>
        )}
      </>
    );
  }
  if (kind === "Survey") {
    const s = content as SurveyContent;
    const observations =
      view === "follow-up"
        ? s.observations.filter(
            (x) => x.kind === "Unknown" || x.kind === "Assumption",
          )
        : s.observations;
    return (
      <>
        {view === "overview" && (
          <section className="detail-section">
            <h2>Exact survey scope</h2>
            <p>{s.purpose}</p>
            <h3>Facilities</h3>
            {s.facility_ids.length ? (
              s.facility_ids.map((id) => (
                <p key={id}>
                  <Link href={`/facilities/${id}`}>
                    {name(options.facilities, id)}
                  </Link>
                </p>
              ))
            ) : (
              <p>Site scope; no Facilities selected.</p>
            )}
            <h3>Equipment</h3>
            {s.asset_ids.length ? (
              s.asset_ids.map((id) => (
                <p key={id}>
                  <Link href={`/assets/${id}`}>{name(options.assets, id)}</Link>
                </p>
              ))
            ) : (
              <p>No equipment selected.</p>
            )}
          </section>
        )}
        {["observations", "follow-up"].includes(view) && (
          <section className="detail-section">
            <h2>
              {view === "follow-up"
                ? "Missing information & owned follow-up"
                : "Measurements & observations"}
            </h2>
            {observations.length ? (
              observations.map((x) => (
                <article key={x.id} className="cs-entry">
                  <h3>
                    {x.title} · {x.kind}
                  </h3>
                  <p>{x.detail}</p>
                  <dl className="summary-grid">
                    <Fact
                      label="Facility"
                      value={name(options.facilities, x.facility_id)}
                    />
                    <Fact
                      label="Equipment"
                      value={name(options.assets, x.asset_id, "Not selected")}
                    />
                    <Fact
                      label="Measurement"
                      value={
                        x.kind === "Measured"
                          ? `${x.value} ${x.unit}`
                          : x.kind === "Unknown"
                            ? "Unknown"
                            : null
                      }
                    />
                    <Fact label="Observer" value={x.observer} />
                    <Fact label="Captured" value={x.captured_on} />
                    <Fact label="Method / source" value={x.method_source} />
                    <Fact
                      label="Affects handover"
                      value={x.significant ? "Yes" : "No"}
                    />
                    <Fact
                      label="Gap disposition"
                      value={x.insignificant_reason}
                    />
                  </dl>
                  {x.activity_id ? (
                    <Link href={`/work/${x.activity_id}`}>
                      {name(options.activities, x.activity_id)}
                    </Link>
                  ) : (
                    <p>
                      Owned follow-up not linked
                      {["Unknown", "Assumption"].includes(x.kind) &&
                      x.significant
                        ? "; required before submission."
                        : "."}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <p>No items recorded in this view.</p>
            )}
          </section>
        )}
      </>
    );
  }
  const p = content as PlanContent;
  return (
    <section className="detail-section">
      {view === "overview" && (
        <>
          <h2>Recorded account context</h2>
          <dl className="summary-grid">
            <Fact label="Sector" value={p.sector} />
            <Fact label="Territory" value={p.territory} />
            <Fact
              label="Horticultural context"
              value={p.horticultural_context}
            />
            <Fact label="Next review" value={p.review_on} />
          </dl>
          <p>Blank context is not scored or inferred from another source.</p>
        </>
      )}
      {["overview", "objectives"].includes(view) && (
        <>
          <h2>Relationship objectives</h2>
          <p>{p.objectives}</p>
        </>
      )}
      {view === "visits" && (
        <>
          <h2>Planned relationship visits</h2>
          <p>
            These records are intentions, not Service Appointments.
            Event-specific aftercare remains with Sales Aftercare.
          </p>
          {p.visits.length ? (
            p.visits.map((v) => (
              <article key={v.id} className="cs-entry">
                <h3>{v.purpose}</h3>
                <p>
                  {name(options.sites, v.site_id, "Customer level")} ·{" "}
                  {v.planned_on ?? "Date not recorded"}
                </p>
                {v.activity_id ? (
                  <Link href={`/work/${v.activity_id}`}>
                    Open owned follow-up
                  </Link>
                ) : (
                  <p>Follow-up not linked.</p>
                )}
              </article>
            ))
          ) : (
            <p>No visits proposed.</p>
          )}
        </>
      )}
      {view === "actions" && (
        <>
          <h2>Accountable next actions</h2>
          {p.activity_ids.length ? (
            p.activity_ids.map((id) => (
              <p key={id}>
                <Link href={`/work/${id}`}>{name(options.activities, id)}</Link>
              </p>
            ))
          ) : (
            <p>No Activities linked.</p>
          )}
          <p>Activity status and ownership remain in My Work.</p>
        </>
      )}
    </section>
  );
}
export function CsWorkspace({ kind, id }: { kind: CsKind; id: string }) {
  const r = useCrmResource<Workspace>(`cs/${kind}/${id}`, true);
  if (!r.data)
    return (
      <div id={scopeId(kind)} className="cs-workspace">
        <PageHeader
          eyebrow="Customers, contacts & sites"
          title={titles[kind]}
        />
        <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      </div>
    );
  return <LoadedWorkspace key={id} data={r.data} refresh={r.reload} />;
}
function LoadedWorkspace({
  data,
  refresh,
}: {
  data: Workspace;
  refresh: () => void;
}) {
  const { record: row, kind } = data,
    contextId = row.site_id ?? row.organisation_id!,
    options = useCrmResource<CsOptions>(
      `cs/${kind}/options?context_id=${contextId}`,
      true,
    );
  const tabs = sections[kind].map(([id, label]) => ({ id, label })),
    [view, setView] = useContactView(
      tabs.map((x) => x.id),
      "overview",
    ),
    [editing, setEditing] = useState<CsRow | null>(null);
  return (
    <div id={scopeId(kind)} className="cs-workspace">
      <PageHeader
        eyebrow={titles[kind]}
        title={row.name}
        description={boundary[kind]}
      />
      <div className="button-row">
        <ContextLink kind={kind} id={contextId} />
        {kind === "Survey" && (
          <Link href={`/surveys?site_id=${row.site_id}`}>Survey register</Link>
        )}
        <Link
          href={`/work/new?type=${row.site_id ? "Site" : "Organisation"}&id=${contextId}&company=${row.company_id}`}
        >
          Create owned follow-up
        </Link>
      </div>
      <p>
        {row.state} · revision {row.revision} · saved version {row.version} ·
        checked {new Date(data.observed_at).toLocaleString("en-AU")}
      </p>
      <RecordTabs
        id="cs"
        label={titles[kind]}
        tabs={tabs}
        value={view}
        onChange={(v) => {
          if (!editing) setView(v);
        }}
      />
      <ReadState
        loading={options.loading}
        error={options.error}
        retry={options.reload}
      />
      {options.data && (
        <RecordPanel id="cs" tab={view} value={view}>
          {editing ? (
            <ContentEditor
              row={editing}
              kind={kind}
              options={options.data}
              view={view}
              onSaved={() => {
                setEditing(null);
                refresh();
                options.reload();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <>
              {data.can_edit &&
                row.state === "Draft" &&
                !["photos", "history", "preparation", "review"].includes(
                  view,
                ) && (
                  <button
                    className="secondary"
                    onClick={() => setEditing(structuredClone(row))}
                  >
                    Edit {view === "overview" ? "record" : view}
                  </button>
                )}
              <ContentView
                kind={kind}
                content={row.content}
                view={view}
                options={options.data}
                evidenceStatus={data.evidence_status}
              />
              {kind === "Survey" && view === "photos" && (
                <PhotoEvidence
                  data={data}
                  options={options.data}
                  onSaved={refresh}
                />
              )}
              {(view === "history" ||
                view === "preparation" ||
                view === "review" ||
                view === "evidence") && (
                <>
                  <WorkflowActions
                    data={data}
                    options={options.data}
                    onSaved={refresh}
                  />
                  <History data={data} options={options.data} />
                </>
              )}
            </>
          )}
        </RecordPanel>
      )}
    </div>
  );
}
function History({ data, options }: { data: Workspace; options: CsOptions }) {
  return (
    <section className="detail-section">
      <h2>Retained snapshots & history</h2>
      <p>{data.history_scope}</p>
      {data.snapshots.map((s) => (
        <details key={s.id} className="cs-entry">
          <summary>
            {s.kind} · revision {s.revision} ·{" "}
            {new Date(s.recorded_at).toLocaleString("en-AU")} ·{" "}
            {s.recheck_required ? "Recheck required" : "Source still matches"}
          </summary>
          <p>Exact snapshot: {s.id}</p>
          {s.basis.assessment && (
            <>
              <p>
                {s.basis.assessment.status}. Work authority:{" "}
                {s.basis.assessment.work_authority}.
              </p>
              <ul>
                {s.basis.assessment.blockers.map((b: string, i: number) => (
                  <li key={i}>{b.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi,id=>name([...options.facilities,...options.people],id,"Selected context"))}</li>
                ))}
              </ul>
            </>
          )}
          <ContentView
            content={s.basis.content}
            kind={data.kind}
            view={
              data.kind === "Survey"
                ? "observations"
                : data.kind === "Readiness"
                  ? "requirements"
                  : "overview"
            }
            options={options}
          />
        </details>
      ))}
      {!data.snapshots.length && (
        <p>No preparation, submission or review snapshot retained yet.</p>
      )}
      {data.events.map((e) => (
        <article className="cs-entry" key={e.id}>
          <strong>{e.kind}</strong>
          <p>
            {new Date(e.recorded_at).toLocaleString("en-AU")} ·{" "}
            {e.details.reason ?? "Recorded decision"}
          </p>
          {e.kind === "Handover" && (
            <p>
              {e.details.destination} · exact source revision{" "}
              {e.details.source_revision}. {e.details.receiving_decision}.
            </p>
          )}
        </article>
      ))}
      <h3>Saved revision history</h3>
      {data.history.map((h) => (
        <p key={h.id}>
          Version {h.version} · revision {h.revision} · {h.state} ·{" "}
          {new Date(h.recorded_at).toLocaleString("en-AU")} · {h.reason}
        </p>
      ))}
    </section>
  );
}
function WorkflowActions({
  data,
  options,
  onSaved,
}: {
  data: Workspace;
  options: CsOptions;
  onSaved: () => void;
}) {
  const { record: row, kind } = data;
  const actions =
    kind === "Readiness"
      ? [
          ["prepare", "Evaluate visit preparation"],
          ["acknowledge", "Acknowledge an exact preparation"],
          ["review_evidence", "Review exact captured evidence"],
        ]
      : kind === "AccountPlan"
        ? [["review_plan", "Record account review"]]
        : row.state === "Draft"
          ? [["submit", "Submit for review"]]
          : row.state === "Submitted"
            ? [
                ["review", "Review submission"],
                ["return", "Return with clarification"],
              ]
            : [
                ["revise", "Start successor draft"],
                ...(row.state === "Reviewed"
                  ? [["handover", "Record reviewed handover"]]
                  : []),
              ];
  const [action, setAction] = useState(actions[0][0]),
    [reason, setReason] = useState(""),
    [snapshot, setSnapshot] = useState(""),
    [evidence, setEvidence] = useState(""),
    [destination, setDestination] = useState("Estimating"),
    [receiver, setReceiver] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]),
    [people, setPeople] = useState<string[]>([]),
    [activity, setActivity] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const [basis, setBasis] = useState(row.version);
  const command = useCrmCommand((receipt) => {
    setBasis(receipt.record_version);
    setAction("");
    setReason("");
    setSnapshot("");
    onSaved();
  });
  if (!data.can_edit)
    return <p>Review and maintenance are restricted in this context.</p>;
  return (
    <form
      className="cs-form detail-section"
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(`cs/${kind}/${row.id}/actions`, {
          expected_version: basis,
          action,
          reason,
          snapshot_id: snapshot || null,
          evidence_id: evidence || null,
          preparation:
            action === "prepare"
              ? {
                  facility_ids: facilities,
                  person_ids: people,
                  activity,
                  starts_at: start,
                  ends_at: end,
                }
              : null,
          destination: action === "handover" ? destination : null,
          receiving_owner_id: action === "handover" ? receiver : null,
        });
      }}
    >
      <h2>Review & coordination</h2>
      <p>{boundary[kind]}</p>
      <ValidationFields error={command.error}>
        <fieldset disabled={command.busy || command.uncertain}>
          <SelectField
            name="action"
            label="Action"
            value={action}
            onChange={(v) => {
              setAction(v);
              setSnapshot("");
              command.dirty();
            }}
            options={actions.map(([id, display_name]) => ({
              id,
              display_name,
            }))}
            required
          />
          {["acknowledge", "review", "return", "handover"].includes(action) && (
            <SelectField
              name="snapshot_id"
              label="Exact retained snapshot"
              value={snapshot}
              onChange={(v) => {
                setSnapshot(v);
                command.dirty();
              }}
              options={data.snapshots
                .filter(
                  (s) =>
                    s.kind ===
                    (kind === "Readiness" ? "Preparation" : "Submission"),
                )
                .map((s) => ({
                  id: s.id,
                  display_name: `Revision ${s.revision} · ${new Date(s.recorded_at).toLocaleString("en-AU")} · ${s.recheck_required ? "recheck required" : "source matches"}`,
                }))}
              required
            />
          )}
          {action === "review_evidence" && (
            <SelectField
              name="evidence_id"
              label="Exact evidence to review"
              value={evidence}
              onChange={(v) => {
                setEvidence(v);
                command.dirty();
              }}
              options={(row.content as ReadinessContent).evidence.map((e) => ({
                id: e.id,
                display_name: `${(row.content as ReadinessContent).requirements.find((r) => r.id === e.requirement_id)?.title ?? "Requirement"} · ${name(options.people, e.person_id, "Site evidence")} · ${e.captured_on}`,
              }))}
              required
            />
          )}
          {action === "prepare" && (
            <>
              <MultiChoice
                label="Exact Facilities for this visit"
                items={options.facilities}
                value={facilities}
                onChange={(v) => {
                  setFacilities(v);
                  command.dirty();
                }}
              />
              <MultiChoice
                label="Individual visitors"
                items={options.people}
                value={people}
                onChange={(v) => {
                  setPeople(v);
                  command.dirty();
                }}
              />
              <Field
                name="activity"
                label="Exact activity basis"
                value={activity}
                onChange={(v) => {
                  setActivity(v);
                  command.dirty();
                }}
                required
              />
              <LocalDateTimeField
                name="starts_at"
                label="Attendance starts"
                timezone={String(options.context.timezone)}
                value={start}
                onChange={(v) => {
                  setStart(v);
                  command.dirty();
                }}
              />
              <LocalDateTimeField
                name="ends_at"
                label="Attendance ends"
                timezone={String(options.context.timezone)}
                value={end}
                onChange={(v) => {
                  setEnd(v);
                  command.dirty();
                }}
              />
            </>
          )}
          {action === "handover" && (
            <>
              <SelectField
                name="destination"
                label="Receiving workflow"
                value={destination}
                options={["Estimating", "Engineering"].map((x) => ({
                  id: x,
                  display_name: x,
                }))}
                onChange={(v) => {
                  setDestination(v);
                  setReceiver("");
                  command.dirty();
                }}
              />
              <SelectField
                name="receiving_owner_id"
                label="Accountable receiving owner"
                value={receiver}
                options={
                  destination === "Estimating"
                    ? options.owners.estimating
                    : options.owners.engineering
                }
                onChange={(v) => {
                  setReceiver(v);
                  command.dirty();
                }}
                required
              />
              <p>
                The receiving owner decides whether to adopt this exact reviewed
                source. No accepted Estimate or Engineering basis is updated.
              </p>
            </>
          )}
          <Field
            name="reason"
            label="Review, clarification or acknowledgement reason"
            multiline
            value={reason}
            onChange={(v) => {
              setReason(v);
              command.dirty();
            }}
            required
          />
          <button>Record action</button>
        </fieldset>
      </ValidationFields>
      <CommandStatus command={command} />
    </form>
  );
}
function PhotoEvidence({
  data,
  options,
  onSaved,
}: {
  data: Workspace;
  options: CsOptions;
  onSaved: () => void;
}) {
  const row = data.record,
    [file, setFile] = useState<File | null>(null),
    [caption, setCaption] = useState(""),
    [observer, setObserver] = useState(""),
    [captured, setCaptured] = useState(""),
    [method, setMethod] = useState(""),
    [facility, setFacility] = useState(""),
    [asset, setAsset] = useState(""),
    [reason, setReason] = useState("");
  const [basis, setBasis] = useState(row.version);
  const command = useCrmCommand((receipt) => {
      setBasis(receipt.record_version);
      onSaved();
    }),
    content = row.content as SurveyContent;
  return (
    <section className="detail-section">
      <h2>Photos & original evidence</h2>
      <p>
        Original PNG bytes and their hash are retained privately. Correct a
        caption by adding a successor; the original photo stays unchanged.
      </p>
      {data.photos.map((photo) => (
        <article className="cs-entry" key={photo.id}>
          <h3>{photo.caption?.caption ?? "Original photo"}</h3>
          <a
            href={`/api/v1/cs/Survey/${row.id}/photos/${photo.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Open original photo
          </a>
          <p>
            {photo.observer} · {photo.captured_on} · {photo.method_source}
          </p>
          <p>
            {name(options.facilities, photo.facility_id)} ·{" "}
            {name(options.assets, photo.asset_id, "No equipment target")}
          </p>
          <details>
            <summary>Original evidence fingerprint</summary>
            <p className="cs-break">
              {photo.content_hash} · {photo.byte_count} bytes
            </p>
          </details>
          {data.can_edit && row.state === "Draft" && (
            <CaptionCorrection
              key={photo.caption?.id}
              id={row.id}
              version={row.version}
              photo={photo}
              onSaved={onSaved}
            />
          )}
        </article>
      ))}
      {!data.photos.length && <p>No photos retained.</p>}
      {data.can_edit && row.state === "Draft" && (
        <form
          className="cs-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!file) return;
            const bytes = new Uint8Array(await file.arrayBuffer());
            let binary = "";
            for (const byte of bytes) binary += String.fromCharCode(byte);
            void command.send(`cs/Survey/${row.id}/photos`, {
              id: crypto.randomUUID(),
              expected_version: basis,
              facility_id: facility || null,
              asset_id: asset || null,
              observer,
              captured_on: captured,
              method_source: method,
              caption,
              png_base64: btoa(binary),
              reason,
            });
          }}
        >
          <h3>Add an original PNG</h3>
          <ValidationFields error={command.error}>
            <fieldset disabled={command.busy || command.uncertain}>
              <label>
                Original PNG, up to 4 MB
                <input
                  type="file"
                  accept="image/png"
                  required
                  onChange={(e) => {
                    const chosen = e.target.files?.[0] ?? null;
                    e.target.setCustomValidity(
                      chosen && chosen.size > 4194304
                        ? "Choose a PNG up to 4 MB."
                        : "",
                    );
                    setFile(chosen);
                    command.dirty();
                  }}
                />
              </label>
              <div className="cs-fields">
                <SelectField
                  name="facility_id"
                  label="Exact Facility (blank means Site)"
                  value={facility}
                  options={options.facilities.filter((x) =>
                    content.facility_ids.includes(x.id),
                  )}
                  onChange={(v) => {
                    setFacility(v);
                    command.dirty();
                  }}
                />
                <SelectField
                  name="asset_id"
                  label="Exact equipment (optional)"
                  value={asset}
                  options={options.assets.filter((x) =>
                    content.asset_ids.includes(x.id),
                  )}
                  onChange={(v) => {
                    setAsset(v);
                    command.dirty();
                  }}
                />
                <Field
                  name="observer"
                  label="Observer"
                  value={observer}
                  onChange={(v) => {
                    setObserver(v);
                    command.dirty();
                  }}
                  required
                />
                <Field
                  name="captured_on"
                  label="Capture date"
                  type="date"
                  value={captured}
                  onChange={(v) => {
                    setCaptured(v);
                    command.dirty();
                  }}
                  required
                />
              </div>
              <Field
                name="method_source"
                label="Method / source"
                value={method}
                onChange={(v) => {
                  setMethod(v);
                  command.dirty();
                }}
                required
              />
              <Field
                name="caption"
                label="Caption"
                multiline
                value={caption}
                onChange={(v) => {
                  setCaption(v);
                  command.dirty();
                }}
                required
              />
              <Field
                name="reason"
                label="Evidence capture reason"
                value={reason}
                onChange={(v) => {
                  setReason(v);
                  command.dirty();
                }}
                required
              />
              <button>Retain original photo</button>
            </fieldset>
          </ValidationFields>
          <CommandStatus command={command} />
        </form>
      )}
    </section>
  );
}
function CaptionCorrection({
  id,
  version,
  photo,
  onSaved,
}: {
  id: string;
  version: number;
  photo: Workspace["photos"][number];
  onSaved: () => void;
}) {
  const [caption, setCaption] = useState(String(photo.caption?.caption ?? "")),
    [reason, setReason] = useState(""),
    [basis] = useState(version);
  const command = useCrmCommand(onSaved);
  return (
    <details>
      <summary>Correct caption</summary>
      <form
        className="cs-form"
        onSubmit={(e) => {
          e.preventDefault();
          void command.send(`cs/Survey/${id}/photos/${photo.id}/caption`, {
            expected_version: basis,
            previous_caption_id: photo.caption.id,
            caption,
            reason,
          });
        }}
      >
        <ValidationFields error={command.error}>
          <fieldset disabled={command.busy || command.uncertain}>
            <Field
              name="caption"
              label="Successor caption"
              value={caption}
              onChange={(v) => {
                setCaption(v);
                command.dirty();
              }}
              required
            />
            <Field
              name="reason"
              label="Correction reason"
              value={reason}
              onChange={(v) => {
                setReason(v);
                command.dirty();
              }}
              required
            />
            <button>Save successor caption</button>
          </fieldset>
        </ValidationFields>
        <CommandStatus command={command} />
      </form>
    </details>
  );
}
