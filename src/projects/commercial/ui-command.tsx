"use client";
import { useEffect, useRef, useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  ReadState,
  ValidationFields,
  useResource,
  type Failure,
  type Option,
} from "../../components/business-ui";
import { Button } from "../../components/ui/button";
import { WorklistPanel } from "../../components/crm-worklist-tools";
import {
  LocalDateTimeField,
  LookupField,
  useUnsavedChanges,
} from "../../components/record-ui";
import type { Source } from "./validation";
import {
  blankContent,
  moneyLabel,
  type Finance,
  commandFields,
  kindLabel,
  type Intent,
  type Context,
  type Pending,
} from "./ui-model";

const decisionLabels: Record<string, string> = {
  Approved: "Approve",
  Rejected: "Reject",
  Disputed: "Dispute",
  Returned: "Return",
  Waived: "Waive",
};
type Choices = { items: Option[]; has_more: boolean };
export function CommercialCommand({
  intent,
  context,
  onClose,
  onSaved,
}: {
  intent: Intent;
  context: Context;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const project = context.project.id,
    route = `projects/${project}/commercial`;
  const [id] = useState(() =>
    intent.action === "Create" ? crypto.randomUUID() : intent.row!.id,
  );
  const [content, setContent] = useState(() =>
    intent.action === "Create" && intent.row
      ? { ...intent.row.content }
      : (intent.row?.content ?? blankContent(context.actor_id)),
  );
  const [reason, setReason] = useState(""),
    [note, setNote] = useState(""),
    [outcome, setOutcome] = useState(
      intent.kind === "Obligation" ? "Waived" : "Approved",
    );
  const [handover, setHandover] = useState(""),
    [quote, setQuote] = useState(""),
    [document, setDocument] = useState("");
  const [pending, setPending] = useState<Pending | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [journalReady, setJournalReady] = useState(false);
  const uncertain = useRef(false),
    inFlight = useRef(false);
  // The journal retains an exact pending operation only, never an offline record cache.
  const storageKey = `ppo.commercial.pending:${context.workspace_id}:${context.actor_id}:${project}`;
  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw) as Pending;
          if (!saved.id || !saved.body?.operation_id) throw Error();
          setPending(saved);
          uncertain.current = true;
        }
        setJournalReady(true);
      } catch {
        setError({
          message:
            "Recovery storage is unavailable. No new action can be sent until the original command can be recovered.",
        });
      }
    });
    return () => {
      live = false;
    };
  }, [storageKey]);
  const fields = intent.action === "Create" || intent.action === "Revise",
    basis = fields && intent.kind === "Basis" && intent.action === "Create";
  const [search, setSearch] = useState({
    owners: "",
    activities: "",
    handovers: "",
    quotations: "",
    documents: "",
  });
  const owners = useResource<Choices>(
    fields
      ? `${route}/basis-options?picker=owners&q=${encodeURIComponent(search.owners)}`
      : null,
  );
  const activities = useResource<Choices>(
    fields
      ? `${route}/basis-options?picker=activities&q=${encodeURIComponent(search.activities)}`
      : null,
  );
  const handovers = useResource<Choices>(
    basis
      ? `${route}/basis-options?picker=handovers&q=${encodeURIComponent(search.handovers)}`
      : null,
  );
  const quotes = useResource<Choices>(
    basis && handover
      ? `${route}/basis-options?picker=quotations&handover_id=${handover}&q=${encodeURIComponent(search.quotations)}`
      : null,
  );
  const documents = useResource<Choices>(
    basis
      ? `${route}/basis-options?picker=documents&q=${encodeURIComponent(search.documents)}`
      : null,
  );
  const exact = useResource<{ source: { input: Source; amount: string } }>(
    basis && handover && quote && document
      ? `${route}/basis-options?handover_id=${handover}&quote_revision_id=${quote}&document_id=${document}`
      : null,
  );
  const finance = useResource<Finance>(basis ? `${route}/finance` : null);
  const release = useUnsavedChanges(true, busy || !!pending);
  const title =
    intent.action === "Create"
      ? intent.predecessor
        ? intent.kind === "Notice"
          ? "Correct notice evidence"
          : "New signed adjustment"
        : intent.kind === "Notice"
          ? "Record a notice"
          : intent.kind === "Basis"
            ? "Propose commercial basis"
            : `New ${kindLabel(intent.kind).toLowerCase()}`
      : intent.action === "Decide"
        ? "Record decision"
        : intent.action === "Satisfy"
          ? "Mark satisfied"
          : intent.action === "Submit" && intent.kind === "Obligation"
            ? "Request waiver"
            : `${intent.action} ${kindLabel(intent.kind).toLowerCase()}`;
  const close = () => {
    if (busy || pending) return;
    if (reason || note || fields) {
      if (!window.confirm("Discard unsaved commercial changes?")) return;
    }
    release();
    onClose();
  };
  const accepted = (saved: Pending) => {
    // Clearing the journal is part of confirmation: failure keeps recovery available.
    sessionStorage.removeItem(storageKey);
    setPending(null);
    uncertain.current = false;
    release();
    onSaved(saved.id);
  };
  const send = async () => {
    if (inFlight.current || !journalReady) return;
    let original = pending;
    if (!original) {
      original = {
        title,
        id,
        body: {
          ...commandFields(
            intent,
            content,
            exact.data?.source.input ?? null,
            id,
            reason,
            note,
            outcome,
          ),
          operation_id: crypto.randomUUID(),
          schema_version: 1,
        },
      };
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(original));
      } catch {
        setError({
          message:
            "Recovery storage is unavailable. This command was not submitted.",
        });
        return;
      }
      setPending(original);
    }
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await api(route, original.body);
      accepted(original);
    } catch (e) {
      const f = e as Failure;
      if (uncertain.current || f.retryable || !f.status || f.status >= 500) {
        uncertain.current = true;
        setError(e);
      } else {
        sessionStorage.removeItem(storageKey);
        setPending(null);
        setError(e);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const recover = async () => {
    if (!pending || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await api(`operations/${pending.body.operation_id}`);
      accepted(pending);
    } catch (e) {
      setError(
        (e as Failure).status === 404
          ? {
              message:
                "No confirmed receipt is available. Keep the original command and retry it unchanged; a missing receipt does not prove failure.",
            }
          : e,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const update = (key: keyof typeof content, value: unknown) =>
    setContent((old) => ({ ...old, [key]: value }));
  const ownerOptions = owners.data?.items ?? [];
  const choices = [
    intent.kind === "Basis"
      ? ["Approved", "Returned"]
      : intent.kind === "Obligation"
        ? ["Waived", "Returned"]
        : ["Approved", "Rejected", "Disputed"],
  ][0];
  const invalidated = (error as Failure)?.status === 409 && !pending;
  return (
    <WorklistPanel
      title={pending?.title ?? title}
      drawer={intent.action === "Create"}
      onClose={close}
    >
      <div className="commercial-command">
        {pending ? (
          <>
            <p role="status">
              {busy
                ? "Waiting for confirmation of this action."
                : "The save outcome is unconfirmed. The original action and version are locked. Check its receipt or retry the unchanged command."}
            </p>
            <ErrorNotice error={error} />
            <div className="commercial-actions">
              <Button busy={busy} onClick={recover}>
                Check saved result
              </Button>
              <Button busy={busy} onClick={send}>
                Retry unchanged
              </Button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <ValidationFields error={error}>
              <p>
                {intent.action === "Decide"
                  ? `Decide version ${intent.row!.version}. Approval records the exact priced terms. Control values update after approval.`
                  : intent.kind === "Notice"
                    ? "Records evidence only. Nothing is sent or claimed as legally served."
                    : "Record the proposed terms. Date impacts do not move the project schedule."}
              </p>
              <ErrorNotice error={error} />
              {invalidated && (
                <p role="alert">
                  The record or its source changed. Close this dialog and
                  refresh before starting a new action.
                </p>
              )}
              <fieldset disabled={busy || invalidated || !journalReady}>
                {basis && (
                  <>
                    <LookupField
                      name="handover"
                      label="Received Sales handover"
                      value={handover}
                      onChange={(v) => {
                        finance.reload();
                        setHandover(v);
                        setQuote("");
                      }}
                      options={handovers.data?.items ?? []}
                      search={search.handovers}
                      onSearch={(q) =>
                        setSearch((old) => ({ ...old, handovers: q }))
                      }
                      loading={handovers.loading}
                      error={!!handovers.error}
                      more={handovers.data?.has_more}
                    />
                    <ReadState
                      loading={handovers.loading}
                      error={handovers.error}
                      retry={handovers.reload}
                    />
                    <LookupField
                      name="quotation"
                      label="Accepted quotation"
                      value={quote}
                      onChange={(v) => {
                        finance.reload();
                        setQuote(v);
                      }}
                      options={quotes.data?.items ?? []}
                      search={search.quotations}
                      onSearch={(q) =>
                        setSearch((old) => ({ ...old, quotations: q }))
                      }
                      loading={quotes.loading}
                      error={!!quotes.error}
                      more={quotes.data?.has_more}
                    />
                    <ReadState
                      loading={quotes.loading}
                      error={quotes.error}
                      retry={quotes.reload}
                    />
                    <LookupField
                      name="document"
                      label="Reviewed contract document"
                      value={document}
                      onChange={(v) => {
                        finance.reload();
                        setDocument(v);
                      }}
                      options={documents.data?.items ?? []}
                      search={search.documents}
                      onSearch={(q) =>
                        setSearch((old) => ({ ...old, documents: q }))
                      }
                      loading={documents.loading}
                      error={!!documents.error}
                      more={documents.data?.has_more}
                    />
                    <ReadState
                      loading={documents.loading || exact.loading}
                      error={documents.error || exact.error}
                      retry={() => {
                        documents.reload();
                        exact.reload();
                      }}
                    />
                    {exact.data && !exact.loading && !exact.error && (
                      <p>
                        Exact source verified for this proposal. It is checked
                        again when saved. Original control value:{" "}
                        {finance.data && !finance.loading && !finance.error
                          ? moneyLabel(exact.data.source.amount)
                          : "Unavailable"}
                        .
                      </p>
                    )}
                  </>
                )}
                {fields && (
                  <>
                    <Field
                      name="title"
                      label="Title"
                      value={content.title}
                      onChange={(v) => update("title", v)}
                      required
                      maxLength={200}
                    />
                    <Field
                      name="clause"
                      label="Clause"
                      value={content.clause}
                      onChange={(v) => update("clause", v)}
                      required
                      maxLength={500}
                    />
                    <Field
                      name="detail"
                      label={
                        intent.kind === "Variation"
                          ? "Scope and exclusions"
                          : "Requirement or narrative"
                      }
                      value={content.detail}
                      onChange={(v) => update("detail", v)}
                      required
                      multiline
                      maxLength={4000}
                    />
                    {intent.kind === "Variation" && (
                      <>
                        <div className="commercial-fields">
                          <div>
                            <label className="commercial-toggle">
                              <input
                                type="checkbox"
                                checked={content.requested_amount === null}
                                onChange={(e) =>
                                  update(
                                    "requested_amount",
                                    e.target.checked ? null : "",
                                  )
                                }
                              />{" "}
                              Requested amount unknown
                            </label>
                            <fieldset
                              disabled={content.requested_amount === null}
                            >
                              <Field
                                name="requested_amount"
                                label="Requested · AUD excluding GST"
                                value={content.requested_amount ?? ""}
                                onChange={(v) => update("requested_amount", v)}
                                hint="Use a minus sign for a credit. Zero must be explicit."
                                required
                              />
                            </fieldset>
                          </div>
                          <div>
                            <label className="commercial-toggle">
                              <input
                                type="checkbox"
                                checked={content.priced_amount === null}
                                onChange={(e) =>
                                  update(
                                    "priced_amount",
                                    e.target.checked ? null : "",
                                  )
                                }
                              />{" "}
                              Not priced yet
                            </label>
                            <fieldset disabled={content.priced_amount === null}>
                              <Field
                                name="priced_amount"
                                label="Priced · AUD excluding GST"
                                value={content.priced_amount ?? ""}
                                onChange={(v) => update("priced_amount", v)}
                                hint="Zero must be explicit."
                                required
                              />
                            </fieldset>
                          </div>
                        </div>
                        <Field
                          name="date_impact"
                          label="Date impact proposal"
                          value={content.date_impact ?? ""}
                          onChange={(v) => update("date_impact", v || null)}
                          multiline
                          maxLength={2000}
                        />
                      </>
                    )}
                    {intent.kind === "Obligation" && (
                      <>
                        <Field
                          name="due_date"
                          label="Due date"
                          type="date"
                          value={content.due_date ?? ""}
                          onChange={(v) =>
                            setContent((old) => ({
                              ...old,
                              due_date: v || null,
                              date_needed: !v,
                            }))
                          }
                          hint="Leave blank when the date is needed. No contractual deadline is calculated."
                        />
                        <Field
                          name="evidence"
                          label="Satisfaction evidence"
                          value={content.evidence ?? ""}
                          onChange={(v) => update("evidence", v || null)}
                          multiline
                          maxLength={4000}
                        />
                      </>
                    )}
                    {intent.kind === "Notice" && (
                      <>
                        <LocalDateTimeField
                          name="occurred_at"
                          label="Reported occurrence"
                          value={content.occurred_at ?? ""}
                          onChange={(v) => update("occurred_at", v || null)}
                          timezone={context.project.timezone}
                        />
                        <Field
                          name="evidence"
                          label="Notice evidence"
                          value={content.evidence ?? ""}
                          onChange={(v) => update("evidence", v || null)}
                          required
                          multiline
                          maxLength={4000}
                        />
                      </>
                    )}
                    {intent.action === "Create" ? (
                      <LookupField
                        name="owner_id"
                        label="Owner"
                        value={content.owner_id}
                        onChange={(v) => update("owner_id", v)}
                        options={ownerOptions}
                        search={search.owners}
                        onSearch={(q) =>
                          setSearch((old) => ({ ...old, owners: q }))
                        }
                        loading={owners.loading}
                        error={!!owners.error}
                        more={owners.data?.has_more}
                      />
                    ) : (
                      <p>Owner: {intent.row?.owner_name} · retained</p>
                    )}
                    <ReadState
                      loading={owners.loading}
                      error={owners.error}
                      retry={owners.reload}
                    />
                    <fieldset>
                      <legend>Linked Activities · up to 20</legend>
                      <Field
                        name="activity_search"
                        label="Find a linked Activity"
                        value={search.activities}
                        onChange={(q) =>
                          setSearch((old) => ({ ...old, activities: q }))
                        }
                      />
                      {activities.data?.items.map((a) => (
                        <label className="commercial-check" key={a.id}>
                          <input
                            type="checkbox"
                            checked={content.action_ids.includes(a.id)}
                            disabled={
                              intent.action !== "Create" &&
                              !!intent.row?.content.action_ids.includes(a.id)
                            }
                            onChange={(e) =>
                              update(
                                "action_ids",
                                e.target.checked
                                  ? [...content.action_ids, a.id]
                                  : content.action_ids.filter(
                                      (id) => id !== a.id,
                                    ),
                              )
                            }
                          />
                          {a.display_name}
                        </label>
                      ))}
                      {!activities.loading &&
                        !activities.error &&
                        !activities.data?.items.length && (
                          <p>No permitted project Activities.</p>
                        )}
                      <ReadState
                        loading={activities.loading}
                        error={activities.error}
                        retry={activities.reload}
                      />
                      {activities.data?.has_more && (
                        <p>
                          Only the first 100 permitted Activities are offered.
                        </p>
                      )}
                    </fieldset>
                  </>
                )}
                {intent.action === "Decide" && (
                  <fieldset className="commercial-decision-choices">
                    <legend>Outcome</legend>
                    {choices.map((choice) => (
                      <label key={choice}>
                        <input
                          type="radio"
                          name="outcome"
                          value={choice}
                          checked={outcome === choice}
                          onChange={() => setOutcome(choice)}
                          required
                        />
                        <span>
                          <strong>{decisionLabels[choice] ?? choice}</strong>
                          <small>
                            {choice === "Approved"
                              ? intent.kind === "Basis"
                                ? "Approves the retained original basis"
                                : `Approves the submitted price of ${moneyLabel(intent.row?.content.priced_amount)}`
                              : choice === "Disputed"
                                ? "Kept disputed until decided again"
                                : choice === "Rejected"
                                  ? "Can be revised and resubmitted"
                                  : choice === "Waived"
                                    ? "Waives this obligation on the retained evidence"
                                    : "Returns the proposal for revision"}
                          </small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}
                <Field
                  name="reason"
                  label="Reason"
                  value={reason}
                  onChange={setReason}
                  required
                  maxLength={1000}
                />
                <Field
                  name="note"
                  label="Note"
                  value={note}
                  onChange={setNote}
                  required
                  multiline
                  maxLength={2000}
                />
                <div className="commercial-actions">
                  <Button onClick={close}>Cancel</Button>
                  <Button
                    type="submit"
                    variant="primary"
                    busy={busy}
                    disabled={
                      basis && (!exact.data || exact.loading || !!exact.error)
                    }
                  >
                    {intent.action === "Create" && intent.kind === "Variation"
                      ? `Save as ${content.priced_amount === null ? "Requested" : "Assessed"}`
                      : title}
                  </Button>
                </div>
              </fieldset>
            </ValidationFields>
          </form>
        )}
      </div>
    </WorklistPanel>
  );
}
