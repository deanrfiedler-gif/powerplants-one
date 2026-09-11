"use client";
import { useEffect, useRef, useState } from "react";
import {
  ErrorNotice,
  Field,
  SelectField,
  ValidationFields,
  isDenied,
  useCommand,
  useResource,
  type Failure,
} from "./business-ui";
import { LookupField, useUnsavedChanges } from "./record-ui";
import {
  formatDate,
  phases,
  scheduleIssues,
  statuses,
  type Owner,
  type Schedule,
  type Task,
} from "../projects/model";

export function ProjectTaskPanel({
  schedule,
  task,
  onClose,
  onSaved,
  onRefresh,
  onDenied,
  refreshing,
}: {
  schedule: Schedule;
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
  onRefresh: () => void;
  onDenied: () => void;
  refreshing: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    command = useCommand();
  const [ownerResolved, setOwnerResolved] = useState(!task?.owner_unavailable);
  const [editing, setEditing] = useState(!task),
    [ownerSearch, setOwnerSearch] = useState(""),
    [baseVersion, setBaseVersion] = useState(schedule.project.version),
    [reviewed, setReviewed] = useState(false);
  const [draft, setDraft] = useState(() => ({
    id: task?.id ?? crypto.randomUUID(),
    title: task?.title ?? "",
    phase: task?.phase ?? "Planning",
    status: task?.status ?? "Planned",
    milestone: task?.milestone ?? false,
    start_date: task?.start_date ?? "",
    finish_date: task?.finish_date ?? "",
    progress: String(task?.progress ?? 0),
    note: task?.note ?? "",
    owner_id: task?.owner_id ?? null,
    external_owner_id: task?.external_owner_id ?? null,
    dependencies: task?.dependencies ?? [],
    reason: task ? "Updated project schedule" : "Added project schedule item",
  }));
  const [initial] = useState(() => JSON.stringify(draft));
  const uncertain = !!(command.error as Failure | null)?.retryable;
  const dirty = JSON.stringify(draft) !== initial;
  const pending = command.busy || uncertain;
  useUnsavedChanges(editing && dirty, pending);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  useEffect(() => {
    if (isDenied(command.error)) onDenied();
  }, [command.error, onDenied]);
  const owners = useResource<{ items: Owner[]; has_more: boolean }>(
    editing
      ? `projects/${schedule.project.id}/owners?q=${encodeURIComponent(ownerSearch)}`
      : null,
  );
  const ownerValue = draft.owner_id
    ? `internal:${draft.owner_id}`
    : draft.external_owner_id
      ? `external:${draft.external_owner_id}`
      : "";
  const ownerOptions =
    owners.data?.items.map((o) => ({
      id: `${o.external ? "external" : "internal"}:${o.id}`,
      display_name: `${o.display_name}${o.external ? " · External" : ""}`,
    })) ?? [];
  const originalOwner = task?.owner_id
    ? `internal:${task.owner_id}`
    : task?.external_owner_id
      ? `external:${task.external_owner_id}`
      : null;
  if (
    originalOwner &&
    task?.owner_name &&
    !ownerOptions.some((o) => o.id === originalOwner)
  )
    ownerOptions.unshift({ id: originalOwner, display_name: task.owner_name });
  const update = <K extends keyof typeof draft>(
    key: K,
    value: (typeof draft)[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));
  const proposed: Task = {
    ...draft,
    version: task?.version ?? 1,
    progress: Number(draft.progress),
    start_date: draft.start_date || null,
    finish_date: draft.finish_date || null,
    note: draft.note || null,
    owner_name: task?.owner_name ?? null,
  };
  const issues = scheduleIssues(proposed, schedule.tasks),
    current = schedule.tasks.find((t) => t.id === draft.id);
  const conflict =
    (command.error as Failure | null)?.code === "VersionConflict";
  const close = () => {
    if (pending) return;
    if (
      editing &&
      dirty &&
      !window.confirm("Discard the unsaved task changes?")
    )
      return;
    onClose();
  };
  return (
    <dialog
      ref={dialog}
      className={`ppo-project-dialog ${editing ? "task-editor" : "task-details"}`}
      aria-labelledby="project-task-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header>
        <div>
          <small>
            {draft.phase} ·{" "}
            {task ? `Task version ${task.version}` : "New schedule item"}
          </small>
          <h2 id="project-task-title">
            {editing
              ? task
                ? "Edit task"
                : "Create task or milestone"
              : task?.title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close task"
          onClick={close}
          disabled={pending}
        >
          ×
        </button>
      </header>
      {!editing ? (
        <div className="project-task-details">
          <dl>
            <div>
              <dt>Owner</dt>
              <dd>
                {task?.owner_name ?? "Unassigned"}
                {task?.external_owner_id && " · External"}
              </dd>
            </div>
            <div>
              <dt>Start</dt>
              <dd>{formatDate(task!.start_date)}</dd>
            </div>
            <div>
              <dt>Finish</dt>
              <dd>{formatDate(task!.finish_date)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{task!.status.replace(/([a-z])([A-Z])/g, "$1 $2")}</dd>
            </div>
            <div>
              <dt>Progress</dt>
              <dd>{task!.progress}%</dd>
            </div>
          </dl>
          <h3>Predecessors</h3>
          {task!.dependencies.length ? (
            <ul>
              {task!.dependencies.map((d) => (
                <li key={d.task_id}>
                  {schedule.tasks.find((t) => t.id === d.task_id)?.title ??
                    "Unavailable task"}{" "}
                  · {d.kind === "FS" ? "Finish → Start" : "Start → Start"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No predecessors</p>
          )}
          {issues.length > 0 && (
            <div className="project-warning">
              <h3>Schedule issues</h3>
              <ul>
                {issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          <h3>Coordination note</h3>
          <p className="project-note">{task!.note ?? "No note added."}</p>
          <footer>
            <button type="button" onClick={close}>
              Close
            </button>
            {schedule.project.can_edit && (
              <button
                className="project-primary"
                type="button"
                onClick={() => setEditing(true)}
              >
                Edit task
              </button>
            )}
          </footer>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (command.busy || refreshing || !ownerResolved) return;
            const result = await command.send(
              `projects/${schedule.project.id}/tasks`,
              {
                ...draft,
                expected_version: baseVersion,
                progress: Number(draft.progress),
                start_date: draft.start_date || null,
                finish_date: draft.finish_date || null,
                note: draft.note.trim() || null,
              },
            );
            if (result) onSaved();
          }}
        >
          <ValidationFields error={command.error}>
            <ErrorNotice error={command.error} />
            {conflict && (
              <div className="project-warning">
                <p>
                  Your proposal is retained. Refresh to compare it with the
                  current saved schedule.
                </p>
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() => {
                    setReviewed(true);
                    onRefresh();
                  }}
                >
                  Load latest schedule
                </button>
                {reviewed &&
                  !refreshing &&
                  schedule.project.version !== baseVersion && (
                    <>
                      <p>
                        Current schedule: version {schedule.project.version}.{" "}
                        {current
                          ? `${current.title} · ${formatDate(current.start_date)} – ${formatDate(current.finish_date)} · ${current.progress}% · ${current.owner_name ?? "Unassigned"}.`
                          : "This is a new task."}
                      </p>
                      {current && (
                        <details open>
                          <summary>Current saved task details</summary>
                          <p>
                            Phase: {current.phase} · Status: {current.status} ·
                            Type: {current.milestone ? "Milestone" : "Task"}
                          </p>
                          <p className="project-note">
                            Note: {current.note ?? "No note added."}
                          </p>
                          <p>
                            Predecessors:{" "}
                            {current.dependencies.length
                              ? current.dependencies
                                  .map(
                                    (d) =>
                                      `${schedule.tasks.find((t) => t.id === d.task_id)?.title ?? "Unavailable task"} (${d.kind})`,
                                  )
                                  .join("; ")
                              : "None"}
                          </p>
                        </details>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setBaseVersion(schedule.project.version);
                          command.clear();
                          setReviewed(false);
                        }}
                      >
                        Use this version and keep my entries
                      </button>
                    </>
                  )}
              </div>
            )}
            {uncertain && (
              <p className="project-warning" role="status">
                The save result is unconfirmed. Retry the unchanged save to
                confirm the original operation.
              </p>
            )}
            <fieldset disabled={pending}>
              <Field
                name="title"
                label="Task name"
                value={draft.title}
                onChange={(v) => update("title", v)}
                required
              />
              <div className="project-form-grid">
                <SelectField
                  name="phase"
                  label="Phase"
                  value={draft.phase}
                  onChange={(v) => update("phase", v as typeof draft.phase)}
                  options={phases.map((id) => ({ id, display_name: id }))}
                />
                <SelectField
                  name="item_type"
                  label="Type"
                  value={draft.milestone ? "milestone" : "task"}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      milestone: v === "milestone",
                      finish_date:
                        v === "milestone" ? d.start_date : d.finish_date,
                      progress:
                        v === "milestone"
                          ? d.status === "Complete"
                            ? "100"
                            : "0"
                          : d.progress,
                      status:
                        v === "milestone" && d.status === "InProgress"
                          ? "Planned"
                          : d.status,
                    }))
                  }
                  options={[
                    { id: "task", display_name: "Task" },
                    { id: "milestone", display_name: "Milestone" },
                  ]}
                />
              </div>
              <LookupField
                name="owner_id"
                label="Owner"
                value={ownerValue}
                onChange={(value) => {
                  setOwnerResolved(true);
                  const [kind, id] = value.split(":");
                  setDraft((d) => ({
                    ...d,
                    owner_id: kind === "internal" ? id : null,
                    external_owner_id: kind === "external" ? id : null,
                  }));
                }}
                search={ownerSearch}
                onSearch={setOwnerSearch}
                options={ownerOptions}
                loading={owners.loading}
                more={owners.data?.has_more}
                error={!!owners.error}
              />
              {(ownerValue || !ownerResolved) && (
                <button
                  type="button"
                  className="project-text-button"
                  onClick={() => {
                    setOwnerResolved(true);
                    setDraft((d) => ({
                      ...d,
                      owner_id: null,
                      external_owner_id: null,
                    }));
                  }}
                >
                  Clear owner
                </button>
              )}
              {!ownerResolved && (
                <p className="project-warning">
                  The assigned owner is unavailable. Choose a permitted owner or
                  explicitly clear the assignment before saving.
                </p>
              )}
              <small>
                External assignment records responsibility and does not invite
                anyone or grant access.
              </small>
              <div className="project-form-grid">
                <Field
                  name="start_date"
                  label={draft.milestone ? "Milestone date" : "Start date"}
                  type="date"
                  value={draft.start_date}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      start_date: v,
                      finish_date: d.milestone ? v : d.finish_date,
                    }))
                  }
                />
                {!draft.milestone && (
                  <Field
                    name="finish_date"
                    label="Finish date"
                    type="date"
                    value={draft.finish_date}
                    onChange={(v) => update("finish_date", v)}
                  />
                )}
              </div>
              <button
                type="button"
                className="project-text-button"
                onClick={() =>
                  setDraft((d) => ({ ...d, start_date: "", finish_date: "" }))
                }
              >
                Leave unscheduled
              </button>
              <div className="project-form-grid">
                <SelectField
                  name="status"
                  label="Status"
                  value={draft.status}
                  onChange={(v) =>
                    setDraft((d) => ({
                      ...d,
                      status: v as typeof draft.status,
                      progress:
                        v === "Complete"
                          ? "100"
                          : v === "Planned" || d.milestone
                            ? "0"
                            : d.progress === "100"
                              ? "0"
                              : d.progress,
                    }))
                  }
                  options={statuses
                    .filter((s) => !draft.milestone || s !== "InProgress")
                    .map((id) => ({
                      id,
                      display_name: id.replace(/([a-z])([A-Z])/g, "$1 $2"),
                    }))}
                />
                {!draft.milestone && (
                  <Field
                    name="progress"
                    label="Progress (%)"
                    type="number"
                    value={draft.progress}
                    onChange={(v) =>
                      setDraft((d) => ({
                        ...d,
                        progress: v,
                        status:
                          Number(v) === 100
                            ? "Complete"
                            : d.status === "Complete" ||
                                (Number(v) > 0 && d.status === "Planned")
                              ? "InProgress"
                              : d.status,
                      }))
                    }
                  />
                )}
              </div>
              <section className="project-predecessors">
                <h3>Predecessors</h3>
                {draft.dependencies.map((dep, i) => (
                  <div className="project-predecessor" key={i}>
                    <label>
                      <span className="sr-only">Predecessor {i + 1}</span>
                      <select
                        aria-label={`Predecessor ${i + 1}`}
                        required
                        value={dep.task_id}
                        onChange={(e) =>
                          update(
                            "dependencies",
                            draft.dependencies.map((d, n) =>
                              n === i ? { ...d, task_id: e.target.value } : d,
                            ),
                          )
                        }
                      >
                        <option value="">Choose a task</option>
                        {schedule.tasks
                          .filter((t) => t.id !== draft.id)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                      </select>
                    </label>
                    <select
                      aria-label={`Relationship ${i + 1}`}
                      value={dep.kind}
                      onChange={(e) =>
                        update(
                          "dependencies",
                          draft.dependencies.map((d, n) =>
                            n === i
                              ? { ...d, kind: e.target.value as "FS" | "SS" }
                              : d,
                          ),
                        )
                      }
                    >
                      <option value="FS">Finish → Start</option>
                      <option value="SS">Start → Start</option>
                    </select>
                    <button
                      type="button"
                      aria-label={`Remove predecessor ${i + 1}`}
                      onClick={() =>
                        update(
                          "dependencies",
                          draft.dependencies.filter((_, n) => n !== i),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={
                    draft.dependencies.length >= 50 ||
                    !schedule.tasks.some((t) => t.id !== draft.id)
                  }
                  onClick={() =>
                    update("dependencies", [
                      ...draft.dependencies,
                      { task_id: "", kind: "FS" },
                    ])
                  }
                >
                  + Predecessor
                </button>
                <p>
                  Dates remain under your control. Finish-to-start uses the next
                  Mon–Fri day; no tasks are moved automatically.
                </p>
              </section>
              {issues.length > 0 && (
                <div className="project-warning">
                  <strong>Dates to review</strong>
                  <ul>
                    {issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                  <p>You can retain these dates when saving.</p>
                </div>
              )}
              <Field
                name="note"
                label="Coordination note"
                value={draft.note}
                onChange={(v) => update("note", v)}
                multiline
                maxLength={2000}
              />
              <Field
                name="reason"
                label="Reason for change"
                value={draft.reason}
                onChange={(v) => update("reason", v)}
                required
                maxLength={1000}
              />
            </fieldset>
          </ValidationFields>
          <footer>
            <button type="button" onClick={close} disabled={pending}>
              Cancel
            </button>
            <button
              className="project-primary"
              type="submit"
              disabled={
                command.busy ||
                refreshing ||
                conflict ||
                !schedule.project.can_edit ||
                !ownerResolved
              }
            >
              {command.busy
                ? "Saving…"
                : uncertain
                  ? "Retry unchanged save"
                  : "Save task"}
            </button>
          </footer>
        </form>
      )}
    </dialog>
  );
}
