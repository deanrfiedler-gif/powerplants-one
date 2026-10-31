"use client";
import { useRef, useState } from "react";
import {
  api,
  ErrorNotice,
  Field,
  ValidationFields,
  type Failure,
} from "./business-ui";
import { WorklistPanel } from "./crm-worklist-tools";
import { Button } from "./ui/button";
import { useUnsavedChanges } from "./record-ui";
import { LibraryChoice } from "./library-choice";
import {
  documentTypes,
  revisionName,
  libraryLabel,
  type LibraryItem,
  type Finding,
} from "../library/model";
export type LibraryIntent =
  | "Register"
  | "Revise"
  | "Review"
  | "Open finding"
  | "Respond"
  | "Accept response"
  | "Add link"
  | "Retire link"
  | "Withdraw"
  | "Recover";
export function LibraryCommand({
  intent,
  item,
  finding,
  linkId,
  onClose,
  onSaved,
}: {
  intent: LibraryIntent;
  item?: LibraryItem;
  finding?: Finding;
  linkId?: string;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    title: item?.revision.title ?? "",
    document_type: item?.revision.document_type ?? documentTypes[0],
    owner_id: item?.revision.owner_id ?? "",
    audience: item?.revision.audience ?? "",
    applicability: item?.revision.applicability ?? "",
    company_id: item?.document.company_id ?? "",
    organisation_id: item?.document.organisation_id ?? "",
    site_id: item?.document.site_id ?? "",
    kind: "SyntheticText",
    outcome: "Reviewed",
    target_kind: "Site",
  });
  const [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<{
      path: string;
      body: Record<string, unknown>;
    } | null>(null),
    [dirty, setDirty] = useState(false),
    [editDetails, setEditDetails] = useState(false);
  const flight = useRef(false),
    ids = useRef<{
      id: string;
      revision_id: string;
      finding_id: string;
      link_id: string;
    } | null>(null);
  const release = useUnsavedChanges(dirty, busy || !!pending);
  const set = (name: string, value: string) => {
    setDirty(true);
    setValues((old) => ({
      ...old,
      [name]: value,
      ...(name === "company_id"
        ? { organisation_id: "", site_id: "", owner_id: "", issue_id: "" }
        : name === "organisation_id"
          ? { site_id: "", issue_id: "" }
          : name === "site_id"
            ? { owner_id: "", issue_id: "" }
            : name === "kind"
              ? { issue_id: "" }
              : name === "target_kind"
                ? { target_id: "" }
                : {}),
    }));
  };
  const scope = {
    company_id: values.company_id,
    organisation_id: values.organisation_id,
    site_id: values.site_id,
    purpose: "Register",
  };
  const field = (
    name: string,
    label: string,
    maxLength = 200,
    multiline = false,
    type = "text",
  ) => (
    <Field
      key={name}
      name={`library-${name}`}
      validationField={
        name === "text" && ["Register", "Revise"].includes(intent)
          ? "source.text"
          : name
      }
      label={label}
      value={values[name] ?? ""}
      onChange={(v) => set(name, v)}
      required
      maxLength={maxLength}
      multiline={multiline}
      type={type}
    />
  );
  const close = () => {
    if (busy || pending) return;
    if (dirty && !window.confirm("Discard these unsaved entries?")) return;
    release();
    onClose();
  };
  const send = async () => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setError(null);
    try {
      let original = pending;
      if (!original) {
        ids.current ??= {
          id: crypto.randomUUID(),
          revision_id: crypto.randomUUID(),
          finding_id: crypto.randomUUID(),
          link_id: crypto.randomUUID(),
        };
        let suffix = "",
          fields: Record<string, unknown> = {};
        const b = {
          operation_id: crypto.randomUUID(),
          schema_version: 1,
          reason: values.reason,
          ...(item
            ? {
                expected_version: item.document.version,
                revision_id: item.revision.id,
              }
            : {}),
        };
        if (intent === "Register" || intent === "Revise") {
          const metadata = {
            revision_id: ids.current.revision_id,
            title: values.title,
            document_type: values.document_type,
            owner_id: values.owner_id,
            audience: values.audience,
            applicability: values.applicability,
            source:
              values.kind === "SyntheticText"
                ? { kind: values.kind, text: values.text }
                : { kind: values.kind, issue_id: values.issue_id },
          };
          if (intent === "Register")
            fields = {
              ...metadata,
              id: ids.current.id,
              company_id: values.company_id,
              organisation_id: values.organisation_id,
              site_id: values.site_id || null,
            };
          else {
            suffix = "revisions";
            fields = { ...metadata, observed_revision_id: item!.revision.id };
          }
        } else if (intent === "Review") {
          suffix = "review";
          fields = {
            outcome: values.outcome,
            purpose: values.purpose,
            rationale: values.rationale,
          };
        } else if (
          ["Open finding", "Respond", "Accept response"].includes(intent)
        ) {
          suffix = "findings";
          fields = {
            action:
              intent === "Open finding"
                ? "Open"
                : intent === "Respond"
                  ? "Respond"
                  : "Accept",
            finding_id: finding?.id ?? ids.current.finding_id,
            text: values.text,
            ...(intent === "Open finding"
              ? { owner_id: values.owner_id, due_date: values.due_date }
              : {}),
          };
        } else if (intent === "Add link" || intent === "Retire link") {
          suffix = "links";
          fields =
            intent === "Add link"
              ? {
                  action: "Add",
                  link_id: ids.current.link_id,
                  target_kind: values.target_kind,
                  target_id: values.target_id,
                  purpose: values.purpose,
                }
              : { action: "Retire", link_id: linkId };
        } else if (intent === "Withdraw") suffix = "withdraw";
        else {
          suffix = "recover";
          fields = { text: values.text };
        }
        original = {
          path: `document-library${item ? `/${item.document.id}/${suffix}` : ""}`,
          body: { ...b, ...fields },
        };
        setPending(original);
      }
      const result = await api<{ record_id: string }>(
        original.path,
        original.body,
      );
      setPending(null);
      release();
      onSaved(result.record_id ?? item?.document.id ?? ids.current!.id);
    } catch (e) {
      setError(e);
      if (!(e as Failure).retryable) setPending(null);
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };
  const revisionForm = intent === "Register" || intent === "Revise";
  return (
    <WorklistPanel
      title={`${intent}${item ? ` · ${revisionName(item.revision.revision)}` : " document"}`}
      onClose={close}
      drawer={intent !== "Review"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <ValidationFields error={error}>
          {item && (
            <p>
              {item.document.display_number} · {item.revision.title} · exact
              SHA-256{" "}
              <span className="library-hash">
                {item.revision.source.content_hash}
              </span>
            </p>
          )}
          {intent === "Review" && (
            <p>
              This independent decision is immutable. Reviewed requires all
              findings closed; Returned does not. A later finding makes a
              decision outdated and requires a new revision.
            </p>
          )}
          {intent === "Register" && (
            <p>
              Register one exact source as r01. Customer and site are fixed
              afterwards. The document starts Unreviewed.
            </p>
          )}
          {intent === "Revise" && (
            <section className="library-card">
              <h3>Replaces the current revision</h3>
              <p>
                {revisionName(item!.revision.revision)} · {item!.revision.title}
              </p>
              <p>
                The successor starts Unreviewed. Existing links and decisions
                stay on their exact earlier revisions.
              </p>
              <p role="status">
                Active links will show Needs assessment after saving. Assess
                each link in its receiving workflow before relying on the new
                revision.
              </p>
            </section>
          )}
          <fieldset
            disabled={busy || !!pending}
            className="library-form-fields"
          >
            {intent === "Register" && (
              <>
                <LibraryChoice
                  label="Company"
                  kind="Company"
                  scope={{ purpose: "Register" }}
                  value={values.company_id}
                  required
                  onChange={(v) => set("company_id", v)}
                />
                <LibraryChoice
                  label="Customer"
                  kind="Organisation"
                  value={values.organisation_id}
                  required
                  scope={{ company_id: values.company_id, purpose: "Register" }}
                  onChange={(v) => set("organisation_id", v)}
                />
                <LibraryChoice
                  label="Site"
                  kind="Site"
                  emptyLabel="No site"
                  value={values.site_id}
                  scope={{
                    company_id: values.company_id,
                    organisation_id: values.organisation_id,
                    purpose: "Register",
                  }}
                  onChange={(v) => set("site_id", v)}
                />
              </>
            )}
            {revisionForm && (
              <>
                {intent === "Revise" && !editDetails && (
                  <section className="library-card">
                    <h3>Copied details</h3>
                    <p>
                      {values.title} · {values.document_type} ·{" "}
                      {item!.owner_name}
                    </p>
                    <p>{values.audience}</p>
                    <p>{values.applicability}</p>
                    <Button onClick={() => setEditDetails(true)}>
                      Edit details
                    </Button>
                  </section>
                )}
                {(intent === "Register" || editDetails) && (
                  <>
                    {field("title", "Title")}
                    <label>
                      Type
                      <select
                        value={values.document_type}
                        onChange={(e) => set("document_type", e.target.value)}
                      >
                        {!documentTypes.includes(values.document_type) && (
                          <option>{values.document_type}</option>
                        )}
                        {documentTypes.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <LibraryChoice
                      label="Owner"
                      kind="Owner"
                      scope={scope}
                      value={values.owner_id}
                      required
                      onChange={(v) => set("owner_id", v)}
                    />
                    {field("audience", "Audience")}
                    {field("applicability", "Applicability", 2000, true)}
                  </>
                )}
                <label>
                  Source
                  <select
                    value={values.kind}
                    onChange={(e) => set("kind", e.target.value)}
                  >
                    <option value="SyntheticText">Synthetic text</option>
                    <option value="JobPackIssue">Issued job pack</option>
                    <option value="ReportIssue">Issued service report</option>
                  </select>
                </label>
                {values.kind === "SyntheticText" ? (
                  field("text", "Exact synthetic text", 20000, true)
                ) : (
                  <LibraryChoice
                    label="Exact issue"
                    kind={values.kind}
                    scope={scope}
                    value={values.issue_id ?? ""}
                    required
                    onChange={(v) => set("issue_id", v)}
                  />
                )}
              </>
            )}
            {intent === "Review" && (
              <>
                <label>
                  Outcome
                  <select
                    value={values.outcome}
                    onChange={(e) => set("outcome", e.target.value)}
                  >
                    <option>Reviewed</option>
                    <option>Returned</option>
                  </select>
                </label>
                {field("purpose", "Purpose")}
                {field("rationale", "Rationale", 2000, true)}
              </>
            )}
            {intent === "Open finding" && (
              <>
                <LibraryChoice
                  label="Finding owner"
                  kind="Owner"
                  scope={scope}
                  value={values.owner_id}
                  required
                  onChange={(v) => set("owner_id", v)}
                />
                {field("due_date", "Due date", 10, false, "date")}
              </>
            )}
            {["Open finding", "Respond", "Accept response", "Recover"].includes(
              intent,
            ) &&
              field(
                "text",
                intent === "Recover"
                  ? "Original exact synthetic text"
                  : intent === "Accept response"
                    ? "Acceptance"
                    : intent === "Respond"
                      ? "Response"
                      : "Finding",
                intent === "Recover" ? 20000 : 2000,
                true,
              )}
            {intent === "Add link" && (
              <>
                <label>
                  Target kind
                  <select
                    value={values.target_kind}
                    onChange={(e) => set("target_kind", e.target.value)}
                  >
                    {[
                      "Organisation",
                      "Site",
                      "Asset",
                      "Project",
                      "WorkOrder",
                      "EngineeringPackage",
                    ].map((k) => (
                      <option key={k} value={k}>
                        {libraryLabel(k)}
                      </option>
                    ))}
                  </select>
                </label>
                <LibraryChoice
                  label="Target"
                  kind={values.target_kind}
                  scope={{ document_id: item!.document.id }}
                  value={values.target_id ?? ""}
                  required
                  onChange={(v) => set("target_id", v)}
                />
                {field("purpose", "Purpose")}
              </>
            )}
            {intent === "Withdraw" && (
              <p>
                Withdraw this document from current use. Revision evidence and
                links remain readable. This cannot reactivate it.
              </p>
            )}
            {intent === "Recover" && (
              <p>
                Only original synthetic bytes matching the retained hash can be
                restored. Native issue recovery belongs to its source workflow.
              </p>
            )}
            {field("reason", "Reason", 1000, true)}
          </fieldset>
          <ErrorNotice error={error} />
          {(error as Failure)?.status === 409 && !pending && (
            <p role="status">
              The record or source changed. Your entries remain here. Close this
              form and refresh the exact record before starting a new command;
              do not repeat an outdated decision.
            </p>
          )}
          {pending && (
            <p role="status">
              Original operation retained. Retry sends the unchanged command;
              confirm its result before editing or closing.
            </p>
          )}
          <div className="library-actions">
            <Button onClick={close} disabled={busy || !!pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={intent === "Withdraw" ? "danger" : "primary"}
              busy={busy}
            >
              {pending
                ? "Retry original operation"
                : intent === "Review"
                  ? "Record review"
                  : intent}
            </Button>
          </div>
        </ValidationFields>
      </form>
    </WorklistPanel>
  );
}
