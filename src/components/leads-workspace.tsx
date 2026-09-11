"use client";
import Link from "next/link";
import { LeadsDesktopList } from "./leads-desktop-list";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useIdentity } from "./business-session";
import { ErrorNotice, type Envelope, type Option } from "./business-ui";
import { LookupField } from "./record-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
import { ProductIcon } from "./product-icons";
import type { listLeads, readLead } from "../crm/leads/reads";
type Lead = Awaited<ReturnType<typeof readLead>>;
type List = Awaited<ReturnType<typeof listLeads>>;
type Mode =
  | "add"
  | "edit"
  | "note"
  | "action"
  | "convert"
  | "archive"
  | "unarchive"
  | "disqualify"
  | "reopen";
const sourceOptions = ["Phone", "Email", "Meeting", "Referral", "Other"];
const actionLabels = {
  Needed: "Next action needed",
  DueNeeded: "Due date needed",
  Overdue: "Overdue",
  Upcoming: "Upcoming",
  Unavailable: "Next action unavailable",
};
const date = (s: string) =>
  new Date(s).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const qs = (r: Record<string, string>) =>
  new URLSearchParams(
    Object.fromEntries(Object.entries(r).filter(([, v]) => v)),
  ).toString();
function Icon({ name }: { name: "back" | "sort" | "search" }) {
  return (
    <svg
      className="product-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d={
          name === "back"
            ? "M20 12H4 M11 5l-7 7 7 7"
            : name === "sort"
              ? "M3 5h10 M3 11h7 M3 17h4 M17 4v16 M12 15l5 5 5-5"
              : "M20 20l-5-5 M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14"
        }
      />
    </svg>
  );
}
function Picker({
  label,
  name,
  kind,
  value,
  onChange,
  context = {},
  enabled = true,
}: {
  label: string;
  name: string;
  kind: string;
  value: string;
  onChange: (v: string) => void;
  context?: Record<string, string>;
  enabled?: boolean;
}) {
  const [search, setSearch] = useState(""),
    [settled, setSettled] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSettled(search), 200);
    return () => clearTimeout(timer);
  }, [search]);
  const ready =
    enabled &&
    (kind === "Company" || !!context.company_id) &&
    (!["Site", "Person"].includes(kind) || !!context.organisation_id);
  const result = useCrmResource<Envelope<Option>>(
    ready
      ? `crm/leads/options?${qs({ kind, ...context, q: settled, limit: "20" })}`
      : null,
    true,
  );
  return (
    <div className="lead-picker">
      <LookupField
        name={name}
        label={label}
        value={value}
        onChange={onChange}
        search={search}
        onSearch={setSearch}
        options={result.data?.items ?? []}
        loading={result.loading || settled !== search}
        more={!!result.data?.next_cursor}
        error={!!result.error}
      />
      <ErrorNotice error={result.error} />
    </div>
  );
}
function Modal({
  children,
  onClose,
  drawer = false,
  locked = false,
}: {
  children: ReactNode;
  onClose: () => void;
  drawer?: boolean;
  locked?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    unlock = useRef(() => {});
  useEffect(() => {
    const el = dialog.current!,
      target = document.activeElement as HTMLElement | null,
      root = document.documentElement,
      body = document.body;
    const oldRoot = root.style.overflow,
      oldBody = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const release = () => {
      root.style.overflow = oldRoot;
      body.style.overflow = oldBody;
    };
    unlock.current = release;
    const resize = () => {
      const area = document
        .querySelector(".leads-workspace")
        ?.getBoundingClientRect();
      if (area) {
        el.style.setProperty("--lead-desktop-top", `${area.top}px`);
        el.style.setProperty(
          "--lead-desktop-height",
          `${Math.min(area.height, innerHeight - area.top)}px`,
        );
      }
      const v = window.visualViewport;
      el.style.setProperty(
        "--lead-viewport",
        `${v?.height ?? window.innerHeight}px`,
      );
      el.style.setProperty("--lead-offset", `${v?.offsetTop ?? 0}px`);
    };
    resize();
    el.showModal();
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("scroll", resize);
    return () => {
      release();
      el.close();
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, []);
  const close = () => {
    if (!locked) {
      unlock.current();
      dialog.current?.close();
      onClose();
    }
  };
  return (
    <dialog
      ref={dialog}
      className={`lead-modal ${drawer ? "lead-drawer" : ""}`}
      aria-labelledby="lead-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const targets = [
          ...e.currentTarget.querySelectorAll<HTMLElement>(
            'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
          ),
        ].filter((x) => x.getClientRects().length > 0);
        const first = targets[0],
          last = targets.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="lead-modal-content">
        {children}
        <button
          className="lead-modal-close"
          aria-label="Close dialog"
          type="button"
          disabled={locked}
          onClick={close}
        >
          <ProductIcon name="close" />
        </button>
      </div>
    </dialog>
  );
}
function TextArea({
  label,
  name,
  value,
  onChange,
  required = false,
  maxLength = 2000,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (s: string) => void;
  required?: boolean;
  maxLength?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null),
    id = useId();
  useEffect(() => {
    const el = ref.current!;
    const size = () => {
      el.style.height = "auto";
      el.style.height = `${Math.max(90, el.scrollHeight)}px`;
    };
    size();
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) {
        width = el.clientWidth;
        size();
      }
    });
    let width = el.clientWidth;
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);
  return (
    <label htmlFor={id}>
      {label}
      <textarea
        ref={ref}
        id={id}
        name={name}
        aria-label={label}
        data-validation-field={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        rows={3}
      />
    </label>
  );
}
function LeadForm({
  mode,
  lead,
  onAccepted,
  onCancel,
  onPending,
}: {
  mode: Mode;
  lead: Lead | null;
  onAccepted: (id: string) => void;
  onCancel: () => void;
  onPending: (v: boolean) => void;
}) {
  const identity = useIdentity(),
    formId = useId();
  const [title, setTitle] = useState(lead?.title ?? ""),
    [need, setNeed] = useState(lead?.need_summary ?? ""),
    [orgText, setOrgText] = useState(lead?.organisation_text ?? ""),
    [contactText, setContactText] = useState(lead?.contact_text ?? "");
  const [company, setCompany] = useState(lead?.company_id ?? ""),
    [owner, setOwner] = useState(lead?.owner_id ?? identity.actor_id),
    [org, setOrg] = useState(lead?.organisation_id ?? ""),
    [site, setSite] = useState(lead?.site_id ?? ""),
    [person, setPerson] = useState(lead?.primary_person_id ?? "");
  const [source, setSource] = useState(lead?.source_channel ?? "Phone"),
    [basis, setBasis] = useState(lead?.source_basis ?? ""),
    [status, setStatus] = useState(lead?.status ?? "New"),
    [note, setNote] = useState(""),
    [reason, setReason] = useState("");
  const [siteReason, setSiteReason] = useState(""),
    [contactReason, setContactReason] = useState(""),
    [actionChoice, setActionChoice] = useState(
      lead?.next_activity &&
        ["Open", "InProgress"].includes(lead.next_activity.status)
        ? lead.next_activity.id
        : "new",
    ),
    [actionId] = useState(() => crypto.randomUUID()),
    [actionOwner, setActionOwner] = useState(identity.actor_id),
    [summary, setSummary] = useState(""),
    [due, setDue] = useState(""),
    [identify, setIdentify] = useState("");
  const command = useCrmCommand(
      (r) => onAccepted(r.record_id),
      "Unsaved",
      onPending,
    ),
    locked = command.busy || command.uncertain;
  const heading = {
    add: "Add lead",
    edit: "Edit lead",
    note: "Add note",
    action: "Plan next activity",
    convert: "Convert to deal",
    archive: "Archive lead",
    unarchive: "Unarchive lead",
    disqualify: "Disqualify lead",
    reopen: "Reopen lead",
  }[mode];
  const context = {
    company_id: company,
    organisation_id: org,
    site_id: site,
    primary_person_id: person,
  };
  const capture = mode === "add" || mode === "edit",
    convert = mode === "convert",
    activity = mode === "action" || convert;
  async function submit() {
    const base = {
      reason:
        reason ||
        (
          {
            add: "Capture a new manual enquiry",
            edit: "Update lead details",
            note: "Record lead note",
            action: "Plan an owned lead follow-up",
            convert: "Qualify and convert lead",
          } as Record<string, string>
        )[mode],
      expected_version: lead?.version,
    };
    const detail = {
      title,
      need_summary: need || null,
      organisation_text: orgText || null,
      contact_text: contactText || null,
      source_channel: source,
      source_basis: basis,
    };
    if (mode === "add") {
      await command.send("crm/leads", {
        reason: base.reason,
        id: crypto.randomUUID(),
        company_id: company,
        owner_id: owner,
        organisation_id: org || null,
        site_id: site || null,
        primary_person_id: person || null,
        ...detail,
      });
      return;
    }
    const root = `crm/leads/${lead!.id}`;
    if (activity) {
      const new_action =
        actionChoice === "new"
          ? {
              id: actionId,
              owner_id: actionOwner,
              kind: "CustomerContact",
              summary,
              due_at: due ? new Date(due).toISOString() : null,
              due_needed: !due,
            }
          : null;
      const plan = {
        ...base,
        activity_id: actionChoice === "new" ? null : actionChoice,
        new_action,
      };
      await command.send(
        `${root}/${convert ? "convert" : "next-action"}`,
        convert
          ? {
              ...plan,
              opportunity_id: crypto.randomUUID(),
              organisation_id: org,
              site_id: site || null,
              primary_person_id: person || null,
              site_unknown_reason: site ? null : siteReason,
              contact_unknown_reason: person ? null : contactReason,
              title,
              need_summary: need,
              qualification_note: note,
              identification_activity_id: person ? null : identify || null,
            }
          : plan,
      );
      return;
    }
    await command.send(root, {
      ...base,
      action: mode === "edit" ? "update" : mode,
      ...(mode === "edit"
        ? { ...detail, status }
        : mode === "note"
          ? { note }
          : {}),
    });
  }
  if (denied(command.error))
    return (
      <>
        <header className="lead-dialog-head">
          <h2 id="lead-dialog-title">Lead unavailable</h2>
        </header>
        <div className="lead-dialog-body">
          <ErrorNotice error={command.error} />
        </div>
      </>
    );
  return (
    <form
      id={formId}
      className="lead-form"
      onChange={() => command.dirty()}
      onSubmit={(e) => {
        e.preventDefault();
        if (!locked) void submit();
      }}
    >
      <header className="lead-dialog-head">
        <h2 id="lead-dialog-title">{heading}</h2>
        <p>
          {capture
            ? "Capture the enquiry. Qualify it when you know more."
            : lead?.display_number}
        </p>
      </header>
      <div className="lead-dialog-body">
        <ErrorNotice error={command.error} />
        <fieldset disabled={locked}>
          {(capture || convert) && (
            <>
              <label>
                Lead title
                <input
                  name="title"
                  data-validation-field="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                  autoFocus
                />
              </label>
              {mode === "add" && (
                <div className="lead-form-two">
                  <Picker
                    label="Company"
                    name="company_id"
                    kind="Company"
                    value={company}
                    onChange={(v) => {
                      setCompany(v);
                      setOrg("");
                      setSite("");
                      setPerson("");
                      setOwner("");
                    }}
                  />
                  <Picker
                    label="Lead owner"
                    name="owner_id"
                    kind="Owner"
                    value={owner}
                    onChange={setOwner}
                    context={context}
                  />
                </div>
              )}
              {capture && (
                <>
                  <div className="lead-form-two">
                    <label>
                      Organisation / business
                      <input
                        name="organisation_text"
                        value={orgText}
                        onChange={(e) => setOrgText(e.target.value)}
                        maxLength={200}
                      />
                    </label>
                    <label>
                      Contact name
                      <input
                        name="contact_text"
                        value={contactText}
                        onChange={(e) => setContactText(e.target.value)}
                        maxLength={200}
                      />
                    </label>
                  </div>
                  <small>Names can be unverified at this stage.</small>
                </>
              )}
              {(mode === "add" || convert) && (
                <details open={convert}>
                  <summary>
                    {convert
                      ? "Confirm organisation and contact"
                      : "Link existing records (optional)"}
                  </summary>
                  <div className="lead-form-grid">
                    <Picker
                      label="Existing organisation"
                      name="organisation_id"
                      kind="Organisation"
                      value={org}
                      onChange={(v) => {
                        setOrg(v);
                        setSite("");
                        setPerson("");
                      }}
                      context={context}
                    />
                    <Picker
                      label="Site"
                      name="site_id"
                      kind="Site"
                      value={site}
                      onChange={setSite}
                      context={context}
                    />
                    <Picker
                      label="Contact"
                      name="primary_person_id"
                      kind="Person"
                      value={person}
                      onChange={setPerson}
                      context={context}
                    />
                  </div>
                </details>
              )}
              {convert && (
                <>
                  <div className="lead-readonly">
                    <strong>{lead?.owner_name}</strong>
                    <span>Accountable deal owner · retained from lead</span>
                    <span>Qualified / Open · Fictional sales enquiry — I1</span>
                  </div>
                  {!site && (
                    <TextArea
                      label="Why is the site unknown?"
                      name="site_unknown_reason"
                      value={siteReason}
                      onChange={setSiteReason}
                      required
                      maxLength={1000}
                    />
                  )}
                  {!person && (
                    <TextArea
                      label="Why is the contact unknown?"
                      name="contact_unknown_reason"
                      value={contactReason}
                      onChange={setContactReason}
                      required
                      maxLength={1000}
                    />
                  )}
                </>
              )}
              <TextArea
                label="Requirement / enquiry"
                name="need_summary"
                value={need}
                onChange={setNeed}
                required={convert}
              />
              {capture && (
                <>
                  <div className="lead-form-two">
                    <label>
                      Source
                      <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                      >
                        {sourceOptions.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    {mode === "edit" && (
                      <label>
                        Status
                        <select
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as Lead["status"])
                          }
                        >
                          {["New", "Contacting", "Nurturing"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <TextArea
                    label="Source details"
                    name="source_basis"
                    value={basis}
                    onChange={setBasis}
                    required
                    maxLength={1000}
                  />
                </>
              )}
            </>
          )}
          {(mode === "note" || convert) && (
            <TextArea
              label={convert ? "Qualification note" : "Note"}
              name={convert ? "qualification_note" : "note"}
              value={note}
              onChange={setNote}
              required
              maxLength={convert ? 2000 : 10000}
            />
          )}
          {activity && (
            <>
              <label>
                Next activity
                <select
                  value={actionChoice}
                  onChange={(e) => setActionChoice(e.target.value)}
                >
                  <option value="new">Create a new activity</option>
                  {lead?.actions
                    .filter((a) => ["Open", "InProgress"].includes(a.status))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.summary} · {a.owner_name}
                      </option>
                    ))}
                </select>
              </label>
              {actionChoice === "new" ? (
                <>
                  <TextArea
                    label="Activity summary"
                    name="activity_summary"
                    value={summary}
                    onChange={setSummary}
                    required
                  />
                  <Picker
                    label="Activity owner"
                    name="activity_owner_id"
                    kind="ActionOwner"
                    value={actionOwner}
                    onChange={setActionOwner}
                    context={context}
                  />
                  <label>
                    Due date and time (optional)
                    <input
                      type="datetime-local"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                    />
                  </label>
                  <small>
                    {due
                      ? "Saved using your device's time zone."
                      : "No date selected — shown as due date needed."}
                  </small>
                </>
              ) : (
                <p className="lead-readonly">
                  The existing activity keeps its owner, due date and history.
                </p>
              )}
              {convert && !person && (
                <label>
                  Contact-identification activity
                  <select
                    value={identify}
                    onChange={(e) => setIdentify(e.target.value)}
                    required
                  >
                    <option value="">Choose an owned active activity</option>
                    {actionChoice === "new" &&
                      actionOwner === lead?.owner_id && (
                        <option value={actionId}>The new activity above</option>
                      )}
                    {lead?.actions
                      .filter(
                        (a) =>
                          a.owner_id === lead.owner_id &&
                          ["Open", "InProgress"].includes(a.status) &&
                          ["CustomerContact", "RelationshipReview"].includes(
                            a.kind,
                          ),
                      )
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.summary}
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </>
          )}
          {["archive", "unarchive", "disqualify", "reopen"].includes(mode) && (
            <TextArea
              label="Reason"
              name="reason"
              value={reason}
              onChange={setReason}
              required
              maxLength={1000}
            />
          )}
        </fieldset>
      </div>
      <footer className="lead-dialog-foot">
        <span role="status">{command.busy ? "Saving…" : command.status}</span>
        <button
          type="button"
          className="secondary"
          disabled={locked}
          onClick={onCancel}
        >
          Cancel
        </button>
        {command.uncertain ? (
          <button
            type="button"
            onClick={() => void command.reconcile()}
            disabled={command.busy}
          >
            Confirm original save
          </button>
        ) : (
          <button type="submit" className="lead-primary" disabled={locked}>
            {convert
              ? "Convert to deal"
              : mode === "add"
                ? "Save lead"
                : "Save"}
          </button>
        )}
      </footer>
    </form>
  );
}
function LeadDetail({
  lead,
  setMode,
}: {
  lead: Lead;
  setMode: (mode: Mode) => void;
}) {
  return (
    <>
      <header className="lead-dialog-head">
        <small>{lead.display_number}</small>
        <h2 id="lead-dialog-title">{lead.title}</h2>
        <span className={`lead-pill ${lead.status.toLowerCase()}`}>
          {lead.status}
        </span>
        {lead.is_archived && <span className="lead-pill">Archived</span>}
      </header>
      <div className="lead-dialog-body">
        <div className="lead-facts">
          {[
            [
              "Organisation",
              lead.organisation_name ??
                lead.organisation_text ??
                "Not yet known",
            ],
            [
              "Contact",
              lead.contact_name ?? lead.contact_text ?? "Not yet known",
            ],
            ["Site", lead.site_name ?? "Not yet known"],
            ["Owner", lead.owner_name],
            ["Source", lead.source_channel],
            ["Date added", date(lead.created_at)],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <section>
          <h3>Requirement / enquiry</h3>
          <p className="lead-narrative">
            {lead.need_summary ?? "Requirement to be confirmed."}
          </p>
          <small>{lead.source_basis}</small>
        </section>
        <section>
          <h3>Next activity</h3>
          <div className="lead-next">
            {lead.next_activity ? (
              <>
                <Link href={`/work/${lead.next_activity.id}`}>
                  {lead.next_activity.summary}
                </Link>
                <p>
                  {lead.next_activity.owner_name} ·{" "}
                  {lead.next_activity.due_at
                    ? date(lead.next_activity.due_at)
                    : "Due date needed"}
                </p>
                <small>
                  {
                    actionLabels[
                      lead.next_action_state as keyof typeof actionLabels
                    ]
                  }
                </small>
              </>
            ) : (
              <p>
                {
                  actionLabels[
                    lead.next_action_state as keyof typeof actionLabels
                  ]
                }
              </p>
            )}
          </div>
          {lead.can_edit &&
            !lead.is_archived &&
            lead.status !== "Disqualified" && (
              <button className="secondary" onClick={() => setMode("action")}>
                Plan next activity
              </button>
            )}
        </section>
        <section>
          <h3>Notes and history</h3>
          <div className="lead-timeline">
            {lead.events.map((e) => (
              <article key={e.id}>
                <strong>
                  {e.event_type.replace(/([a-z])([A-Z])/g, "$1 $2")}
                </strong>
                <small>
                  {e.actor_name} · {date(e.created_at)}
                </small>
                <p className="lead-narrative">{e.note ?? e.reason}</p>
              </article>
            ))}
            {lead.actions.map((a) => (
              <article key={a.id}>
                <Link href={`/work/${a.id}`}>{a.summary}</Link>
                <small>
                  {a.owner_name} · {a.status}
                </small>
                {a.outcome && <p>{a.outcome}</p>}
              </article>
            ))}
          </div>
          {lead.can_edit && (
            <button className="secondary" onClick={() => setMode("note")}>
              Add note
            </button>
          )}
        </section>
        {lead.status === "Converted" && (
          <div className="lead-readonly">
            {lead.deal ? (
              <>
                <strong>Converted to deal</strong>
                <Link href={`/crm/opportunities/${lead.deal.id}`}>
                  Open deal · {lead.deal.display_number}
                </Link>
              </>
            ) : (
              "Linked deal unavailable"
            )}
          </div>
        )}
        {lead.can_edit && (
          <div className="lead-secondary-actions">
            {!lead.is_archived && lead.status !== "Disqualified" && (
              <button className="secondary" onClick={() => setMode("edit")}>
                Edit lead
              </button>
            )}
            <button
              className="secondary"
              onClick={() =>
                setMode(lead.is_archived ? "unarchive" : "archive")
              }
            >
              {lead.is_archived ? "Unarchive" : "Archive"}
            </button>
            <button
              className="secondary"
              onClick={() =>
                setMode(
                  lead.status === "Disqualified" ? "reopen" : "disqualify",
                )
              }
            >
              {lead.status === "Disqualified" ? "Reopen" : "Disqualify"}
            </button>
          </div>
        )}
      </div>
      <footer className="lead-dialog-foot">
        {lead.can_convert && (
          <button className="lead-primary" onClick={() => setMode("convert")}>
            Convert to deal
          </button>
        )}
        {lead.deal && (
          <Link href={`/crm/opportunities/${lead.deal.id}`}>Open deal</Link>
        )}
      </footer>
    </>
  );
}
export function LeadsWorkspace({ leadId }: { leadId?: string }) {
  const router = useRouter(),
    params = useSearchParams(),
    identity = useIdentity();
  const [mode, setMode] = useState<Mode | null>(
      params.get("create") === "1" ? "add" : null,
    ),
    [pending, setPending] = useState(false),
    [filters, setFilters] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [sortOpen, setSortOpen] = useState(false),
    [notice, setNotice] = useState("");
  const requestedCreate = params.get("create") === "1";
  useEffect(() => { if (requestedCreate) queueMicrotask(() => setMode("add")); }, [requestedCreate]);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const lastSentSearch = useRef(params.get("q") ?? "");
  useEffect(() => {
    const next = params.get("q") ?? "";
    if (next !== lastSentSearch.current) {
      lastSentSearch.current = next;
      queueMicrotask(() => setSearch(next));
    }
  }, [params]);
  const query = qs(
    Object.fromEntries(
      ["view", "q", "owner_id", "status", "source", "sort", "cursor"].flatMap(
        (k) => (params.get(k) ? [[k, params.get(k)!]] : []),
      ),
    ),
  );
  const list = useCrmResource<List>(`crm/leads?${query}`, true),
    detail = useCrmResource<Lead>(leadId ? `crm/leads/${leadId}` : null, true);
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("cursor");
    if (key === "view") next.delete("status");
    router.replace(`/crm/leads?${next}`);
  };
  useEffect(() => {
    if (search === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(query);
      if (search) next.set("q", search);
      else next.delete("q");
      next.delete("cursor");
      lastSentSearch.current = search;
      router.replace(`/crm/leads?${next}`);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, params, query, router]);
  const close = () => {
    setPending(false);
    if (mode) {
      setMode(null);
      if (requestedCreate) router.replace(`/crm/leads${query ? `?${query}` : ""}`);
    } else router.push(`/crm/leads?${query ? `${query}&` : ""}focus=${leadId}`);
  };
  const accepted = (id: string) => {
    setPending(false);
    setMode(null);
    setNotice(
      mode === "convert"
        ? "Lead converted. The linked deal is ready."
        : "Saved to the server.",
    );
    list.reload();
    detail.reload();
    if (!leadId) router.push(`/crm/leads/${id}${query ? `?${query}` : ""}`);
  };
  const focused = useRef(false);
  useEffect(() => {
    const id = params.get("focus");
    if (!leadId && id && list.data && !focused.current) {
      const target = [
        ...document.querySelectorAll<HTMLAnchorElement>(
          ".lead-table a,.lead-mobile-row",
        ),
      ].find(
        (a) =>
          a.href.includes(`/crm/leads/${id}`) && a.getClientRects().length > 0,
      );
      if (target) {
        target.focus({ preventScroll: true });
        focused.current = true;
      }
    }
  }, [leadId, list.data, params]);
  const openLead = (id: string) =>
    `/crm/leads/${id}${query ? `?${query}` : ""}`;
  const items = list.data?.items ?? [],
    view = params.get("view") ?? "Active";
  const hasFilters = ["q", "owner_id", "status", "source"].some(
    (k) => !!params.get(k),
  );
  const clearFilters = () =>
    router.replace(
      `/crm/leads?${qs({ view, sort: params.get("sort") ?? "Newest" })}`,
    );
  const firstPage = () => {
    const next = new URLSearchParams(query);
    next.delete("cursor");
    router.push(`/crm/leads?${next}`);
  };
  const nextPage = () => {
    const next = new URLSearchParams(query);
    next.set("cursor", list.data!.next_cursor!);
    router.push(`/crm/leads?${next}`);
  };
  const filterControls = (
    <>
      <label>
        Owner
        <select
          value={params.get("owner_id") ?? ""}
          onChange={(e) => change("owner_id", e.target.value)}
        >
          <option value="">All owners</option>
          <option value={identity.actor_id}>My leads</option>
        </select>
      </label>
      <label>
        Status
        <select
          disabled={view !== "Active"}
          value={params.get("status") ?? ""}
          onChange={(e) => change("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {["New", "Contacting", "Nurturing"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Source
        <select
          value={params.get("source") ?? ""}
          onChange={(e) => change("source", e.target.value)}
        >
          <option value="">All sources</option>
          {sourceOptions.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <button className="secondary" onClick={clearFilters} hidden={!hasFilters}>
        Clear filters
      </button>
    </>
  );
  return (
    <section className="leads-workspace">
      <header className="lead-mobile-header">
        <Link href="/crm/opportunities" aria-label="Back to deals">
          <Icon name="back" />
        </Link>
        <button
          aria-label="Sort leads"
          aria-expanded={sortOpen}
          onClick={() => {
            setSortOpen(!sortOpen);
            setFilters(false);
          }}
        >
          <Icon name="sort" />
        </button>
        <label className="lead-mobile-view">
          <span className="sr-only">Lead view</span>
          <select value={view} onChange={(e) => change("view", e.target.value)}>
            {["Active", "Archived", "Disqualified", "Converted"].map((v) => (
              <option key={v} value={v}>
                {v === "Active" ? "Inbox" : v}
              </option>
            ))}
          </select>
        </label>
        <button
          aria-label="Search leads"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Icon name="search" />
        </button>
        <button
          aria-label="Filter leads"
          aria-expanded={filters}
          onClick={() => {
            setFilters(!filters);
            setSortOpen(false);
          }}
        >
          <ProductIcon name="filter" />
        </button>
      </header>
      <div className="lead-heading">
        <h1>Leads</h1>
        <span className="lead-count">
          {items.length}
          {list.data?.next_cursor ? "+" : ""}
        </span>
        {list.data?.can_create && (
          <button
            className="lead-add lead-primary"
            aria-label="Add lead"
            onClick={() => setMode("add")}
          >
            <ProductIcon name="plus" />
            <span>Lead</span>
          </button>
        )}
      </div>
      <nav className="lead-lifecycle-tabs" aria-label="Lead lifecycle">
        {["Active", "Archived", "Disqualified", "Converted"].map((v) => (
          <button
            key={v}
            aria-current={view === v ? "page" : undefined}
            onClick={() => change("view", v)}
          >
            {v === "Active" ? "Inbox" : v}
          </button>
        ))}
      </nav>
      <div className="lead-list-controls">
        <div className={`lead-search ${searchOpen ? "open" : ""}`}>
          <label>
            Search leads
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads"
            />
          </label>
        </div>
        <div className={`lead-toolbar ${filters ? "open" : ""}`}>
          <label className="lead-desktop-view">
            View
            <select
              value={view}
              onChange={(e) => {
                change("view", e.target.value);
              }}
            >
              {["Active", "Archived", "Disqualified", "Converted"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          {filterControls}
        </div>
        <div className={`lead-sort ${sortOpen ? "open" : ""}`}>
          <label>
            Sort by
            <select
              value={params.get("sort") ?? "Newest"}
              onChange={(e) => change("sort", e.target.value)}
            >
              {["Newest", "Oldest", "Name"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <p className="lead-notice" role="status">
        {notice}
      </p>
      <ErrorNotice error={list.error} />
      {list.error != null && (
        <button onClick={list.reload}>Try loading again</button>
      )}
      {list.loading && <p role="status">Loading permitted leads…</p>}
      {list.data && (
        <>
          <LeadsDesktopList
            items={items}
            selected={leadId}
            href={openLead}
            preferenceKey={`${identity.workspace_id}:${identity.actor_id}`}
            view={view}
            queryKey={query}
            filtered={hasFilters}
            more={!!list.data.next_cursor}
            firstPage={!params.get("cursor")}
            onNext={nextPage}
            onFirst={firstPage}
            emptyLabel={
              hasFilters
                ? "Clear filters"
                : view === "Active" && list.data.can_create
                  ? "+ Lead"
                  : "Back to Inbox"
            }
            onEmpty={() =>
              hasFilters
                ? clearFilters()
                : view === "Active" && list.data!.can_create
                  ? setMode("add")
                  : change("view", "Active")
            }
          />
          <div className="lead-mobile-results">
            <div className="lead-mobile-summary">
              <strong>
                {items.length}
                {list.data.next_cursor ? "+" : ""} leads
              </strong>
              <span>{view === "Active" ? "Active enquiries" : view}</span>
            </div>
            {items.length === 0 ? (
              <div className="lead-empty">
                <ProductIcon name="sales" />
                <h2>{query ? "No leads match this view" : "No leads added"}</h2>
                <p>
                  {query
                    ? "Adjust your search or filters."
                    : "Add a new lead using the button below."}
                </p>
              </div>
            ) : (
              <>
                <div className="lead-mobile-list">
                  {items.map((l) => (
                    <Link
                      className="lead-mobile-row"
                      key={l.id}
                      href={openLead(l.id)}
                      aria-label={`${l.title}, ${l.owner_name}, ${l.status}`}
                    >
                      <strong>{l.title}</strong>
                      <span>
                        {[l.organisation_name, l.contact_name]
                          .filter(Boolean)
                          .join(" · ") || "Details to confirm"}
                      </span>
                      <span className="lead-row-meta">
                        <span
                          className={`lead-row-status ${l.status.toLowerCase()}`}
                        >
                          {l.status}
                        </span>
                        <span
                          className={
                            l.next_action_state !== "Upcoming"
                              ? "lead-attention"
                              : ""
                          }
                        >
                          {
                            actionLabels[
                              l.next_action_state as keyof typeof actionLabels
                            ]
                          }
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {list.data.next_cursor && (
              <button
                className="secondary lead-next-page"
                onClick={() => {
                  const next = new URLSearchParams(query);
                  next.set("cursor", list.data!.next_cursor!);
                  router.push(`/crm/leads?${next}`);
                }}
              >
                Next page
              </button>
            )}
          </div>
        </>
      )}
      {(mode || leadId) && (
        <Modal
          key={mode ?? "detail"}
          onClose={close}
          locked={pending}
          drawer={!mode}
        >
          {mode && (mode === "add" || detail.data) ? (
            <LeadForm
              key={`${mode}:${leadId ?? "new"}`}
              mode={mode}
              lead={detail.data}
              onAccepted={accepted}
              onCancel={close}
              onPending={setPending}
            />
          ) : detail.data ? (
            <LeadDetail lead={detail.data} setMode={setMode} />
          ) : (
            <>
              <header className="lead-dialog-head">
                <h2 id="lead-dialog-title">
                  {detail.error ? "Lead unavailable" : "Loading lead…"}
                </h2>
              </header>
              <div className="lead-dialog-body">
                <ErrorNotice error={detail.error} />
                {detail.error != null && (
                  <button onClick={detail.reload}>Try loading again</button>
                )}
              </div>
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
