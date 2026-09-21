"use client";
import { useEffect, useRef, useState } from "react";
import { api, type Failure } from "../../components/business-ui";
import { useIdentity } from "../../components/business-session";
import type { OperationReceipt } from "../../platform/operations";
import type { Detail } from "./model";
import type { Action, Fields } from "./validation";
import type { Data, Proposal } from "./workspace";
const titles: Record<Action, string> = {
  create: "Create acceptance stage",
  edit: "Edit draft stage",
  unit: "Add project scope unit",
  scope: "Edit exact stage scope",
  disposition: "Authorise scope removal or restoration",
  submit: "Submit exact revision",
  return: "Return review",
  successor: "Create successor revision",
  check: "Check required sources",
  technical: "Confirm technical applicability",
  source: "Record synthetic source evidence",
  requirement: "Add exact requirement",
  obligation: "Record outstanding obligation",
  transfer: "Accept continuing responsibility",
  completeObligation: "Record source completion",
  prepare: "Prepare exact handover pack",
  issue: "Issue exact handover pack",
  request: "Submit local handover request",
  response: "Record customer response",
  validate: "Validate exact customer response",
  receive: "Record independent Service receiving",
  commercial: "Record commercial disposition",
  closeStage: "Review stage closeout",
  closeProject: "Review whole-project closeout",
  reopen: "Reopen exact scope",
  amendment: "Record scoped amendment",
};
export function AcceptanceDialog({
  data,
  detail,
  proposal,
  onClose,
  onSaved,
}: {
  data: Data;
  detail: Detail | null;
  proposal: Proposal;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { action } = proposal,
    identity = useIdentity(),
    dialog = useRef<HTMLDialogElement>(null),
    form = useRef<HTMLFormElement>(null),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<Failure | null>(null),
    [unknown, setUnknown] = useState(false),
    [original, setOriginal] = useState<Record<string, unknown> | null>(null),
    [reviewed, setReviewed] = useState(false),
    [renewal, setRenewal] = useState<Data | null>(null),
    [renewed, setRenewed] = useState(false),
    [audience, setAudience] = useState(proposal.fields?.audience ?? "Customer"),
    [sourceKind, setSourceKind] = useState(
      proposal.fields?.kind ?? "Technical",
    );
  const base = useRef({
    version: proposal.project
      ? data.project.version
      : (detail?.stage.version ?? data.project.version),
    facts: proposal.project
      ? data.project_facts_hash
      : (detail?.facts_hash ?? null),
  });
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    return () => {
      if (prior?.isConnected) prior.focus();
    };
  }, []);
  const close = () => {
    if (!dirty || window.confirm("Discard the unsaved decision entries?"))
      onClose();
  };
  const initial = { ...proposal.fields };
  const text = (
    name: string,
    label: string,
    value: string | number | null | undefined = "",
    required = true,
    type = "text",
  ) => (
    <label key={name}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={required}
        maxLength={type === "text" ? 4000 : undefined}
      />
    </label>
  );
  const area = (
    name: string,
    label: string,
    value: string | undefined = "",
    required = true,
  ) => (
    <label key={name}>
      {label}
      <textarea
        name={name}
        defaultValue={value ?? ""}
        required={required}
        rows={3}
        maxLength={4000}
      />
    </label>
  );
  const select = (
    name: string,
    label: string,
    options: readonly string[] | { id: string; name: string }[],
    value?: string,
  ) => (
    <label key={name}>
      {label}
      <select
        name={name}
        defaultValue={
          value ??
          (typeof options[0] === "string" ? options[0] : options[0]?.id)
        }
        required
      >
        {options.map((o) => (
          <option
            key={typeof o === "string" ? o : o.id}
            value={typeof o === "string" ? o : o.id}
          >
            {typeof o === "string" ? o : o.name}
          </option>
        ))}
      </select>
    </label>
  );
  const people = (duty: string) =>
    data.people.filter((p) => p.duties.includes(duty as never));
  const owner = () =>
    select(
      "owner_id",
      "Responsible owner",
      people("scope"),
      initial.owner_id ??
        (proposal.project
          ? data.project.coordinator_id
          : detail?.stage.owner_id) ??
        data.project.coordinator_id,
    );
  const due = () => (
    <>
      {text(
        "due",
        "Due date",
        initial.due ?? (proposal.project ? null : detail?.stage.due),
        false,
        "date",
      )}
      {text(
        "due_basis",
        "Due date meaning / agreed date-needed basis",
        initial.due_basis ?? "Review due",
      )}
    </>
  );
  const scopeUnits = () =>
    data.ledger.map((u) => (
      <label className="ac-scope-choice" key={u.id}>
        <input
          type="checkbox"
          name="unit_ids"
          value={u.id}
          defaultChecked={
            detail?.units.some(
              (x) => x.id === u.id && x.disposition === "Included",
            ) ?? false
          }
        />
        <span>
          {u.title}
          <small>
            {u.reference} · {u.configuration_version}
          </small>
        </span>
      </label>
    ));
  async function reconcile() {
    if (!original) return;
    setBusy(true);
    try {
      const r = await api<OperationReceipt>(
        `operations/${original.operation_id}`,
      );
      await api(`projects/acceptance/intents/${original!.operation_id}`, {
        disposition: "Seen",
      }).catch(() => undefined);
      onSaved(r.record_id);
    } catch (e) {
      setError(e as Failure);
    } finally {
      setBusy(false);
    }
  }
  async function send(body: Record<string, unknown>) {
    setOriginal(body);
    setBusy(true);
    setError(null);
    try {
      const r = await api<OperationReceipt>("projects/acceptance", body);
      setDirty(false);
      await api(`projects/acceptance/intents/${body.operation_id}`, {
        disposition: "Seen",
      }).catch(() => undefined);
      onSaved(r.record_id);
    } catch (e) {
      const failure = e as Failure;
      setError(failure);
      setUnknown(!failure.status || failure.status >= 500);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (unknown || (renewal && !renewed)) return;
    const fd = new FormData(form.current!),
      fields: Fields = { ...initial };
    const value = (key: string) => String(fd.get(key) ?? "").trim(),
      optional = (key: string) => value(key) || null;
    const ids = [
      "create",
      "unit",
      "source",
      "requirement",
      "obligation",
      "prepare",
      "request",
      "response",
    ];
    if (ids.includes(action)) fields.id = initial.id ?? crypto.randomUUID();
    if (["create", "edit"].includes(action)) {
      fields.title = value("title");
      fields.owner_id = value("owner_id");
      fields.due = optional("due");
      fields.due_basis = value("due_basis");
    }
    if (action === "disposition")
      Object.assign(fields, {
        required: value("required") === "Required",
        removal_reference: value("removal_reference"),
      });
    if (action === "unit")
      Object.assign(fields, {
        reference: value("reference"),
        title: value("title"),
        system_name: value("system_name"),
        function_name: value("function_name"),
        installed_at: value("installed_at"),
        served_areas: value("served_areas")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        configuration_version: value("configuration_version"),
        required: true,
      });
    if (action === "scope")
      fields.units = data.ledger
        .filter((u) => value("disposition:" + u.id) !== "Unallocated")
        .map((u) => ({
          unit_id: u.id,
          disposition: value("disposition:" + u.id) as "Included" | "Excluded",
          reason: value("scope_reason:" + u.id) || value("reason"),
          relationship: optional("relationship:" + u.id),
        }));
    if (action === "return") fields.owner_id = value("owner_id");
    if (action === "source") {
      const details = { ...initial.details, evidence: value("evidence") };
      if (sourceKind === "Technical")
        Object.assign(details, {
          tests_accepted: Number(value("tests_accepted")),
          tests_required: Number(value("tests_required")),
          release: value("release"),
        });
      if (sourceKind === "Training")
        Object.assign(details, {
          planned_on: optional("planned_on"),
          delivered_on: optional("delivered_on"),
          attendance: value("attendance"),
          competence: value("competence"),
        });
      if (sourceKind === "Backup")
        Object.assign(details, {
          backup_available: fd.has("backup_available"),
          identity_verified: fd.has("identity_verified"),
          restore_verified: fd.has("restore_verified"),
        });
      if (sourceKind === "Manual")
        Object.assign(details, {
          source_reference: value("source_reference"),
          availability_evidence: value("availability_evidence"),
        });
      if (sourceKind === "Commercial")
        Object.assign(details, {
          source_reference: value("source_reference"),
          as_at: value("as_at"),
          completeness: value("completeness"),
          currency: value("currency"),
        });
      if (value("authority_reference"))
        Object.assign(details, {
          authority_reference: value("authority_reference"),
        });
      Object.assign(fields, {
        title: value("title"),
        kind: sourceKind,
        outcome: value("outcome"),
        availability: value("availability"),
        public_reference: value("public_reference"),
        source_version: value("source_version"),
        details,
      });
    }
    if (action === "requirement")
      Object.assign(fields, {
        unit_id: value("unit_id"),
        source_id: value("source_id"),
        title: value("title"),
        gate: value("gate"),
        mandatory: true,
        owner_id: value("owner_id"),
        due: optional("due"),
        due_basis: value("due_basis"),
      });
    if (action === "obligation")
      Object.assign(fields, {
        unit_id: value("unit_id"),
        source_id: optional("source_id"),
        title: value("title"),
        owner_id: value("owner_id"),
        recipient_id: value("recipient_id"),
        due: optional("due"),
        due_basis: value("due_basis"),
        required_evidence: value("required_evidence"),
        control_reference: value("control_reference"),
        eligible: fd.has("eligible"),
        conditions: value("conditions"),
        review_rule: value("review_rule"),
      });
    if (action === "completeObligation") fields.evidence = value("evidence");
    if (action === "prepare")
      Object.assign(fields, {
        audience,
        recipient_id: value("recipient_id"),
        purpose: value("purpose"),
      });
    if (action === "request") fields.due = optional("due");
    if (action === "response")
      Object.assign(fields, {
        request_id: value("request_id"),
        respondent_id: value("respondent_id"),
        authority_basis: value("authority_basis"),
        method: value("method"),
        evidence: value("evidence"),
        outcome: value("outcome"),
        response_time: optional("response_time"),
        time_precision: value("time_precision"),
        conditions: value("conditions") || undefined,
        unit_ids: fd.getAll("unit_ids").map(String),
      });
    if (action === "validate")
      fields.authority_basis = value("authority_basis");
    if (action === "receive")
      Object.assign(fields, {
        request_id: value("request_id"),
        outcome: value("outcome"),
        evidence: value("evidence"),
        owner_id: value("owner_id"),
      });
    if (action === "commercial")
      Object.assign(fields, {
        outcome: value("outcome"),
        evidence: value("evidence"),
        source_id: value("source_id"),
      });
    if (["reopen", "amendment"].includes(action))
      fields.unit_ids = fd.getAll("unit_ids").map(String);
    const body = {
      operation_id: crypto.randomUUID(),
      schema_version: 1,
      reason: value("reason"),
      action,
      project_id: data.project.id,
      stage_id: proposal.project ? null : (detail?.stage.id ?? null),
      expected_version: base.current.version,
      facts_hash: base.current.facts,
      fields,
    };
    await send(body);
  }
  const requirements =
    action === "closeProject"
      ? data.project_gates
      : action === "closeStage"
        ? detail?.closeout_gates
        : action === "technical"
          ? detail?.technical_gates
          : action === "prepare"
            ? detail?.handover_gates
            : [];
  return (
    <dialog
      ref={dialog}
      className={
        "ac-dialog" +
        ([
          "scope",
          "unit",
          "source",
          "requirement",
          "obligation",
          "response",
        ].includes(action)
          ? " ac-full-editor"
          : "")
      }
      aria-labelledby="ac-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form ref={form} onSubmit={submit} onChange={() => setDirty(true)}>
        <header>
          <h2 id="ac-dialog-title">{titles[action]}</h2>
          <button
            type="button"
            className="ac-button"
            aria-label="Close decision"
            onClick={close}
          >
            ×
          </button>
        </header>
        <div className="ac-dialog-body">
          <p>
            {data.project.display_number} ·{" "}
            {proposal.project
              ? "Whole project"
              : `${detail?.stage.reference} · revision ${detail?.stage.revision}`}
          </p>
          {requirements && requirements.length > 0 && (
            <div className="ac-notice">
              <strong>Requirements still outstanding</strong>
              <ul>
                {requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {["create", "edit"].includes(action) && (
            <>
              {text(
                "title",
                "Acceptance stage",
                initial.title ?? (action === "edit" ? detail?.stage.title : ""),
              )}
              {owner()}
              {due()}
            </>
          )}
          {action === "disposition" && (
            <>
              <p>
                This decision retains the original unit and all shared
                dependencies. Existing stages require reassessment; removing a
                unit does not close its obligations.
              </p>
              {select(
                "required",
                "Project requirement",
                ["Required", "Removed by authorised change"],
                initial.required ? "Required" : "Removed by authorised change",
              )}
              {text(
                "removal_reference",
                "Authoritative scope change reference",
              )}
            </>
          )}
          {action === "unit" && (
            <>
              {text("reference", "Scope reference")}
              {text("title", "Scope unit")}
              {text("system_name", "System")}
              {text("function_name", "Function")}
              {text("installed_at", "Installed location")}
              {text("served_areas", "Served areas (comma separated)")}
              {text("configuration_version", "Exact configuration version")}
            </>
          )}
          {action === "scope" && (
            <>
              <p>
                Excluded units remain in the whole-project ledger. An overlap
                needs its exact relationship.
              </p>
              {data.ledger.map((u) => (
                <fieldset key={u.id}>
                  <legend>{u.title}</legend>
                  {select(
                    "disposition:" + u.id,
                    "Scope inclusion",
                    ["Unallocated", "Included", "Excluded"],
                    detail?.units.find((x) => x.id === u.id)?.disposition ??
                      "Unallocated",
                  )}
                  {text(
                    "scope_reason:" + u.id,
                    "Scope / exclusion reason",
                    detail?.units.find((x) => x.id === u.id)?.reason,
                    false,
                  )}
                  {text(
                    "relationship:" + u.id,
                    "Overlap / reassignment relationship",
                    detail?.units.find((x) => x.id === u.id)?.relationship,
                    false,
                  )}
                </fieldset>
              ))}
            </>
          )}
          {action === "return" && owner()}
          {action === "source" && (
            <>
              <p className="ac-notice">
                Labelled synthetic evidence. EN-08 records must be resolved in
                their owning workspace.
              </p>
              {text("title", "Source title", initial.title)}
              <label>
                Evidence kind
                <select
                  value={sourceKind}
                  onChange={(e) => setSourceKind(e.target.value)}
                >
                  {[
                    "Technical",
                    "Training",
                    "Manual",
                    "Backup",
                    "Warranty",
                    "Commercial",
                    "Hold",
                  ].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              {select(
                "outcome",
                "Source outcome",
                [
                  "Outstanding",
                  "Satisfied",
                  "Blocked",
                  "Cannot assess",
                  "Not required",
                ],
                initial.outcome,
              )}
              {select(
                "availability",
                "Source availability",
                [
                  "Current",
                  "Changed",
                  "Unavailable",
                  "Restricted",
                  "Not checked",
                ],
                initial.availability,
              )}
              {text(
                "public_reference",
                "Public source reference",
                initial.public_reference,
              )}
              {text(
                "source_version",
                "Exact source version",
                initial.source_version,
              )}
              {area(
                "evidence",
                "Source evidence / assessed result",
                initial.details?.evidence,
              )}
              {sourceKind === "Technical" && (
                <>
                  {text(
                    "tests_accepted",
                    "Test evidence accepted",
                    initial.details?.tests_accepted ?? 0,
                    true,
                    "number",
                  )}
                  {text(
                    "tests_required",
                    "Required test evidence",
                    initial.details?.tests_required ?? 0,
                    true,
                    "number",
                  )}
                  {text(
                    "release",
                    "Exact released technical issue",
                    initial.details?.release,
                  )}
                </>
              )}
              {sourceKind === "Training" && (
                <>
                  {text(
                    "planned_on",
                    "Training planned",
                    initial.details?.planned_on,
                    false,
                    "date",
                  )}
                  {text(
                    "delivered_on",
                    "Training delivered",
                    initial.details?.delivered_on,
                    false,
                    "date",
                  )}
                  {area(
                    "attendance",
                    "Attendance evidence",
                    initial.details?.attendance,
                  )}
                  {area(
                    "competence",
                    "Separate competence evidence",
                    initial.details?.competence,
                  )}
                </>
              )}
              {sourceKind === "Backup" && (
                <>
                  {(
                    [
                      "backup_available",
                      "identity_verified",
                      "restore_verified",
                    ] as const
                  ).map((k) => (
                    <label key={k}>
                      <input
                        type="checkbox"
                        name={k}
                        defaultChecked={initial.details?.[k] ?? false}
                      />
                      {k.replaceAll("_", " ")}
                    </label>
                  ))}
                </>
              )}
              {["Manual", "Commercial"].includes(sourceKind) &&
                text(
                  "source_reference",
                  "Controlled source reference",
                  initial.details?.source_reference,
                )}
              {sourceKind === "Manual" &&
                area(
                  "availability_evidence",
                  "Exact version availability evidence",
                  initial.details?.availability_evidence,
                )}
              {sourceKind === "Commercial" && (
                <>
                  {text(
                    "as_at",
                    "Source as-at (with timezone)",
                    initial.details?.as_at,
                  )}
                  {select(
                    "completeness",
                    "Source completeness",
                    ["Partial", "Complete", "Unknown"],
                    initial.details?.completeness,
                  )}
                  {text(
                    "currency",
                    "Source currency (or Not applicable)",
                    initial.details?.currency,
                  )}
                </>
              )}
              {text(
                "authority_reference",
                "Not-required applicability authority, if applicable",
                initial.details?.authority_reference,
                false,
              )}
            </>
          )}
          {action === "requirement" && (
            <>
              {text("title", "Requirement")}
              {select(
                "unit_id",
                "Exact scope unit",
                data.ledger.map((u) => ({ id: u.id, name: u.title })),
              )}
              {select(
                "source_id",
                "Source evidence",
                data.sources.map((s) => ({
                  id: s.id,
                  name: `${s.title} · ${s.source_version}`,
                })),
              )}
              {select("gate", "Required for", [
                "Technical",
                "Handover",
                "Closeout",
                "Commercial",
              ])}
              {owner()}
              {due()}
            </>
          )}
          {action === "obligation" && (
            <>
              {text("title", "Outstanding work")}
              {select(
                "unit_id",
                "Affected scope",
                (detail?.units ?? []).map((u) => ({ id: u.id, name: u.title })),
              )}
              {select("source_id", "Owning source", [
                { id: "", name: "Stage-owned obligation" },
                ...data.sources.map((s) => ({ id: s.id, name: s.title })),
              ])}
              {owner()}
              {select(
                "recipient_id",
                "Independent accountable recipient",
                people("receive").filter((p) => p.id !== identity.actor_id),
              )}
              {due()}
              {area(
                "conditions",
                "Exact conditions agreed with the accepting party",
              )}
              {area("required_evidence", "Evidence needed for completion")}
              {text(
                "control_reference",
                "Source policy / risk-control reference",
              )}
              {area("review_rule", "Review and escalation rule")}
              <label>
                <input name="eligible" type="checkbox" />
                Source policy permits this nonblocking work to continue after
                closeout
              </label>
            </>
          )}
          {action === "completeObligation" &&
            area("evidence", "Accepted source completion evidence")}
          {action === "prepare" && (
            <>
              <label>
                Audience
                <select
                  value={audience}
                  onChange={(e) =>
                    setAudience(e.target.value as "Customer" | "Service")
                  }
                >
                  <option>Customer</option>
                  <option>Service</option>
                </select>
              </label>
              {select(
                "recipient_id",
                "Named recipient",
                audience === "Customer"
                  ? data.customers
                  : people("receive").filter((p) => p.id !== identity.actor_id),
                initial.recipient_id,
              )}
              {text(
                "purpose",
                "Handover purpose",
                "Staged acceptance and continuing support",
              )}
            </>
          )}
          {action === "request" && (
            <>
              <p>
                Records a local request to the exact issued manifest. No email
                or external delivery occurs.
              </p>
              {text("due", "Requested response date", null, false, "date")}
            </>
          )}
          {action === "response" && (
            <>
              <p>
                Recorded from evidence. The recorder is not the customer
                signatory; validation is a separate decision.
              </p>
              {select(
                "request_id",
                "Exact issued customer request",
                (detail?.manifests ?? [])
                  .filter((m) => m.audience === "Customer" && m.request_id)
                  .map((m) => ({
                    id: m.request_id!,
                    name: `Revision ${m.revision} · ${m.purpose} · ${m.id.slice(0, 8)}`,
                  })),
                initial.request_id,
              )}
              {select(
                "respondent_id",
                "Actual responding person",
                data.customers,
              )}
              {text(
                "authority_basis",
                "Respondent authority basis (unknown may be recorded)",
              )}
              {select("method", "Response method", [
                "Recorded from evidence",
                "Synthetic recipient response",
              ])}
              {area("evidence", "Incoming response evidence")}
              {select("outcome", "Actual response", [
                "Accepted",
                "With conditions",
                "Reservations",
                "Declined",
                "Disputed",
                "Returned",
              ])}
              {select("time_precision", "Response time precision", [
                "Date",
                "Instant",
                "Unknown",
              ])}
              {text(
                "response_time",
                "Actual response date or ISO timestamp; blank if unknown",
                "",
                false,
              )}
              {area("conditions", "Exact reservations / conditions", "", false)}
              <fieldset>
                <legend>Scope actually covered by this response</legend>
                {scopeUnits()}
              </fieldset>
            </>
          )}
          {action === "validate" && (
            <>
              {area(
                "authority_basis",
                "Verified appointment / contract / scoped authority evidence",
              )}
              <p>
                Validation applies only to the recorded responding person, exact
                issued scope and stated response. It grants no technical or
                commercial approval.
              </p>
            </>
          )}
          {action === "receive" && (
            <>
              {select(
                "request_id",
                "Exact Service request",
                (detail?.manifests ?? [])
                  .filter(
                    (m) =>
                      m.audience === "Service" &&
                      m.request_id &&
                      m.recipient_id === identity.actor_id,
                  )
                  .map((m) => ({
                    id: m.request_id!,
                    name: `Revision ${m.revision} · ${m.purpose}`,
                  })),
                initial.request_id,
              )}
              {select("outcome", "Receiving response", [
                "Received",
                "Accepted",
                "Returned",
                "Declined",
              ])}
              {area("evidence", "Receiving evidence / returned requirements")}
              {owner()}
            </>
          )}
          {action === "commercial" && (
            <>
              <p>
                Commercial disposition only. No invoice, payment, retention or
                warranty transaction is made.
              </p>
              {select(
                "source_id",
                "Commercial source",
                data.sources
                  .filter((s) => s.kind === "Commercial")
                  .map((s) => ({ id: s.id, name: s.title })),
              )}
              {select("outcome", "Disposition", [
                "Outstanding",
                "Complete",
                "Disputed",
                "Not required",
              ])}
              {area("evidence", "Exact source review evidence")}
            </>
          )}
          {["reopen", "amendment"].includes(action) && (
            <fieldset>
              <legend>Exact changed or reassessed scope</legend>
              {scopeUnits()}
            </fieldset>
          )}
          {[
            "closeStage",
            "closeProject",
            "technical",
            "issue",
            "transfer",
          ].includes(action) && (
            <label className="ac-review-check">
              <input
                type="checkbox"
                required
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              I reviewed the exact scope, source versions and continuing
              obligations shown for this decision.
            </label>
          )}
          {renewal && (
            <section className="ac-notice">
              <h3>Changed facts — renewed review required</h3>
              <p>
                Project version {data.project.version} →{" "}
                {renewal.project.version}; stage version{" "}
                {detail?.stage.version ?? "—"} →{" "}
                {renewal.selected?.stage.version ?? "—"}.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Previously reviewed</th>
                    <th>Current source / outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {renewal.selected?.requirements.map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>
                        {detail?.requirements.find((x) => x.id === r.id)?.source
                          .source_version ?? "Added"}
                      </td>
                      <td>
                        {r.source.source_version} · {r.outcome}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                {(proposal.project
                  ? renewal.project_gates
                  : (renewal.selected?.closeout_gates ?? [])
                ).join(" ")}
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={renewed}
                  onChange={(e) => setRenewed(e.target.checked)}
                />
                I reviewed these current facts and confirm my retained proposal.
              </label>
            </section>
          )}
          {area("reason", "Reason / decision record")}
          {error && (
            <div className="ac-notice ac-error" role="alert">
              <strong>
                {unknown
                  ? "Outcome unknown — check the original operation."
                  : error.message}
              </strong>
              <p>{unknown ? error.message : undefined}</p>
              {error.field_errors?.map((f, i) => (
                <p key={i}>
                  {f.field}: {f.message}
                </p>
              ))}
              {error.status === 409 && !unknown && (
                <button
                  type="button"
                  className="ac-button"
                  onClick={async () => {
                    const fresh = await api<Data>(
                      `projects/acceptance?project=${data.project.id}${detail ? "&stage=" + detail.stage.id : ""}`,
                    );
                    base.current = {
                      version: proposal.project
                        ? fresh.project.version
                        : fresh.selected!.stage.version,
                      facts: proposal.project
                        ? fresh.project_facts_hash
                        : fresh.selected!.facts_hash,
                    };
                    setRenewal(fresh);
                    setRenewed(false);
                    setReviewed(false);
                    setError({
                      message:
                        "Compare the changed facts below. Your proposal is retained.",
                    });
                  }}
                >
                  Load current versions for renewed review
                </button>
              )}
            </div>
          )}
        </div>
        <footer>
          <button
            type="button"
            className="ac-button"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          {unknown ? (
            <>
              <button
                type="button"
                className="ac-button ac-primary"
                disabled={busy}
                onClick={reconcile}
              >
                Check original operation
              </button>
              {error?.status === 404 && (
                <button
                  type="button"
                  className="ac-button"
                  disabled={busy}
                  onClick={() => original && send(original)}
                >
                  Retry unchanged original
                </button>
              )}
            </>
          ) : (
            <button
              className="ac-button ac-primary"
              disabled={busy || (!!renewal && !renewed)}
            >
              {busy ? "Saving…" : titles[action]}
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}
