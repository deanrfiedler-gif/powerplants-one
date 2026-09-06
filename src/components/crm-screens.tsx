"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { listOpportunities, readOpportunity } from "../crm/reads";
import { useIdentity } from "./business-session";
import {
  ErrorNotice,
  Field,
  SelectField,
  PageHeader,
  Stamp,
  Status,
  friendly,
  ValidationFields,
  type Envelope,
  type Option,
} from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
type Opportunity = Awaited<ReturnType<typeof readOpportunity>>;
type Options = Envelope<Option> & {
  pipeline_definition_id: string;
  pipeline_label: string;
};
const query = (fields: Record<string, string>) =>
  new URLSearchParams(
    Object.fromEntries(Object.entries(fields).filter(([, v]) => v)),
  ).toString();
const NEXT_LABELS: Record<string, string> = {
  Needed: "Next action needed",
  DueNeeded: "Due date needed",
  Overdue: "Overdue",
  Upcoming: "Upcoming",
  Unavailable: "Next action unavailable",
};
const options = (values: string[]) =>
  values.map((id) => ({ id, display_name: friendly(id) }));
function ResourceState({
  loading,
  error,
  reload,
}: {
  loading: boolean;
  error: unknown;
  reload: () => void;
}) {
  return (
    <>
      <ErrorNotice error={error} />
      {loading && <p role="status">Loading permitted sales records…</p>}
      {error != null && (
        <button className="secondary" onClick={reload}>
          Try loading again
        </button>
      )}
    </>
  );
}
function SaveState({ command }: { command: ReturnType<typeof useCrmCommand> }) {
  return (
    <>
      <p role="status">{command.status}</p>
      <ErrorNotice error={command.error} />
      {command.uncertain && (
        <button
          onClick={() => void command.reconcile()}
          disabled={command.busy}
        >
          Confirm original save outcome
        </button>
      )}
    </>
  );
}
function CrmPicker({
  label,
  name,
  kind,
  value,
  onChange,
  context = {},
}: {
  label: string;
  name: string;
  kind: string;
  value: string;
  onChange: (s: string) => void;
  context?: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const ready =
    kind === "Company" ||
    (!!context.company_id &&
      (kind === "Organisation" || !!context.organisation_id));
  const result = useCrmResource<Options>(
    ready
      ? `crm/options?${query({ kind, ...context, q: search, limit: "100" })}`
      : null,
  );
  return (
    <div className="crm-picker">
      <Field
        name={`${name}-search`}
        label={`Find ${label.toLowerCase()}`}
        value={search}
        onChange={setSearch}
      />
      <SelectField
        name={name}
        label={label}
        value={value}
        onChange={onChange}
        options={result.data?.items ?? []}
        empty={result.loading ? "Loading…" : "Choose / unknown"}
      />
      <ErrorNotice error={result.error} />
      {result.data?.next_cursor && (
        <small>More matches exist. Refine the search.</small>
      )}
    </div>
  );
}
export function SalesWorklist() {
  const p = useIdentity(),
    [search, setSearch] = useState(""),
    [stage, setStage] = useState(""),
    [next, setNext] = useState(""),
    [mine, setMine] = useState(false),
    [cursor, setCursor] = useState("");
  const data = useCrmResource<Awaited<ReturnType<typeof listOpportunities>>>(
    `crm/opportunities?${query({ q: search, stage_id: stage, next_action: next, owner_id: mine ? p.actor_id : "", cursor })}`,
  );
  return (
    <>
      <PageHeader
        eyebrow="CRM · Synthetic · Online"
        title="Sales worklist"
        description="Owned opportunities and qualification follow-up. Fictional Enquiry → Qualified pipeline."
        action={
          data.data?.can_create ? (
            <Link className="primary-link" href="/crm/opportunities/new">
              New opportunity
            </Link>
          ) : undefined
        }
      />
      <div className="crm-filters">
        <Field
          name="sales-search"
          label="Search opportunities"
          value={search}
          onChange={(v) => {
            setSearch(v);
            setCursor("");
          }}
        />
        <SelectField
          name="stage"
          label="Stage"
          value={stage}
          onChange={(v) => {
            setStage(v);
            setCursor("");
          }}
          options={options(["Enquiry", "Qualified"])}
          empty="All stages"
        />
        <SelectField
          name="next-state"
          label="Next action"
          value={next}
          onChange={(v) => {
            setNext(v);
            setCursor("");
          }}
          options={Object.entries(NEXT_LABELS).map(([id, display_name]) => ({
            id,
            display_name,
          }))}
          empty="All action states"
        />
        <label className="crm-check">
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => {
              setMine(e.target.checked);
              setCursor("");
            }}
          />
          Owned by me
        </label>
      </div>
      <ResourceState {...data} />
      {data.data && (
        <>
          <p className="source-stamp">
            Synthetic source · As at <Stamp value={data.data.observed_at} /> ·{" "}
            {data.data.items.length} permitted items on this page ·{" "}
            {data.data.completeness}
          </p>
          {!data.data.items.length ? (
            <p className="empty-state">
              No permitted opportunities match this view.
            </p>
          ) : (
            <ul className="crm-worklist">
              {data.data.items.map((o) => (
                <li key={o.id} className="crm-card">
                  <div>
                    <small>{o.display_number}</small>
                    <h2>
                      <Link href={`/crm/opportunities/${o.id}`}>{o.title}</Link>
                    </h2>
                    <p>{o.organisation_name}</p>
                    <p>Owner: {o.owner_name}</p>
                  </div>
                  <div>
                    <Status value={o.stage_id} />
                    <span className="crm-outcome">
                      Sales outcome: {o.close_outcome}
                    </span>
                    <strong>{NEXT_LABELS[o.next_action_state]}</strong>
                    {["Upcoming", "Overdue", "DueNeeded"].includes(
                      o.next_action_state,
                    ) && <p>{o.next_action_summary}</p>}
                    {o.due_at &&
                      ["Upcoming", "Overdue"].includes(o.next_action_state) && (
                        <p>
                          Due <Stamp value={String(o.due_at)} /> (Brisbane)
                        </p>
                      )}
                    <small>
                      Stage entered <Stamp value={String(o.stage_entered_at)} />
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="crm-actions">
            <button
              className="secondary"
              onClick={() => {
                setCursor("");
                data.reload();
              }}
            >
              Refresh from start
            </button>
            {data.data.next_cursor && (
              <button onClick={() => setCursor(data.data!.next_cursor!)}>
                Next page
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
type ActionDraft = {
  id: string;
  owner_id: string;
  kind: string;
  summary: string;
  due_at: string;
  due_needed: boolean;
};
const emptyAction = (owner: string): ActionDraft => ({
  id: crypto.randomUUID(),
  owner_id: owner,
  kind: "CustomerContact",
  summary: "",
  due_at: "",
  due_needed: true,
});
function ActionFields({
  value,
  set,
  context,
}: {
  value: ActionDraft;
  set: (v: ActionDraft) => void;
  context: Record<string, string>;
}) {
  return (
    <>
      <SelectField
        name="activity-kind"
        label="Activity kind"
        value={value.kind}
        onChange={(kind) => set({ ...value, kind })}
        options={options(["CustomerContact", "RelationshipReview"])}
      />
      <CrmPicker
        name="activity_owner_id"
        label="Activity owner"
        kind="ActionOwner"
        value={value.owner_id}
        onChange={(owner_id) => set({ ...value, owner_id })}
        context={context}
      />
      <Field
        name="activity_summary"
        label="Action purpose"
        value={value.summary}
        onChange={(summary) => set({ ...value, summary })}
        multiline
        required
        maxLength={2000}
      />
      <label className="crm-check">
        <input
          type="checkbox"
          checked={value.due_needed}
          onChange={(e) =>
            set({ ...value, due_needed: e.target.checked, due_at: "" })
          }
        />
        Due date needed
      </label>
      {!value.due_needed && (
        <Field
          name="due_at"
          label="Due instant (UTC)"
          value={value.due_at}
          onChange={(due_at) => set({ ...value, due_at })}
          hint="Example: 2026-09-12T00:00:00Z. This is a planned action, not a message or invitation."
          required
        />
      )}
    </>
  );
}
export function NewOpportunity() {
  const p = useIdentity(),
    router = useRouter(),
    [id] = useState(() => crypto.randomUUID()),
    [company, setCompany] = useState(""),
    [org, setOrg] = useState(""),
    [site, setSite] = useState(""),
    [person, setPerson] = useState(""),
    [owner, setOwner] = useState(p.actor_id),
    [title, setTitle] = useState(""),
    [need, setNeed] = useState(""),
    [siteReason, setSiteReason] = useState(""),
    [contactReason, setContactReason] = useState(""),
    [channel, setChannel] = useState("Phone"),
    [source, setSource] = useState(""),
    [action, setAction] = useState(() => emptyAction(p.actor_id));
  const available = useCrmResource<Options>("crm/options?kind=Company");
  const command = useCrmCommand((r) =>
    router.push(`/crm/opportunities/${r.record_id}`),
  );
  const context = {
    company_id: company,
    organisation_id: org,
    site_id: site,
    primary_person_id: person,
  };
  if (denied(command.error) || denied(available.error))
    return <ErrorNotice error={command.error ?? available.error} />;
  return (
    <>
      <PageHeader
        eyebrow="CRM · Synthetic · Online"
        title="New opportunity"
        description="Select existing customer context. Creating saves one Open opportunity and its initial owned Activity together."
      />
      <Link href="/crm/opportunities">Back to sales worklist</Link>
      <ResourceState {...available} />
      {available.data && (
        <>
          <p>
            Pipeline: {available.data.pipeline_label}. Stage: Enquiry. Sales
            outcome: Open.
          </p>
          <SaveState command={command} />
          <ValidationFields error={command.error}>
            <form
              className="crm-form"
              onChange={command.dirty}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void command.send("crm/opportunities", {
                  id,
                  company_id: company,
                  organisation_id: org,
                  site_id: site || null,
                  primary_person_id: person || null,
                  site_unknown_reason: site ? null : siteReason,
                  contact_unknown_reason: person ? null : contactReason,
                  title,
                  need_summary: need,
                  source_channel: channel,
                  source_basis: source,
                  owner_id: owner,
                  pipeline_definition_id:
                    available.data!.pipeline_definition_id,
                  initial_action: {
                    ...action,
                    due_at: action.due_needed ? null : action.due_at,
                  },
                  reason:
                    "Create synthetic owned opportunity and initial action",
                });
              }}
            >
              <fieldset disabled={command.busy || command.uncertain}>
                <legend>Opportunity and customer context</legend>
                <SelectField
                  name="company_id"
                  label="Visibility company"
                  value={company}
                  onChange={(v) => {
                    setCompany(v);
                    setOrg("");
                    setSite("");
                    setPerson("");
                    setOwner("");
                    setAction({ ...action, owner_id: "" });
                  }}
                  options={available.data.items}
                />
                {company && (
                  <CrmPicker
                    name="organisation_id"
                    label="Organisation"
                    kind="Organisation"
                    value={org}
                    onChange={(v) => {
                      setOrg(v);
                      setSite("");
                      setPerson("");
                    }}
                    context={{ company_id: company }}
                  />
                )}
                {org && (
                  <>
                    <CrmPicker
                      name="site_id"
                      label="Site"
                      kind="Site"
                      value={site}
                      onChange={setSite}
                      context={context}
                    />
                    {!site && (
                      <Field
                        name="site_unknown_reason"
                        label="Why is the site unknown?"
                        value={siteReason}
                        onChange={setSiteReason}
                        required
                        maxLength={1000}
                      />
                    )}
                    <CrmPicker
                      name="primary_person_id"
                      label="Contact"
                      kind="Person"
                      value={person}
                      onChange={setPerson}
                      context={context}
                    />
                    {!person && (
                      <Field
                        name="contact_unknown_reason"
                        label="Why is the contact unknown?"
                        value={contactReason}
                        onChange={setContactReason}
                        required
                        maxLength={1000}
                      />
                    )}
                    <CrmPicker
                      name="owner_id"
                      label="Opportunity owner"
                      kind="Owner"
                      value={owner}
                      onChange={setOwner}
                      context={context}
                    />
                  </>
                )}
                <Field
                  name="title"
                  label="Opportunity title"
                  value={title}
                  onChange={setTitle}
                  required
                />
                <Field
                  name="need_summary"
                  label="Customer need"
                  value={need}
                  onChange={setNeed}
                  multiline
                  required
                  maxLength={2000}
                />
                <SelectField
                  name="source_channel"
                  label="Source channel"
                  value={channel}
                  onChange={setChannel}
                  options={options([
                    "Phone",
                    "Email",
                    "Meeting",
                    "Referral",
                    "Other",
                  ])}
                />
                <Field
                  name="source_basis"
                  label="Source context (synthetic)"
                  value={source}
                  onChange={setSource}
                  required
                  maxLength={1000}
                />
                <h2>Initial next action</h2>
                <ActionFields
                  value={action}
                  set={setAction}
                  context={context}
                />
                <button type="submit">Create opportunity and action</button>
              </fieldset>
            </form>
          </ValidationFields>
        </>
      )}
    </>
  );
}
export function OpportunityDetail({ id }: { id: string }) {
  const resource = useCrmResource<Envelope<Opportunity>>(
    `crm/opportunities/${id}`,
  );
  return (
    <>
      <ResourceState {...resource} />
      {resource.data?.items[0] && (
        <OpportunityContent
          key={id}
          opportunity={resource.data.items[0]}
          reload={resource.reload}
        />
      )}
    </>
  );
}
function OpportunityContent({
  opportunity: o,
  reload,
}: {
  opportunity: Opportunity;
  reload: () => void;
}) {
  const [version, setVersion] = useState(o.version),
    [need, setNeed] = useState(o.need_summary),
    [note, setNote] = useState(""),
    [identification, setIdentification] = useState(""),
    [existing, setExisting] = useState(""),
    [mode, setMode] = useState("New"),
    [action, setAction] = useState(() => emptyAction(o.owner_id));
  const command = useCrmCommand((r) => {
    setVersion(r.record_version);
    setNote("");
    setExisting("");
    setAction(emptyAction(o.owner_id));
    reload();
  });
  const context = {
    company_id: o.company_id,
    organisation_id: o.organisation_id,
    site_id: o.site_id ?? "",
    primary_person_id: o.primary_person_id ?? "",
    opportunity_id: o.id,
  };
  const active = o.actions.filter((a) =>
    ["Open", "InProgress"].includes(a.status),
  );
  if (denied(command.error)) return <ErrorNotice error={command.error} />;
  return (
    <>
      <PageHeader
        eyebrow={`${o.display_number} · Synthetic · Online`}
        title={o.title}
        description="Fictional sales enquiry — I1. Relationship context is fixed for this slice."
      />
      <Link href="/crm/opportunities">Back to sales worklist</Link>
      <div className="crm-status-row">
        <Status value={o.stage_id} />
        <span>Sales outcome: {o.close_outcome}</span>
        <span>Owner: {o.owner_name}</span>
      </div>
      <p className="source-stamp">
        Saved version {o.version} · Source updated{" "}
        <Stamp value={o.updated_at} /> · Stage entered{" "}
        <Stamp value={o.stage_entered_at} /> · As at{" "}
        <Stamp value={o.observed_at} />
      </p>
      <div className="crm-detail-grid">
        <section className="crm-panel">
          <h2>Customer context</h2>
          <dl>
            <dt>Organisation</dt>
            <dd>
              <Link href={`/customers/${o.organisation_id}`}>
                {o.organisation_name}
              </Link>
            </dd>
            <dt>Site</dt>
            <dd>
              {o.site_id ? (
                <Link href={`/sites/${o.site_id}`}>{o.site_name}</Link>
              ) : (
                <>Unknown — {o.site_unknown_reason}</>
              )}
            </dd>
            <dt>Contact</dt>
            <dd>
              {o.primary_person_id ? (
                <Link href={`/people/${o.primary_person_id}`}>
                  {o.contact_name}
                </Link>
              ) : (
                <>Unknown — {o.contact_unknown_reason}</>
              )}
            </dd>
            <dt>Customer need</dt>
            <dd className="crm-narrative">{o.need_summary}</dd>
            <dt>Source</dt>
            <dd>
              {o.source_channel} · {o.source_basis}
            </dd>
          </dl>
        </section>
        <section className="crm-panel">
          <h2>{NEXT_LABELS[o.next_action_state]}</h2>
          {o.next_activity &&
          ["Open", "InProgress"].includes(o.next_activity.status) ? (
            <>
              <p>{o.next_activity.summary}</p>
              <p>Owner: {o.next_activity.owner_name}</p>
              <p>
                {o.next_activity.due_needed ? (
                  "Due date needed"
                ) : (
                  <>
                    Due <Stamp value={o.next_activity.due_at} /> (Brisbane)
                  </>
                )}
              </p>
              <Link
                className="primary-link"
                href={`/work/${o.next_activity.id}`}
              >
                Open activity
              </Link>
            </>
          ) : (
            <p>
              {o.next_action_state === "Unavailable"
                ? "The linked action is unavailable under current permissions."
                : "The last designated action is finished. Plan or deliberately select an active next action."}
            </p>
          )}
          <p>
            Activity completion records its outcome. Qualification is a separate
            decision.
          </p>
        </section>
      </div>
      <SaveState command={command} />
      {version !== o.version && (
        <section className="crm-conflict" role="status">
          <h2>Compare saved version {o.version} with your proposal</h2>
          <p>
            Saved stage: {o.stage_id}. Saved need: {o.need_summary}
          </p>
          <p>Your proposed need: {need}</p>
          <p>Your qualification note: {note || "No note entered"}</p>
          <button
            className="secondary"
            disabled={command.uncertain}
            onClick={() => {
              setVersion(o.version);
              command.clearError();
            }}
          >
            Use current version for deliberate retry
          </button>
        </section>
      )}
      {command.error && !command.uncertain && (
        <button className="secondary" onClick={reload}>
          Load current saved version for comparison
        </button>
      )}
      {o.can_edit && (
        <ValidationFields error={command.error}>
          <div className="crm-detail-grid">
            {o.can_qualify && (
              <form
                className="crm-panel"
                onChange={command.dirty}
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void command.send(`crm/opportunities/${o.id}/qualify`, {
                    expected_version: version,
                    pipeline_definition_id: o.pipeline_definition_id,
                    need_summary: need,
                    qualification_note: note,
                    identification_activity_id: identification || null,
                    reason: "Record synthetic qualification and progress",
                  });
                }}
              >
                <fieldset disabled={command.busy || command.uncertain}>
                  <legend>Record qualification</legend>
                  <Field
                    name="need_summary"
                    label="Qualified customer need"
                    value={need}
                    onChange={setNeed}
                    multiline
                    required
                    maxLength={2000}
                  />
                  <Field
                    name="qualification_note"
                    label="Qualification outcome"
                    value={note}
                    onChange={setNote}
                    multiline
                    required
                    maxLength={2000}
                  />
                  {!o.primary_person_id && (
                    <SelectField
                      name="identification_activity_id"
                      label="Owned contact-identification action"
                      value={identification}
                      onChange={setIdentification}
                      options={active
                        .filter(
                          (a) =>
                            a.owner_id === o.owner_id &&
                            ["CustomerContact", "RelationshipReview"].includes(
                              a.kind,
                            ),
                        )
                        .map((a) => ({ id: a.id, display_name: a.summary }))}
                    />
                  )}
                  <button type="submit" disabled={version !== o.version}>
                    Progress to Qualified
                  </button>
                </fieldset>
              </form>
            )}
            <form
              className="crm-panel"
              onChange={command.dirty}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void command.send(`crm/opportunities/${o.id}/next-action`, {
                  expected_version: version,
                  activity_id: mode === "Existing" ? existing : null,
                  new_action:
                    mode === "New"
                      ? {
                          ...action,
                          due_at: action.due_needed ? null : action.due_at,
                        }
                      : null,
                  reason: "Plan the next synthetic opportunity action",
                });
              }}
            >
              <fieldset disabled={command.busy || command.uncertain}>
                <legend>Plan next action</legend>
                <SelectField
                  name="action-mode"
                  label="Action choice"
                  value={mode}
                  onChange={setMode}
                  options={options(["New", "Existing"])}
                />
                {mode === "New" ? (
                  <ActionFields
                    value={action}
                    set={setAction}
                    context={context}
                  />
                ) : (
                  <SelectField
                    name="activity_id"
                    label="Existing active linked activity"
                    value={existing}
                    onChange={setExisting}
                    options={active.map((a) => ({
                      id: a.id,
                      display_name: `${a.summary} · ${a.owner_name}`,
                    }))}
                  />
                )}
                <button type="submit" disabled={version !== o.version}>
                  Save next action
                </button>
              </fieldset>
            </form>
          </div>
        </ValidationFields>
      )}
      <section className="crm-panel">
        <h2>Activity history</h2>
        {o.actions.length ? (
          <ul className="crm-history">
            {o.actions.map((a) => (
              <li key={a.id}>
                <Link href={`/work/${a.id}`}>{a.summary}</Link>
                <p>
                  {a.owner_name} · <Status value={a.status} />
                </p>
                {a.outcome && (
                  <p className="crm-narrative">Outcome: {a.outcome}</p>
                )}
                {a.cancellation_reason && (
                  <p>Cancellation: {a.cancellation_reason}</p>
                )}
                <small>
                  Updated <Stamp value={a.updated_at} />
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No permitted activities are available.</p>
        )}
      </section>
      <section className="crm-panel">
        <h2>Opportunity history</h2>
        <ol className="crm-history">
          {o.events.map((e) => (
            <li key={e.id}>
              <strong>
                {e.event_type === "OpportunityCreated"
                  ? "Opportunity created"
                  : e.event_type === "OpportunityQualified"
                    ? "Qualification recorded"
                    : "Next action planned"}{" "}
                · Version {e.opportunity_version}
              </strong>
              <p>
                {e.from_stage ? `${e.from_stage} → ` : ""}
                {e.to_stage} · {e.reason}
              </p>
              <details>
                <summary>Recorded need and qualification</summary>
                <p className="crm-narrative">{e.need_summary}</p>
                {e.qualification_note && <p className="crm-narrative">{e.qualification_note}</p>}
              </details>
              <small>
                Recorded by {e.actor_name} · <Stamp value={String(e.created_at)} />
              </small>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
