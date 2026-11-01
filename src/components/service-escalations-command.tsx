"use client";
import { useEffect, useState, type RefObject } from "react";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  ValidationFields,
  useCommand,
  isDenied,
  type Failure,
} from "./business-ui";
import { LocalDateTimeField, useUnsavedChanges } from "./record-ui";
import { Button } from "./ui/button";
import type { CaseRecord } from "../service/escalations/reads";
import type { CaseAction } from "../service/escalations/states";
export type Wire<T> = T extends Date
  ? string
  : T extends readonly (infer U)[]
    ? Wire<U>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;
export type EscalationRecord = Wire<CaseRecord>;
export type EditorAction = CaseAction | "support_route";
export const actionLabels: Record<EditorAction, string> = {
  diagnose: "Record diagnostic",
  photo: "Add technical photo",
  capture_configuration: "Capture configuration",
  prepare_pack: "Prepare evidence pack",
  review_pack: "Review evidence pack",
  record_sent: "Record as sent",
  record_reply: "Record reply",
  next_action: "Record next action",
  follow_up: "Record a follow-up question",
  close: "Close case",
  withdraw: "Withdraw case",
  support_route: "Maintain support route",
};
type Upload = { media_type: string; content_base64: string; sha256: string };
async function upload(file: File): Promise<Upload> {
  if (file.size > 2097152)
    throw { message: "Choose a file no larger than 2 MB." };
  const bytes = await file.arrayBuffer(),
    hash = await crypto.subtle.digest("SHA-256", bytes);
  const content_base64 = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () =>
      reject({ message: "The selected file could not be read." });
    r.readAsDataURL(file);
  });
  return {
    media_type: file.type,
    content_base64,
    sha256: [...new Uint8Array(hash)]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join(""),
  };
}
export function CaseCommandEditor({
  data,
  action,
  guardRef,
  onSaved,
  onCancel,
  onRevoked,
}: {
  data: EscalationRecord;
  action: EditorAction;
  guardRef: RefObject<() => boolean>;
  onSaved: () => void;
  onCancel: () => void;
  onRevoked: (e: unknown) => void;
}) {
  const [current, setCurrent] = useState(data),
    [comparison, setComparison] = useState<EscalationRecord | null>(null),
    [compareError, setCompareError] = useState<unknown>(null),
    [comparing, setComparing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    attempted_at: new Date().toISOString(),
    source_reference: data.finding.source_record.href,
    sent_at: new Date().toISOString(),
    sent_by: data.record.owner_id,
    reply_expected_at: "",
    received_at: new Date().toISOString(),
    owner_id: data.finding.action?.owner_id ?? data.record.owner_id,
    due_at: data.finding.action?.due_at ?? "",
    instruction: "",
    required_evidence: "",
    method: data.support_route?.method ?? "Email",
    recipient: data.support_route?.recipient ?? "",
    reason: "",
  });
  const [confirmed, setConfirmed] = useState(false),
    [settings, setSettings] = useState(false),
    [approval, setApproval] = useState(false),
    [files, setFiles] = useState<Upload[]>([]),
    [fileError, setFileError] = useState<unknown>(null),
    [readingFile, setReadingFile] = useState(false);
  const cmd = useCommand(),
    uncertain = !!(cmd.error as Failure)?.retryable,
    locked = cmd.busy || uncertain || comparing || readingFile;
  const [dirty, setDirty] = useState(false);
  const release = useUnsavedChanges(dirty, locked);
  const set = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };
  useEffect(() => {
    guardRef.current = () =>
      !locked && (!dirty || window.confirm("Discard unsaved case entries?"));
    return () => {
      guardRef.current = () => true;
    };
  }, [dirty, locked, guardRef]);
  useEffect(() => {
    if (isDenied(cmd.error)) onRevoked(cmd.error);
  }, [cmd.error, onRevoked]);
  const field = (
    key: string,
    label: string,
    multiline = false,
    maxLength = 4000,
  ) => (
    <Field
      name={`sv08-${key}`}
      validationField={key}
      label={label}
      required
      value={values[key] ?? ""}
      onChange={(v) => set(key, v)}
      multiline={multiline}
      maxLength={maxLength}
    />
  );
  const time = (key: string, label: string) => (
    <LocalDateTimeField
      name={`sv08-${key}`}
      validationField={key}
      label={label}
      value={values[key] ?? ""}
      onChange={(v) => set(key, v)}
      timezone={current.site.timezone}
    />
  );
  const people = (key: string, label: string) => (
    <SelectField
      name={`sv08-${key}`}
      validationField={key}
      label={label}
      required
      value={values[key] ?? ""}
      onChange={(v) => set(key, v)}
      options={current.owners}
    />
  );
  const pack = current.packs.find(
    (p) => p.id === current.record.latest_pack_id,
  );
  const lastReply = current.events.find(
    (e) => e.id === current.record.last_reply_id,
  );
  async function save() {
    let fields: Record<string, unknown> = {};
    switch (action) {
      case "diagnose":
        fields = {
          attempted_at: values.attempted_at,
          diagnostic: values.diagnostic,
          result: values.result,
          source_reference: values.source_reference,
        };
        break;
      case "photo":
        fields = { ...files[0], confirmed_exclusions: confirmed };
        break;
      case "capture_configuration":
      case "prepare_pack":
        break;
      case "review_pack":
        fields = {
          pack_id: pack?.id,
          html_sha256: pack?.html_sha256,
          pdf_sha256: pack?.pdf_sha256,
          confirmed_exclusions: confirmed,
        };
        break;
      case "record_sent":
        fields = {
          pack_id: current.record.reviewed_pack_id,
          sent_at: values.sent_at,
          sent_by: values.sent_by,
          method: current.support_route?.method,
          recipient: current.support_route?.recipient,
          manufacturer_reference: values.manufacturer_reference,
          reply_expected_at: values.reply_expected_at,
        };
        break;
      case "record_reply":
        fields = {
          received_at: values.received_at,
          reply: values.reply,
          advice: values.advice,
          settings_change: settings,
          attachments: files,
        };
        break;
      case "next_action":
        fields = {
          source_token: current.source_token,
          expected_finding_version: current.expected_finding_version,
          owner_id: values.owner_id,
          due_at: values.due_at,
          instruction: values.instruction,
          required_evidence: values.required_evidence?.trim() || null,
          grower_approval_required: approval,
        };
        break;
      case "follow_up":
        fields = { question: values.question };
        break;
      case "close":
      case "withdraw":
        fields = { outcome: values.outcome };
        break;
      case "support_route":
        fields = { method: values.method, recipient: values.recipient };
        break;
    }
    const result = await cmd.send(
      action === "support_route"
        ? `service/escalations/equipment/${current.record.asset_id}/support-route`
        : `service/escalations/${current.record.id}/commands`,
      {
        ...fields,
        ...(action === "support_route" ? {} : { action }),
        expected_version:
          action === "support_route"
            ? current.equipment.version
            : current.record.version,
        reason: values.reason,
      },
    );
    if (result) {
      setDirty(false);
      release();
      guardRef.current = () => true;
      onSaved();
    }
  }
  async function compare() {
    setComparing(true);
    setCompareError(null);
    try {
      setComparison(
        await api<EscalationRecord>(`service/escalations/${current.record.id}`),
      );
    } catch (e) {
      setCompareError(e);
      if (isDenied(e)) onRevoked(e);
    } finally {
      setComparing(false);
    }
  }
  const fileControl = (
    <div className="field">
      <label htmlFor="sv08-files">
        {action === "photo"
          ? "Technical photo"
          : "Reply attachments (optional)"}
      </label>
      <input
        id="sv08-files"
        type="file"
        accept={
          action === "photo"
            ? "image/png,image/jpeg"
            : "image/png,image/jpeg,application/pdf"
        }
        multiple={action !== "photo"}
        required={action === "photo"}
        onChange={async (e) => {
          setFileError(null);
          setReadingFile(true);
          try {
            const selected = Array.from(e.target.files ?? []);
            if (selected.length > (action === "photo" ? 1 : 5))
              throw {
                message:
                  "Choose no more than five reply attachments, or one technical photo.",
              };
            setFiles(await Promise.all(selected.map(upload)));
            setDirty(true);
          } catch (error) {
            setFiles([]);
            setFileError(error);
          } finally {
            setReadingFile(false);
          }
        }}
      />
      <small>
        PNG/JPEG{action === "photo" ? "" : "/PDF"}, up to 2 MB each. Files are
        retained with their SHA-256.
      </small>
      {files.map((f, i) => (
        <code className="sv08-hash" key={i}>
          {f.sha256}
        </code>
      ))}
    </div>
  );
  return (
    <section
      className="sv08-card sv08-editor"
      aria-label={actionLabels[action]}
    >
      <h2>{actionLabels[action]}</h2>
      <ValidationFields error={cmd.error}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <ErrorNotice error={cmd.error || fileError} />
          <fieldset disabled={locked}>
            {action === "diagnose" && (
              <>
                {field("diagnostic", "Diagnostic tried", true)}
                {time("attempted_at", "When it was tried")}
                {field("result", "Result", true)}
                {field(
                  "source_reference",
                  "Inspection, defect or evidence reference",
                  false,
                  300,
                )}
                <p>
                  Recorded under your signed-in name. Entries are retained as
                  recorded.
                </p>
              </>
            )}
            {action === "photo" && (
              <>
                {fileControl}
                <label className="sv08-check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    required
                    onChange={(e) => {
                      setConfirmed(e.target.checked);
                      setDirty(true);
                    }}
                  />
                  I reviewed this photo: customer contact details, prices and
                  credentials are left out.
                </label>
              </>
            )}
            {action === "capture_configuration" && (
              <p>
                Capture the current Equipment configuration as a read-only
                snapshot. Controller settings belong to the grower. This action
                changes no settings.
              </p>
            )}
            {action === "prepare_pack" && (
              <p>
                Prepare retained HTML and PDF files from the diagnostics,
                current configuration snapshot, permitted readings and reviewed
                photos. Review both files before recording them as sent.
              </p>
            )}
            {action === "review_pack" && (
              <>
                {pack ? (
                  <>
                    <p>Evidence pack version {pack.revision}</p>
                    <p>
                      <a
                        href={`/api/v1/service/escalations/${current.record.id}/files?kind=pack&file_id=${pack.id}&format=html`}
                        download
                      >
                        Download HTML for review
                      </a>{" "}
                      ·{" "}
                      <a
                        href={`/api/v1/service/escalations/${current.record.id}/files?kind=pack&file_id=${pack.id}&format=pdf`}
                        download
                      >
                        Download PDF for review
                      </a>
                    </p>
                    <code className="sv08-hash">HTML {pack.html_sha256}</code>
                    <code className="sv08-hash">PDF {pack.pdf_sha256}</code>
                    <label className="sv08-check">
                      <input
                        type="checkbox"
                        required
                        checked={confirmed}
                        onChange={(e) => {
                          setConfirmed(e.target.checked);
                          setDirty(true);
                        }}
                      />
                      I reviewed both files. Customer contact details, prices
                      and credentials are left out.
                    </label>
                  </>
                ) : (
                  <p>Prepare an evidence pack first.</p>
                )}
              </>
            )}
            {action === "record_sent" && (
              <>
                <p>Diagnosing → Waiting on manufacturer</p>
                <dl>
                  <dt>Evidence pack</dt>
                  <dd>Version {pack?.revision ?? "not prepared"}</dd>
                  <dt>Support route</dt>
                  <dd>
                    {current.support_route
                      ? `${current.support_route.method} · ${current.support_route.recipient}`
                      : "Maintain a support route first"}
                  </dd>
                </dl>
                {pack && (
                  <code className="sv08-hash">PDF {pack.pdf_sha256}</code>
                )}
                {people("sent_by", "Who sent it")}
                {time("sent_at", "When it was sent")}
                {field(
                  "manufacturer_reference",
                  "Manufacturer’s reference",
                  false,
                  200,
                )}
                {time("reply_expected_at", "Reply expected")}
              </>
            )}
            {action === "record_reply" && (
              <>
                {time("received_at", "When the reply was received")}
                {field("reply", "Reply as received", true, 10000)}
                {field("advice", "Recommended steps", true)}
                <label className="sv08-check">
                  <input
                    type="checkbox"
                    checked={settings}
                    onChange={(e) => {
                      setSettings(e.target.checked);
                      setDirty(true);
                    }}
                  />
                  The advice includes controller settings changes.
                </label>
                {fileControl}
                <p>
                  Recorded under your signed-in name. PPO did not receive or
                  send this message.
                </p>
              </>
            )}
            {action === "next_action" && (
              <>
                <p>
                  Record the advice as owned work against the existing finding.
                  This does not approve or change controller settings.
                </p>
                {field("instruction", "Next action", true, 1800)}
                {people("owner_id", "Next action owner")}
                {time("due_at", "Next action due")}
                <Field
                  name="sv08-required_evidence"
                  validationField="required_evidence"
                  label="Evidence needed (optional)"
                  multiline
                  maxLength={4000}
                  value={values.required_evidence ?? ""}
                  onChange={(v) => set("required_evidence", v)}
                />
                <label className="sv08-check">
                  <input
                    type="checkbox"
                    checked={approval}
                    required={!!lastReply?.details.settings_change}
                    onChange={(e) => {
                      setApproval(e.target.checked);
                      setDirty(true);
                    }}
                  />
                  Grower approval is required before changing settings.
                </label>
              </>
            )}
            {action === "follow_up" && (
              <>
                {field("question", "Follow-up question", true)}
                <p>
                  This records a question and returns the case to Diagnosing.
                  Prepare and review another pack if needed, then a named person
                  sends it outside PPO.
                </p>
              </>
            )}
            {(action === "close" || action === "withdraw") && (
              <>
                {field("outcome", "Case outcome", true)}
                <p>
                  Closing or withdrawing the case records its outcome. It does
                  not close the finding.
                </p>
              </>
            )}
            {action === "support_route" && (
              <>
                <p>
                  Manufacturer from Equipment:{" "}
                  <strong>
                    {String(current.equipment.manufacturer ?? "Not recorded")}
                  </strong>
                </p>
                <SelectField
                  name="sv08-method"
                  validationField="method"
                  label="Support method"
                  required
                  value={values.method}
                  onChange={(v) => set("method", v)}
                  options={[
                    { id: "Email", display_name: "Email" },
                    { id: "Portal", display_name: "Portal" },
                  ]}
                />
                {field(
                  "recipient",
                  "Manufacturer support address or portal",
                  false,
                  500,
                )}
                <p>
                  Maintain a synthetic support route taken from this equipment
                  record. PPO will not contact it.
                </p>
              </>
            )}
            {field("reason", "Reason for this record", true, 1000)}
          </fieldset>
          {action === "record_sent" && (
            <p className="sv08-notice">
              Recording sends nothing. Send the pack from your mailbox or their
              portal first, then record it here.
            </p>
          )}
          {uncertain && (
            <p role="status">
              The result is unconfirmed. Your original entries are locked; retry
              the unchanged action to recover its receipt.
            </p>
          )}
          <div className="sv08-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={
                cmd.busy ||
                comparing ||
                readingFile ||
                (action === "review_pack" && !pack)
              }
            >
              {cmd.busy
                ? "Recording…"
                : uncertain
                  ? "Retry unchanged action"
                  : actionLabels[action]}
            </Button>
            <Button
              type="button"
              disabled={locked}
              variant="quiet"
              onClick={() => {
                if (guardRef.current()) onCancel();
              }}
            >
              Cancel
            </Button>
          </div>
          {!!cmd.error && !uncertain && !isDenied(cmd.error) && (
            <Button
              type="button"
              disabled={comparing}
              onClick={() => void compare()}
            >
              Compare current case
            </Button>
          )}
          <ErrorNotice error={compareError} />
          {comparison && (
            <div className="sv08-notice">
              <p>
                Current case version {comparison.record.version}; your entries
                were opened at version {current.record.version}. Current state:{" "}
                {comparison.record.state}.
              </p>
              <p>
                Your entries are retained. Review the current case before
                retrying against its version.
              </p>
              <Button
                type="button"
                disabled={locked}
                onClick={() => {
                  setCurrent(comparison);
                  setComparison(null);
                  cmd.clear();
                }}
              >
                Use current version and keep my entries
              </Button>
            </div>
          )}
        </form>
      </ValidationFields>
    </section>
  );
}
