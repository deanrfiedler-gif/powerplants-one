"use client";
import { SalesFollowupPanel } from "./sales-followup";
import { IncidentActivityHandover } from "../incidents/activity-handover";
import { PolicyHolds } from "../scheduling/components/client/policy-holds.client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { acceptanceReturn } from "../shell/context-links";
import { useState } from "react";
import { LocalDateTimeField, useUnsavedChanges } from "./record-ui";
import type { readActivity } from "../activities/activities";
import { activityTypeLabels, timing, whenText } from "../activities/work-view";
import { Tag } from "../activities/components/client/my-work-ui";
import { useIdentity } from "./business-session";
import { useShell } from "./shell-provider";
import {
  ErrorNotice,
  isDenied,
  Field,
  ReadState,
  RecordLink,
  SelectField,
  Status,
  useCommand,
  useResource,
  type Envelope,
  type Option,
} from "./business-ui";
type Activity = Awaited<ReturnType<typeof readActivity>>;
const kinds = [
  "TechnicalFollowUp",
  "CustomerContact",
  "MaterialAction",
  "FinanceQuery",
  "RelationshipReview",
];
// S5: plain names for stored values; the values themselves are unchanged.
const kindLabels: Record<string, string> = {
  TechnicalFollowUp: "Technical follow-up",
  CustomerContact: "Customer contact",
  MaterialAction: "Materials action",
  FinanceQuery: "Finance query",
  RelationshipReview: "Relationship review",
};
const linkTypes = ["Organisation", "Site", "Asset", "Ticket", "Project"] as const;
const linkTypeLabels: Record<string, string> = { Organisation: "Customer", Site: "Site", Asset: "Equipment", Ticket: "Service request", Project: "Project" };
// Who can read an activity's purpose and notes: anyone who can see the linked record, or only
// people who also hold internal or Finance access (classVisibility in src/activities/activities.ts).
const accessClasses = ["RestrictedService", "Internal", "RestrictedFinance"] as const;
const accessLabels: Record<string, string> = {
  RestrictedService: "Anyone who can see the linked record",
  Internal: "Internal staff only",
  RestrictedFinance: "Finance only",
};
export function ActivityDetail({ id }: { id: string }) {
  const source = acceptanceReturn(useSearchParams().get("returnTo"));
  const r = useResource<Envelope<Activity>>(`activities/${id}`);
  return (
    <div className="mw-page mw-record-page">
      <PolicyHolds activityId={id} />
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {!isDenied(r.error) && r.data?.items[0] && (
        <>{source && <Link className="ppo-back-link" href={source}>Return to acceptance obligation</Link>}<ActivityEditor key={id} activity={r.data.items[0]} reload={r.reload} /></>
      )}
    </div>
  );
}
function ActivityEditor({
  activity: a,
  reload,
}: {
  activity: Activity;
  reload: () => void;
}) {
  const [summary, setSummary] = useState(a.summary),
    [owner, setOwner] = useState(a.owner_id),
    [due, setDue] = useState(a.due_at ?? ""),
    [needed, setNeeded] = useState(a.due_needed),
    [outcome, setOutcome] = useState(""),
    [reason, setReason] = useState(""),
    [expected, setExpected] = useState(a.version);
  const cmd = useCommand(),
    owners = useResource<Envelope<Option>>(
      `selectors/owners?${new URLSearchParams({ company_id: a.company_id, ...(a.site_id ? { site_id: a.site_id } : {}), purpose: "Activity", access_class: a.access_class, activity_id: a.id })}`,
    );
  useUnsavedChanges(summary !== a.summary || owner !== a.owner_id || due !== (a.due_at ?? "") || needed !== a.due_needed || !!outcome || !!reason, cmd.busy);
  const active = a.status === "Open" || a.status === "InProgress",
    t = timing(a, new Date().toISOString());
  // The header's Complete and Reschedule take the person to the fields that do the work; the
  // commands, their reasons and their version checks are unchanged.
  const jump = (field: string, openUpdate = false) => {
    if (openUpdate) {
      const details = document.querySelector<HTMLDetailsElement>("details.activity-update");
      if (details) details.open = true;
      if (needed) setNeeded(false);
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(field);
      el?.scrollIntoView({ block: "center" });
      el?.focus();
    });
  };
  async function act(action: string) {
    const fields =
      action === "update"
        ? {
            summary,
            owner_id: owner,
            due_needed: needed,
            due_at: needed ? null : due || null,
          }
        : action === "complete"
          ? { outcome }
          : action === "cancel"
            ? { cancellation_reason: outcome }
            : {};
    const result = await cmd.send<{ record_version: number }>(
      `activities/${a.id}/${action}`,
      { expected_version: expected, reason, ...fields },
    );
    if (result) {
      setExpected(result.record_version);
      setOutcome("");
      setReason("");
      reload();
    }
  }
  // Permission loss removes previously loaded content and unsaved context.
  // Lifecycle payloads and retained-input handling for ordinary conflicts stay unchanged.
  if (isDenied(cmd.error) || isDenied(owners.error))
    return (
      <ErrorNotice error={isDenied(cmd.error) ? cmd.error : owners.error} />
    );
  return (
    <>
      <section className="mw-panel mw-record" aria-labelledby="activity-title">
        <div className="mw-record-identity">
          <div className="mw-record-heading">
            <p className="mw-record-eyebrow">Activity · {activityTypeLabels[a.activity_type]}</p>
            <h1 id="activity-title">{a.summary}</h1>
            <div className="mw-record-meta">
              {active && t.tone === "overdue" && <Tag tone="overdue">{t.detail ? t.value : "Overdue"}</Tag>}
              <Status value={a.status} />
              <span>Owner: {a.owner_name}</span>
              <span>Details readable by: {accessLabels[a.access_class] ?? a.access_class}</span>
            </div>
          </div>
          {a.can_edit && active && (
            <div className="mw-record-actions">
              {a.can_complete && (
                <button type="button" className="mw-button mw-button-primary" onClick={() => jump("activity-outcome")}>
                  Complete
                </button>
              )}
              <button type="button" className="mw-button" onClick={() => jump("activity-due", true)}>
                Reschedule
              </button>
            </div>
          )}
        </div>
        <dl className="mw-record-facts">
          {/* An appointment keeps its planned end in due_at, so it is described as a start and an end, never as a due time. */}
          <dt>{a.starts_at ? "Appointment" : "Due"}</dt>
          <dd>
            {a.due_needed ? "Due date needed" : whenText(a).replace(/^Due /, "")}
          </dd>
          <dt>Purpose</dt>
          <dd>{kindLabels[a.kind] ?? a.kind}</dd>
          <dt>Outcome</dt>
          <dd className="narrative">{a.outcome ?? a.cancellation_reason ?? "Not completed yet"}</dd>
          <dt>Linked to</dt>
          <dd>
            {a.links.length ? (
              <ul className="mw-record-links">
                {a.links.map((l) => (
                  <li key={l.object_id}>
                    <RecordLink type={l.object_type} id={l.object_id}>
                      {l.label ?? l.display_number}
                    </RecordLink>
                    <span className="mw-muted">
                      {" "}
                      · {linkTypeLabels[l.object_type] ?? l.object_type}
                      {l.label && l.display_number ? `, ${l.display_number}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              "No linked record"
            )}
          </dd>
        </dl>
      </section>
      {a.incident_source && <IncidentActivityHandover href={a.incident_source.href} />}
      {a.report_source && <p><Link href={a.report_source.href}>Return to original service report and response</Link>. Completing this Activity does not change a customer response, internal attendance acceptance, incident or inspection defect.</p>}
      <SalesFollowupPanel id={a.id} onLinked={reload} />
      {a.kind === "CustomerContact" && (
        <p className="scope-note">
          Recording an activity does not prove that a message was sent,
          delivered or acknowledged.
        </p>
      )}
      <ErrorNotice error={cmd.error} />
      <p role="status">{cmd.saved}</p>
      {a.can_edit && (
        <form
          className="mw-panel mw-record-form mw-record-actions-form"
          onSubmit={(e) => {
            e.preventDefault();
            void act("update");
          }}
        >
          <h2>Activity actions</h2>
          <fieldset disabled={cmd.busy} className="mw-record-body">
            <details className="activity-update"><summary>Update follow-up</summary>
            <div className="form-grid">
              <Field
                name="activity-summary"
                label="Purpose / summary"
                value={summary}
                onChange={setSummary}
                required
                multiline
                maxLength={2000}
              />
              <SelectField
                name="activity-owner"
                label="Owner"
                value={owner}
                onChange={setOwner}
                options={
                  owners.data?.items ?? [
                    { id: a.owner_id, display_name: a.owner_name },
                  ]
                }
                required
              />
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={needed}
                  onChange={(e) => setNeeded(e.target.checked)}
                />{" "}
                Due date still needed
              </label>
              {!needed && (
                <LocalDateTimeField
                  name="activity-due"
                  // An appointment's start is rescheduled from My Work; here its planned end can move.
                  label={a.starts_at ? "Planned end" : "Due date and time"}
                  value={due}
                  onChange={setDue}
                  required
                />
              )}
            </div>
            <ReadState
              loading={owners.loading}
              error={owners.error}
              retry={owners.reload}
            />
            <div className="actions">
              <button type="submit">Save activity</button>
              {a.can_complete && a.status === "Open" && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void act("start")}
                >
                  Start activity
                </button>
              )}
            </div>
            </details>
              <Field
                name="activity-reason"
                label="Reason for change"
                value={reason}
                onChange={setReason}
                required
                maxLength={1000}
              />
            {a.can_complete && (
              <>
                <Field
                  name="activity-outcome"
                  label="Completion outcome or cancellation reason"
                  value={outcome}
                  onChange={setOutcome}
                  multiline
                  maxLength={10000}
                />
                <div className="actions">
                  <button type="button" onClick={() => void act("complete")}>
                    Complete with outcome
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => void act("cancel")}
                  >
                    Cancel with reason
                  </button>
                </div>
              </>
            )}
          </fieldset>
        </form>
      )}
      {expected !== a.version && (
        <section className="conflict-panel">
          <h2>A newer version is available</h2>
          <p>
            Your proposed entries remain above. Current version: {a.version};
            current purpose: {a.summary}.
          </p>
          <button
            className="secondary"
            onClick={() => {
              setExpected(a.version);
              cmd.clear();
            }}
          >
            Use current version with my entries
          </button>
        </section>
      )}
      {["Completed", "Cancelled"].includes(a.status) && a.links.filter(l => l.object_type === "Lead").map(l => <p key={l.object_id}><Link href={`/sales/leads/${l.object_id}`}>Return to lead and plan follow-up</Link></p>)}
      {["Completed", "Cancelled"].includes(a.status) && a.links.filter(l => l.object_type === "Opportunity").map(l =>
        <p key={l.object_id}><Link className="button" href={`/sales/opportunities/${l.object_id}`}>Return to opportunity and plan follow-up</Link></p>)}
      <button className="secondary" onClick={reload}>
        Compare current saved version
      </button>
    </>
  );
}
export function ActivityCreate({
  initial = {},
}: {
  initial?: Record<string, string>;
}) {
  const p = useIdentity(),
    router = useRouter(),
    cmd = useCommand();
  // The working company is filled in until the person chooses one; it never widens access, and the
  // server rechecks every link, owner and access class on save.
  // As in the header: the chosen working company, or the only company the person's grants reach.
  const shellContext = useShell().context,
    working = shellContext?.working_company_id ?? (shellContext?.companies?.length === 1 ? shellContext.companies[0].id : null);
  const [chosenCompany, setCompany] = useState<string | null>(initial.company ?? null),
    company = chosenCompany ?? working ?? "",
    prefilled = chosenCompany === null && !!working,
    [kind, setKind] = useState(kinds.includes(initial.kind) ? initial.kind : "TechnicalFollowUp"),
    [type, setType] = useState(initial.type ?? "Site"),
    [target, setTarget] = useState(initial.id ?? ""),
    [summary, setSummary] = useState(""),
    [owner, setOwner] = useState(p.actor_id),
    [needed, setNeeded] = useState(true),
    [due, setDue] = useState(""),
    [access, setAccess] = useState(initial.access === "Internal" ? "Internal" : "RestrictedService"),
    [recordId] = useState(() => crypto.randomUUID());
  const companies = useResource<Envelope<Option>>("selectors/companies"),
    path = (
      {
        Organisation: "customers",
        Site: "sites",
        Asset: "assets",
        Ticket: "service/tickets",
        Project: "projects",
      } as Record<string, string>
    )[type];
  const records = useResource<
    Envelope<
      Option & { company_id?: string; site_id?: string; summary?: string; title?: string }
    >
  >(company && path ? type === "Project" ? `projects?q=${encodeURIComponent(target || initial.id || "")}&limit=100` : `${path}?company_id=${company}&limit=200` : null);
  const selected = records.data?.items.find((o) => o.id === target),
    site = type === "Site" ? target : (selected?.site_id ?? initial.site ?? "");
  const owners = useResource<Envelope<Option>>(
    company
      ? `selectors/owners?${new URLSearchParams({ company_id: company, ...(site ? { site_id: site } : {}), purpose: "Activity", access_class: access })}`
      : null,
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await cmd.send<{ record_id: string }>("activities", {
      id: recordId,
      company_id: company,
      site_id: site || null,
      kind,
      owner_id: owner,
      summary,
      due_needed: needed,
      due_at: needed ? null : due || null,
      access_class: access,
      links: [{ object_type: type, object_id: target }],
      reason: "Create owned synthetic follow-up",
    });
    if (result) router.push(`/work/${result.record_id}`);
  }
  return (
    <div className="mw-page mw-record-page">
      <form className="mw-panel mw-record-form" onSubmit={submit} aria-labelledby="new-activity-title">
        <header className="mw-record-head">
          <h1 id="new-activity-title">New activity</h1>
          <p>
            Give the next action an owner and a date. Fields marked <span aria-hidden="true">*</span>
            <span className="mw-sr">with an asterisk</span> are required.
          </p>
        </header>
        <ErrorNotice error={cmd.error} />
        <fieldset disabled={cmd.busy} className="mw-record-body">
          <Field name="follow-summary" label="What needs doing?" value={summary} onChange={setSummary} required multiline maxLength={2000} />
          <div className="mw-form-grid">
            <SelectField
              name="follow-kind"
              label="Category"
              value={kind}
              options={kinds.map((k) => ({ id: k, display_name: kindLabels[k] }))}
              onChange={(v) => {
                setKind(v);
                if (v === "FinanceQuery") setAccess("RestrictedFinance");
              }}
              required
            />
            <SelectField name="follow-owner" label="Owner" value={owner} onChange={setOwner} options={(owners.data?.items ?? []).map((o) => (o.id === p.actor_id ? { ...o, display_name: `${o.display_name ?? o.id} (you)` } : o))} empty={company ? "Choose…" : "Choose a company first"} required />
            <div className="mw-check mw-form-wide">
              <input id="follow-due-needed" type="checkbox" checked={needed} onChange={(e) => setNeeded(e.target.checked)} aria-describedby="follow-due-needed-hint" />
              <label htmlFor="follow-due-needed">No due date yet</label>
              <small id="follow-due-needed-hint">It appears under &quot;Date needed&quot; until you set one.</small>
            </div>
            {!needed && <LocalDateTimeField name="follow-due" label="Due date and time" value={due} onChange={setDue} required />}
          </div>
          <fieldset className="mw-form-group">
            <legend>Linked to</legend>
            <div className="mw-form-grid">
              <SelectField
                name="follow-type"
                label="Record type"
                value={type}
                options={linkTypes.map((t) => ({ id: t, display_name: linkTypeLabels[t] }))}
                onChange={(v) => {
                  setType(v);
                  setTarget("");
                }}
                required
              />
              <SelectField
                name="follow-target"
                label="Linked record"
                value={target}
                onChange={setTarget}
                options={(records.data?.items ?? []).filter((o) => !o.company_id || o.company_id === company).map((o) => ({
                  ...o,
                  display_name: o.display_name ?? o.description ?? o.summary ?? o.title,
                }))}
                empty={company ? "Choose…" : "Choose a company first"}
                required
              />
            </div>
            {records.data?.next_cursor && <p className="mw-form-note">Not listed? Open the record and add the activity from there.</p>}
          </fieldset>
          <fieldset className="mw-form-group">
            <legend>Who can see it</legend>
            <div className="mw-form-grid">
              <div>
                <SelectField
                  name="follow-company"
                  label="Company"
                  value={company}
                  onChange={(v) => {
                    setCompany(v);
                    setTarget("");
                  }}
                  options={companies.data?.items ?? []}
                  required
                />
                {prefilled && <p className="mw-form-note">{shellContext?.working_company_id ? "Your working company is filled in for you." : "Your company is filled in for you."}</p>}
              </div>
              <div>
                <SelectField
                  name="follow-access"
                  label="Who can read the details"
                  value={access}
                  options={accessClasses.map((a) => ({ id: a, display_name: accessLabels[a] }))}
                  onChange={setAccess}
                  required
                />
                <p className="mw-form-note">Choose who can read the purpose and notes.</p>
              </div>
            </div>
          </fieldset>
          {[companies, records, owners].map((r, i) => (
            <ReadState key={i} loading={r.loading} error={r.error} retry={r.reload} />
          ))}
          <div className="mw-form-actions">
            <button type="submit" className="mw-button mw-button-primary">
              Create activity
            </button>
            {/* Cancel returns to where the person came from, such as a customer or equipment record. */}
            <button type="button" className="mw-button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/work/actions"))}>
              Cancel
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
