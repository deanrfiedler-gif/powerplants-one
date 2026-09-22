"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorNotice } from "./business-ui";
import { useCrmCommand, useCrmResource } from "./crm-state";
import type { FertigationRecord } from "../estimating/fertigation/storage-types";

type Source = {
  estimating_workspace_id: string;
  expected_workspace_version: number;
  option_id: string;
  option_label: string;
  revision_id: string;
  revision: number;
  site: string;
  facility_ids: string[];
  configuration: {
    systems: { id: string; name: string; coverage: { area_ids: string[] } }[];
  } | null;
};
type Action = "copy" | "restore" | "archive";

/** Saved-content operations never consume or discard the working scope draft. */
export function FertigationHistoryActions({
  scope,
  savedRevision,
  revisions,
  canEdit,
  blocked,
  open,
  onPendingChange,
  onDirtyChange,
  onChanged,
}: {
  scope: FertigationRecord;
  savedRevision: string;
  revisions: { id: string; version: number }[];
  canEdit: boolean;
  blocked: boolean;
  open: boolean;
  onPendingChange: (value: boolean) => void;
  onDirtyChange: (value: boolean) => void;
  onChanged: () => void;
}) {
  const sources = useCrmResource<{ sources: Source[] }>(
    open
      ? `estimating/fertigation/options?estimating_workspace_id=${scope.estimating_workspace_id}`
      : null,
    true,
  );
  const [action, setAction] = useState<Action | null>(null),
    [revisionId, setRevisionId] = useState(savedRevision),
    [optionId, setOptionId] = useState(scope.option_id),
    [systemId, setSystemId] = useState(""),
    [copySources, setCopySources] = useState<Source[]>([]),
    [target, setTarget] = useState({
      version: scope.version,
      revisionId: scope.current_revision_id,
    }),
    [name, setName] = useState(`${scope.name} — copy`.slice(0, 200)),
    [reason, setReason] = useState(""),
    [accepted, setAccepted] = useState<{ action: Action; id: string } | null>(
      null,
    );
  const command = useCrmCommand(
    (receipt) => {
      setAccepted({ action: action!, id: receipt.record_id });
      setAction(null);
      setReason("");
      onChanged();
    },
    "No history action pending",
    onPendingChange,
    false,
  );
  useEffect(() => {
    onDirtyChange(command.hasUnsavedChanges);
  }, [command.hasUnsavedChanges, onDirtyChange]);
  const pending = command.busy || command.uncertain,
    source = copySources.find((item) => item.option_id === optionId),
    system = source?.configuration?.systems.find(
      (item) => item.id === systemId,
    ),
    revision = revisions.find((item) => item.id === revisionId),
    allowed = !blocked && !pending;
  function begin(next: Action) {
    if (!allowed) return;
    setAction(next);
    setCopySources(sources.data?.sources ?? []);
    setTarget({
      version: scope.version,
      revisionId: scope.current_revision_id,
    });
    setAccepted(null);
    command.dirty();
  }
  return (
    <section className="fn-section" aria-label="Saved scope actions">
      <h3>Copy, restore or archive</h3>
      <p>
        These actions use an exact saved revision. Save or explicitly discard
        working scope edits before continuing. Earlier revisions and outputs
        remain unchanged.
      </p>
      <ErrorNotice error={command.error} />
      {blocked && (
        <p className="fn-note">
          Working scope or editor changes are still pending. Close this history
          panel and finish those changes first.
        </p>
      )}
      {accepted && (
        <p role="status" className="fn-note">
          {accepted.action === "copy" ? (
            <>
              Copy saved with new record identities.{" "}
              <Link href={`/estimating/fertigation/${accepted.id}`}>
                Open copied scope
              </Link>
            </>
          ) : accepted.action === "restore" ? (
            "Historical inputs restored as a new current revision. Previous review and output records remain attached to their original revisions."
          ) : (
            "Scope archived. Its saved history and outputs remain available; editing is disabled."
          )}
        </p>
      )}
      {!action ? (
        <div className="fn-actions">
          <button
            disabled={!allowed || !sources.data?.sources.length}
            onClick={() => begin("copy")}
          >
            Copy saved revision
          </button>
          <button
            disabled={!allowed || !canEdit}
            onClick={() => begin("restore")}
          >
            Restore saved revision
          </button>
          <button
            disabled={!allowed || !canEdit}
            onClick={() => begin("archive")}
          >
            Archive scope
          </button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!allowed || !reason.trim()) return;
            if (action === "copy") {
              if (!source || !revision || !name.trim()) return;
              void command.send(`estimating/fertigation/${scope.id}/copy`, {
                id: crypto.randomUUID(),
                name: name.trim(),
                source_revision_id: revisionId,
                estimating_workspace_id: source.estimating_workspace_id,
                option_id: source.option_id,
                revision_id: source.revision_id,
                expected_workspace_version: source.expected_workspace_version,
                coverage: {
                  system_id: systemId || null,
                  area_ids: system?.coverage.area_ids ?? [],
                  facility_ids: source.facility_ids,
                },
                reason: reason.trim(),
              });
            } else if (action === "restore") {
              if (
                !canEdit ||
                !revision ||
                revisionId === scope.current_revision_id
              )
                return;
              void command.send(`estimating/fertigation/${scope.id}/restore`, {
                source_revision_id: revisionId,
                expected_version: target.version,
                expected_revision_id: target.revisionId,
                reason: reason.trim(),
              });
            } else if (canEdit)
              void command.send(`estimating/fertigation/${scope.id}/archive`, {
                expected_version: target.version,
                reason: reason.trim(),
              });
          }}
        >
          <fieldset disabled={!allowed}>
            <div className="fn-fields">
              {action !== "archive" && (
                <label>
                  Saved revision to {action}
                  <select
                    value={revisionId}
                    onChange={(event) => {
                      setRevisionId(event.target.value);
                      command.dirty();
                    }}
                  >
                    {revisions.map((item) => (
                      <option key={item.id} value={item.id}>
                        Revision {item.version}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {action === "copy" && (
                <>
                  <label>
                    Copy name
                    <input
                      value={name}
                      required
                      maxLength={200}
                      onChange={(event) => {
                        setName(event.target.value);
                        command.dirty();
                      }}
                    />
                  </label>
                  <label>
                    Copy to saved Discovery alternative
                    <select
                      value={optionId}
                      required
                      onChange={(event) => {
                        setOptionId(event.target.value);
                        setSystemId("");
                        command.dirty();
                      }}
                    >
                      {copySources.map((item) => (
                        <option value={item.option_id} key={item.option_id}>
                          {item.option_label} · r{item.revision} · {item.site}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Copy coverage system
                    <select
                      value={systemId}
                      onChange={(event) => {
                        setSystemId(event.target.value);
                        command.dirty();
                      }}
                    >
                      <option value="">
                        Site / selected Facilities; no system selected
                      </option>
                      {source?.configuration?.systems.map((item) => (
                        <option value={item.id} key={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <label className="fn-wide">
                Reason for {action}
                <textarea
                  value={reason}
                  required
                  maxLength={1000}
                  onChange={(event) => {
                    setReason(event.target.value);
                    command.dirty();
                  }}
                />
              </label>
            </div>
            <p className="fn-note">
              {action === "copy"
                ? `Copy ${revision ? `revision ${revision.version}` : "the selected revision"} into a new scope with remapped design record identities. Canonical Facilities and Assets retain their identities. Reviews are not copied or approved.`
                : action === "restore"
                  ? `Restore ${revision ? `revision ${revision.version}` : "the selected revision"} inputs into a new current revision. The server rechecks the current version and exact source binding; changed upstream context must be explicitly refreshed first. No existing estimate is repriced.`
                  : "Archive this scope after recording the reason. This disables new edits and preserves every saved revision, review, output and installed Asset."}
            </p>
            <div className="fn-actions">
              <button
                className="fn-primary"
                type="submit"
                disabled={
                  !reason.trim() ||
                  (action === "copy" &&
                    (!source || !revision || !name.trim())) ||
                  (action === "restore" &&
                    (!canEdit ||
                      !revision ||
                      revisionId === scope.current_revision_id)) ||
                  (action === "archive" && !canEdit)
                }
              >
                {action === "copy"
                  ? "Create saved copy"
                  : action === "restore"
                    ? "Restore as new revision"
                    : "Confirm archive scope"}
              </button>
              <button
                type="button"
                onClick={() => {
                  command.discard();
                  setAction(null);
                  setReason("");
                }}
              >
                Discard action
              </button>
            </div>
          </fieldset>
          {pending && <p role="status">{command.status}</p>}
          {command.uncertain && (
            <button
              type="button"
              disabled={command.busy}
              onClick={() => void command.reconcile()}
            >
              Confirm original history action
            </button>
          )}
        </form>
      )}
      {!!sources.error && (
        <p className="fn-note">
          No permitted copy destination is currently available. Existing exact
          history remains readable.
        </p>
      )}
      {action && !pending && (
        <p className="fn-subtle">
          Closing this panel keeps these entries in memory. Discard action
          explicitly clears them.
        </p>
      )}
    </section>
  );
}
