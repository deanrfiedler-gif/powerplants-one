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
  workspaceId,
  canEdit,
  dirty,
  onPendingChange,
  onAddEvidence,
  evidenceIds = [],
}: {
  scopeId: string;
  scopeVersion: number;
  revisionId: string;
  workspaceId: string;
  canEdit: boolean;
  dirty: boolean;
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
  return (
    <section
      aria-label="Exact review and delivery evidence"
      className="fertigation-artifacts"
    >
      <ErrorNotice
        error={ledger.error ?? files.error ?? command.error ?? uploadError}
      />
      <p role="status">
        {command.status} {uploadStatus}
      </p>
      {dirty && (
        <p>
          Save the scope revision before preparing review, handover, report or
          attachment evidence.
        </p>
      )}
      {command.uncertain && (
        <button
          type="button"
          onClick={() => void command.reconcile()}
          disabled={command.busy}
        >
          Confirm original action
        </button>
      )}
      <h3>Review of this exact revision</h3>
      <p>
        Authenticated review notes retain unresolved conditions. Engineering
        approval is not configured; manufacturer confirmation remains pending.
      </p>
      <label htmlFor="fertigation-review-note">
        Review purpose and remaining conditions
      </label>
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
      <button
        type="button"
        disabled={blocked || !note.trim()}
        onClick={() =>
          void command.send(`${path}/reviews`, { ...fields, note })
        }
      >
        Record review — unresolved
      </button>
      <ul>
        {ledger.data?.reviews.map((r) => (
          <li key={r.id}>
            {r.revision_id === revisionId
              ? "This revision"
              : "Historical revision"}{" "}
            · {r.disposition} · {r.note}
          </li>
        ))}
      </ul>
      <h3>Discovery and manual costing</h3>
      <p>
        Prepare revision-bound scoping notes. Acceptance requires the exact
        selected Complete Discovery option in a Draft workspace. This creates no
        estimate lines, prices or technical approval.
      </p>
      <button
        type="button"
        disabled={blocked || !review}
        onClick={() =>
          void command.send(`${path}/handovers`, {
            ...fields,
            review_id: review?.id,
          })
        }
      >
        Prepare scoping handover
      </button>
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
      <p>
        {accepted
          ? "Notes accepted; adoption for costing is separate."
          : prepared
            ? "Prepared; not accepted or adopted for costing."
            : "No prepared handover for this revision."}
      </p>
      <h3>Retained report</h3>
      <p>
        Customer output uses a field allowlist. These synthetic draft reports
        are not construction or commissioning releases.
      </p>
      {(["customer", "internal"] as const).flatMap((a) =>
        (["html", "pdf"] as const).map((format) => (
          <button
            key={`${a}-${format}`}
            type="button"
            disabled={blocked}
            onClick={() =>
              void command.send(`${path}/outputs`, {
                ...fields,
                audience: a,
                format,
              })
            }
          >
            Retain {a} {format.toUpperCase()} report
          </button>
        )),
      )}
      <ul>
        {ledger.data?.outputs.map((o) => (
          <li key={o.id}>
            <a href={`/api/v1/${path}/outputs/${o.id}`}>
              Download exact {o.audience}{" "}
              {o.mime_type === "application/pdf" ? "PDF" : "HTML"} report
            </a>{" "}
            · <code>{o.content_hash}</code>
            {o.revision_id !== revisionId ? " · Historical" : ""}
          </li>
        ))}
      </ul>
      <h3>Prepare original PNG evidence</h3>
      <p>
        Preparing bytes does not change an immutable scope or its review. Add
        the prepared reference to the draft, then Save revision. The successor
        records its exact hash.
      </p>
      <p>
        {files.data?.policy ??
          "Bounded validated PNG evidence; no malware scanning or general document upload is implied."}
      </p>
      <label htmlFor="fertigation-evidence-file">PNG file (up to 4 MiB)</label>
      <input
        id="fertigation-evidence-file"
        type="file"
        accept="image/png"
        disabled={blocked}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <label htmlFor="fertigation-evidence-revision">
        Source revision / observation date
      </label>
      <input
        id="fertigation-evidence-revision"
        value={sourceRevision}
        disabled={blocked}
        onChange={(e) => setSourceRevision(e.target.value)}
      />
      <label htmlFor="fertigation-evidence-attribution">
        Source author / attribution
      </label>
      <input
        id="fertigation-evidence-attribution"
        value={attribution}
        disabled={blocked}
        onChange={(e) => setAttribution(e.target.value)}
      />
      <label htmlFor="fertigation-evidence-applicability">
        Applicable record and conditions
      </label>
      <input
        id="fertigation-evidence-applicability"
        value={applicability}
        disabled={blocked}
        onChange={(e) => setApplicability(e.target.value)}
      />
      <button
        type="button"
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
      </button>
      {file && !busy && (
        <button type="button" onClick={() => setFile(null)}>
          Discard selected file
        </button>
      )}
      {uploadUnknown && (
        <button
          type="button"
          disabled={uploadBusy}
          onClick={() => void upload(true)}
        >
          Confirm original upload
        </button>
      )}
      <ul>
        {files.data?.items.map((f) => (
          <li key={f.id}>
            <a href={`/api/v1/${path}/evidence/${f.id}`}>{f.label}</a> · exact
            hash <code>{f.sha256}</code> ·{" "}
            {evidenceIds.includes(f.id)
              ? "Reference included in displayed scope"
              : "Prepared; not included in displayed scope"}
            {onAddEvidence && (
              <button
                type="button"
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
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
