import type { FileHistory } from "./model";

export function DocumentDetails({
  history,
  owner,
  reviewer,
  reviewedAt,
}: {
  history: FileHistory;
  owner?: string;
  reviewer?: string | null;
  reviewedAt?: string | null;
}) {
  return (
    <div className="studio-note">
      {owner && <p>Owner: {owner}</p>}
      <p>
        Last committed change: {history.last_changed_at || "Not available"} ·{" "}
        {history.state}
      </p>
      {owner && (
        <p>
          Last reviewed:{" "}
          {reviewedAt && reviewer
            ? `${reviewedAt} · ${reviewer}`
            : "Not recorded"}
        </p>
      )}
      {history.state === "Uncommitted changes" && (
        <p>Local edits are newer than the saved Git history.</p>
      )}
      <div className="studio-actions">
        {history.history_url && (
          <a
            href={history.history_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View history ↗
          </a>
        )}
        {history.source_url && (
          <a
            href={history.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View committed source ↗
          </a>
        )}
      </div>
    </div>
  );
}
