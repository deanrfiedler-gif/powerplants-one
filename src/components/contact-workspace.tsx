"use client";
import "../app/styles/customers.css";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ErrorNotice,
  Field,
  PageHeader,
  ReadState,
  SelectField,
  Stamp,
  Status,
  SummaryPair,
  ValidationFields,
} from "./business-ui";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { RecordPanel, RecordTabs } from "./record-ui";
import type {
  Affiliation,
  Collection,
  ContactWorkspace,
  Stakeholders,
} from "../shared/contacts/reads";

export function useContactView(allowed: string[], fallback: string) {
  const params = useSearchParams(),
    router = useRouter(),
    path = usePathname();
  const selected = params.get("view") ?? fallback;
  const value = allowed.includes(selected) ? selected : fallback;
  return [
    value,
    (next: string) => {
      const query = new URLSearchParams(params);
      query.set("view", next);
      router.push(`${path}?${query}`, { scroll: false });
    },
  ] as const;
}
function ScopeNote({ value }: { value: Collection<unknown> }) {
  return (
    <p className="scope-note">
      {value.state === "Restricted"
        ? "Restricted: this view cannot establish the full set. Hidden records and counts are not disclosed. "
        : value.state === "Partial"
          ? "Partial view. "
          : ""}
      {value.basis}
    </p>
  );
}
function CommandStatus({
  command,
}: {
  command: ReturnType<typeof useCrmCommand>;
}) {
  return (
    <>
      <ErrorNotice error={command.error} />
      <p role="status">{command.status}</p>
      {command.uncertain && (
        <button
          type="button"
          onClick={() => void command.reconcile()}
          disabled={command.busy}
        >
          Confirm original save
        </button>
      )}
    </>
  );
}
function PersonCorrection({
  person,
  done,
  cancel,
}: {
  person: ContactWorkspace;
  done: () => void;
  cancel: () => void;
}) {
  const [draft, setDraft] = useState({
    display_name: person.display_name,
    email: person.email ?? "",
    phone: person.phone ?? "",
    contact_preference: person.contact_preference ?? "",
    active: person.active,
  });
  const [reason, setReason] = useState("");
  const command = useCrmCommand(done);
  const change = (field: keyof typeof draft, value: string | boolean) => {
    setDraft((d) => ({ ...d, [field]: value }));
    command.dirty();
  };
  return (
    <form
      className="detail-section cs-form"
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(`people/${person.id}/revise`, {
          ...draft,
          email: draft.email || null,
          phone: draft.phone || null,
          contact_preference: draft.contact_preference || null,
          expected_version: person.version,
          reason,
        });
      }}
    >
      <h2>Correct contact</h2>
      <p>
        Reviewing version {person.version}. A preference records what was
        stated; it does not record marketing consent. Making a contact inactive
        retains all relationships and history.
      </p>
      <ValidationFields error={command.error}>
        <fieldset disabled={command.busy || command.uncertain}>
          <Field
            name="display_name"
            label="Name"
            value={draft.display_name}
            onChange={(v) => change("display_name", v)}
            required
          />
          <Field
            name="email"
            label="Email"
            value={draft.email}
            onChange={(v) => change("email", v)}
          />
          <Field
            name="phone"
            label="Phone"
            value={draft.phone}
            onChange={(v) => change("phone", v)}
          />
          <Field
            name="contact_preference"
            label="Contact preference"
            value={draft.contact_preference}
            onChange={(v) => change("contact_preference", v)}
          />
          <SelectField
            name="active"
            label="Contact status"
            value={String(draft.active)}
            onChange={(v) => change("active", v === "true")}
            options={[
              { id: "true", display_name: "Active" },
              { id: "false", display_name: "Inactive" },
            ]}
          />
          <Field
            name="reason"
            label="Reason for correction"
            value={reason}
            onChange={(v) => {
              setReason(v);
              command.dirty();
            }}
            required
          />
          <div className="actions">
            <button type="submit">Save contact correction</button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                if (
                  !command.hasUnsavedChanges ||
                  window.confirm("Discard this unsaved correction?")
                ) {
                  command.discard();
                  cancel();
                }
              }}
            >
              Cancel correction
            </button>
          </div>
        </fieldset>
      </ValidationFields>
      <CommandStatus command={command} />
    </form>
  );
}
export function EndAffiliation({
  affiliation,
  done,
}: {
  affiliation: Affiliation;
  done: () => void;
}) {
  const [open, setOpen] = useState(false),
    [end, setEnd] = useState(""),
    [reason, setReason] = useState("");
  const [basis, setBasis] = useState(affiliation.organisation_version);
  const command = useCrmCommand(() => {
    setOpen(false);
    done();
  });
  if (!affiliation.can_end) return null;
  return open ? (
    <form
      className="cs-form"
      onSubmit={(e) => {
        e.preventDefault();
        void command.send(
          `customers/${affiliation.organisation_id}/affiliations/end`,
          {
            relationship_id: affiliation.id,
            expected_version: basis,
            valid_to: end,
            reason,
          },
        );
      }}
    >
      <p>
        End dates are exclusive. Historic reliance is retained; review
        downstream responsibilities before ending this affiliation.
      </p>
      <ValidationFields error={command.error}>
        <fieldset disabled={command.busy || command.uncertain}>
          <Field
            name="valid_to"
            type="date"
            label="Affiliation end date"
            value={end}
            onChange={(v) => {
              setEnd(v);
              command.dirty();
            }}
            required
          />
          <Field
            name="reason"
            label="Reason for ending affiliation"
            value={reason}
            onChange={(v) => {
              setReason(v);
              command.dirty();
            }}
            required
          />
          <button type="submit">Confirm affiliation end</button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              command.discard();
              setOpen(false);
            }}
          >
            Cancel
          </button>
        </fieldset>
      </ValidationFields>
      <CommandStatus command={command} />
    </form>
  ) : (
    <button
      className="secondary"
      onClick={() => {
        setBasis(affiliation.organisation_version);
        setOpen(true);
      }}
    >
      End affiliation
    </button>
  );
}
export function ContactWorkspacePage({ id }: { id: string }) {
  const r = useCrmResource<ContactWorkspace>(`people/${id}/workspace`, true);
  const [tab, setTab] = useContactView(
    ["identity", "relationships", "reliance", "history"],
    "identity",
  );
  const [editing, setEditing] = useState<ContactWorkspace | null>(null);
  const person = r.data;
  return (
    <div id="ppo-contact" className="cs-workspace">
      <Link href="/contacts?view=people">← Contacts</Link>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {person && (
        <>
          <PageHeader eyebrow="CS-02 / Contact" title={person.display_name} />
          <div className="record-banner">
            <Status value={person.active ? "Active" : "Inactive"} />
            <span>Version {person.version}</span>
            <span>
              Observed <Stamp value={person.observed_at} />
            </span>
            <button className="secondary" onClick={r.reload}>
              Refresh contact
            </button>
          </div>
          <RecordTabs
            id="contact"
            label="Contact sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "identity", label: "Identity & channels" },
              { id: "relationships", label: "Relationships" },
              { id: "reliance", label: "Reliance & interactions" },
              { id: "history", label: "Correction history" },
            ]}
          />
          <RecordPanel id="contact" tab="identity" value={tab}>
            <dl className="context-grid">
              <SummaryPair label="Email">
                {person.email ?? "Not recorded"}
              </SummaryPair>
              <SummaryPair label="Phone">
                {person.phone ?? "Not recorded"}
              </SummaryPair>
              <SummaryPair label="Contact preference">
                {person.contact_preference ?? "Not recorded"}
              </SummaryPair>
            </dl>
            <p>
              A contact preference does not establish consent. A recorded role
              does not establish authority to commit the customer.
            </p>
            {person.can_edit && !editing && (
              <button onClick={() => setEditing(person)}>
                Correct contact
              </button>
            )}
            {!person.can_edit && (
              <p className="scope-note">
                Contact maintenance requires shared-data edit access in every
                company context.
              </p>
            )}
            {editing && person.can_edit && (
              <>
                {editing.version !== person.version && (
                  <p role="alert">
                    The saved contact has changed since this correction was
                    opened. Your proposed values remain below; the stale save
                    will be refused.
                  </p>
                )}
                <PersonCorrection
                  person={editing}
                  done={() => {
                    setEditing(null);
                    r.reload();
                  }}
                  cancel={() => setEditing(null)}
                />
              </>
            )}
          </RecordPanel>
          <RecordPanel id="contact" tab="relationships" value={tab}>
            <h2>Organisation affiliations</h2>
            <ScopeNote value={person.affiliations} />
            {!person.affiliations.items.length &&
              person.affiliations.state === "Available" && (
                <p>No affiliations recorded.</p>
              )}
            {person.affiliations.items.map((a) => (
              <article className="history-card" key={a.id}>
                <h3>
                  <Link href={`/customers/${a.organisation_id}/stakeholders`}>
                    {a.display_name}
                  </Link>
                </h3>
                <p>
                  {a.role_label} · <Status value={a.period} />
                </p>
                <p>
                  {a.valid_from} to {a.valid_to ?? "open-ended"} · Authority
                  basis: {a.authority_basis}. Purchasing authority: Unknown.
                </p>
                <EndAffiliation affiliation={a} done={r.reload} />
              </article>
            ))}
            <h2>Site primary contact</h2>
            <ScopeNote value={person.sites} />
            {person.sites.items.map((s) => (
              <p key={s.id}>
                <Link href={`/sites/${s.id}`}>
                  {s.display_name} · {s.display_number}
                </Link>
              </p>
            ))}
            {!person.sites.items.length && (
              <p>No primary-contact links in your permitted Site scope.</p>
            )}
          </RecordPanel>
          <RecordPanel id="contact" tab="reliance" value={tab}>
            <h2>Downstream reliance</h2>
            <ScopeNote value={person.reliance} />
            {!person.reliance.items.length && (
              <p>
                No reliance returned by these permitted source queries. Other
                workflows may be unavailable.
              </p>
            )}
            {person.reliance.items.map((x) => (
              <article className="history-card" key={`${x.kind}:${x.id}`}>
                <h3>
                  <Link href={x.href}>{x.label}</Link>
                </h3>
                <p>{x.kind}</p>
                <p>{x.consequence}</p>
              </article>
            ))}
          </RecordPanel>
          <RecordPanel id="contact" tab="history" value={tab}>
            <h2>Correction history</h2>
            <ScopeNote value={person.history} />
            {!person.history.items.length &&
              person.history.state === "Available" && (
                <p>No contact corrections recorded.</p>
              )}
            {person.history.items.map((h) => (
              <article className="history-card" key={h.id}>
                <h3>{h.reason}</h3>
                <p>
                  {h.actor_name} · <Stamp value={h.occurred_at} />
                </p>
                {h.details.before &&
                  Object.entries(h.details.before).map(([field, value]) => (
                    <p key={field}>
                      {field.replaceAll("_", " ")}:{" "}
                      {String(value ?? "Not recorded")} →{" "}
                      {String(h.details.after?.[field] ?? "Not recorded")}
                    </p>
                  ))}
              </article>
            ))}
          </RecordPanel>
        </>
      )}
    </div>
  );
}

export function StakeholderWorkspace({ id }: { id: string }) {
  const r = useCrmResource<Stakeholders>(`customers/${id}/stakeholders`, true);
  const [tab, setTab] = useContactView(
    ["current", "historic", "sites"],
    "current",
  );
  const value = r.data;
  return (
    <div id="ppo-stakeholders" className="cs-workspace">
      <Link href={`/customers/${id}`}>← Customer</Link>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {value && (
        <>
          <PageHeader
            eyebrow="CS-03 / Stakeholders & relationships"
            title={value.organisation.display_name}
          />
          <p>
            Relationship owner:{" "}
            {value.organisation.owner_name ?? "Not recorded"}. Recorded role ≠
            authority to commit the customer.
          </p>
          <p className="scope-note">
            Authority basis describes evidence: Recorded, Asserted by us, or
            Unknown. These canonical relationships are Recorded; purchasing
            authority remains Unknown. No authority assertion is created here.
          </p>
          <RecordTabs
            id="stakeholders"
            label="Relationship views"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "current", label: "Current & future" },
              { id: "historic", label: "Historic affiliations" },
              { id: "sites", label: "Site relationships" },
            ]}
          />
          {["current", "historic"].map((view) => (
            <RecordPanel key={view} id="stakeholders" tab={view} value={tab}>
              <ScopeNote value={value.affiliations} />
              {!value.affiliations.items.some((a) =>
                view === "historic"
                  ? a.period === "Historic"
                  : a.period !== "Historic",
              ) &&
                value.affiliations.state === "Available" && (
                  <p>
                    {view === "historic"
                      ? "No historic affiliations recorded."
                      : "Relationship gap: no current or future affiliations recorded."}
                  </p>
                )}
              {value.affiliations.items
                .filter((a) =>
                  view === "historic"
                    ? a.period === "Historic"
                    : a.period !== "Historic",
                )
                .map((a) => (
                  <article className="history-card" key={a.id}>
                    <h3>
                      <Link href={`/people/${a.person_id}`}>
                        {a.display_name}
                      </Link>
                    </h3>
                    <p>
                      {a.role_label} · {a.period} ·{" "}
                      {a.active
                        ? "Active contact"
                        : "Inactive contact — review reliance"}
                    </p>
                    <p>
                      {a.valid_from} to {a.valid_to ?? "open-ended"}. Authority
                      basis: Recorded.
                    </p>
                    <p>
                      <Link href={`/people/${a.person_id}?view=reliance`}>
                        Inspect downstream reliance
                      </Link>
                    </p>
                    <EndAffiliation affiliation={a} done={r.reload} />
                  </article>
                ))}
            </RecordPanel>
          ))}
          <RecordPanel id="stakeholders" tab="sites" value={tab}>
            <ScopeNote value={value.sites} />
            {value.sites.items.map((s) => (
              <article className="history-card" key={s.id}>
                <h3>
                  <Link href={`/sites/${s.id}`}>{s.display_name}</Link>
                </h3>
                <p>
                  Primary contact:{" "}
                  {s.contact ? (
                    <>
                      <Link href={`/people/${s.contact.id}`}>
                        {s.contact.display_name}
                      </Link>
                      {!s.contact.active && " · Inactive — review reliance"}
                    </>
                  ) : s.contact_state === "Not recorded" ? (
                    "Not recorded — relationship gap"
                  ) : (
                    s.contact_state
                  )}
                </p>
                {s.parties.map((p) => (
                  <p key={p.id}>
                    {p.role === "BillingParty" ? "Bill payer" : p.role}:{" "}
                    <Link href={`/customers/${p.organisation_id}`}>
                      {p.display_name}
                    </Link>{" "}
                    · {p.is_current ? "Current" : "Historic or future"}
                  </p>
                ))}
                <p>
                  Operator, property owner and bill payer are separate
                  relationships. They do not grant access or financial
                  authority.
                </p>
              </article>
            ))}
            {!value.sites.items.length && (
              <p>No Site relationships in your permitted scope.</p>
            )}
          </RecordPanel>
        </>
      )}
    </div>
  );
}
