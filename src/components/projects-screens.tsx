"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ErrorNotice,
  Field,
  ReadState,
  ValidationFields,
  isDenied,
  useCommand,
  useResource,
  type Envelope,
  type Failure,
  type Option,
} from "./business-ui";
import { useIdentity } from "./business-session";
import { LookupField, useUnsavedChanges } from "./record-ui";
import { ProjectsGantt } from "./projects-gantt";
import { ProjectTaskPanel } from "./project-task-panel";
import {
  formatDate,
  type Project,
  type ProjectHistory,
  type Schedule,
  type Task,
} from "../projects/model";
import type { ShellContext } from "../shell/model";

export function ProjectRegister() {
  const [search, setSearch] = useState(""),
    [cursors, setCursors] = useState<(string | null)[]>([null]);
  const cursor = cursors.at(-1),
    resource = useResource<Envelope<Project>>(
      `projects?q=${encodeURIComponent(search)}${cursor ? `&cursor=${cursor}` : ""}`,
    ),
    context = useResource<ShellContext>("shell/context");
  return (
    <section className="project-register">
      <div className="business-heading">
        <div>
          <h1>Projects</h1>
          <p>Plan delivery, assign responsibility and track the schedule.</p>
        </div>
        {context.data?.actions.some((a) => a.id === "project") && (
          <Link href="/projects/new" className="primary-link">
            + Project
          </Link>
        )}
      </div>
      <Field
        name="project-search"
        label="Search projects"
        value={search}
        onChange={(v) => {
          setSearch(v);
          setCursors([null]);
        }}
      />
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {!resource.error && !resource.loading && resource.data && (
        <>
          <div className="project-register-list">
            {resource.data.items.map((p) => (
              <Link
                href={`/projects/${p.id}`}
                className="project-register-card"
                key={p.id}
              >
                <small>{p.display_number}</small>
                <h2>{p.title}</h2>
                <p>
                  {p.customer_name} · {p.site_name}
                </p>
                <span>Coordinator: {p.coordinator_name}</span>
                <span>
                  Target:{" "}
                  {p.target_date ? formatDate(p.target_date) : "Not set"}
                </span>
                <strong>Open schedule →</strong>
              </Link>
            ))}
          </div>
          {!resource.data.items.length && (
            <div className="business-card">
              <h2>{search ? "No matching projects" : "No projects yet"}</h2>
              <p>
                {search
                  ? "Try another name, customer or reference."
                  : "Create a project to start planning its tasks and milestones."}
              </p>
            </div>
          )}
          <div className="project-pagination">
            <button
              disabled={cursors.length === 1}
              onClick={() => setCursors((c) => c.slice(0, -1))}
            >
              Previous
            </button>
            <button
              disabled={!resource.data.next_cursor}
              onClick={() =>
                setCursors((c) => [...c, resource.data!.next_cursor])
              }
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
type Options = {
  items: (Option & { company_id?: string })[];
  has_more: boolean;
};
export function NewProject() {
  const router = useRouter(),
    command = useCommand();
  const [id] = useState(() => crypto.randomUUID()),
    [title, setTitle] = useState(""),
    [customer, setCustomer] = useState(""),
    [company, setCompany] = useState(""),
    [site, setSite] = useState(""),
    [coordinator, setCoordinator] = useState(""),
    [target, setTarget] = useState("");
  const [customerQuery, setCustomerQuery] = useState(""),
    [siteQuery, setSiteQuery] = useState(""),
    [ownerQuery, setOwnerQuery] = useState("");
  const customers = useResource<Options>(
      `projects/options?kind=customer&q=${encodeURIComponent(customerQuery)}`,
    ),
    sites = useResource<Options>(
      customer
        ? `projects/options?kind=site&organisation_id=${customer}&q=${encodeURIComponent(siteQuery)}`
        : null,
    ),
    owners = useResource<Options>(
      customer && site
        ? `projects/options?kind=coordinator&organisation_id=${customer}&site_id=${site}&q=${encodeURIComponent(ownerQuery)}`
        : null,
    );
  const uncertain = !!(command.error as Failure | null)?.retryable;
  useUnsavedChanges(
    !!(title || customer || site || coordinator || target),
    command.busy || uncertain,
  );
  return (
    <section className="project-create">
      <nav aria-label="Breadcrumb">
        <Link href="/projects">Projects</Link> / New project
      </nav>
      <h1>Create project</h1>
      <p>
        Choose the existing customer and site, then nominate the project
        coordinator.
      </p>
      <form
        className="business-card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (command.busy) return;
          const receipt = await command.send<{ record_id: string }>(
            "projects",
            {
              id,
              title,
              company_id: company,
              organisation_id: customer,
              site_id: site,
              coordinator_id: coordinator,
              target_date: target || null,
              reason: "Created project schedule",
            },
          );
          if (receipt) router.push(`/projects/${receipt.record_id}`);
        }}
      >
        <ValidationFields error={command.error}>
          <ErrorNotice error={command.error} />
          {uncertain && (
            <p role="status">
              Retry the unchanged action to confirm the original save.
            </p>
          )}
          <fieldset disabled={command.busy || uncertain}>
            <Field
              name="title"
              label="Project name"
              value={title}
              onChange={setTitle}
              required
            />
            <LookupField
              name="organisation_id"
              label="Customer"
              value={customer}
              onChange={(value) => {
                setCustomer(value);
                setCompany(
                  customers.data?.items.find((c) => c.id === value)
                    ?.company_id ?? "",
                );
                setSite("");
                setSiteQuery("");
                setCoordinator("");
                setOwnerQuery("");
              }}
              search={customerQuery}
              onSearch={setCustomerQuery}
              options={customers.data?.items ?? []}
              loading={customers.loading}
              more={customers.data?.has_more}
              error={!!customers.error}
            />
            {customer && (
              <LookupField
                name="site_id"
                label="Site"
                value={site}
                onChange={(value) => {
                  setSite(value);
                  setCoordinator("");
                  setOwnerQuery("");
                }}
                search={siteQuery}
                onSearch={setSiteQuery}
                options={sites.data?.items ?? []}
                loading={sites.loading}
                more={sites.data?.has_more}
                error={!!sites.error}
              />
            )}
            {site && (
              <LookupField
                name="coordinator_id"
                label="Project coordinator"
                value={coordinator}
                onChange={setCoordinator}
                search={ownerQuery}
                onSearch={setOwnerQuery}
                options={owners.data?.items ?? []}
                loading={owners.loading}
                more={owners.data?.has_more}
                error={!!owners.error}
              />
            )}
            <Field
              name="target_date"
              label="Target handover"
              type="date"
              value={target}
              onChange={setTarget}
              hint="Optional project target. Task dates are planned separately."
            />
          </fieldset>
        </ValidationFields>
        <footer>
          <Link href="/projects">Cancel</Link>
          <button
            type="submit"
            className="project-primary"
            disabled={command.busy || !customer || !site || !coordinator}
          >
            {command.busy
              ? "Creating…"
              : uncertain
                ? "Retry unchanged creation"
                : "Create project"}
          </button>
        </footer>
      </form>
    </section>
  );
}
function History({ id, onClose }: { id: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null),
    [cursors, setCursors] = useState<(string | null)[]>([null]),
    cursor = cursors.at(-1),
    resource = useResource<ProjectHistory>(
      `projects/${id}/history${cursor ? `?cursor=${cursor}` : ""}`,
    );
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      className="ppo-project-dialog"
      ref={dialog}
      aria-labelledby="project-history-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id="project-history-title">Schedule change history</h2>
        <button type="button" aria-label="Close history" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="project-task-details">
        <ReadState
          loading={resource.loading}
          error={resource.error}
          retry={resource.reload}
        />
        {!resource.loading && !resource.error && (
          <ol className="project-history-list">
            {resource.data?.items.map((e) => (
              <li key={e.project_version}>
                <strong>
                  Version {e.project_version} ·{" "}
                  {e.event_type === "ProjectCreated"
                    ? "Project created"
                    : "Task saved"}
                </strong>
                <span>
                  {e.actor_name} ·{" "}
                  {new Date(e.created_at).toLocaleString("en-AU")}
                </span>
                <p>{e.reason}</p>
              </li>
            ))}
          </ol>
        )}
        <footer>
          <button
            disabled={cursors.length === 1}
            onClick={() => setCursors((c) => c.slice(0, -1))}
          >
            Newer
          </button>
          <button
            disabled={!resource.data?.next_cursor}
            onClick={() =>
              setCursors((c) => [...c, resource.data!.next_cursor])
            }
          >
            Older
          </button>
          <button onClick={onClose}>Close</button>
        </footer>
      </div>
    </dialog>
  );
}
export function ProjectSchedulePage({ id }: { id: string }) {
  const identity = useIdentity(),
    resource = useResource<Schedule>(`projects/${id}`),
    [panel, setPanel] = useState<{ task: Task | null } | null>(null),
    [history, setHistory] = useState(false),
    [saved, setSaved] = useState(""),
    [blocked, setBlocked] = useState(false);
  if (blocked || isDenied(resource.error))
    return (
      <section>
        <ErrorNotice
          error={
            resource.error ?? {
              message:
                "This project is no longer available to your current identity.",
            }
          }
        />
        <Link href="/projects">Back to projects</Link>
      </section>
    );
  if (!resource.data)
    return (
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
    );
  return (
    <>
      <ProjectsGantt
        key={id}
        schedule={resource.data}
        preferenceKey={`ppo:project-layout:r10:${identity.workspace_id}:${identity.actor_id}:${id}`}
        loading={resource.loading}
        saved={saved}
        onTask={(task) => setPanel({ task })}
        onHistory={() => setHistory(true)}
        onRefresh={resource.reload}
      />
      {resource.error && (
        <div className="project-load-error">
          <ErrorNotice error={resource.error} />
          <button onClick={resource.reload}>Retry refresh</button>
        </div>
      )}
      {panel && (
        <ProjectTaskPanel
          schedule={resource.data}
          task={panel.task}
          refreshing={resource.loading}
          onClose={() => setPanel(null)}
          onSaved={() => {
            setPanel(null);
            setSaved("Saved to the server");
            resource.reload();
          }}
          onRefresh={resource.reload}
          onDenied={() => {
            setBlocked(true);
            setPanel(null);
          }}
        />
      )}
      {history && <History id={id} onClose={() => setHistory(false)} />}
    </>
  );
}
