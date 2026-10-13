"use client";
import "./fertigation-artifacts.css";
import { useRef, useState } from "react";
import { api, ErrorNotice, type Failure } from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import type { OperationReceipt } from "../platform/operations";
import type { Evidence } from "../estimating/fertigation/types";
import {
  FertigationHandoverPreview,
  type PreparedFertigationHandover,
} from "./fertigation-handover-preview";
import { Button, Chip, Hint, Notice, Panel, Steps, Token } from "./fertigation-ui";

/*
 * Review, handover, retained reports and prepared files for the exact saved
 * revision (design board 08 and 09). One instance stays mounted while the
 * workspace is open, so a review note or a chosen file survives a change of
 * view; `view` chooses which panels it shows.
 */

type Ledger = {
  reviews: {
    id: string;
    revision_id: string;
    note: string;
    created_by: string;
    created_at: string;
    disposition: string;
  }[];
  handovers: PreparedFertigationHandover[];
  outputs: {
    id: string;
    revision_id: string;
    audience: string;
    mime_type: string;
    content_hash: string;
  }[];
};
type Files = {
  items: {
    id: string;
    revision_id: string;
    label: string;
    filename: string;
    sha256: string;
    source_revision: string;
    attribution: string;
    applicability: string;
  }[];
  policy: string;
};
export function FertigationArtifacts({
  scopeId,
  scopeVersion,
  revisionId,
  revisionNumber,
  workspaceId,
  optionLabel,
  canEdit,
  dirty,
  view,
  onPendingChange,
  onAddEvidence,
  evidenceIds = [],
}: {
  scopeId: string;
  scopeVersion: number;
  revisionId: string;
  revisionNumber: number;
  workspaceId: string;
  optionLabel: string;
  canEdit: boolean;
  dirty: boolean;
  view: "evidence" | "review" | "other";
  onPendingChange?: (v: boolean) => void;
  onAddEvidence?: (e: Evidence) => void;
  evidenceIds?: string[];
}) {
  const path = `estimating/fertigation/${scopeId}`,
    ledger = useCrmResource<Ledger>(`${path}/ledger`, true),
    files = useCrmResource<Files>(`${path}/evidence`, true);
  const [note, setNote] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [attribution, setAttribution] = useState(""),
    [applicability, setApplicability] = useState(""),
    [sourceRevision, setSourceRevision] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false),
    [uploadUnknown, setUploadUnknown] = useState(false),
    [uploadError, setUploadError] = useState<unknown>(null),
    [uploadStatus, setUploadStatus] = useState("");
  const pendingFile = useRef<{
    file: File;
    metadata: Record<string, unknown>;
  } | null>(null);
  const command = useCrmCommand(
    () => {
      ledger.reload();
      files.reload();
    },
    "No pending server action",
    onPendingChange,
  );
  const busy = command.busy || command.uncertain || uploadBusy || uploadUnknown,
    blocked = busy || dirty || !canEdit;
  useUnsavedChanges(!!file, uploadBusy || uploadUnknown);
  if (
    denied(ledger.error) ||
    denied(files.error) ||
    denied(uploadError) ||
    denied(command.error)
  )
    return (
      <ErrorNotice
        error={ledger.error ?? files.error ?? uploadError ?? command.error}
      />
    );
  const review = ledger.data?.reviews.find((r) => r.revision_id === revisionId),
    prepared = ledger.data?.handovers.find(
      (h) => h.revision_id === revisionId && !h.receiving_revision_id,
    ),
    accepted = ledger.data?.handovers.find(
      (h) => h.revision_id === revisionId && h.receiving_revision_id,
    );
  const fields = {
    expected_version: scopeVersion,
    revision_id: revisionId,
    reason:
      "Record exact fertigation scoping evidence; technical suitability remains unassessed",
  };
  async function upload(reconcile = false) {
    if (!pendingFile.current) {
      if (!file) return;
      pendingFile.current = {
        file,
        metadata: {
          ...fields,
          schema_version: 1,
          operation_id: crypto.randomUUID(),
          label: file.name,
          filename: file.name,
          source_revision: sourceRevision,
          attribution,
          applicability,
        },
      };
    }
    const intent = pendingFile.current;
    setUploadBusy(true);
    setUploadError(null);
    onPendingChange?.(true);
    try {
      let receipt: OperationReceipt | null = null;
      if (reconcile)
        try {
          receipt = await api<OperationReceipt>(
            `operations/${intent.metadata.operation_id}`,
          );
        } catch (e) {
          if ((e as Failure).status !== 404) throw e;
        }
      if (!receipt) {
        const response = await fetch(`/api/v1/${path}/evidence`, {
          method: "POST",
          headers: {
            "Content-Type": "image/png",
            "x-ppo-evidence": encodeURIComponent(
              JSON.stringify(intent.metadata),
            ),
          },
          body: intent.file,
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw { ...result, status: response.status };
        receipt = result;
      }
      if (receipt) {
        pendingFile.current = null;
        setFile(null);
        setUploadUnknown(false);
        setUploadStatus(
          "Original PNG prepared on the server. Add its reference to the draft and Save revision to include it in reviewed scope content.",
        );
        files.reload();
        onPendingChange?.(false);
      }
    } catch (e) {
      setUploadError(e);
      const uncertain =
        !(e as Failure).status ||
        !!(e as Failure).retryable ||
        Number((e as Failure).status) >= 500;
      setUploadUnknown(uncertain);
      if (!uncertain) pendingFile.current = null;
      onPendingChange?.(uncertain);
      setUploadStatus(
        uncertain
          ? "Outcome unknown — confirm the original upload."
          : "Upload failed; your file and metadata remain here.",
      );
    } finally {
      setUploadBusy(false);
    }
  }
  const common = (
    <>
      <ErrorNotice
        error={ledger.error ?? files.error ?? command.error ?? uploadError}
      />
      {(command.status !== "No pending server action" || uploadStatus) && (
        <p role="status" className="fn-artifacts-status">{command.status} {uploadStatus}</p>
      )}
      {dirty && (
        <Notice tone="warning">
          Save the scope revision before preparing review, handover, report or attachment evidence.
        </Notice>
      )}
      {command.uncertain && (
        <Button variant="secondary" size="sm" onClick={() => void command.reconcile()} disabled={command.busy}>
          Confirm original action
        </Button>
      )}
    </>
  );
  return (
    <section
      aria-label="Exact review and delivery evidence"
      className={`fertigation-artifacts fn-artifacts fn-artifacts-${view}`}
    >
      {view === "review" && (
        <>
          {common}
          <Panel
            title="Technical review record"
            subtitle="Reviewer, discipline and remaining conditions"
            foot="Engineering approval is not configured in this prototype; manufacturer confirmation remains pending. A review with open findings is recorded as unresolved."
          >
            <p className="fn-artifacts-revision">
              Revision {revisionNumber}{" "}
              {review ? <Chip tone="review">Reviewed; unresolved</Chip> : <Token>Not recorded</Token>}
            </p>
            <label className="fn-field" htmlFor="fertigation-review-note">
              <span>Review purpose and remaining conditions</span>
              <textarea
                id="fertigation-review-note"
                value={note}
                maxLength={2000}
                disabled={blocked}
                onChange={(e) => {
                  setNote(e.target.value);
                  command.dirty();
                }}
              />
            </label>
            <Button
              variant="secondary"
              icon="check"
              disabled={blocked || !note.trim()}
              onClick={() => void command.send(`${path}/reviews`, { ...fields, note })}
            >
              Record review — unresolved
            </Button>
            {!!ledger.data?.reviews.length && (
              <ul className="fn-artifacts-list">
                {ledger.data.reviews.map((r) => (
                  <li key={r.id}>
                    <Chip tone={r.revision_id === revisionId ? "review" : "neutral"}>
                      {r.revision_id === revisionId ? "This revision" : "Historical revision"}
                    </Chip>
                    <span>
                      {r.disposition} · {r.note}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel
            title="Scoping handover"
            subtitle={`To Discovery alternative ${optionLabel}`}
            foot="Received notes are not adopted for costing; no price or estimate line is created."
          >
            <Steps
              items={[
                {
                  title: `Record a technical review of revision ${revisionNumber}`,
                  detail: review ? "Recorded" : "Available on this exact revision",
                  done: !!review,
                },
                {
                  title: "Prepare the scoping handover",
                  detail: "Binds this exact revision and its content hash",
                  done: !!prepared || !!accepted,
                },
                {
                  title: "Review the receiving effect",
                  detail: "Previous, prepared and difference for area, connected flow and operating peak",
                  done: !!accepted,
                },
                {
                  title: `Accepted by Discovery alternative ${optionLabel}`,
                  detail: "Only while the alternative is selected and Complete, the source is unchanged and the hashes match",
                  done: !!accepted,
                },
              ]}
            />
            <Button
              variant="secondary"
              disabled={blocked || !review}
              onClick={() =>
                void command.send(`${path}/handovers`, { ...fields, review_id: review?.id })
              }
            >
              Prepare scoping handover
            </Button>
            <FertigationHandoverPreview
              scopeId={scopeId}
              workspaceId={workspaceId}
              prepared={prepared}
              blocked={blocked}
              accepted={!!accepted}
              onAccept={(basis) =>
                void command.send(`${path}/handovers/accept`, {
                  ...basis,
                  reason:
                    "Accept exact notes-only fertigation scope binding; no pricing or technical approval",
                })
              }
            />
            <p className="fn-artifacts-state">
              {accepted
                ? "Notes accepted; adoption for costing is separate."
                : prepared
                  ? "Prepared; not accepted or adopted for costing."
                  : "No prepared handover for this revision."}
            </p>
          </Panel>
          <Panel
            title="Retained reports"
            subtitle={`Bound to revision ${revisionNumber} and its content hash`}
            foot="Customer output uses a field allowlist. These synthetic draft reports are not construction or commissioning releases."
          >
            <div className="fn-actions">
              {(["customer", "internal"] as const).flatMap((a) =>
                (["html", "pdf"] as const).map((format) => (
                  <Button
                    key={`${a}-${format}`}
                    variant="secondary"
                    size="sm"
                    disabled={blocked}
                    onClick={() =>
                      void command.send(`${path}/outputs`, { ...fields, audience: a, format })
                    }
                  >
                    Retain {a} {format.toUpperCase()} report
                  </Button>
                )),
              )}
            </div>
            {ledger.data?.outputs.length ? (
              <ul className="fn-artifacts-list">
                {ledger.data.outputs.map((o) => (
                  <li key={o.id}>
                    <a href={`/api/v1/${path}/outputs/${o.id}`}>
                      Download exact {o.audience} {o.mime_type === "application/pdf" ? "PDF" : "HTML"} report
                    </a>
                    <code>{o.content_hash}</code>
                    {o.revision_id !== revisionId && <Chip tone="neutral">Historical</Chip>}
                  </li>
                ))}
              </ul>
            ) : (
              <Hint>None retained for revision {revisionNumber}.</Hint>
            )}
          </Panel>
        </>
      )}
      {view === "evidence" && (
        <>
          {common}
          <Panel
            title="Prepared files"
            subtitle={files.data?.policy ?? "Bounded validated PNG evidence; no malware scanning or general document upload is implied."}
            foot="Preparing bytes does not change an immutable scope or its review. Add the prepared reference to the draft, then Save revision; the successor records its exact hash."
          >
            <div className="fn-upload">
              <label className="fn-field" htmlFor="fertigation-evidence-file">
                <span>PNG file (up to 4 MiB)</span>
                <input
                  id="fertigation-evidence-file"
                  type="file"
                  accept="image/png"
                  disabled={blocked}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="fn-field" htmlFor="fertigation-evidence-revision">
                <span>Source revision / observation date</span>
                <input
                  id="fertigation-evidence-revision"
                  value={sourceRevision}
                  disabled={blocked}
                  onChange={(e) => setSourceRevision(e.target.value)}
                />
              </label>
              <label className="fn-field" htmlFor="fertigation-evidence-attribution">
                <span>Source author / attribution</span>
                <input
                  id="fertigation-evidence-attribution"
                  value={attribution}
                  disabled={blocked}
                  onChange={(e) => setAttribution(e.target.value)}
                />
              </label>
              <label className="fn-field" htmlFor="fertigation-evidence-applicability">
                <span>Applicable record and conditions</span>
                <input
                  id="fertigation-evidence-applicability"
                  value={applicability}
                  disabled={blocked}
                  onChange={(e) => setApplicability(e.target.value)}
                />
              </label>
            </div>
            <div className="fn-actions">
              <Button
                variant="secondary"
                icon="upload"
                disabled={
                  blocked ||
                  !file ||
                  !sourceRevision.trim() ||
                  !attribution.trim() ||
                  !applicability.trim()
                }
                onClick={() => void upload()}
              >
                Prepare original PNG evidence
              </Button>
              {file && !busy && (
                <Button variant="quiet" onClick={() => setFile(null)}>
                  Discard selected file
                </Button>
              )}
              {uploadUnknown && (
                <Button variant="secondary" disabled={uploadBusy} onClick={() => void upload(true)}>
                  Confirm original upload
                </Button>
              )}
            </div>
            {files.data?.items.length ? (
              <ul className="fn-artifacts-list">
                {files.data.items.map((f) => (
                  <li key={f.id}>
                    <a href={`/api/v1/${path}/evidence/${f.id}`}>{f.label}</a>
                    <code>{f.sha256}</code>
                    <Chip tone={evidenceIds.includes(f.id) ? "success" : "neutral"}>
                      {evidenceIds.includes(f.id)
                        ? "Reference included in displayed scope"
                        : "Prepared; not included in displayed scope"}
                    </Chip>
                    {onAddEvidence && (
                      <Button
                        variant="quiet"
                        size="sm"
                        disabled={!canEdit || busy || evidenceIds.includes(f.id)}
                        onClick={() =>
                          onAddEvidence({
                            id: f.id,
                            label: f.label,
                            kind: "document_reference",
                            reference: `ppo-file:${f.id}`,
                            source_revision: f.source_revision,
                            sha256: f.sha256,
                            captured_date: null,
                            attribution: f.attribution,
                            applicability: f.applicability,
                            notes:
                              "Original PNG prepared through the authorised private document adapter. Malware scanning is not configured.",
                          })
                        }
                      >
                        Add prepared reference to draft
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Hint>No prepared file for this scope yet.</Hint>
            )}
          </Panel>
        </>
      )}
    </section>
  );
}
