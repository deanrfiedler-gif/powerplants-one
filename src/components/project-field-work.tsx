"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ErrorNotice,
  Field,
  ReadState,
  SelectField,
  Status,
  ValidationFields,
  useCommand,
  useResource,
  type Failure,
} from "./business-ui";
import { Button } from "./ui/button";
import type { Project } from "../projects/model";
import type {
  FieldWork,
  FieldWorkCandidate,
  FieldWorkItem,
} from "../service/project-field-work-model";

// B1 (project delivery billing decision R1): the project's field work. Service still owns visits and
// bookings; this section only lists, links and unlinks work orders, each with a reason.
type Candidates = { items: FieldWorkCandidate[]; has_more: boolean };
const label = (w: { display_number: string; summary: string | null }) =>
  `${w.display_number} · ${w.summary ?? "Work scope needed"}`;

export function ProjectFieldWork({
  project,
  fieldWork,
  onChanged,
}: {
  project: Project;
  fieldWork: FieldWork;
  onChanged: () => void;
}) {
  const [linking, setLinking] = useState(false),
    [unlinking, setUnlinking] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const done = (message: string) => {
    setLinking(false);
    setUnlinking(null);
    setNotice(message);
    onChanged();
  };
  return (
    <section
      className="project-field-work business-card"
      aria-labelledby="project-field-work-title"
    >
      <header className="project-field-work-header">
        <div>
          <h2 id="project-field-work-title">Field work</h2>
          <p>
            Service work orders that belong to this project. Service still books
            and confirms their visits.
          </p>
        </div>
        {fieldWork.can_link && !linking && (
          <Button
            variant="primary"
            onClick={() => {
              setNotice("");
              setUnlinking(null);
              setLinking(true);
            }}
          >
            Link a work order
          </Button>
        )}
      </header>
      <p role="status" className="project-field-work-status">
        {notice}
      </p>
      {linking && (
        <LinkWorkOrder
          project={project}
          onCancel={() => setLinking(false)}
          onLinked={(reference) => done(`${reference} linked to this project`)}
        />
      )}
      {fieldWork.items.length ? (
        <ul className="project-field-work-list">
          {fieldWork.items.map((w) => (
            <li key={w.id}>
              <div className="project-field-work-item">
                <div>
                  <Link href={`/service/work-orders/${w.id}`}>
                    {w.display_number}
                  </Link>
                  <span>{w.summary ?? "Work scope needed"}</span>
                  <small>
                    {w.site_name}
                    {w.visit_started ? " · Visit started" : ""}
                  </small>
                </div>
                <Status value={w.status} />
                {w.can_unlink && unlinking !== w.id && (
                  <Button
                    aria-label={`Unlink ${w.display_number}`}
                    onClick={() => {
                      setNotice("");
                      setLinking(false);
                      setUnlinking(w.id);
                    }}
                  >
                    Unlink
                  </Button>
                )}
              </div>
              {unlinking === w.id && (
                <UnlinkWorkOrder
                  project={project}
                  order={w}
                  onCancel={() => setUnlinking(null)}
                  onUnlinked={() =>
                    done(`${w.display_number} unlinked from this project`)
                  }
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="project-field-work-empty">
          No field work you can see is linked to this project.
        </p>
      )}
    </section>
  );
}

function Retry({ error }: { error: unknown }) {
  return (error as Failure | null)?.retryable ? (
    <p role="status">
      Retry the unchanged action to confirm the original save.
    </p>
  ) : null;
}

function LinkWorkOrder({
  project,
  onCancel,
  onLinked,
}: {
  project: Project;
  onCancel: () => void;
  onLinked: (reference: string) => void;
}) {
  const command = useCommand(),
    [search, setSearch] = useState(""),
    [chosen, setChosen] = useState(""),
    [reason, setReason] = useState("");
  const candidates = useResource<Candidates>(
    `projects/${project.id}/field-work/candidates?q=${encodeURIComponent(search)}`,
  );
  const items = candidates.data?.items ?? [],
    order = items.find((w) => w.id === chosen);
  const uncertain = !!(command.error as Failure | null)?.retryable;
  return (
    <form
      className="project-field-work-form"
      aria-label="Link a work order"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!order || command.busy) return;
        const receipt = await command.send(
          `service/work-orders/${order.id}/project-link`,
          {
            project_id: project.id,
            expected_version: order.version,
            expected_project_version: project.version,
            reason: reason.trim(),
          },
        );
        if (receipt) onLinked(order.display_number);
      }}
    >
      <ValidationFields error={command.error}>
        <ErrorNotice error={command.error} />
        <Retry error={command.error} />
        <fieldset disabled={command.busy || uncertain}>
          <Field
            name="field-work-search"
            label="Find a work order"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setChosen("");
            }}
            hint="Search by reference or scope. Only unlinked work orders for this customer that you may edit are listed."
          />
          <ReadState
            loading={candidates.loading}
            error={candidates.error}
            retry={candidates.reload}
            focusOnError={false}
          />
          <SelectField
            name="field-work-order"
            validationField="project_id"
            label="Work order"
            value={chosen}
            onChange={setChosen}
            options={items.map((w) => ({ id: w.id, display_name: label(w) }))}
            empty={
              candidates.loading
                ? "Loading…"
                : items.length
                  ? "Choose a work order…"
                  : "No work orders to link"
            }
            required
          />
          {candidates.data?.has_more && (
            <small>
              More work orders match. Narrow the search to see them.
            </small>
          )}
          <Field
            name="field-work-link-reason"
            validationField="reason"
            label="Reason for linking"
            value={reason}
            onChange={setReason}
            maxLength={1000}
            required
          />
        </fieldset>
      </ValidationFields>
      <footer className="project-field-work-actions">
        <Button onClick={onCancel} disabled={command.busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          busy={command.busy}
          disabled={!order || !reason.trim()}
        >
          {uncertain ? "Retry unchanged link" : "Link work order"}
        </Button>
      </footer>
    </form>
  );
}

function UnlinkWorkOrder({
  project,
  order,
  onCancel,
  onUnlinked,
}: {
  project: Project;
  order: FieldWorkItem;
  onCancel: () => void;
  onUnlinked: () => void;
}) {
  const command = useCommand(),
    [reason, setReason] = useState("");
  const uncertain = !!(command.error as Failure | null)?.retryable;
  return (
    <form
      className="project-field-work-form"
      aria-label={`Unlink ${order.display_number}`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (command.busy) return;
        const receipt = await command.send(
          `service/work-orders/${order.id}/project-unlink`,
          {
            project_id: project.id,
            expected_version: order.version,
            expected_project_version: project.version,
            reason: reason.trim(),
          },
        );
        if (receipt) onUnlinked();
      }}
    >
      <ValidationFields error={command.error}>
        <ErrorNotice error={command.error} />
        <Retry error={command.error} />
        <fieldset disabled={command.busy || uncertain}>
          <Field
            name={`field-work-unlink-reason-${order.id}`}
            validationField="reason"
            label="Reason for unlinking"
            value={reason}
            onChange={setReason}
            maxLength={1000}
            required
            hint="The work order stays in Service. Only its project link is removed."
          />
        </fieldset>
      </ValidationFields>
      <footer className="project-field-work-actions">
        <Button onClick={onCancel} disabled={command.busy}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="danger"
          busy={command.busy}
          disabled={!reason.trim()}
        >
          {uncertain ? "Retry unchanged unlink" : "Unlink work order"}
        </Button>
      </footer>
    </form>
  );
}
