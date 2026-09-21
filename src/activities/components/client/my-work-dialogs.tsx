"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useIdentity } from "../../../components/business-session";
import {
  ErrorNotice,
  friendly,
  isDenied,
  useCommand,
  useResource,
  type Envelope,
  type Option,
} from "../../../components/business-ui";
import type { PlannableParent } from "../../../crm/planning-gaps";
import type { ActivityHistoryEvent, readActivity } from "../../activities";
import type { readWorkConflicts, WorkRow } from "../../work-overview";
import {
  activityTypeLabels,
  agendaDayLabel,
  clockTime,
  localDay,
  shortDate,
  timing,
  whenText,
  WORK_TIMEZONE,
  type ActivityType,
} from "../../work-view";
import {
  defaultModeFor,
  sameTiming,
  TimingFields,
  timingFrom,
  timingPayload,
  TypeField,
  type TimingState,
} from "./my-work-forms";
import { Icon, Tag, WorkDialog, type IconName } from "./my-work-ui";

type Activity = Awaited<ReturnType<typeof readActivity>>;
type Conflicts = Awaited<ReturnType<typeof readWorkConflicts>>;

export const typeIcons: Record<ActivityType, IconName> = {
  Task: "task",
  Call: "phone",
  Email: "mail",
  Meeting: "video",
  SiteVisit: "pin",
};
export function recordHref(linked: { type: WorkRow["linked"]["type"] | "Project"; id: string | null }) {
  if(linked.type === "Project") return `/projects/${linked.id}`;
  const root = {
    Lead: "/sales/leads",
    Opportunity: "/sales/opportunities",
    Ticket: "/service/tickets",
    Asset: "/equipment",
    Site: "/sites",
    Organisation: "/customers",
  }[linked.type];
  return `${root}/${linked.id}`;
}
export function contextLine(row: WorkRow) {
  const l = row.linked;
  const second = l.type === "Lead" ? l.contact_name : l.type === "Organisation" ? l.reference : l.title;
  return [l.organisation_name ?? (l.type === "Lead" ? l.title : null), second].filter(Boolean) as string[];
}
const stamp = (iso: string) => `${shortDate(iso, WORK_TIMEZONE)}, ${clockTime(iso, WORK_TIMEZONE)}`;

// ───────────────────────── Activity details ─────────────────────────
const historyLabels: Record<string, string> = {
  CreateActivity: "Created",
  UpdateActivity: "Updated",
  StartActivity: "Started",
  CompleteActivity: "Completed with an outcome",
  CancelActivity: "Cancelled",
  PlanOpportunityAction: "Planned as the opportunity's next action",
  PlanLeadAction: "Planned as the lead's next action",
};
export function ActivityDrawer({
  row,
  now,
  onClose,
  onComplete,
  onReschedule,
}: {
  row: WorkRow;
  now: string;
  onClose: () => void;
  onComplete: () => void;
  onReschedule: () => void;
}) {
  const detail = useResource<Envelope<Activity>>(`activities/${row.id}`),
    history = useResource<Envelope<ActivityHistoryEvent> & { owners: Record<string, string> }>(`activities/${row.id}/history`);
  const a = detail.data?.items[0];
  const t = timing(row, now);
  const l = row.linked;
  return (
    <WorkDialog
      drawer
      title={row.summary}
      subtitle={`${activityTypeLabels[row.activity_type]} · ${friendly(row.kind)}`}
      onClose={onClose}
      footer={
        <>
          <Link className="mw-link" href={`/work/${row.id}`}>
            Open full activity page
          </Link>
          <span className="mw-spacer" />
          {row.can_edit && (
            <button type="button" className="mw-button mw-button-quiet" onClick={onReschedule}>
              <Icon name="calendar" />
              {row.due_needed ? "Set date" : "Reschedule"}
            </button>
          )}
          {row.can_complete && (
            <button type="button" className="mw-button mw-button-primary" onClick={onComplete}>
              <Icon name="check" />
              Complete
            </button>
          )}
        </>
      }
    >
      <dl className="mw-facts">
        <div>
          <dt>When</dt>
          <dd>
            {whenText(row)}
            {!row.due_needed && <span className="mw-muted"> · {WORK_TIMEZONE.split("/")[1].replace("_", " ")} time</span>}
            {t.tone === "overdue" && <Tag tone="overdue">Overdue</Tag>}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{friendly(row.status)}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{row.owner_name}</dd>
        </div>
        <div>
          <dt>{l.type === "Organisation" ? "Customer" : friendly(l.type)}</dt>
          <dd>
            <Link className="mw-link" href={recordHref(l)}>
              {[l.reference, l.title].filter(Boolean).join(" · ") || "Open record"}
            </Link>
          </dd>
        </div>
        {l.organisation_name && l.type !== "Organisation" && (
          <div>
            <dt>Customer</dt>
            <dd>{l.organisation_name}</dd>
          </div>
        )}
        {l.contact_name && (
          <div>
            <dt>Contact</dt>
            <dd>{l.contact_name}</dd>
          </div>
        )}
        {row.outcome && (
          <div>
            <dt>Outcome</dt>
            <dd className="mw-narrative">{row.outcome}</dd>
          </div>
        )}
      </dl>
      {(l.contact_phone || l.contact_email) && (
        <section className="mw-section" aria-label="Contact methods">
          <h3>Contact {l.contact_name}</h3>
          <div className="mw-actions">
            {l.contact_phone && (
              <a className="mw-button" href={`tel:${l.contact_phone.replace(/[^\d+]/g, "")}`}>
                <Icon name="phone" />
                Call {l.contact_phone}
              </a>
            )}
            {l.contact_email && (
              <a className="mw-button" href={`mailto:${l.contact_email}`}>
                <Icon name="mail" />
                Email {l.contact_email}
              </a>
            )}
          </div>
          <p className="mw-hint">These open your own phone or mail application. Opening one records nothing here and completes nothing.</p>
        </section>
      )}
      {a && a.links.length > 1 && (
        <section className="mw-section" aria-label="Linked records">
          <h3>Linked records</h3>
          <ul className="mw-plain-list">
            {a.links.map((link) => (
              <li key={`${link.object_type}:${link.object_id}`}>
                <Link className="mw-link" href={recordHref({ type: link.object_type, id: link.object_id })}>
                  {friendly(link.object_type)} · {link.display_number ?? link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mw-section" aria-label="History">
        <h3>History</h3>
        {history.loading && <p role="status">Loading history…</p>}
        {!!history.error && (
          <p className="mw-inline-error" role="alert">
            History could not be loaded.{" "}
            <button type="button" className="mw-link" onClick={history.reload}>
              Try again
            </button>
          </p>
        )}
        {history.data && (
          <ol className="mw-history">
            {history.data.items.map((e) => (
              <li key={e.id}>
                <strong>{historyLabels[e.command] ?? friendly(e.command)}</strong>
                <span>
                  {e.actor_name} · {stamp(e.occurred_at)}
                </span>
                {e.before && e.after && e.before.due_at !== e.after.due_at && e.after.due_at !== undefined && (
                  <span>
                    Timing: {e.before.due_at ? stamp(String(e.before.due_at)) : "no date"} → {e.after.due_at ? stamp(String(e.after.due_at)) : "no date"}
                  </span>
                )}
                {e.before && e.after && e.after.owner_id !== undefined && e.before.owner_id !== e.after.owner_id && (
                  <span>
                    Owner: {history.data!.owners[String(e.before.owner_id)] ?? "previous owner"} → {history.data!.owners[String(e.after.owner_id)] ?? "new owner"}
                  </span>
                )}
                {e.reason && <span className="mw-narrative">{e.reason}</span>}
              </li>
            ))}
            {!history.data.items.length && <li>No recorded changes are visible to you.</li>}
          </ol>
        )}
      </section>
    </WorkDialog>
  );
}

// ───────────────────────── Record outcome ─────────────────────────
// Presets are a quick way to start the outcome text. They are words in the record, not a new
// status, and none of them sends, issues, approves or converts anything.
const outcomePresets: Record<ActivityType, string[]> = {
  Call: ["Spoke with the contact", "No answer", "Left a message"],
  Email: ["Email handled", "Waiting for a reply"],
  Meeting: ["Held as planned", "Did not go ahead"],
  SiteVisit: ["Visit completed", "Visit did not go ahead"],
  Task: ["Done"],
};
type NextStep = { summary: string; type: ActivityType; timing: TimingState };
export function OutcomeDialog({
  row,
  now,
  onClose,
  onChanged,
}: {
  row: WorkRow;
  now: string;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const me = useIdentity();
  const complete = useCommand(),
    plan = useCommand();
  const [preset, setPreset] = useState(""),
    [notes, setNotes] = useState(""),
    [wantNext, setWantNext] = useState(row.linked.type === "Lead" || row.linked.type === "Opportunity"),
    [next, setNext] = useState<NextStep>({ summary: "", type: row.activity_type, timing: timingFrom(null, now) }),
    [local, setLocal] = useState(""),
    [completed, setCompleted] = useState(false);
  const detail = useResource<Envelope<Activity>>(wantNext && !row.linked.can_plan ? `activities/${row.id}` : null);
  const outcome = [preset, notes.trim()].filter(Boolean).join(preset && notes.trim() ? ". " : "");
  const busy = complete.busy || plan.busy;
  const salesParent = row.linked.type === "Lead" || row.linked.type === "Opportunity";

  async function saveNext() {
    const when = timingPayload(next.timing);
    const problem = !next.summary.trim() ? "Give the next activity a title." : when.ok ? "" : when.message;
    setLocal(problem);
    if (problem || !when.ok) return false;
    const action = { id: crypto.randomUUID(), owner_id: me.actor_id, summary: next.summary.trim(), activity_type: next.type, ...when.value };
    if (salesParent && row.linked.can_plan) {
      // Designates the parent's next action through its own command, under its own version check.
      const kind = ["CustomerContact", "RelationshipReview"].includes(row.kind) ? row.kind : "CustomerContact";
      return !!(await plan.send(`crm/${row.linked.type === "Lead" ? "leads" : "opportunities"}/${row.linked.id}/next-action`, {
        expected_version: row.linked.version,
        activity_id: null,
        new_action: { ...action, kind },
        reason: "Plan the next action after recording an outcome in My Work",
      }));
    }
    const source = detail.data?.items[0];
    if (!source) {
      setLocal("The completed activity's links could not be read, so a follow-up cannot be linked yet. Try again.");
      return false;
    }
    return !!(await plan.send("activities", {
      ...action,
      company_id: source.company_id,
      site_id: source.site_id,
      kind: source.kind,
      access_class: source.access_class,
      links: source.links.map((l) => ({ object_type: l.object_type, object_id: l.object_id })),
      reason: "Create a follow-up after recording an outcome in My Work",
    }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!completed) {
      if (!outcome) return setLocal("Record what happened before completing this activity.");
      if (wantNext) {
        // Check the next step before anything is saved, so a fixable mistake never half-completes.
        if (!next.summary.trim()) return setLocal("Give the next activity a title, or choose no further action.");
        const when = timingPayload(next.timing);
        if (!when.ok) return setLocal(when.message);
      }
      setLocal("");
      const saved = await complete.send(`activities/${row.id}/complete`, {
        expected_version: row.version,
        outcome,
        reason: "Record the activity outcome from My Work",
      });
      if (!saved) return;
      setCompleted(true);
      if (!wantNext) {
        onChanged(`Outcome saved for “${row.summary}”.`);
        return onClose();
      }
    }
    if (await saveNext()) {
      onChanged(`Outcome saved for “${row.summary}” and the next activity is planned.`);
      onClose();
    } else onChanged(`Outcome saved for “${row.summary}”. The next activity is not saved yet.`);
  }
  return (
    <WorkDialog
      title={completed ? "Outcome saved — next activity not saved" : "Record outcome"}
      subtitle={[row.summary, ...contextLine(row)].join(" · ")}
      busy={busy}
      dirty={!completed && (!!outcome || !!next.summary)}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="mw-button" onClick={onClose} disabled={busy}>
            {completed ? "Close without a next activity" : "Cancel"}
          </button>
          <button type="submit" form="mw-outcome" className="mw-button mw-button-primary" disabled={busy}>
            {busy ? "Saving…" : completed ? "Retry next activity" : wantNext ? "Save outcome and next activity" : "Save outcome"}
          </button>
        </>
      }
    >
      <form id="mw-outcome" onSubmit={submit} noValidate>
        {completed ? (
          <p className="mw-notice mw-notice-attention" role="status">
            The outcome is saved and this activity is complete. The next activity below was not saved. Your entries are kept: correct them and retry, or close and plan it later.
          </p>
        ) : (
          <>
            <fieldset className="mw-fieldset" disabled={busy}>
              <legend>What happened?</legend>
              <div className="mw-choice-row">
                {outcomePresets[row.activity_type].map((p) => (
                  <label key={p} className="mw-choice">
                    <input type="radio" name="mw-preset" checked={preset === p} onChange={() => setPreset(p)} data-autofocus={p === outcomePresets[row.activity_type][0] || undefined} />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
              <div className="mw-field">
                <label htmlFor="mw-outcome-notes">Notes {preset ? "(optional)" : ""}</label>
                <textarea id="mw-outcome-notes" rows={3} maxLength={9000} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </fieldset>
            <p className="mw-hint">
              Completing records this outcome only. It does not send a message, issue or approve a quotation, move a stage or convert a lead; those stay with their own workflows.
            </p>
          </>
        )}
        <fieldset className="mw-fieldset" disabled={busy}>
          <legend>What happens next?</legend>
          {!completed && (
            <div className="mw-choice-row">
              <label className="mw-choice">
                <input type="radio" name="mw-next" checked={wantNext} onChange={() => setWantNext(true)} />
                <span>Plan the next activity</span>
              </label>
              <label className="mw-choice">
                <input type="radio" name="mw-next" checked={!wantNext} onChange={() => setWantNext(false)} />
                <span>No further action now</span>
              </label>
            </div>
          )}
          {wantNext && (
            <>
              <p className="mw-hint">
                {salesParent && row.linked.can_plan
                  ? `This becomes the next action for ${row.linked.type === "Lead" ? "lead" : "opportunity"} ${row.linked.reference ?? ""}.`
                  : salesParent
                    ? `You do not own this ${row.linked.type.toLowerCase()}, so the follow-up is linked to it without changing its designated next action.`
                    : "The follow-up is linked to the same records as this activity."}
              </p>
              <div className="mw-field">
                <label htmlFor="mw-next-title">Next activity</label>
                <input id="mw-next-title" type="text" maxLength={2000} value={next.summary} onChange={(e) => setNext({ ...next, summary: e.target.value })} />
              </div>
              <TypeField value={next.type} onChange={(type) => setNext({ ...next, type, timing: { ...next.timing, mode: next.timing.at || next.timing.mode === "needed" ? next.timing.mode : defaultModeFor(type) } })} />
              <TimingFields value={next.timing} onChange={(t) => setNext({ ...next, timing: t })} now={now} />
            </>
          )}
        </fieldset>
        {local && (
          <p className="mw-inline-error" role="alert">
            {local}
          </p>
        )}
        <ErrorNotice error={complete.error ?? plan.error} />
        {isDenied(detail.error) && <p className="mw-inline-error">This activity is no longer available to you.</p>}
      </form>
    </WorkDialog>
  );
}

// ───────────────────────── Reschedule / set a date / change owner ─────────────────────────
export function RescheduleDialog({
  activityId,
  now,
  purpose = "reschedule",
  onClose,
  onChanged,
}: {
  activityId: string;
  now: string;
  purpose?: "reschedule" | "date" | "owner" | "followup";
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const detail = useResource<Envelope<Activity>>(`activities/${activityId}`);
  const a = detail.data?.items[0];
  return a ? (
    <RescheduleForm key={`${a.id}:${a.version}`} a={a} now={now} purpose={purpose} onClose={onClose} onChanged={onChanged} reload={detail.reload} />
  ) : (
    <WorkDialog title="Reschedule" onClose={onClose}>
      {detail.loading && <p role="status">Loading the current saved activity…</p>}
      <ErrorNotice error={detail.error} />
      {!!detail.error && (
        <button type="button" className="mw-button" onClick={detail.reload}>
          Try again
        </button>
      )}
    </WorkDialog>
  );
}
function RescheduleForm({
  a,
  now,
  purpose,
  onClose,
  onChanged,
  reload,
}: {
  a: Activity;
  now: string;
  purpose: "reschedule" | "date" | "owner" | "followup";
  onClose: () => void;
  onChanged: (message: string) => void;
  reload: () => void;
}) {
  const cmd = useCommand();
  const [when, setWhen] = useState<TimingState>(() => {
    const t = timingFrom(a, now);
    return purpose === "date" && t.mode === "needed" ? { ...t, mode: "deadline" } : t;
  });
  const [owner, setOwner] = useState(a.owner_id),
    [reason, setReason] = useState(""),
    [local, setLocal] = useState("");
  const owners = useResource<Envelope<Option>>(
    purpose === "owner"
      ? `selectors/owners?${new URLSearchParams({ company_id: a.company_id, ...(a.site_id ? { site_id: a.site_id } : {}), purpose: "Activity", access_class: a.access_class, activity_id: a.id })}`
      : null,
  );
  const proposed = useMemo(() => timingPayload(when), [when]);
  const slot = proposed.ok && proposed.value.starts_at ? proposed.value : null;
  const conflicts = useResource<Conflicts>(
    slot ? `work/conflicts?${new URLSearchParams({ owner_id: owner, starts_at: slot.starts_at!, ends_at: slot.due_at!, exclude: a.id })}` : null,
  );
  const changed = (proposed.ok && !sameTiming(proposed.value, a)) || owner !== a.owner_id;
  const titles = { reschedule: "Reschedule", date: "Set a date", owner: "Change owner or date", followup: "Record a follow-up and set the next chase" };
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!proposed.ok) return setLocal(proposed.message);
    if (!changed) return setLocal("Nothing has changed yet.");
    if (reason.trim().length < 3) return setLocal(purpose === "followup" ? "Note what happened when you followed up." : "Give a short reason for the change; it is kept in the history.");
    setLocal("");
    const saved = await cmd.send(`activities/${a.id}/update`, {
      expected_version: a.version,
      owner_id: owner,
      summary: a.summary,
      activity_type: a.activity_type,
      ...proposed.value,
      reason: reason.trim(),
    });
    if (saved) {
      onChanged(
        purpose === "followup"
          ? `Follow-up recorded for “${a.summary}”. The request itself is unchanged.`
          : `“${a.summary}” updated. No external calendar is connected, so no one was notified.`,
      );
      onClose();
    }
  }
  const conflict = (cmd.error as { code?: string } | null)?.code === "VersionConflict";
  return (
    <WorkDialog
      title={titles[purpose]}
      subtitle={a.summary}
      busy={cmd.busy}
      dirty={changed || !!reason}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="mw-button" onClick={onClose} disabled={cmd.busy}>
            Cancel
          </button>
          <button type="submit" form="mw-reschedule" className="mw-button mw-button-primary" disabled={cmd.busy || !a.can_edit}>
            {cmd.busy ? "Saving…" : "Save change"}
          </button>
        </>
      }
    >
      <form id="mw-reschedule" onSubmit={submit} noValidate>
        <dl className="mw-facts mw-facts-compact">
          <div>
            <dt>Currently</dt>
            <dd>{whenText(a)}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{a.owner_name}</dd>
          </div>
        </dl>
        {!a.can_edit && <p className="mw-notice mw-notice-attention">This activity can no longer be changed by you. It may have been completed or reassigned.</p>}
        <fieldset disabled={cmd.busy || !a.can_edit} className="mw-fieldset-plain">
          <TimingFields value={when} onChange={setWhen} now={now} />
          {purpose === "owner" && (
            <div className="mw-field">
              <label htmlFor="mw-owner">Owner</label>
              <select id="mw-owner" value={owner} onChange={(e) => setOwner(e.target.value)}>
                {(owners.data?.items ?? [{ id: a.owner_id, display_name: a.owner_name }]).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.display_name}
                  </option>
                ))}
              </select>
              {!!owners.error && <small className="mw-inline-error">Eligible owners could not be loaded; the owner stays as it is.</small>}
            </div>
          )}
          {slot && (
            <div className="mw-conflicts" role="status">
              {conflicts.loading
                ? "Checking the owner's other appointments…"
                : conflicts.error
                  ? "Other appointments could not be checked."
                  : conflicts.data?.items.length
                    ? `Overlaps ${conflicts.data.items.length} other appointment${conflicts.data.items.length === 1 ? "" : "s"}: ${conflicts.data.items.map((c) => `${c.summary} (${clockTime(c.starts_at, WORK_TIMEZONE)}–${clockTime(c.ends_at, WORK_TIMEZONE)})`).join("; ")}. You can still save.`
                    : "No overlap with the owner's other Powerplants One appointments that you can see."}
            </div>
          )}
          <div className="mw-field">
            <label htmlFor="mw-reason">{purpose === "followup" ? "What happened when you followed up?" : "Reason for the change"}</label>
            <input id="mw-reason" type="text" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} data-autofocus={purpose === "followup" || undefined} />
          </div>
        </fieldset>
        <p className="mw-hint">
          {purpose === "followup"
            ? "This records your chase and the next follow-up date. It does not send anything, and it does not clear the request: only the owning workflow can do that. The original waiting date is kept."
            : "This changes the Powerplants One activity and keeps the previous timing in its history. No external calendar is connected, so no invitation or update is sent to anyone."}
        </p>
        {local && (
          <p className="mw-inline-error" role="alert">
            {local}
          </p>
        )}
        <ErrorNotice error={cmd.error} />
        {conflict && (
          <button type="button" className="mw-button" onClick={reload}>
            Load the current saved version (your entries will need re-entering)
          </button>
        )}
      </form>
    </WorkDialog>
  );
}

// ───────────────────────── Create or plan an activity ─────────────────────────
export type ParentPreset = Pick<PlannableParent, "type" | "id" | "version" | "title" | "display_number" | "organisation_name" | "contact_name" | "company_id" | "site_id">;
export function ActivityFormDialog({
  preset,
  initialDay,
  now,
  onClose,
  onChanged,
}: {
  preset?: ParentPreset;
  // A day carried in from the weekly agenda. It only fills the form; the person can change it.
  initialDay?: string;
  now: string;
  onClose: () => void;
  onChanged: (message: string) => void;
}) {
  const me = useIdentity(),
    cmd = useCommand();
  const parents = useResource<{ items: PlannableParent[] }>(preset ? null : "work/parents");
  const [parentId, setParentId] = useState(preset?.id ?? ""),
    [summary, setSummary] = useState(""),
    [type, setType] = useState<ActivityType>("Call"),
    [kind, setKind] = useState("CustomerContact"),
    [owner, setOwner] = useState(me.actor_id),
    [when, setWhen] = useState<TimingState>(() =>
      // A day with no time is all the agenda knows, so that is all that is prefilled.
      initialDay ? { ...timingFrom(null, now), mode: "date", day: initialDay, at: `${initialDay}T09:00` } : timingFrom(null, now),
    ),
    [local, setLocal] = useState("");
  const parent: ParentPreset | undefined = preset ?? parents.data?.items.find((p) => p.id === parentId);
  const owners = useResource<Envelope<Option>>(
    parent ? `selectors/owners?${new URLSearchParams({ company_id: parent.company_id, ...(parent.site_id ? { site_id: parent.site_id } : {}), purpose: "Activity", access_class: "Internal" })}` : null,
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!parent) return setLocal("Choose the lead or opportunity this activity is for.");
    if (!summary.trim()) return setLocal("Give the activity a title.");
    const timingValue = timingPayload(when);
    if (!timingValue.ok) return setLocal(timingValue.message);
    setLocal("");
    const saved = await cmd.send(`crm/${parent.type === "Lead" ? "leads" : "opportunities"}/${parent.id}/next-action`, {
      expected_version: parent.version,
      activity_id: null,
      new_action: { id: crypto.randomUUID(), owner_id: owner, kind, summary: summary.trim(), activity_type: type, ...timingValue.value },
      reason: "Plan the next action from My Work",
    });
    if (saved) {
      onChanged(
        timingValue.value.due_needed
          ? `“${summary.trim()}” saved without a date. It is listed under Date needed until it has one.`
          : `“${summary.trim()}” planned for ${parent.display_number}.`,
      );
      onClose();
    }
  }
  return (
    <WorkDialog
      title={preset ? "Plan activity" : "New activity"}
      subtitle={preset ? [preset.organisation_name, preset.title, preset.display_number].filter(Boolean).join(" · ") : "For one of your leads or open opportunities"}
      busy={cmd.busy}
      dirty={!!summary}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="mw-button" onClick={onClose} disabled={cmd.busy}>
            Cancel
          </button>
          <button type="submit" form="mw-activity" className="mw-button mw-button-primary" disabled={cmd.busy}>
            {cmd.busy ? "Saving…" : "Save activity"}
          </button>
        </>
      }
    >
      <form id="mw-activity" onSubmit={submit} noValidate>
        <fieldset disabled={cmd.busy} className="mw-fieldset-plain">
          {!preset && (
            <div className="mw-field">
              <label htmlFor="mw-parent">Lead or opportunity</label>
              <select
                id="mw-parent"
                value={parentId}
                onChange={(e) => {
                  // Eligible owners depend on the record's company and site, so the choice starts again.
                  setParentId(e.target.value);
                  setOwner(me.actor_id);
                }}
                data-autofocus
              >
                <option value="">{parents.loading ? "Loading your records…" : "Choose…"}</option>
                {(["Opportunity", "Lead"] as const).map((group) => (
                  <optgroup key={group} label={group === "Lead" ? "Your leads" : "Your open opportunities"}>
                    {(parents.data?.items ?? [])
                      .filter((p) => p.type === group)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {[p.organisation_name, p.title, p.display_number].filter(Boolean).join(" · ")}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              {!!parents.error && <small className="mw-inline-error">Your leads and opportunities could not be loaded.</small>}
              {parents.data && !parents.data.items.length && <small>You own no active leads or open opportunities to plan against.</small>}
              <small>
                For a site, asset, customer or service request, use the <Link href="/work/new">full activity form</Link>.
              </small>
            </div>
          )}
          <div className="mw-field">
            <label htmlFor="mw-title">Title</label>
            <input id="mw-title" type="text" maxLength={2000} value={summary} onChange={(e) => setSummary(e.target.value)} data-autofocus={preset ? true : undefined} />
          </div>
          <div className="mw-field-row">
            <TypeField
              value={type}
              onChange={(t) => {
                setType(t);
                if (!when.at && when.mode !== "needed" && when.mode !== "date") setWhen({ ...when, mode: defaultModeFor(t) });
              }}
            />
            <div className="mw-field">
              <label htmlFor="mw-kind">Purpose</label>
              <select id="mw-kind" value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="CustomerContact">Customer contact</option>
                <option value="RelationshipReview">Relationship review</option>
              </select>
            </div>
          </div>
          {initialDay && (
            <p className="mw-hint" role="note">
              The date starts as {agendaDayLabel(initialDay, localDay(now))}, the agenda day you were viewing. Change it below if that is not what you want.
            </p>
          )}
          <TimingFields value={when} onChange={setWhen} now={now} />
          <div className="mw-field">
            <label htmlFor="mw-new-owner">Owner</label>
            <select id="mw-new-owner" value={owner} onChange={(e) => setOwner(e.target.value)} disabled={!parent}>
              {(owners.data?.items ?? [{ id: me.actor_id, display_name: me.display_name }]).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id === me.actor_id ? `${o.display_name} (me)` : o.display_name}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
        {parent && (
          <p className="mw-hint">
            Saving makes this the designated next action for {parent.type === "Lead" ? "lead" : "opportunity"} {parent.display_number}
            {parent.contact_name ? ` (${parent.contact_name})` : ""}. Nothing is sent to the customer.
          </p>
        )}
        {local && (
          <p className="mw-inline-error" role="alert">
            {local}
          </p>
        )}
        <ErrorNotice error={cmd.error} />
      </form>
    </WorkDialog>
  );
}
