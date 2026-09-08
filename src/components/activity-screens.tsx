"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocalDateTimeField, useUnsavedChanges } from "./record-ui";
import type { readActivity } from "../activities/activities";
import { useIdentity } from "./business-session";
import {
  EnumField,
  ErrorNotice,
  isDenied,
  Field,
  Observed,
  PageHeader,
  ReadState,
  RecordLink,
  SelectField,
  Stamp,
  Status,
  SummaryPair,
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
const states = ["Active", "Open", "InProgress", "Completed", "Cancelled"];
export function WorkList() {
  const p = useIdentity(),
    [filters, setFilters] = useState({
      owner_id: p.actor_id,
      status: "Active",
      kind: "",
      due: "",
      q: "",
    }),
    [cursor, setCursor] = useState("");
  const query = new URLSearchParams(
    Object.entries({ ...filters, cursor }).filter(([, v]) => !!v),
  );
  const r = useResource<Envelope<Activity>>(`work?${query}`);
  const update = (k: string, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setCursor("");
  };
  return (
    <>
      <PageHeader
        eyebrow="SC-01 / My Work"
        title="Owned follow-up"
        description="Questions, customer contact and next actions with a clear owner."
        action={
          <Link className="button" href="/work/new">
            New activity
          </Link>
        }
      />
      <div className="filters">
        <Field
          name="work-search"
          label="Search activities"
          value={filters.q}
          onChange={(v) => update("q", v)}
        />
        <EnumField
          name="work-status"
          label="Status"
          value={filters.status}
          values={states}
          onChange={(v) => update("status", v)}
        />
        <EnumField
          name="work-kind"
          label="Type"
          value={filters.kind}
          values={kinds}
          onChange={(v) => update("kind", v)}
        />
        <EnumField
          name="work-due"
          label="Due date"
          value={filters.due}
          values={["Overdue", "Upcoming", "Needed"]}
          onChange={(v) => update("due", v)}
        />
        <SelectField
          name="work-owner"
          label="Owner"
          value={filters.owner_id}
          empty="All permitted owners"
          options={[{ id: p.actor_id, display_name: "My activities" }]}
          onChange={(v) => update("owner_id", v)}
        />
      </div>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.error && (
        <>
          <Observed envelope={r.data} />
          {r.data.items.length === 0 ? (
            <p className="empty-state">
              No permitted activities match these filters.
            </p>
          ) : (
            <div className="work-groups">
              {[
                "Overdue",
                "Upcoming",
                "Due date needed",
                "Completed or cancelled",
              ].map((group) => {
                const rows = r.data!.items.filter((a) =>
                  ["Completed", "Cancelled"].includes(a.status)
                    ? group === "Completed or cancelled"
                    : a.due_needed
                      ? group === "Due date needed"
                      : Date.parse(a.due_at!) < Date.parse(r.data!.observed_at)
                        ? group === "Overdue"
                        : group === "Upcoming",
                );
                return (
                  rows.length > 0 && (
                    <section key={group}>
                      <h2>{group}</h2>
                      <div className="record-grid">
                        {rows.map((a) => (
                          <article className="record-card" key={a.id}>
                            <div className="card-top">
                              <Status value={a.status} />
                              <span>
                                {a.kind.replace(/([a-z])([A-Z])/g, "$1 $2")}
                              </span>
                            </div>
                            <h3>
                              <Link href={`/work/${a.id}`}>{a.summary}</Link>
                            </h3>
                            <p>Owner: {a.owner_name}</p>
                            <p>
                              {a.due_needed ? (
                                "Due date needed"
                              ) : (
                                <>
                                  Due <Stamp value={a.due_at} />
                                </>
                              )}
                            </p>
                            {a.outcome && (
                              <p className="narrative">Outcome: {a.outcome}</p>
                            )}
                            {a.cancellation_reason && (
                              <p>Cancellation: {a.cancellation_reason}</p>
                            )}
                            <div className="related-links">
                              {a.links.map((l) => (
                                <RecordLink
                                  key={`${l.object_type}:${l.object_id}`}
                                  type={l.object_type}
                                  id={l.object_id}
                                >
                                  {l.display_number ?? l.label}
                                </RecordLink>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )
                );
              })}
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
              Refresh activities
            </button>
          </div>
        </>
      )}
    </>
  );
}
export function ActivityDetail({ id }: { id: string }) {
  const r = useResource<Envelope<Activity>>(`activities/${id}`);
  return (
    <>
      <Link href="/work">← My Work</Link>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {!isDenied(r.error) && r.data?.items[0] && (
        <ActivityEditor key={id} activity={r.data.items[0]} reload={r.reload} />
      )}
    </>
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
    return <ErrorNotice error={isDenied(cmd.error) ? cmd.error : owners.error} />;
  return (
    <>
      <PageHeader eyebrow="SC-01 / Activity" title={a.summary} />
      <div className="record-banner">
        <Status value={a.status} />
        <span>Owner: {a.owner_name}</span>
        <span>Version {a.version}</span>
      </div>
      <dl className="context-grid">
        <SummaryPair label="Purpose">
          {a.kind.replace(/([a-z])([A-Z])/g, "$1 $2")}
        </SummaryPair>
        <SummaryPair label="Due">
          {a.due_needed ? (
            "Due date needed"
          ) : (
            <>
              <Stamp value={a.due_at} /> (Australia/Brisbane)
            </>
          )}
        </SummaryPair>
        <SummaryPair label="Outcome">
          <span className="narrative">
            {a.outcome ?? a.cancellation_reason ?? "Not completed"}
          </span>
        </SummaryPair>
      </dl>
      <div className="related-links">
        {a.links.map((l) => (
          <RecordLink key={l.object_id} type={l.object_type} id={l.object_id}>
            {l.display_number ?? l.label}
          </RecordLink>
        ))}
      </div>
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
          className="form-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void act("update");
          }}
        >
          <h2>Activity actions</h2>
          <fieldset disabled={cmd.busy}>
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
      {["Completed", "Cancelled"].includes(a.status) && a.links.filter(l => l.object_type === "Opportunity").map(l =>
        <p key={l.object_id}><Link className="button" href={`/crm/opportunities/${l.object_id}`}>Return to opportunity and plan follow-up</Link></p>)}
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
  const [company, setCompany] = useState(initial.company ?? ""),
    [kind, setKind] = useState("TechnicalFollowUp"),
    [type, setType] = useState(initial.type ?? "Site"),
    [target, setTarget] = useState(initial.id ?? ""),
    [summary, setSummary] = useState(""),
    [owner, setOwner] = useState(p.actor_id),
    [needed, setNeeded] = useState(true),
    [due, setDue] = useState(""),
    [access, setAccess] = useState("RestrictedService"),
    [recordId] = useState(() => crypto.randomUUID());
  const companies = useResource<Envelope<Option>>("selectors/companies"),
    path = (
      {
        Organisation: "customers",
        Site: "sites",
        Asset: "assets",
        Ticket: "service/tickets",
      } as Record<string, string>
    )[type];
  const records = useResource<
    Envelope<
      Option & { company_id?: string; site_id?: string; summary?: string }
    >
  >(company ? `${path}?company_id=${company}&limit=200` : null);
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
    <>
      <Link href="/work">← My Work</Link>
      <PageHeader
        eyebrow="SC-01 / New activity"
        title="Give the next action an owner"
      />
      <ErrorNotice error={cmd.error} />
      <form className="form-panel" onSubmit={submit}>
        <fieldset disabled={cmd.busy}>
          <div className="form-grid">
            <SelectField
              name="follow-company"
              label="Company visibility context"
              value={company}
              onChange={(v) => {
                setCompany(v);
                setTarget("");
              }}
              options={companies.data?.items ?? []}
              required
            />
            <EnumField
              name="follow-type"
              label="Linked record type"
              value={type}
              values={["Organisation", "Site", "Asset", "Ticket"]}
              onChange={(v) => {
                setType(v);
                setTarget("");
              }}
            />
            <SelectField
              name="follow-target"
              label="Linked record"
              value={target}
              onChange={setTarget}
              options={(records.data?.items ?? []).map((o) => ({
                ...o,
                display_name: o.display_name ?? o.description ?? o.summary,
              }))}
              required
            />
            <EnumField
              name="follow-kind"
              label="Activity category"
              value={kind}
              values={kinds}
              onChange={(v) => {
                setKind(v);
                if (v === "FinanceQuery") setAccess("RestrictedFinance");
              }}
            />
            <EnumField
              name="follow-access"
              label="Content access"
              value={access}
              values={["RestrictedService", "Internal", "RestrictedFinance"]}
              onChange={setAccess}
            />
            <SelectField
              name="follow-owner"
              label="Owner"
              value={owner}
              onChange={setOwner}
              options={owners.data?.items ?? []}
              required
            />
            <Field
              name="follow-summary"
              label="Purpose / summary"
              value={summary}
              onChange={setSummary}
              required
              multiline
              maxLength={2000}
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
              <Field
                name="follow-due"
                label="Due instant (UTC)"
                type="datetime-local"
                value={due}
                onChange={setDue}
                required
              />
            )}
          </div>
          {[companies, records, owners].map((r, i) => (
            <ReadState
              key={i}
              loading={r.loading}
              error={r.error}
              retry={r.reload}
            />
          ))}
          {records.data?.next_cursor && (
            <p>
              Narrow the linked record through its detail page to find records
              beyond this selector page.
            </p>
          )}
          <button type="submit">Create activity</button>
        </fieldset>
      </form>
    </>
  );
}
