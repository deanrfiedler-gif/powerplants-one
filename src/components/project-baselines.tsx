"use client";
import { useEffect, useRef, useState } from "react";
import { compareBaseline, type BaselineRead } from "../projects/baseline-model";
import { formatDate, scheduleIssues } from "../projects/model";
import {
  ErrorNotice,
  Field,
  ReadState,
  SelectField,
  ValidationFields,
  isDenied,
  useCommand,
  useResource,
  type Failure,
} from "./business-ui";
import { useUnsavedChanges } from "./record-ui";
import { Button } from "./ui/button";

const variance = (n: number | null) =>
  n === null
    ? "Not comparable"
    : n === 0
      ? "On baseline"
      : `${Math.abs(n)} calendar day${Math.abs(n) === 1 ? "" : "s"} ${n > 0 ? "later" : "earlier"}`;

export function ProjectBaselines({
  id,
  onClose,
  onDenied,
  onSaved,
}: {
  id: string;
  onClose: () => void;
  onDenied: () => void;
  onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState(""),
    [label, setLabel] = useState(""),
    [reason, setReason] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const resource = useResource<BaselineRead>(
      `projects/${id}/baselines${query}`,
    ),
    command = useCommand();
  const uncertain = !!(command.error as Failure | null)?.retryable,
    pending = command.busy || uncertain;
  const dirty = !!(label || reason || reviewed);
  useUnsavedChanges(dirty, pending);
  useEffect(() => {
    const node = dialog.current,
      opener = document.activeElement;
    node?.showModal();
    return () => {
      node?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  const denied = isDenied(resource.error) || isDenied(command.error);
  useEffect(() => {
    if (denied) onDenied();
  }, [denied, onDenied]);
  const close = () => {
    if (
      pending ||
      (dirty && !window.confirm("Discard the unsaved baseline entry?"))
    )
      return;
    onClose();
  };
  const reload = () => {
    if (!pending) {
      command.clear();
      setReviewed(false);
      resource.reload();
    }
  };
  const data = denied ? null : resource.data;
  const rows = data
    ? compareBaseline(data.selected?.snapshot ?? [], data.schedule.tasks)
    : [];
  const ready =
    !!data?.schedule.tasks.length &&
    data.schedule.tasks.every((t) => t.start_date && t.finish_date);
  const stale = (command.error as Failure | null)?.code === "VersionConflict";
  return (
    <dialog
      ref={dialog}
      className="ppo-project-dialog project-baseline-dialog"
      aria-labelledby="project-baseline-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header>
        <h2 id="project-baseline-title">Baselines and forecast</h2>
        <Button aria-label="Close baselines" disabled={pending} onClick={close}>
          ×
        </Button>
      </header>
      <div className="project-task-details">
        {denied ? (
          <ErrorNotice error={resource.error ?? command.error} />
        ) : !data ? (
          <ReadState
            loading={resource.loading}
            error={resource.error}
            retry={reload}
          />
        ) : (
          <>
            <p>
              Forecast version {data.schedule.project.version} · Observed{" "}
              {new Date(data.schedule.observed_at).toLocaleString()}.
            </p>
            <p>
              Finish-to-start uses the next working date in the current Project calendar; start-to-start
              uses the predecessor start. Dates remain manually scheduled.
              Differences below are calendar days. Current calendar: {data.schedule.programme?.calendar.name ?? "Synthetic Monday-Friday"}.
            </p>
            <div className="project-baseline-actions">
              <Button disabled={pending || resource.loading} onClick={reload}>
                Refresh comparison
              </Button>
              {query && (
                <Button
                  disabled={pending || resource.loading}
                  onClick={() => {
                    setReviewed(false);
                    setQuery("");
                  }}
                >
                  Latest baselines
                </Button>
              )}
              {data.next_cursor && (
                <Button
                  disabled={pending || resource.loading}
                  onClick={() => {
                    setReviewed(false);
                    setQuery(`?before=${data.next_cursor}`);
                  }}
                >
                  Older baselines
                </Button>
              )}
            </div>
            <ErrorNotice error={resource.error} />
            {data.items.length > 0 && (
              <SelectField
                name="baseline_revision"
                label="Compare baseline"
                value={String(data.selected?.revision ?? "")}
                disabled={pending || resource.loading}
                options={data.items.map((b) => ({
                  id: String(b.revision),
                  display_name: `Baseline ${b.revision} · ${b.label}`,
                }))}
                onChange={(v) => {
                  if (!v) return;
                  const q = new URLSearchParams(query);
                  q.set("revision", v);
                  setReviewed(false);
                  setQuery("?" + q);
                }}
              />
            )}
            {data.selected ? (
              <div className="project-baseline-meta">
                <h3>
                  Baseline {data.selected.revision}: {data.selected.label}
                </h3>
                <p>
                  Schedule version {data.selected.project_version} · Recorded by{" "}
                  {data.selected.actor_name} on{" "}
                  {new Date(data.selected.created_at).toLocaleString()}.
                </p>
                <p>Reason: {data.selected.reason}</p>
              </div>
            ) : (
              <p>
                No baseline recorded. Review the current schedule below before
                recording the first one.
              </p>
            )}
            <h3>
              {data.selected ? "Forecast comparison" : "Current schedule"}
            </h3>
            {data.selected && (
              <p role="status">
                {
                  rows.filter(
                    (r) =>
                      (r.task.milestone || r.original?.milestone) &&
                      (r.finish_days ?? 0) > 0,
                  ).length
                }{" "}
                milestone(s) later than baseline ·{" "}
                {rows.filter((r) => r.affected).length} additional successor(s)
                to review.
              </p>
            )}
            {!rows.length && (
              <p>No schedule items yet. Add and date tasks in the schedule.</p>
            )}
            <ul className="project-baseline-items">
              {rows.map((r) => {
                const issues = scheduleIssues(r.task, data.schedule.tasks, data.schedule.programme?.calendar);
                return (
                  <li key={r.task.id}>
                    <h4>
                      {r.task.title}
                      {r.task.milestone ? " · Milestone" : ""}
                    </h4>
                    <p>Current owner: {r.task.owner_name ?? "Unassigned"}</p>
                    {r.original &&
                      r.original.milestone !== r.task.milestone && (
                        <p>
                          Item type changed from{" "}
                          {r.original.milestone ? "milestone" : "task"} to{" "}
                          {r.task.milestone ? "milestone" : "task"} — review the
                          baseline commitment.
                        </p>
                      )}
                    {data.selected && (
                      <p>
                        Baseline:{" "}
                        {r.original
                          ? `${formatDate(r.original.start_date)} – ${formatDate(r.original.finish_date)}`
                          : "Added after this baseline"}
                      </p>
                    )}
                    <p>
                      Forecast: {formatDate(r.task.start_date)} –{" "}
                      {formatDate(r.task.finish_date)}
                    </p>
                    {data.selected && r.original && (
                      <p>
                        Start: {variance(r.start_days)} · Finish:{" "}
                        {variance(r.finish_days)}
                      </p>
                    )}
                    {r.dependencies_changed && (
                      <p>
                        Predecessor links changed — review the dependency plan.
                      </p>
                    )}
                    {r.affected && (
                      <p className="project-warning">
                        Downstream of a changed item — review dates and
                        ownership. A delay is not automatically assumed.
                      </p>
                    )}
                    {issues.length > 0 && (
                      <ul aria-label={`Schedule warnings for ${r.task.title}`}>
                        {issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            {data.can_record ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    command.busy ||
                    resource.loading ||
                    resource.error ||
                    stale ||
                    !reviewed ||
                    !ready
                  )
                    return;
                  const result = await command.send(
                    `projects/${id}/baselines`,
                    {
                      expected_version: data.schedule.project.version,
                      expected_baseline_revision: data.latest_revision,
                      label,
                      reason,
                      reviewed,
                    },
                  );
                  if (result) {
                    setLabel("");
                    setReason("");
                    setReviewed(false);
                    setQuery("");
                    resource.reload();
                    onSaved();
                  }
                }}
              >
                <h3>Record a new baseline</h3>
                <p>
                  Each revision preserves the current dates and links. Existing
                  baselines remain available. Commercial approval and confirmed
                  Service bookings are separate.
                </p>
                {!ready && (
                  <p className="project-warning">
                    Add at least one task and date every task before recording a
                    baseline.
                  </p>
                )}
                <ValidationFields error={command.error}>
                  <ErrorNotice error={command.error} />
                  {stale && (
                    <p>
                      Refresh comparison, inspect the updated schedule and
                      acknowledge the review again. Your label and reason are
                      retained.
                    </p>
                  )}
                  {uncertain && (
                    <p role="status">
                      The result is unconfirmed. Retry the unchanged baseline to
                      confirm the original operation.
                    </p>
                  )}
                  <fieldset
                    disabled={
                      pending ||
                      resource.loading ||
                      !!resource.error ||
                      stale ||
                      !ready
                    }
                  >
                    <Field
                      name="label"
                      label="Baseline label"
                      value={label}
                      onChange={setLabel}
                      required
                    />
                    <Field
                      name="reason"
                      label="Baseline reason"
                      value={reason}
                      onChange={setReason}
                      required
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={reviewed}
                        onChange={(e) => setReviewed(e.target.checked)}
                      />{" "}
                      I reviewed all schedule dates, dependencies and warnings.
                    </label>
                  </fieldset>
                  <Button
                    variant="primary"
                    type="submit"
                    busy={command.busy}
                    disabled={
                      !reviewed ||
                      !ready ||
                      resource.loading ||
                      !!resource.error ||
                      stale
                    }
                  >
                    {uncertain ? "Retry unchanged baseline" : "Record baseline"}
                  </Button>
                  {command.saved && <p role="status">{command.saved}</p>}
                </ValidationFields>
              </form>
            ) : (
              <p>
                Only the current project coordinator with edit access can record
                a baseline for an active project.
              </p>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
