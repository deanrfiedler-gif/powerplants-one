"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { readIntake } from "../service/intake";
import { useIdentity } from "./business-session";
import {
  EnumField,
  ErrorNotice,
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
type Intake = Awaited<ReturnType<typeof readIntake>>;
type TicketRow = {
  id: string;
  display_number: string;
  summary: string;
  status: string;
  priority: string;
  version: number;
  site_identification_needed: boolean;
  received_time_basis: string;
};
export function TicketList() {
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [cursor, setCursor] = useState("");
  const r = useResource<Envelope<TicketRow>>(
    `service/tickets?${new URLSearchParams({ q, ...(status ? { status } : {}), ...(cursor ? { cursor } : {}) })}`,
  );
  return (
    <>
      <PageHeader
        eyebrow="SC-04 / Service intake"
        title="Service requests"
        description="Capture the issue, clarify what is unknown and prepare it for a separate work-scope decision."
        action={
          <Link className="button" href="/service/tickets/new">
            New service request
          </Link>
        }
      />
      <div className="filters">
        <Field
          name="ticket-search"
          label="Search service requests"
          value={q}
          onChange={(v) => {
            setQ(v);
            setCursor("");
          }}
        />
        <EnumField
          name="ticket-status"
          label="Status"
          value={status}
          values={["New", "NeedsInformation", "Triaged"]}
          onChange={(v) => {
            setStatus(v);
            setCursor("");
          }}
        />
      </div>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && (
        <>
          <Observed envelope={r.data} />
          {r.data.items.length === 0 ? (
            <p className="empty-state">
              No permitted service requests match these filters.
            </p>
          ) : (
            <div className="record-grid">
              {r.data.items.map((t) => (
                <article key={t.id} className="record-card">
                  <p className="eyebrow">{t.display_number}</p>
                  <h2>
                    <Link href={`/service/tickets/${t.id}`}>{t.summary}</Link>
                  </h2>
                  <div className="card-top">
                    <Status value={t.status} />
                    <Status value={t.priority} />
                  </div>
                  {t.site_identification_needed && (
                    <p>Site identification needed</p>
                  )}
                  {t.received_time_basis === "LegacyUnverified" && (
                    <p>Legacy received time needs confirmation</p>
                  )}
                  <small>
                    Intake does not authorise work or confirm a booking.
                  </small>
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
              Refresh requests
            </button>
          </div>
        </>
      )}
    </>
  );
}
export function TicketCreate({ siteId }: { siteId?: string }) {
  const r = useResource<Envelope<Option & { company_id: string }>>(
    siteId ? `sites/${siteId}` : null,
  );
  return (
    <>
      <Link href="/service/tickets">← Service requests</Link>
      <PageHeader
        eyebrow="SC-04 / New intake"
        title="Record a service request"
      />
      <p className="scope-note">
        An incomplete request can be saved with an owner and explicit unknowns.
        Urgent priority is not work authorisation or a booking.
      </p>
      {siteId && (
        <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      )}{" "}
      {(!siteId || r.data) && (
        <IntakeForm
          initialSite={siteId}
          initialCompany={r.data?.items[0].company_id}
        />
      )}
    </>
  );
}
export function TicketDetail({ id }: { id: string }) {
  const r = useResource<Envelope<Intake>>(`service/tickets/${id}`),
    t = r.data?.items[0];
  return (
    <>
      <Link href="/service/tickets">← Service requests</Link>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {t && (
        <>
          <PageHeader
            eyebrow={`SC-04 / ${t.display_number}`}
            title={t.summary}
          />
          <div className="record-banner">
            <Status value={t.status} />
            <Status value={t.priority} />
            <span>Owner: {t.owner_name}</span>
            <span>Version {t.version}</span>
          </div>
          <p className="scope-note">
            Triage records the intake assessment. Work authorisation, coverage,
            readiness and booking are separate later decisions.
          </p>
          <dl className="context-grid">
            <SummaryPair label="Received">
              <Stamp value={t.received_at} /> ·{" "}
              {t.received_time_basis === "LegacyUnverified"
                ? "Retained legacy time — unverified"
                : "User-reported time"}
            </SummaryPair>
            <SummaryPair label="Channel">{t.channel}</SummaryPair>
            <SummaryPair label="Requester">
              {t.requester_id ? (
                <RecordLink type="Person" id={t.requester_id}>
                  Open requester contact
                </RecordLink>
              ) : (
                t.requester_description
              )}
            </SummaryPair>
            <SummaryPair label="Site">
              {t.site_id ? (
                <RecordLink type="Site" id={t.site_id}>
                  Open site context
                </RecordLink>
              ) : (
                "Site identification needed"
              )}
            </SummaryPair>
            <SummaryPair label="Reported symptoms">
              <span className="narrative">{t.symptom}</span>
            </SummaryPair>
            <SummaryPair label="Impact">{t.impact ?? "Unknown"}</SummaryPair>
            <SummaryPair label="Priority rationale">
              {t.priority_reason ?? "Unknown"}
            </SummaryPair>
            <SummaryPair label="Next action">
              {t.next_action ?? "Unknown — legacy intake needs review"}
            </SummaryPair>
          </dl>
          {t.asset_id && (
            <p>
              <RecordLink type="Asset" id={t.asset_id}>
                Open equipment identity, configuration and original history
              </RecordLink>
            </p>
          )}
          {t.open_questions && (
            <section className="detail-section">
              <h2>Clarification questions</h2>
              <p className="narrative">{t.open_questions}</p>
              {t.clarification_outcome && (
                <p>Resolution: {t.clarification_outcome}</p>
              )}
            </section>
          )}
          {t.clarification_activity && (
            <section className="detail-section">
              <h2>Owned clarification</h2>
              <Link href={`/work/${t.clarification_activity.id}`}>
                {t.clarification_activity.summary}
              </Link>
              <p>
                {t.clarification_activity.owner_name} ·{" "}
                <Status value={t.clarification_activity.status} />
              </p>
            </section>
          )}
          {t.clarification_unavailable && (
            <p>
              The linked clarification is outside this identity's activity
              access. No question or outcome details are disclosed.
            </p>
          )}
          {t.can_edit_intake && (
            <>
              <IntakeForm key={id} ticket={t} reload={r.reload} />
              <TriageActions
                key={`triage:${id}`}
                ticket={t}
                reload={r.reload}
              />
            </>
          )}
          <button className="secondary" onClick={r.reload}>
            Compare current saved version
          </button>
        </>
      )}
    </>
  );
}
function IntakeForm({
  ticket: t,
  initialSite,
  initialCompany,
  reload,
}: {
  ticket?: Intake;
  initialSite?: string;
  initialCompany?: string;
  reload?: () => void;
}) {
  const p = useIdentity(),
    router = useRouter(),
    cmd = useCommand(),
    [id] = useState(() => t?.id ?? crypto.randomUUID()),
    [expected, setExpected] = useState(t?.version ?? 1);
  const [v, setV] = useState<Record<string, string>>({
    company: t?.company_id ?? initialCompany ?? "",
    site: t?.site_id ?? initialSite ?? "",
    requester: t?.requester_id ?? "",
    requester_description: t?.requester_description ?? "",
    asset: t?.asset_id ?? "",
    received:
      t?.received_at.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
    channel: t?.channel ?? "Manual",
    summary: t?.summary ?? "",
    symptom: t?.symptom ?? "",
    impact: t?.impact ?? "",
    priority: t?.priority ?? "Normal",
    priority_reason: t?.priority_reason ?? "",
    owner: t?.triage_owner_id ?? p.actor_id,
    next_action: t?.next_action ?? "",
    reason: "",
  });
  const set = (k: string, value: string) => setV((s) => ({ ...s, [k]: value }));
  const companies = useResource<Envelope<Option>>("selectors/companies"),
    sites = useResource<Envelope<Option>>(
      v.company ? `sites?company_id=${v.company}&limit=200` : null,
    ),
    people = useResource<Envelope<Option>>("people?limit=200"),
    assets = useResource<Envelope<Option>>(
      v.site ? `assets?site_id=${v.site}&limit=200` : null,
    ),
    owners = useResource<Envelope<Option>>(
      v.company
        ? `selectors/owners?${new URLSearchParams({ company_id: v.company, ...(v.site ? { site_id: v.site } : {}), purpose: "Ticket" })}`
        : null,
    );
  const field = (
    k: string,
    label: string,
    required = false,
    multiline = false,
    max = 200,
    type = "text",
  ) => (
    <Field
      key={k}
      name={`intake-${k}`}
      label={label}
      value={v[k]}
      onChange={(value) => set(k, value)}
      required={required}
      multiline={multiline}
      maxLength={max}
      type={type}
    />
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = {
      received_at: v.received ? `${v.received}:00Z` : null,
      channel: v.channel,
      requester_id: v.requester || null,
      requester_description: v.requester_description || null,
      site_id: v.site || null,
      site_identification_needed: !v.site,
      asset_id: v.asset || null,
      summary: v.summary,
      symptom: v.symptom,
      impact: v.impact || null,
      priority: v.priority,
      priority_reason: v.priority_reason || null,
      triage_owner_id: v.owner,
      next_action: v.next_action,
      reason: v.reason,
    };
    const result = await cmd.send<{
      record_id: string;
      record_version: number;
    }>(
      t ? `service/tickets/${id}/save-intake` : "service/tickets",
      t
        ? { ...fields, expected_version: expected }
        : { ...fields, id, company_id: v.company },
    );
    if (result) {
      setExpected(result.record_version);
      if (t) reload?.();
      else router.push(`/service/tickets/${result.record_id}`);
    }
  }
  return (
    <section className="detail-section">
      <h2>{t ? "Edit intake details" : "Intake details"}</h2>
      <ErrorNotice error={cmd.error} />
      <p role="status">{cmd.saved}</p>
      <form className="form-panel" onSubmit={submit}>
        <fieldset disabled={cmd.busy}>
          <div className="form-grid">
            {!t && (
              <SelectField
                name="intake-company"
                label="Company visibility context"
                value={v.company}
                options={companies.data?.items ?? []}
                onChange={(value) => {
                  set("company", value);
                  set("site", "");
                  set("asset", "");
                }}
                required
              />
            )}
            {field(
              "received",
              "Received time (UTC)",
              true,
              false,
              200,
              "datetime-local",
            )}
            <EnumField
              name="intake-channel"
              label="Received channel"
              value={v.channel}
              values={[
                "Phone",
                "Email",
                "Manual",
                "PlannedMaintenance",
                "Other",
              ]}
              onChange={(value) => set("channel", value)}
            />
            <SelectField
              name="intake-requester"
              label="Known requester"
              value={v.requester}
              options={people.data?.items ?? []}
              onChange={(value) => set("requester", value)}
              empty="Unknown — describe below"
            />
            {field(
              "requester_description",
              "Requester description / clarification",
              !v.requester,
              true,
              2000,
            )}
            <SelectField
              name="intake-site"
              label="Known site"
              value={v.site}
              options={sites.data?.items ?? []}
              onChange={(value) => {
                set("site", value);
                set("asset", "");
              }}
              empty="Unknown — identification needed"
            />
            {v.site && (
              <SelectField
                name="intake-asset"
                label="Equipment, if identified"
                value={v.asset}
                options={assets.data?.items ?? []}
                onChange={(value) => set("asset", value)}
                empty="No equipment link yet"
              />
            )}
            {field("summary", "Request summary", true)}
            {field(
              "symptom",
              "Reported symptoms / explicit symptom uncertainty",
              true,
              true,
              10000,
            )}
            {field("impact", "Operational impact", false, true, 2000)}
            <EnumField
              name="intake-priority"
              label="Priority"
              value={v.priority}
              values={["Low", "Normal", "High", "Urgent"]}
              onChange={(value) => set("priority", value)}
            />
            {field("priority_reason", "Priority rationale", false, true, 2000)}
            <SelectField
              name="intake-owner"
              label="Triage and next-action owner"
              value={v.owner}
              options={owners.data?.items ?? []}
              onChange={(value) => set("owner", value)}
              required
            />
            {field("next_action", "Next action", true, true, 2000)}
            {field("reason", "Reason for saving", true, false, 1000)}
          </div>
          <button type="submit">
            {cmd.busy
              ? "Saving…"
              : t
                ? "Save intake details"
                : "Save service request"}
          </button>
        </fieldset>
      </form>
      {[companies, sites, people, assets, owners].map((r, i) => (
        <ReadState
          key={i}
          loading={r.loading}
          error={r.error}
          retry={r.reload}
        />
      ))}
      {t && expected !== t.version && (
        <section className="conflict-panel">
          <h3>Compare before resubmitting</h3>
          <p>
            Your proposal remains above. Current saved version {t.version}:{" "}
            {t.summary}. Symptoms: {t.symptom}
          </p>
          <button
            className="secondary"
            onClick={() => {
              setExpected(t.version);
              cmd.clear();
            }}
          >
            Use current version with my entries
          </button>
        </section>
      )}
    </section>
  );
}
function TriageActions({
  ticket: t,
  reload,
}: {
  ticket: Intake;
  reload: () => void;
}) {
  const cmd = useCommand(),
    p = useIdentity(),
    [questions, setQuestions] = useState(""),
    [next, setNext] = useState(t.next_action ?? ""),
    [owner, setOwner] = useState(p.actor_id),
    [needed, setNeeded] = useState(true),
    [due, setDue] = useState(""),
    [reason, setReason] = useState(""),
    [outcome, setOutcome] = useState(""),
    [activityId] = useState(() => crypto.randomUUID());
  const owners = useResource<Envelope<Option>>(
    `selectors/owners?${new URLSearchParams({ company_id: t.company_id, ...(t.site_id ? { site_id: t.site_id } : {}), purpose: "Activity", access_class: "RestrictedService", ticket_id: t.id })}`,
  );
  async function information() {
    const result = await cmd.send(
      `service/tickets/${t.id}/request-information`,
      {
        expected_version: t.version,
        reason,
        open_questions: questions,
        next_action: next,
        follow_up: {
          id: activityId,
          owner_id: owner,
          due_needed: needed,
          due_at: needed ? null : due ? `${due}:00Z` : null,
        },
      },
    );
    if (result) reload();
  }
  async function triage() {
    const result = await cmd.send(`service/tickets/${t.id}/triage`, {
      expected_version: t.version,
      reason,
      clarification_outcome: outcome || null,
    });
    if (result) reload();
  }
  return (
    <section className="detail-section">
      <h2>Triage assessment</h2>
      {t.triage_blockers.length ? (
        <div className="blocker-panel">
          <h3>Before triage</h3>
          <ul>
            {t.triage_blockers.map((b) => (
              <li key={b.field}>{b.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>
          Saved intake fields are complete for triage. Later work-authorisation
          checks still apply.
        </p>
      )}
      <ErrorNotice error={cmd.error} />
      <p role="status">{cmd.saved}</p>
      <fieldset disabled={cmd.busy}>
        <Field
          name="triage-reason"
          label="Reason for this triage action"
          value={reason}
          onChange={setReason}
          maxLength={1000}
        />
        {t.status === "New" && (
          <details className="form-panel">
            <summary>Request information with owned follow-up</summary>
            <Field
              name="triage-questions"
              label="Open clarification questions"
              value={questions}
              onChange={setQuestions}
              multiline
              maxLength={4000}
            />
            <Field
              name="triage-next"
              label="Next action for triage owner"
              value={next}
              onChange={setNext}
              multiline
              maxLength={2000}
            />
            <SelectField
              name="triage-follow-owner"
              label="Clarification activity owner"
              value={owner}
              onChange={setOwner}
              options={owners.data?.items ?? []}
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
                name="triage-due"
                label="Follow-up due instant (UTC)"
                type="datetime-local"
                value={due}
                onChange={setDue}
              />
            )}
            <ReadState
              loading={owners.loading}
              error={owners.error}
              retry={owners.reload}
            />
            <button onClick={() => void information()}>
              Request information
            </button>
          </details>
        )}
        {t.status === "NeedsInformation" && (
          <Field
            name="triage-outcome"
            label="How the clarification questions were resolved"
            value={outcome}
            onChange={setOutcome}
            multiline
            maxLength={4000}
          />
        )}
        <button onClick={() => void triage()}>Complete triage</button>
      </fieldset>
    </section>
  );
}
