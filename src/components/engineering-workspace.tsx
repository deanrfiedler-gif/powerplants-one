"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useIdentity } from "./business-session";
import {
  ErrorNotice,
  ReadState,
  Field,
  ValidationFields,
  useCommand,
  useResource,
  type Envelope,
  type Option,
  type Failure,
} from "./business-ui";
import { LookupField, useUnsavedChanges } from "./record-ui";
import {
  disciplines,
  coordinationStates,
  engineeringDate,
  requiresAttention,
  type EngineeringPackage,
  type EngineeringDetail,
  type LinkKind,
} from "../engineering/model";
import type { ShellContext } from "../shell/model";
const views = [
  ["all", "All packages"],
  ["mine", "My work"],
  ["review", "Reviews"],
  ["released", "Released"],
] as const;
const tabs = [
  ["overview", "Overview"],
  ["documents", "Deliverables"],
  ["queries", "Technical queries"],
  ["review", "Review & history"],
] as const;
type Options = { items: Option[]; has_more: boolean };
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join("");
const dateText = (date: string | null) => engineeringDate(date);
function Person({ name }: { name: string }) {
  return (
    <span className="eng-person">
      <span className="eng-avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <span>{name}</span>
    </span>
  );
}
function Badge({ state }: { state: string }) {
  return (
    <span
      className={`eng-status ${state === "In design" ? "design" : state === "Awaiting information" ? "wait" : "queued"}`}
    >
      {state}
    </span>
  );
}
function tabKeys(
  e: React.KeyboardEvent<HTMLButtonElement>,
  items: readonly (readonly [string, string])[],
  index: number,
  select: (v: string) => void,
  prefix: string,
) {
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? items.length - 1
        : e.key === "ArrowRight"
          ? (index + 1) % items.length
          : e.key === "ArrowLeft"
            ? (index + items.length - 1) % items.length
            : null;
  if (next !== null) {
    e.preventDefault();
    select(items[next][0]);
    document.getElementById(prefix + items[next][0])?.focus();
  }
}
function Modal({
  open,
  title,
  drawer = false,
  onClose,
  children,
  footer,
  blocked = false,
}: {
  open: boolean;
  title: string;
  drawer?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  blocked?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const prior = document.activeElement as HTMLElement | null;
    const position = () => {
      const root = document
          .getElementById("ppo-engineering")!
          .getBoundingClientRect(),
        top = Math.max(root.top, 0),
        height = Math.max(0, Math.min(innerHeight, root.bottom) - top),
        right = Math.max(0, document.documentElement.clientWidth - root.right);
      if (drawer) {
        d.style.setProperty("--eng-drawer-top", top + "px");
        d.style.setProperty("--eng-drawer-right", right + "px");
        d.style.setProperty("--eng-drawer-height", height + "px");
        d.style.width = Math.min(750, root.width) + "px";
      } else {
        d.style.position = "fixed";
        d.style.inset = `${top}px ${right}px ${Math.max(0, innerHeight - root.bottom)}px ${Math.max(0, root.left)}px`;
        d.style.width = Math.min(620, root.width - 24) + "px";
        d.style.maxWidth = Math.max(0, root.width - 24) + "px";
        d.style.maxHeight = Math.max(0, height - 24) + "px";
      }
    };
    if (open) {
      position();
      if (!d.open) d.showModal();
      titleRef.current?.focus();
      window.addEventListener("resize", position);
      window.addEventListener("scroll", position, true);
    } else if (d.open) d.close();
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      if (d.open) d.close();
      if (open && prior?.isConnected) prior.focus();
    };
  }, [open, drawer]);
  return (
    <dialog
      ref={ref}
      className={drawer ? "eng-drawer" : ""}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!blocked) onClose();
      }}
    >
      <header className="eng-dialog-head">
        <button
          type="button"
          className="eng-close"
          disabled={blocked}
          aria-label={`Close ${drawer ? "package" : "request"}`}
          onClick={onClose}
        >
          ×
        </button>
        <h2 ref={titleRef} tabIndex={-1}>
          {title}
        </h2>
      </header>
      {children}
      <footer className="eng-dialog-foot">
        {footer}
        <button type="button" disabled={blocked} onClick={onClose}>
          Close
        </button>
      </footer>
    </dialog>
  );
}
export function EngineeringWorkspace({ initialId }: { initialId?: string }) {
  const identity = useIdentity(),
    params = useSearchParams(),
    root = useRef<HTMLElement>(null);
  const [view, setView] = useState("all"),
    [search, setSearch] = useState(""),
    [discipline, setDiscipline] = useState(""),
    [mine, setMine] = useState(false),
    [attention, setAttention] = useState(false),
    [sort, setSort] = useState("ref"),
    [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [selected, setSelected] = useState<string | null>(initialId ?? null),
    [request, setRequest] = useState(params.get("create") === "1"),
    [notes, setNotes] = useState<Record<string, string>>({});
  const query = new URLSearchParams({
    q: search,
    view,
    attention: String(attention),
  });
  if (discipline) query.set("discipline", discipline);
  if (mine) query.set("owner_id", identity.actor_id);
  if (cursors.at(-1)) query.set("cursor", cursors.at(-1)!);
  const records = useResource<Envelope<EngineeringPackage>>(
      "engineering?" + query,
    ),
    shell = useResource<ShellContext>("shell/context");
  useEffect(() => {
    const node = root.current!;
    const resize = () => {
      node.dataset.compact = String(node.clientWidth <= 820);
      node.dataset.phone = String(node.clientWidth <= 520);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const [widths, setWidths] = useState<number[] | null>(null),
    [measured, setMeasured] = useState<number[]>([]),
    table = useRef<HTMLTableElement>(null);
  useEffect(() => {
    const node = table.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setMeasured(
        Array.from(node.querySelectorAll("th")).map((h) =>
          Math.round(h.getBoundingClientRect().width),
        ),
      ),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [records.data, records.loading]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const v = JSON.parse(
          localStorage.getItem("ppo.engineering.app.columns") ?? "null",
        );
        if (
          Array.isArray(v) &&
          v.length === 7 &&
          v.every((w) => Number.isFinite(w) && w >= 110 && w <= 800)
        )
          setWidths(v);
      } catch {}
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const resizeColumn = (i: number, w: number) => {
    const current =
        widths ??
        Array.from(table.current!.querySelectorAll("th")).map(
          (th) => th.getBoundingClientRect().width,
        ),
      next = current.map((n, j) =>
        i === j ? Math.min(800, Math.max(110, w)) : n,
      );
    setWidths(next);
    try {
      localStorage.setItem("ppo.engineering.app.columns", JSON.stringify(next));
    } catch {}
  };
  function change(action: () => void) {
    action();
    setCursors([null]);
  }
  const rows = (records.data?.items ?? [])
    .slice()
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : sort === "due"
          ? (a.required_date ?? "9999").localeCompare(b.required_date ?? "9999")
          : a.display_number.localeCompare(b.display_number),
    );
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const clear = () =>
    change(() => {
      setSearch("");
      setDiscipline("");
      setMine(false);
      setAttention(false);
    });
  const filtered = !!(search || discipline || mine || attention);
  useUnsavedChanges(Object.values(notes).some(Boolean));
  const nextAction = (p: EngineeringPackage) => (
    <div className="eng-next">
      {p.next_action}
      <span className="eng-next-sub">{p.owner_name}</span>
      <span
        className={`eng-next-date ${p.action_due && p.action_due < today ? "overdue" : ""}`}
      >
        {p.action_due && p.action_due < today ? "Overdue · " : ""}
        {p.action_due ? dateText(p.action_due) : "Action date needed"}
      </span>
    </div>
  );
  return (
    <section ref={root} id="ppo-engineering" aria-label="Engineering">
      <div className="eng-heading">
        <div>
          <h1>Engineering</h1>
          <p>Work packages, drawings and technical reviews</p>
        </div>
        <div className="eng-heading-actions">
          {shell.data?.actions.some((a) => a.id === "engineering") && (
            <button className="eng-primary" onClick={() => setRequest(true)}>
              ＋ Request
            </button>
          )}
        </div>
      </div>
      <div className="eng-views" role="tablist" aria-label="Engineering views">
        {views.map(([id, label], i) => (
          <button
            key={id}
            role="tab"
            id={"eng-view-" + id}
            aria-controls="eng-workspace"
            aria-selected={view === id}
            tabIndex={view === id ? 0 : -1}
            onKeyDown={(e) =>
              tabKeys(e, views, i, (v) => change(() => setView(v)), "eng-view-")
            }
            onClick={() => change(() => setView(id))}
          >
            {label}
          </button>
        ))}
        <span className="eng-stamp">{identity.display_name}</span>
      </div>
      <div
        className="eng-workspace"
        id="eng-workspace"
        role="tabpanel"
        aria-labelledby={"eng-view-" + view}
      >
        <div className="eng-toolbar">
          <label className="eng-search">
            <span className="eng-sr">Search engineering packages</span>
            <input
              type="search"
              value={search}
              placeholder="Search packages, customers or projects"
              maxLength={200}
              onChange={(e) => change(() => setSearch(e.target.value))}
            />
          </label>
          <label className="eng-filter-label">
            <span className="eng-sr">Engineer</span>
            <select
              value={mine ? "mine" : "all"}
              onChange={(e) => change(() => setMine(e.target.value === "mine"))}
            >
              <option value="all">All engineers</option>
              <option value="mine">Assigned to me</option>
            </select>
          </label>
          <label className="eng-filter-label">
            <span className="eng-sr">Discipline</span>
            <select
              value={discipline}
              onChange={(e) => change(() => setDiscipline(e.target.value))}
            >
              <option value="">All disciplines</option>
              {disciplines.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="eng-sort">
            <span className="eng-sr">Sort this page</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="ref">Reference order</option>
              <option value="due">Required date</option>
              <option value="name">Package name</option>
            </select>
          </label>
          {filtered && (
            <button className="eng-link" onClick={clear}>
              Clear filters
            </button>
          )}
        </div>
        <div className="eng-context">
          <strong>
            {records.loading
              ? "Loading packages…"
              : records.error
                ? "Packages unavailable"
                : `${rows.length} packages on this page`}
          </strong>
          <button
            className="eng-attention"
            aria-pressed={attention}
            onClick={() => change(() => setAttention(!attention))}
          >
            Needs attention
          </button>
        </div>
        <ReadState
          loading={records.loading}
          error={records.error}
          retry={records.reload}
        />
        <div className="eng-scroll">
          {!records.loading && !records.error && records.data && (
            <>
              {!!rows.length && (
                <table
                  ref={table}
                  className="eng-table"
                  style={
                    widths
                      ? {
                          width: widths.reduce((a, b) => a + b, 0),
                          minWidth: widths.reduce((a, b) => a + b, 0),
                        }
                      : undefined
                  }
                >
                  <caption className="eng-sr">
                    Engineering work packages
                  </caption>
                  <colgroup>
                    {[22, 17, 12, 12, 10, 10, 17].map((w, i) => (
                      <col
                        key={i}
                        style={{ width: widths ? widths[i] : w + "%" }}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {[
                        "Work package",
                        "Customer / project",
                        "Engineer",
                        "Status",
                        "Deliverables",
                        "Required by",
                        "Next action",
                      ].map((label, i) => (
                        <th key={label}>
                          {label}
                          {i < 6 && (
                            <button
                              className="eng-resizer"
                              role="separator"
                              aria-orientation="vertical"
                              aria-label={"Resize " + label + " column"}
                              aria-valuemin={110}
                              aria-valuemax={800}
                              aria-valuenow={Math.round(
                                measured[i] ??
                                  widths?.[i] ??
                                  (1140 * [22, 17, 12, 12, 10, 10, 17][i]) /
                                    100,
                              )}
                              onKeyDown={(e) => {
                                if (
                                  [
                                    "ArrowLeft",
                                    "ArrowRight",
                                    "Home",
                                    "End",
                                  ].includes(e.key)
                                ) {
                                  e.preventDefault();
                                  resizeColumn(
                                    i,
                                    e.key === "Home"
                                      ? 110
                                      : e.key === "End"
                                        ? 800
                                        : e.currentTarget.parentElement!.getBoundingClientRect()
                                            .width +
                                          (e.key === "ArrowRight" ? 10 : -10),
                                  );
                                }
                              }}
                              onDoubleClick={() =>
                                resizeColumn(
                                  i,
                                  (Math.max(
                                    1140,
                                    table.current!.parentElement!.clientWidth,
                                  ) *
                                    [22, 17, 12, 12, 10, 10, 17][i]) /
                                    100,
                                )
                              }
                              onPointerDown={(e) => {
                                e.currentTarget.dataset.startX = String(
                                  e.clientX,
                                );
                                e.currentTarget.dataset.startWidth = String(
                                  e.currentTarget.parentElement!.getBoundingClientRect()
                                    .width,
                                );
                                e.currentTarget.setPointerCapture(e.pointerId);
                                e.currentTarget.classList.add("eng-dragging");
                                e.preventDefault();
                              }}
                              onPointerMove={(e) => {
                                if (
                                  e.currentTarget.hasPointerCapture(e.pointerId)
                                )
                                  resizeColumn(
                                    i,
                                    Number(e.currentTarget.dataset.startWidth) +
                                      e.clientX -
                                      Number(e.currentTarget.dataset.startX),
                                  );
                              }}
                              onPointerUp={(e) => {
                                e.currentTarget.releasePointerCapture(
                                  e.pointerId,
                                );
                                e.currentTarget.classList.remove(
                                  "eng-dragging",
                                );
                              }}
                              onLostPointerCapture={(e) =>
                                e.currentTarget.classList.remove("eng-dragging")
                              }
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <button
                            className="eng-package-link"
                            onClick={() => setSelected(p.id)}
                          >
                            {p.title}
                          </button>
                          <span className="eng-cell-sub">
                            {p.display_number}
                          </span>
                        </td>
                        <td>
                          {p.customer_name}
                          <span className="eng-cell-sub">
                            {p.context_title}
                          </span>
                        </td>
                        <td>
                          <Person name={p.owner_name} />
                        </td>
                        <td>
                          <Badge state={p.state} />
                          <span className="eng-cell-sub">{p.discipline}</span>
                        </td>
                        <td>
                          <span className="eng-meta">To be agreed</span>
                        </td>
                        <td>
                          <span
                            className={
                              p.required_date && p.required_date < today
                                ? "eng-overdue"
                                : ""
                            }
                          >
                            {dateText(p.required_date)}
                          </span>
                        </td>
                        <td>{nextAction(p)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="eng-cards">
                {rows.map((p) => (
                  <article className="eng-mobile-card" key={p.id}>
                    <div className="eng-mobile-head">
                      <button
                        className="eng-package-link"
                        onClick={() => setSelected(p.id)}
                      >
                        {p.title}
                      </button>
                      <Badge state={p.state} />
                    </div>
                    <span className="eng-cell-sub">
                      {p.customer_name} · {p.display_number}
                    </span>
                    <div className="eng-mobile-facts">
                      <Person name={p.owner_name} />
                      <span>{dateText(p.required_date)}</span>
                    </div>
                    <div className="eng-mobile-action">{nextAction(p)}</div>
                  </article>
                ))}
              </div>
              {!rows.length && (
                <div className="eng-empty">
                  <h2>
                    {view === "review"
                      ? "No technical reviews recorded"
                      : view === "released"
                        ? "No issued packages recorded"
                        : filtered
                          ? "No packages match these filters"
                          : "No engineering packages yet"}
                  </h2>
                  <p>
                    {["review", "released"].includes(view)
                      ? "Technical review and formal document issue are separate from the intake and coordination workflow."
                      : filtered
                        ? "Adjust your search or clear filters to keep this view."
                        : "Create a request linked to an existing project or opportunity."}
                  </p>
                  {filtered && <button onClick={clear}>Clear filters</button>}
                </div>
              )}
            </>
          )}
        </div>
        <footer className="eng-list-foot">
          <span>
            {records.loading
              ? "Loading…"
              : records.error
                ? "Results unavailable"
                : `Engineering intake · ${rows.filter((p) => requiresAttention(p, today)).length} need attention on this page`}
          </span>
          <div className="eng-pagination">
            <button
              disabled={records.loading || cursors.length === 1}
              onClick={() => setCursors((c) => c.slice(0, -1))}
            >
              Previous
            </button>
            <button
              disabled={
                records.loading || !!records.error || !records.data?.next_cursor
              }
              onClick={() =>
                setCursors((c) => [...c, records.data!.next_cursor])
              }
            >
              Next
            </button>
            <button
              onClick={() => {
                setWidths(null);
                try {
                  localStorage.removeItem("ppo.engineering.app.columns");
                } catch {}
              }}
            >
              Reset columns
            </button>
          </div>
        </footer>
      </div>
      <div className="eng-page-foot">
        <span>Engineering · Approved r02 layout</span>
        <span>Requests and notes saved to the server</span>
      </div>
      <RequestDialog
        open={request}
        onClose={() => setRequest(false)}
        onCreated={(id) => {
          setRequest(false);
          clear();
          setView("all");
          records.reload();
          setSelected(id);
        }}
      />
      {selected && (
        <PackageDrawer
          key={selected}
          id={selected}
          draft={notes[selected] ?? ""}
          onDraft={(value) => setNotes((v) => ({ ...v, [selected]: value }))}
          onClose={() => setSelected(null)}
          onSaved={records.reload}
        />
      )}
    </section>
  );
}
function RequestDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const command = useCommand();
  const blank = () => ({
    id: crypto.randomUUID(),
    title: "",
    brief: "",
    context_kind: "Project" as LinkKind,
    context_id: "",
    owner_id: "",
    discipline: "Mechanical",
    required_date: "",
    next_action: "Review scope and required inputs",
    action_due: "",
  });
  const [form, setForm] = useState(blank),
    [contextSearch, setContextSearch] = useState(""),
    [ownerSearch, setOwnerSearch] = useState("");
  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const contexts = useResource<Options>(
      open
        ? `engineering/options?context_kind=${form.context_kind}&q=${encodeURIComponent(contextSearch)}`
        : null,
    ),
    owners = useResource<Options>(
      open && form.context_id
        ? `engineering/options?kind=owner&context_kind=${form.context_kind}&context_id=${form.context_id}&q=${encodeURIComponent(ownerSearch)}`
        : null,
    );
  const blocked =
    command.busy || !!(command.error as Failure | null)?.retryable;
  useUnsavedChanges(
    !!(form.title || form.brief || form.context_id || form.owner_id),
    blocked,
  );
  return (
    <Modal
      open={open}
      title="What needs engineering?"
      onClose={onClose}
      blocked={blocked}
      footer={
        <button
          className="eng-primary"
          type="submit"
          form="engineering-request"
          disabled={
            command.busy ||
            contexts.loading ||
            owners.loading ||
            !!contexts.error ||
            !!owners.error
          }
        >
          {command.busy
            ? "Saving…"
            : blocked
              ? "Retry original request"
              : "Create request"}
        </button>
      }
    >
      <form
        id="engineering-request"
        className="eng-form"
        onSubmit={async (e) => {
          e.preventDefault();
          // commandRoute replies with the operation receipt itself as the body.
          const result = await command.send<{ record_id: string }>(
            "engineering",
            {
              ...form,
              required_date: form.required_date || null,
              action_due: form.action_due || null,
              reason: "Engineering request captured for scope review",
            },
          );
          if (result) {
            setForm(blank());
            setContextSearch("");
            setOwnerSearch("");
            command.clear();
            onCreated(result.record_id);
          }
        }}
      >
        <div className="eng-dialog-body">
          <ValidationFields error={command.error}>
            <ErrorNotice error={command.error} />
            <div className="eng-fields">
              <fieldset disabled={blocked}>
                <Field
                  name="title"
                  label="Work package title"
                  value={form.title}
                  onChange={(v) => set("title", v)}
                  required
                />
                <label className="eng-select">
                  Link to
                  <select
                    value={form.context_kind}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        context_kind: e.target.value as LinkKind,
                        context_id: "",
                        owner_id: "",
                      }));
                      setContextSearch("");
                      setOwnerSearch("");
                    }}
                  >
                    <option>Project</option>
                    <option>Opportunity</option>
                  </select>
                </label>
                <LookupField
                  name="context_id"
                  label={form.context_kind}
                  value={form.context_id}
                  onChange={(id) =>
                    setForm((f) => ({ ...f, context_id: id, owner_id: "" }))
                  }
                  search={contextSearch}
                  onSearch={setContextSearch}
                  options={contexts.data?.items ?? []}
                  loading={contexts.loading}
                  more={contexts.data?.has_more}
                  error={!!contexts.error}
                />
                <ReadState
                  loading={false}
                  error={contexts.error}
                  retry={contexts.reload}
                />
                <Field
                  name="brief"
                  label="Design brief"
                  value={form.brief}
                  onChange={(v) => set("brief", v)}
                  multiline
                  required
                />
                {form.context_id && (
                  <>
                    <LookupField
                      name="owner_id"
                      label="Assigned engineer"
                      value={form.owner_id}
                      onChange={(v) => set("owner_id", v)}
                      search={ownerSearch}
                      onSearch={setOwnerSearch}
                      options={owners.data?.items ?? []}
                      loading={owners.loading}
                      more={owners.data?.has_more}
                      error={!!owners.error}
                    />
                    <ReadState
                      loading={false}
                      error={owners.error}
                      retry={owners.reload}
                    />
                  </>
                )}
                <label className="eng-select">
                  Discipline
                  <select
                    value={form.discipline}
                    onChange={(e) => set("discipline", e.target.value)}
                  >
                    {disciplines.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <Field
                  name="required_date"
                  label="Package required by"
                  hint="Optional until scope is confirmed"
                  type="date"
                  value={form.required_date}
                  onChange={(v) => set("required_date", v)}
                />
                <Field
                  name="next_action"
                  label="Next action"
                  value={form.next_action}
                  onChange={(v) => set("next_action", v)}
                  required
                />
                <Field
                  name="action_due"
                  label="Next action due"
                  hint="Owned by the assigned engineer; a missing date remains visible."
                  type="date"
                  value={form.action_due}
                  onChange={(v) => set("action_due", v)}
                />
                <p className="eng-form-hint">
                  New requests enter the queue for scope and effort review.
                  Creating a request does not authorise design effort or issue
                  any documents.
                </p>
              </fieldset>
            </div>
          </ValidationFields>
        </div>
      </form>
    </Modal>
  );
}
function PackageDrawer({
  id,
  draft,
  onDraft,
  onClose,
  onSaved,
}: {
  id: string;
  draft: string;
  onDraft: (v: string) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const resource = useResource<EngineeringDetail>("engineering/" + id),
    command = useCommand();
  const [tab, setTab] = useState("overview"),
    [edit, setEdit] = useState(false),
    [editBlocked, setEditBlocked] = useState(false),
    [editDirty, setEditDirty] = useState(false),
    [notice, setNotice] = useState("");
  const p = resource.data?.package,
    blocked =
      command.busy ||
      !!(command.error as Failure | null)?.retryable ||
      editBlocked;
  const noteVersion = useRef<number | null>(null);
  useUnsavedChanges(!!draft, blocked);
  const close = () => {
    if (
      !blocked &&
      (!editDirty ||
        window.confirm(
          "Discard the unsaved coordination update? Your review note will be kept.",
        ))
    )
      onClose();
  };
  const cancelUpdate = () => {
    if (
      editDirty &&
      !window.confirm(
        "Discard the unsaved coordination update and reload the latest package?",
      )
    )
      return;
    setEdit(false);
    setEditDirty(false);
    resource.reload();
  };
  return (
    <Modal
      open
      title={p?.title ?? "Engineering package"}
      drawer
      onClose={close}
      blocked={blocked}
      footer={
        <span className="eng-meta">
          {blocked
            ? "Confirm the pending save before leaving."
            : (p?.display_number ?? "Loading package")}
        </span>
      }
    >
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
      />
      {p && !resource.error && (
        <>
          <div className="eng-dialog-head" style={{ paddingTop: 0 }}>
            <p>
              {p.customer_name} · {p.context_title}
            </p>
            <div className="eng-row">
              <Badge state={p.state} />
              <span className="eng-meta">
                {p.discipline} ·{" "}
                {p.context_kind === "Project"
                  ? "Project work"
                  : "Presales support"}
              </span>
            </div>
          </div>
          <div
            className="eng-dialog-tabs"
            role="tablist"
            aria-label="Package sections"
          >
            {tabs.map(([key, label], i) => (
              <button
                key={key}
                role="tab"
                id={"eng-tab-" + key}
                aria-controls={"eng-panel-" + key}
                tabIndex={tab === key ? 0 : -1}
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                onKeyDown={(e) => tabKeys(e, tabs, i, setTab, "eng-tab-")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="eng-dialog-body">
            <div
              hidden={tab !== "overview"}
              role="tabpanel"
              id="eng-panel-overview"
              aria-labelledby="eng-tab-overview"
            >
              <div className="eng-version-pair">
                <div>
                  <span>Working set</span>
                  <strong>Not assigned</strong>
                  <small>Deliverables to be agreed</small>
                </div>
                <div>
                  <span>Latest issued package</span>
                  <strong>No issue yet</strong>
                  <small>No use authorised by an issue</small>
                </div>
              </div>
              <div className="eng-facts">
                <div className="eng-fact">
                  <span>Engineer</span>
                  <Person name={p.owner_name} />
                </div>
                <div className="eng-fact">
                  <span>Technical reviewer</span>
                  <strong>To be assigned</strong>
                </div>
                <div className="eng-fact">
                  <span>Package required by</span>
                  <strong>{dateText(p.required_date)}</strong>
                </div>
                <div className="eng-fact">
                  <span>Engineering effort</span>
                  <strong>To be assessed</strong>
                </div>
              </div>
              {p.blocker && (
                <div className="eng-note amber">
                  <strong>Awaiting design input</strong>
                  {p.blocker}
                </div>
              )}
              <section className="eng-section">
                <h3>Design brief</h3>
                <p>{p.brief}</p>
                <Link
                  className="eng-meta-link"
                  href={`${p.context_kind === "Project" ? "/projects" : "/crm/opportunities"}/${p.context_id}`}
                >
                  Open {p.context_reference}
                </Link>
              </section>
              <div className="eng-next-box">
                <span>Next action</span>
                <strong>{p.next_action}</strong>
                <p>
                  {p.owner_name} ·{" "}
                  {p.action_due ? dateText(p.action_due) : "Action date needed"}
                </p>
              </div>
              <section className="eng-section">
                <h3>Design inputs & checks</h3>
                <p>
                  Request brief recorded. Scope, effort and required
                  deliverables need engineering assessment.
                </p>
              </section>
              {p.can_edit && !resource.loading && !edit && (
                <button style={{ marginTop: 20 }} onClick={() => setEdit(true)}>
                  Update coordination
                </button>
              )}
              {edit && p.can_edit && (
                <CoordinationForm
                  key={id}
                  p={p}
                  onBlocked={setEditBlocked}
                  onDirty={setEditDirty}
                  onCancel={cancelUpdate}
                  onSaved={() => {
                    setEdit(false);
                    setEditBlocked(false);
                    resource.reload();
                    onSaved();
                  }}
                />
              )}
            </div>
            <div
              hidden={tab !== "documents"}
              role="tabpanel"
              id="eng-panel-documents"
              aria-labelledby="eng-tab-documents"
            >
              <h3>Drawing & model register</h3>
              <div className="eng-note">
                <strong>No deliverables recorded</strong>The required drawings,
                models and renders will be agreed during scope review.
              </div>
              <section className="eng-section">
                <h3>Source documents</h3>
                <p>
                  Engineering files remain in SharePoint and are authored in
                  SOLIDWORKS. Document linking and published previews are the
                  next integration step.
                </p>
              </section>
            </div>
            <div
              hidden={tab !== "queries"}
              role="tabpanel"
              id="eng-panel-queries"
              aria-labelledby="eng-tab-queries"
            >
              <h3>Technical queries</h3>
              <div className="eng-note">
                <strong>No formal technical queries recorded</strong>Questions
                can be captured in Review & history while the technical-query
                workflow is introduced.
              </div>
            </div>
            <div
              hidden={tab !== "review"}
              role="tabpanel"
              id="eng-panel-review"
              aria-labelledby="eng-tab-review"
            >
              <h3>Review & history</h3>
              {notice && (
                <p className="eng-saved" role="status">
                  {notice}
                </p>
              )}
              {p.can_edit && (
                <form
                  className="eng-comment-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (resource.loading) return;
                    if (noteVersion.current === null)
                      noteVersion.current = p.version;
                    const result = await command.send(
                      "engineering/" + id + "/notes",
                      {
                        expected_version: noteVersion.current,
                        note: draft,
                        reason: "Engineering coordination note",
                      },
                    );
                    if (result) {
                      onDraft("");
                      noteVersion.current = null;
                      command.clear();
                      setNotice("Note saved.");
                      resource.reload();
                      onSaved();
                    }
                  }}
                >
                  <ValidationFields error={command.error}>
                    <ErrorNotice error={command.error} />
                    <fieldset disabled={blocked}>
                      <Field
                        name="note"
                        label="Add a review note"
                        multiline
                        required
                        value={draft}
                        onChange={onDraft}
                      />
                    </fieldset>
                  </ValidationFields>
                  <span className="eng-form-hint">
                    A note does not approve or release a design.
                  </span>
                  <button
                    type="submit"
                    disabled={resource.loading || command.busy || editBlocked}
                  >
                    {command.busy
                      ? "Saving…"
                      : blocked
                        ? "Retry original note"
                        : "Add note"}
                  </button>
                  {(command.error as Failure | null)?.code ===
                    "VersionConflict" && (
                    <button
                      type="button"
                      onClick={() => {
                        noteVersion.current = null;
                        command.clear();
                        resource.reload();
                      }}
                    >
                      Reload latest package and keep note
                    </button>
                  )}
                </form>
              )}
              {resource.data!.has_more_history && (
                <p className="eng-form-hint">
                  Showing the latest 100 events. Earlier events are retained.
                </p>
              )}
              {resource.data!.events.map((e) => (
                <article className="eng-event" key={e.package_version}>
                  <strong>
                    {e.event_type === "EngineeringRequested"
                      ? "Engineering request created"
                      : e.event_type === "EngineeringCoordinated"
                        ? "Coordination updated"
                        : "Review note added"}
                  </strong>
                  <small>
                    {e.actor_name} ·{" "}
                    {new Date(e.created_at).toLocaleString("en-AU")} · Record
                    version {e.package_version}
                  </small>
                  <p>{e.note ?? e.reason}</p>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
function CoordinationForm({
  p,
  onCancel,
  onSaved,
  onBlocked,
  onDirty,
}: {
  p: EngineeringPackage;
  onCancel: () => void;
  onSaved: () => void;
  onBlocked: (v: boolean) => void;
  onDirty: (v: boolean) => void;
}) {
  const command = useCommand(),
    [form, setForm] = useState({
      expected_version: p.version,
      owner_id: p.owner_id,
      state: p.state,
      required_date: p.required_date ?? "",
      next_action: p.next_action,
      action_due: p.action_due ?? "",
      blocker: p.blocker ?? "",
      reason: "",
    }),
    [ownerSearch, setOwnerSearch] = useState("");
  const [original] = useState(form);
  const dirty = JSON.stringify(form) !== JSON.stringify(original);
  const owners = useResource<Options>(
    `engineering/options?kind=owner&context_kind=${p.context_kind}&context_id=${p.context_id}&q=${encodeURIComponent(ownerSearch)}`,
  );
  const blocked =
    command.busy || !!(command.error as Failure | null)?.retryable;
  useEffect(() => {
    onBlocked(blocked);
    return () => onBlocked(false);
  }, [blocked, onBlocked]);
  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  useUnsavedChanges(dirty, blocked);
  return (
    <form
      className="eng-coordination eng-fields"
      onSubmit={async (e) => {
        e.preventDefault();
        const result = await command.send(
          "engineering/" + p.id + "/coordination",
          {
            ...form,
            required_date: form.required_date || null,
            action_due: form.action_due || null,
            blocker: form.blocker || null,
          },
        );
        if (result) onSaved();
      }}
    >
      <h3>Update coordination</h3>
      <ValidationFields error={command.error}>
        <ErrorNotice error={command.error} />
        <fieldset disabled={blocked}>
          <LookupField
            name="owner_id"
            label="Assigned engineer"
            value={form.owner_id}
            onChange={(v) => setForm((f) => ({ ...f, owner_id: v }))}
            search={ownerSearch}
            onSearch={setOwnerSearch}
            options={
              owners.data?.items ?? [
                { id: p.owner_id, display_name: p.owner_name },
              ]
            }
            loading={owners.loading}
            more={owners.data?.has_more}
            error={!!owners.error}
          />
          <ReadState
            loading={false}
            error={owners.error}
            retry={owners.reload}
          />
          <label className="eng-select">
            Status
            <select
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  state: e.target.value as typeof form.state,
                  blocker:
                    e.target.value === "Awaiting information" ? f.blocker : "",
                }))
              }
            >
              {coordinationStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {form.state === "Awaiting information" && (
            <Field
              name="blocker"
              label="Missing design input"
              multiline
              required
              value={form.blocker}
              onChange={(v) => setForm((f) => ({ ...f, blocker: v }))}
            />
          )}
          <Field
            name="required_date"
            label="Package required by"
            type="date"
            value={form.required_date}
            onChange={(v) => setForm((f) => ({ ...f, required_date: v }))}
          />
          <Field
            name="next_action"
            label="Next action"
            required
            value={form.next_action}
            onChange={(v) => setForm((f) => ({ ...f, next_action: v }))}
          />
          <Field
            name="action_due"
            label="Next action due"
            type="date"
            value={form.action_due}
            onChange={(v) => setForm((f) => ({ ...f, action_due: v }))}
          />
          <Field
            name="reason"
            label="Reason for update"
            multiline
            required
            value={form.reason}
            onChange={(v) => setForm((f) => ({ ...f, reason: v }))}
          />
        </fieldset>
      </ValidationFields>
      <button
        className="eng-primary"
        type="submit"
        disabled={command.busy || owners.loading || !!owners.error}
      >
        {command.busy
          ? "Saving…"
          : blocked
            ? "Retry original update"
            : "Save coordination"}
      </button>
      {(command.error as Failure | null)?.code === "VersionConflict" && (
        <p className="eng-note amber">
          The package changed. Cancel this update to reload the latest package
          before preparing a new update. You will be asked before discarding
          your entries.
        </p>
      )}
      <button type="button" disabled={blocked} onClick={onCancel}>
        Cancel update
      </button>
    </form>
  );
}
