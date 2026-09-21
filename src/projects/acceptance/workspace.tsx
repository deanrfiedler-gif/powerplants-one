"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useIdentity } from "../../components/business-session";
import { api, type Failure } from "../../components/business-ui";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../shell/secondary-menu";
import { Icon } from "./icon";
import { actionDuty } from "./ui-actions";
import {
  views,
  href,
  labelTone,
  type Detail,
  type Workspace,
  type View,
} from "./model";
import type { Action, Fields } from "./validation";
import { RecoveryDialog } from "./recovery-dialog";
import { AcceptanceDialog } from "./workspace-dialog";
export type Data = Workspace & { project_facts_hash: string };
export type Proposal = { action: Action; fields?: Fields; project?: boolean };
export const dateLabel = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(v + "T00:00:00Z"))
    : "Date needed";
export function Tag({ children }: { children: string }) {
  const tone = labelTone(children);
  return (
    <span className={`ac-tag ac-${tone}`}>
      <Icon
        name={
          tone === "success"
            ? "check"
            : tone === "failure" || tone === "caution"
              ? "warning"
              : tone === "info"
                ? "clock"
                : "info"
        }
      />
      {children}
    </span>
  );
}
const readLayout = (key: string) => {
  try {
    return localStorage.getItem(key) ?? "closed";
  } catch {
    return "closed";
  }
};
function useLayout(key: string) {
  const value = useSyncExternalStore(
    useCallback((notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener("ppo-acceptance-layout", notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener("ppo-acceptance-layout", notify);
      };
    }, []),
    () => readLayout(key),
    () => "closed",
  );
  return [
    value === "open",
    (open: boolean) => {
      try {
        localStorage.setItem(key, open ? "open" : "closed");
      } catch {}
      window.dispatchEvent(new Event("ppo-acceptance-layout"));
    },
  ] as const;
}
export function AcceptanceWorkspace({ recordId }: { recordId?: string }) {
  const [recovery, setRecovery] = useState<string | null>(null);
  const identity = useIdentity(),
    router = useRouter(),
    path = usePathname(),
    params = useSearchParams(),
    query = params.toString();
  const [menuOpen, saveMenu] = useLayout(
      `ppo.acceptance.menu.v1:${identity.workspace_id}:${identity.actor_id}`,
    ),
    menu = useSecondaryMenu(menuOpen, saveMenu);
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState<Failure | null>(null),
    [epoch, setEpoch] = useState(0),
    [loaded, setLoaded] = useState(""),
    [proposal, setProposal] = useState<Proposal | null>(null),
    [filters, setFilters] = useState(false),
    [columns, setColumns] = useState(false),
    [message, setMessage] = useState("");
  const table = useRef<HTMLDivElement>(null),
    scope = useRef<HTMLDivElement>(null),
    [docked, setDocked] = useState(false);
  const view: View =
    views.find(
      (v) => path === `/projects/acceptance${v.segment ? "/" + v.segment : ""}`,
    )?.id ?? (recordId ? "closeout" : "register");
  const url = recordId
    ? `projects/acceptance/stages/${recordId}`
    : `projects/acceptance${query ? "?" + query : ""}`;
  const loadKey = `${url}:${epoch}:${identity.actor_id}`;
  const pending = loaded !== loadKey;
  const hasData = data !== null;
  useEffect(() => {
    let live = true;

    api<Data>(url).then(
      (value) => {
        if (live) {
          setData(value);
          setError(null);
          setLoaded(loadKey);
        }
      },
      (e) => {
        if (live) {
          setError(e);
          if ([401, 403, 404].includes(e.status)) setData(null);
          setLoaded(loadKey);
        }
      },
    );
    return () => {
      live = false;
    };
  }, [url, epoch, identity.actor_id, loadKey]);
  useEffect(() => {
    if (!scope.current) return;
    const observer = new ResizeObserver((entries) =>
      setDocked(entries[0].contentRect.width >= 1224),
    );
    observer.observe(scope.current);
    return () => observer.disconnect();
  }, [hasData]);
  const selected = recordId
    ? data?.selected
    : (data?.selected ??
      (params.get("panel") === "closed" ? null : (data?.items[0] ?? null)));
  const inspector =
    !!selected && (recordId || params.get("panel") !== "closed");

  const setQuery = (patch: Record<string, string | null>, replace = false) => {
    const q = new URLSearchParams(query);
    if (data && !q.has("project")) q.set("project", data.project.id);
    for (const [k, v] of Object.entries(patch))
      if (v === null) q.delete(k);
      else q.set(k, v);
    if (replace) router.replace(href(view, q), { scroll: false });
    else router.push(href(view, q), { scroll: false });
  };
  const scopedQuery = (() => {
    const q = new URLSearchParams(query);
    if (data) q.set("project", data.project.id);
    if (selected) q.set("stage", selected.stage.id);
    return q;
  })();
  const open = (action: Action, fields: Fields = {}, project = false) =>
    setProposal({ action, fields, project });
  const can = (action: Action) => !!data?.can[actionDuty[action]];
  const action = (
    name: string,
    a: Action,
    fields: Fields = {},
    project = false,
    primary = false,
  ) =>
    can(a) && (
      <button
        type="button"
        className={primary ? "ac-button ac-primary" : "ac-button"}
        onClick={() => open(a, fields, project)}
      >
        {name}
      </button>
    );
  const selectStage = (id: string) =>
    setQuery({
      stage: id,
      panel: null,
      position: String(table.current?.scrollTop ?? 0),
    });
  useEffect(() => {
    if (table.current)
      table.current.scrollTop = Number(params.get("position") ?? 0);
  }, [params]);
  const menuContents = (
    <>
      <div className="mw-menu-title">
        <strong>Acceptance & closeout</strong>
        <span>Projects workspace</span>
      </div>
      <nav aria-label="Acceptance views">
        <ul>
          {views.map((v) => (
            <li key={v.id}>
              <Link
                href={href(v.id, scopedQuery)}
                aria-current={view === v.id ? "page" : undefined}
                onClick={() => menu.closeOverlay(false)}
              >
                <Icon name={v.icon === "list" ? "register" : v.icon} />
                <span>{v.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
  const content = selected && (
    <Inspector
      d={selected}
      full={!!recordId}
      onClose={() => setQuery({ panel: "closed" })}
      action={action}
      onPrimary={() => {
        if (selected.next.href) router.push(selected.next.href);
        else if (selected.next.label === "Review closeout")
          router.push(href("closeout", scopedQuery));
        else if (selected.next.label === "Review readiness")
          router.push(href("readiness", scopedQuery));
        else {
          const a =
            selected.next.label === "Record response" ? "response" : "prepare";
          if (can(a)) open(a);
          else router.push(`/projects/acceptance/stages/${selected.stage.id}`);
        }
      }}
      projectId={data!.project.id}
    />
  );
  return (
    <SecondaryMenuFrame presentation="baseline"
      id="ppo-acceptance"
      name="Acceptance & closeout"
      menuId="acceptance-menu"
      contentId="acceptance-content"
      state={menu}
      menu={menuContents}
      message={message}
    >
      {error && (
        <div className="ac-notice ac-error" role="alert">
          <strong>{error.message ?? "The workspace could not be read."}</strong>
          <button className="ac-button" onClick={() => setEpoch((x) => x + 1)}>
            Retry read
          </button>
        </div>
      )}
      {!data ? (
        <p className="ac-empty" role="status">
          {pending
            ? "Loading permitted acceptance stages…"
            : "No permitted project is available. Open Projects to create or select a project."}
        </p>
      ) : (
        <>
          <div
            className="ac-workspace"
            ref={scope}
            data-inspector={
              inspector && docked && !recordId ? "docked" : "overlay"
            }
          >
            <div className="ac-main" aria-busy={pending}>
              {data.recoveries.length > 0 && (
                <div className="ac-notice">
                  <strong>Review unconfirmed command outcomes</strong>
                  <p>
                    Reconcile these originals before submitting another
                    decision.
                  </p>
                  {data.recoveries.map((r) => (
                    <button
                      key={r.operation_id}
                      className="ac-button"
                      onClick={() => setRecovery(r.operation_id)}
                    >
                      Review {r.action} ·{" "}
                      {r.accepted
                        ? "Original result available"
                        : "Outcome not confirmed"}
                    </button>
                  ))}
                </div>
              )}
              <div className="ac-context">
                <label>
                  Project
                  <select
                    aria-label="Project"
                    value={data.project.id}
                    onChange={(e) =>
                      setQuery({
                        project: e.target.value,
                        stage: null,
                        offset: null,
                        panel: null,
                      })
                    }
                  >
                    {data.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="ac-project-reference">
                  {data.project.display_number}
                </span>
                <div>
                  <small>Customer</small>
                  <span>{data.project.customer_name}</span>
                </div>
                <div>
                  <small>Site</small>
                  <span>{data.project.site_name}</span>
                </div>
                {data.project.lifecycle === "Closed" && (
                  <Tag>
                    {data.project_gates.length
                      ? "Closed · reassessment needed"
                      : "Closed"}
                  </Tag>
                )}
              </div>
              <div className="ac-toolbar">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setQuery({
                      q:
                        String(
                          new FormData(e.currentTarget).get("q") ?? "",
                        ).trim() || null,
                      offset: null,
                    });
                  }}
                  key={params.get("q") ?? ""}
                  className="ac-search"
                >
                  <Icon name="search" />
                  <input
                    aria-label="Search acceptance stages"
                    placeholder="Search acceptance stages"
                    name="q"
                    defaultValue={params.get("q") ?? ""}
                  />
                </form>
                {action("＋ Acceptance stage", "create", {}, true, true)}
                <button
                  className="ac-button"
                  aria-expanded={filters}
                  onClick={() => setFilters(!filters)}
                >
                  <Icon name="filter" />
                  Filters
                </button>
                <button
                  className="ac-button ac-icon-button"
                  aria-label="Refresh workspace"
                  onClick={() => setEpoch((x) => x + 1)}
                >
                  <Icon name="refresh" />
                </button>
              </div>
              {filters && (
                <div className="ac-filters">
                  {(
                    [
                      "technical",
                      "customer",
                      "service",
                      "commercial",
                      "source",
                      "dates",
                    ] as const
                  ).map((k) => (
                    <label key={k}>
                      {k[0].toUpperCase() + k.slice(1)}
                      <select
                        aria-label={`Filter ${k}`}
                        value={params.get(k) ?? ""}
                        onChange={(e) =>
                          setQuery({
                            [k]: e.target.value || null,
                            offset: null,
                          })
                        }
                      >
                        <option value="">All</option>
                        {(k === "source"
                          ? [
                              "Current",
                              "Changed",
                              "Unavailable",
                              "Restricted",
                              "Not checked",
                            ]
                          : k === "dates"
                            ? ["overdue", "upcoming", "needed"]
                            : k === "technical"
                              ? [
                                  "Accepted",
                                  "Release pending",
                                  "Blocked",
                                  "Cannot assess",
                                  "Reassessment needed",
                                ]
                              : k === "customer"
                                ? [
                                    "Not requested",
                                    "Awaiting response",
                                    "Accepted",
                                    "With conditions",
                                    "Validation needed",
                                    "Reservations",
                                    "Declined",
                                  ]
                                : k === "service"
                                  ? [
                                      "Not requested",
                                      "Requested",
                                      "Received",
                                      "Accepted",
                                      "Returned",
                                      "Declined",
                                    ]
                                  : [
                                      "Not assessed",
                                      "Complete",
                                      "Outstanding",
                                      "Disputed",
                                      "Not required",
                                    ]
                        ).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label>
                    Owner
                    <select
                      value={params.get("owner") ?? ""}
                      onChange={(e) =>
                        setQuery({
                          owner: e.target.value || null,
                          offset: null,
                        })
                      }
                    >
                      <option value="">All owners</option>
                      {data.people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="ac-button"
                    onClick={() => {
                      setQuery(
                        Object.fromEntries(
                          [
                            "q",
                            "technical",
                            "customer",
                            "service",
                            "commercial",
                            "source",
                            "dates",
                            "owner",
                            "area",
                            "offset",
                          ].map((k) => [k, null]),
                        ),
                      );
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <div className="ac-tools">
                <select
                  aria-label="Area or system"
                  value={params.get("area") ?? ""}
                  onChange={(e) =>
                    setQuery({ area: e.target.value || null, offset: null })
                  }
                >
                  <option value="">All areas</option>
                  {data.ledger.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </select>
                {selected && action("＋ Add condition", "obligation")}
                <span className="ac-count">{data.total} stages</span>
                <select
                  aria-label="Sort acceptance stages"
                  value={params.get("order") ?? "due"}
                  onChange={(e) =>
                    setQuery({ order: e.target.value, offset: null })
                  }
                >
                  <option value="due">Sort: Due date</option>
                  <option value="changed">Sort: Recently changed</option>
                  <option value="reference">Sort: Stage reference</option>
                </select>
                <button
                  className="ac-button"
                  aria-expanded={columns}
                  onClick={() => setColumns(!columns)}
                >
                  <Icon name="columns" />
                  Columns
                </button>
                {columns && (
                  <label>
                    <input
                      type="checkbox"
                      checked={params.get("columns") === "commercial"}
                      onChange={(e) =>
                        setQuery({
                          columns: e.target.checked ? "commercial" : null,
                        })
                      }
                    />
                    Commercial
                  </label>
                )}
              </div>
              <div className="ac-scroll" ref={table}>
                {view === "register" && !recordId ? (
                  <>
                    <table className="ac-register">
                      <colgroup>
                        <col style={{ width: "23%" }} />
                        <col style={{ width: "16%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "13%" }} />
                        {params.get("columns") === "commercial" && (
                          <col style={{ width: "13%" }} />
                        )}
                        <col />
                      </colgroup>
                      <thead>
                        <tr>
                          {[
                            "Acceptance stage",
                            "Area / system",
                            "Technical",
                            "Customer",
                            "Service",
                            ...(params.get("columns") === "commercial"
                              ? ["Commercial"]
                              : []),
                            "Next requirement / owner",
                          ].map((h) => (
                            <th key={h} scope="col">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((d) => (
                          <tr
                            key={d.stage.id}
                            data-selected={
                              selected?.stage.id === d.stage.id && inspector
                            }
                          >
                            <td>
                              <button
                                className="ac-row-link"
                                onClick={() => selectStage(d.stage.id)}
                              >
                                {d.stage.title}
                              </button>
                              <small>
                                {d.stage.reference} · r
                                {String(d.stage.revision).padStart(2, "0")}
                                {d.stage.closeout === "Closed"
                                  ? d.obligations.some(
                                      (o) => o.state !== "Completed",
                                    )
                                    ? " · Closed · remaining obligations"
                                    : " · Closed"
                                  : ""}
                              </small>
                            </td>
                            <td>
                              {d.units
                                .filter((u) => u.disposition === "Included")
                                .map((u) => u.installed_at)
                                .filter((v, i, a) => a.indexOf(v) === i)
                                .join(", ") || "Scope needed"}
                              <small>
                                {d.units[0]?.system_name ?? "System needed"}
                              </small>
                            </td>
                            <td>
                              <Tag>{d.outcomes.technical}</Tag>
                            </td>
                            <td>
                              <Tag>{d.outcomes.customer}</Tag>
                            </td>
                            <td>
                              <Tag>{d.outcomes.service}</Tag>
                            </td>
                            {params.get("columns") === "commercial" && (
                              <td>
                                <Tag>{d.outcomes.commercial}</Tag>
                              </td>
                            )}
                            <td>
                              {d.requirements.find(
                                (r) =>
                                  !["Satisfied", "Not required"].includes(
                                    r.outcome,
                                  ),
                              )?.title ?? d.next.label}
                              <small>
                                {d.next.owner} · {dateLabel(d.next.due)}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="ac-phone-list">
                      {data.items.map((d) => (
                        <button
                          key={d.stage.id}
                          className="ac-phone-row"
                          onClick={() => selectStage(d.stage.id)}
                        >
                          <strong>{d.stage.title}</strong>
                          <small>
                            {d.stage.reference} ·{" "}
                            {d.units[0]?.installed_at ?? "Scope needed"}
                          </small>
                          <span>
                            Technical: <Tag>{d.outcomes.technical}</Tag>
                          </span>
                          <span>
                            Customer: <Tag>{d.outcomes.customer}</Tag>
                          </span>
                          <span>
                            Service: <Tag>{d.outcomes.service}</Tag>
                          </span>
                          <span>{d.next.explanation}</span>
                          <small>
                            {d.next.owner} · {dateLabel(d.next.due)}
                          </small>
                        </button>
                      ))}
                    </div>
                    {!data.items.length && (
                      <p className="ac-empty">
                        {data.total
                          ? "This page has no stages. Return to the first page."
                          : "No matching stages. Clear filters or create a permitted acceptance stage."}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="ac-view-content">
                    <div className="ac-view-heading">
                      <h2>
                        {recordId
                          ? selected?.stage.title
                          : views.find((v) => v.id === view)!.label}
                      </h2>
                      {!recordId && (
                        <select
                          aria-label="Selected stage"
                          value={selected?.stage.id ?? ""}
                          onChange={(e) => selectStage(e.target.value)}
                        >
                          {data.items.map((s) => (
                            <option key={s.stage.id} value={s.stage.id}>
                              {s.stage.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    {recordId && content}
                    {(view === "readiness" || recordId) && (
                      <>
                        <h3>Complete project scope ledger</h3>
                        <p className="ac-muted">
                          Every required unit remains here, including excluded
                          and unallocated work. Closing a filtered list cannot
                          close this project.
                        </p>
                        <div className="ac-actions">
                          {action("Add scope unit", "unit", {}, true)}
                          {selected && action("Edit stage scope", "scope")}
                          {selected && action("Add requirement", "requirement")}
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>Scope unit</th>
                              <th>Installed / serves</th>
                              <th>Configuration</th>
                              <th>Current stage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.ledger.map((u) => (
                              <tr key={u.id}>
                                <td>
                                  {u.title}
                                  <small>
                                    {u.reference} · {u.function_name}
                                  </small>
                                </td>
                                <td>
                                  {u.installed_at}
                                  <small>{u.served_areas.join(", ")}</small>
                                </td>
                                <td>
                                  {u.configuration_version}
                                  <small>
                                    {u.required
                                      ? "Required"
                                      : "Removed · " + u.removal_reference}
                                  </small>
                                  {action(
                                    "Change scope requirement",
                                    "disposition",
                                    { unit_id: u.id, required: u.required },
                                    true,
                                  )}
                                </td>
                                <td>
                                  {selected?.units.find((x) => x.id === u.id)
                                    ?.disposition ??
                                    (u.required
                                      ? "Unallocated to selected stage"
                                      : "Removed by source change")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {selected && (
                          <>
                            <h3>Requirements and source checks</h3>
                            <div className="ac-actions">
                              {action("Check sources", "check")}
                              {action(
                                "Record source evidence",
                                "source",
                                {},
                                true,
                              )}
                            </div>
                            <table>
                              <thead>
                                <tr>
                                  <th>Requirement / owner</th>
                                  <th>Outcome</th>
                                  <th>Source / exact version</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selected.requirements.map((r) => (
                                  <tr key={r.id}>
                                    <td>
                                      {r.title}
                                      <small>
                                        {r.owner_name} · {dateLabel(r.due)}
                                      </small>
                                    </td>
                                    <td>
                                      <Tag>{r.outcome}</Tag>
                                      <small>{r.source.availability}</small>
                                    </td>
                                    <td>
                                      {r.source.reference ||
                                        "Restricted source"}
                                      <small>{r.source.source_version}</small>
                                    </td>
                                    <td>
                                      {r.source.href ? (
                                        <Link href={r.source.href}>
                                          Open source →
                                        </Link>
                                      ) : r.source.adapter ===
                                          "SyntheticAcceptanceSource" &&
                                        can("source") ? (
                                        <button
                                          className="ac-button"
                                          onClick={() =>
                                            open(
                                              "source",
                                              {
                                                id: r.source.id,
                                                title: r.source.title,
                                                kind: r.source.kind,
                                                outcome: r.source.outcome,
                                                availability:
                                                  r.source.availability,
                                                details: r.source.details,
                                                public_reference:
                                                  r.source.reference,
                                                source_version:
                                                  r.source.source_version,
                                                source_expected_version:
                                                  r.source.version,
                                              },
                                              true,
                                            )
                                          }
                                        >
                                          Review source evidence
                                        </button>
                                      ) : (
                                        "Source owner required"
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
                      </>
                    )}
                    {(view === "outstanding" || recordId) && selected && (
                      <>
                        <div className="ac-actions">
                          {action("Add obligation", "obligation")}
                        </div>
                        {selected.obligations.length ? (
                          selected.obligations.map((o) => (
                            <section className="ac-section" key={o.id}>
                              <h3>{o.title}</h3>
                              <Tag>{o.state}</Tag>
                              <p>{o.conditions}</p>
                              <dl>
                                <dt>Responsible owner</dt>
                                <dd>{o.owner_name}</dd>
                                <dt>Accountable recipient</dt>
                                <dd>
                                  {o.recipient_name} ·{" "}
                                  {o.transfer_accepted
                                    ? "Accepted transfer"
                                    : "Transfer not accepted"}
                                </dd>
                                <dt>Due</dt>
                                <dd>
                                  {dateLabel(o.due)} · {o.due_basis}
                                </dd>
                                <dt>Completion evidence required</dt>
                                <dd>{o.required_evidence}</dd>
                                <dt>Review rule</dt>
                                <dd>{o.review_rule}</dd>
                              </dl>
                              <div className="ac-actions">
                                <Link href={`/activities/${o.activity_id}`}>
                                  Open owned Activity →
                                </Link>
                                {!o.transfer_accepted &&
                                  o.recipient_id === identity.actor_id &&
                                  action(
                                    "Accept continuing responsibility",
                                    "transfer",
                                    { id: o.id },
                                  )}
                                {o.state !== "Completed" &&
                                  action(
                                    "Record source completion",
                                    "completeObligation",
                                    { id: o.id },
                                  )}
                              </div>
                            </section>
                          ))
                        ) : (
                          <p>
                            No stage-specific residual obligations are recorded.
                            Source requirements remain independently assessed.
                          </p>
                        )}
                      </>
                    )}
                    {(view === "handover" || recordId) && selected && (
                      <>
                        <h3>Training, manuals and configuration</h3>
                        {selected.requirements
                          .filter((r) => r.gate === "Handover")
                          .map((r) => (
                            <section key={r.id} className="ac-section">
                              <strong>{r.title}</strong> <Tag>{r.outcome}</Tag>
                              <p>
                                {r.source.reference} · {r.source.source_version}
                              </p>
                              {r.source.kind === "Training" && (
                                <p>
                                  Planned:{" "}
                                  {dateLabel(
                                    r.source.details.planned_on ?? null,
                                  )}{" "}
                                  · Delivered:{" "}
                                  {dateLabel(
                                    r.source.details.delivered_on ?? null,
                                  )}
                                  <br />
                                  Attendance:{" "}
                                  {r.source.details.attendance ??
                                    "Not evidenced"}
                                  <br />
                                  Competence:{" "}
                                  {r.source.details.competence ??
                                    "Not assessed"}
                                </p>
                              )}
                              {r.source.kind === "Backup" && (
                                <p>
                                  Available:{" "}
                                  {r.source.details.backup_available
                                    ? "Yes"
                                    : "Not evidenced"}{" "}
                                  · Identity verified:{" "}
                                  {r.source.details.identity_verified
                                    ? "Yes"
                                    : "Not evidenced"}{" "}
                                  · Restore verified:{" "}
                                  {r.source.details.restore_verified
                                    ? "Yes"
                                    : "Not evidenced"}
                                </p>
                              )}
                            </section>
                          ))}
                        <h3>Exact handover packs</h3>
                        <div className="ac-actions">
                          {action("Prepare handover", "prepare")}
                        </div>
                        {selected.handover_gates.length > 0 && (
                          <p className="ac-notice">
                            {selected.handover_gates.join(" ")}
                          </p>
                        )}
                        {selected.manifests.map((m) => (
                          <section className="ac-section" key={m.id}>
                            <h3>
                              {m.audience} · {m.purpose}
                            </h3>
                            <Tag>{m.issue_id ? "Issued" : "Prepared"}</Tag>
                            <p>
                              Revision {m.revision} · Prepared{" "}
                              {new Date(m.prepared_at).toLocaleString("en-AU")}
                              {m.issued_at
                                ? ` · Issued ${new Date(m.issued_at).toLocaleString("en-AU")}`
                                : ""}
                            </p>
                            <small>Manifest {m.content_hash}</small>
                            <div className="ac-actions">
                              <a
                                target="_blank"
                                rel="noreferrer"
                                href={`/api/v1/projects/acceptance/files/${m.id}?format=html`}
                              >
                                Inspect exact HTML
                              </a>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                href={`/api/v1/projects/acceptance/files/${m.id}?format=pdf`}
                              >
                                Open exact PDF
                              </a>
                              {!m.issue_id &&
                                action("Issue exact pack", "issue", {
                                  id: m.id,
                                })}
                              {m.issue_id &&
                                !m.request_id &&
                                action("Submit local request", "request", {
                                  issue_id: m.issue_id,
                                })}
                            </div>
                            <p>
                              {m.transport ?? "Not requested"} · No external
                              message is sent.
                            </p>
                            {m.request_id &&
                              m.audience === "Customer" &&
                              action("Record customer response", "response", {
                                request_id: m.request_id,
                              })}
                            {m.request_id &&
                              m.audience === "Service" &&
                              m.recipient_id === identity.actor_id &&
                              action("Record Service receiving", "receive", {
                                request_id: m.request_id,
                              })}
                          </section>
                        ))}
                      </>
                    )}
                    {(view === "closeout" || recordId) && selected && (
                      <>
                        <h3>Independent decisions</h3>
                        <dl>
                          {Object.entries(selected.outcomes).map(([k, v]) => (
                            <div key={k}>
                              <dt>{k[0].toUpperCase() + k.slice(1)}</dt>
                              <dd>
                                <Tag>{v}</Tag>
                              </dd>
                            </div>
                          ))}
                        </dl>
                        <div className="ac-actions">
                          {action(
                            "Confirm technical applicability",
                            "technical",
                          )}
                          {action("Record customer response", "response")}
                          {action(
                            "Record commercial disposition",
                            "commercial",
                          )}
                          {action("Review stage closeout", "closeStage")}
                          {selected.stage.closeout === "Closed" &&
                            action("Reopen stage", "reopen")}
                        </div>
                        <h3>Received customer responses</h3>
                        {selected.responses
                          .filter((r) => r.audience === "Customer")
                          .map((r) => (
                            <section className="ac-section" key={r.id}>
                              <strong>
                                {r.respondent_name} · {r.outcome}
                              </strong>
                              <p>
                                {r.authority_basis} · {r.method}
                                <br />
                                Responded: {r.response_time ?? "Time unknown"} (
                                {r.time_precision}) · Recorded{" "}
                                {new Date(r.recorded_at).toLocaleString(
                                  "en-AU",
                                )}
                              </p>
                              <p>{r.evidence}</p>
                              <p>{r.conditions}</p>
                              <Tag>
                                {r.validated
                                  ? "Validated"
                                  : "Validation needed"}
                              </Tag>
                              {!r.validated &&
                                action("Validate exact response", "validate", {
                                  id: r.id,
                                })}
                            </section>
                          ))}
                        <h3>Stage closeout requirements</h3>
                        {selected.closeout_gates.length ? (
                          <ul>
                            {selected.closeout_gates.map((g) => (
                              <li key={g}>{g}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            Ready for the named closeout decision against
                            current scope and evidence.
                          </p>
                        )}
                        <h3>Separate whole-project closure</h3>
                        <p>
                          {data.ledger.filter((u) => u.required).length}{" "}
                          required scope units. This review includes every stage
                          and unallocated unit.
                        </p>
                        {data.project_gates.length ? (
                          <ul>
                            {data.project_gates.map((g) => (
                              <li key={g}>{g}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>Whole-project closure gates are satisfied.</p>
                        )}
                        <div className="ac-actions">
                          {action(
                            "Project commercial disposition",
                            "commercial",
                            {},
                            true,
                          )}
                          {action(
                            "Review project closeout",
                            "closeProject",
                            {},
                            true,
                          )}
                          {data.project.lifecycle === "Closed" &&
                            action("Reopen project", "reopen", {}, true)}
                        </div>
                      </>
                    )}
                    {view === "history" && selected && (
                      <>
                        <h3>Immutable revisions, decisions and events</h3>
                        {selected.revisions.map((r) => (
                          <section className="ac-section" key={r.id}>
                            <strong>Submitted revision {r.revision}</strong>
                            <p>
                              {r.submitted_at} · {r.content_hash}
                            </p>
                            <details>
                              <summary>
                                Inspect frozen scope and evidence binding
                              </summary>
                              <pre>{JSON.stringify(r.snapshot, null, 2)}</pre>
                            </details>
                          </section>
                        ))}
                        <details>
                          <summary>Retained source version identities</summary>
                          <pre>
                            {JSON.stringify(selected.source_history, null, 2)}
                          </pre>
                        </details>
                        {[...selected.decisions, ...data.project_decisions].map(
                          (d) => (
                            <section className="ac-section" key={d.id}>
                              <strong>
                                {d.kind} · {d.outcome}
                              </strong>
                              <p>{d.reason}</p>
                              <small>
                                {d.actor_name} ·{" "}
                                {new Date(d.created_at).toLocaleString("en-AU")}{" "}
                                · revision {d.revision ?? "whole project"}
                              </small>
                              <details>
                                <summary>Inspect exact decision scope</summary>
                                <pre>{JSON.stringify(d.snapshot, null, 2)}</pre>
                              </details>
                            </section>
                          ),
                        )}
                        {[...selected.history, ...data.project_history]
                          .sort((a, b) =>
                            b.created_at.localeCompare(a.created_at),
                          )
                          .map((e) => (
                            <section className="ac-section" key={e.id}>
                              <strong>{e.kind}</strong>
                              <p>{e.reason}</p>
                              <small>
                                {e.actor_name} ·{" "}
                                {new Date(e.created_at).toLocaleString("en-AU")}
                              </small>
                              <details>
                                <summary>Inspect retained event</summary>
                                <pre>{JSON.stringify(e.snapshot, null, 2)}</pre>
                              </details>
                            </section>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              <footer className="ac-footer">
                <span>{data.total} stages · permitted matching records</span>
                <span>
                  {data.total ? data.offset + 1 : 0}–
                  {Math.min(data.offset + data.items.length, data.total)} of{" "}
                  {data.total}
                </span>
                <button
                  className="ac-button"
                  aria-label="Previous page"
                  disabled={!data.offset}
                  onClick={() =>
                    setQuery({
                      offset: String(Math.max(0, data.offset - data.limit)),
                    })
                  }
                >
                  ‹
                </button>
                <button
                  className="ac-button"
                  aria-label="Next page"
                  disabled={data.offset + data.limit >= data.total}
                  onClick={() =>
                    setQuery({ offset: String(data.offset + data.limit) })
                  }
                >
                  ›
                </button>
              </footer>
              <div className="ac-preview">
                Synthetic local preview ·{" "}
                {new Date(data.observed_at).toLocaleDateString("en-AU")} ·{" "}
                {pending
                  ? "Refreshing permitted records…"
                  : "No external delivery or ERP posting"}
              </div>
            </div>
            {inspector &&
              !recordId &&
              (docked ? (
                <aside className="ac-inspector">{content}</aside>
              ) : (
                <InspectorOverlay onClose={() => setQuery({ panel: "closed" })}>
                  {content}
                </InspectorOverlay>
              ))}
          </div>
          {recovery && (
            <RecoveryDialog
              id={recovery}
              onClose={() => {
                setRecovery(null);
                setEpoch((x) => x + 1);
              }}
              onSaved={() => {
                setRecovery(null);
                setEpoch((x) => x + 1);
                setMessage(
                  "Original outcome reconciled; no duplicate decision was made.",
                );
              }}
            />
          )}
          {proposal && (
            <AcceptanceDialog
              data={data}
              detail={selected ?? null}
              proposal={proposal}
              onClose={() => setProposal(null)}
              onSaved={(id) => {
                setMessage("Original operation accepted and saved.");
                setProposal(null);
                setEpoch((x) => x + 1);
                if (proposal.action === "create")
                  setQuery({ stage: id, panel: null });
              }}
            />
          )}
        </>
      )}
    </SecondaryMenuFrame>
  );
}
function InspectorOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      if (old?.isConnected) old.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="ac-inspector-overlay"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
function Inspector({
  d,
  full,
  onClose,
  action,
  onPrimary,
  projectId,
}: {
  d: Detail;
  full: boolean;
  onClose: () => void;
  action: (
    n: string,
    a: Action,
    f?: Fields,
    p?: boolean,
    primary?: boolean,
  ) => React.ReactNode;
  onPrimary: () => void;
  projectId: string;
}) {
  const technical = d.requirements
      .filter((r) => r.gate === "Technical")
      .filter(
        (r, i, a) => a.findIndex((x) => x.source.id === r.source.id) === i,
      ),
    accepted = technical.reduce(
      (sum, r) => sum + (r.source.tests_accepted ?? 0),
      0,
    ),
    required = technical.reduce(
      (sum, r) => sum + (r.source.tests_required ?? 0),
      0,
    );
  return (
    <div className={full ? "ac-full-record" : "ac-inspector-inner"}>
      <header className="ac-inspector-head">
        {!full && (
          <button
            className="ac-icon-button ac-button"
            aria-label="Close inspector"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        )}
        <small>
          {d.stage.reference} · r{String(d.stage.revision).padStart(2, "0")}
        </small>
        <h2>{d.stage.title}</h2>
        <p>
          {d.units
            .filter((u) => u.disposition === "Included")
            .map((u) => u.installed_at)
            .join(", ")}{" "}
          · {d.units[0]?.system_name ?? "System needed"}
        </p>
      </header>
      <section className="ac-section">
        <h3>Scope</h3>
        <dl>
          <dt>Included</dt>
          <dd>
            {d.units
              .filter((u) => u.disposition === "Included")
              .map((u) => u.title)
              .join("; ") || "Scope needed"}
          </dd>
          <dt>Excluded</dt>
          <dd>
            {d.units
              .filter((u) => u.disposition === "Excluded")
              .map((u) => `${u.title} — ${u.reason}`)
              .join("; ") || "None recorded"}
          </dd>
        </dl>
      </section>
      <section className="ac-section">
        <h3>Acceptance decisions</h3>
        <dl>
          {Object.entries(d.outcomes).map(([k, v]) => (
            <div key={k}>
              <dt>{k[0].toUpperCase() + k.slice(1)}</dt>
              <dd>
                <Tag>{v}</Tag>
              </dd>
            </div>
          ))}
        </dl>
        {d.stage.closeout === "Closed" && (
          <Tag>
            {d.stage.reassessment
              ? "Closed · reassessment needed"
              : d.obligations.some((o) => o.state !== "Completed")
                ? "Closed · remaining obligations"
                : "Closed"}
          </Tag>
        )}
      </section>
      <section className="ac-section">
        <h3>Next requirement</h3>
        <div className="ac-next">
          <Icon name="warning" />
          <div>
            <strong>
              {d.requirements.find(
                (r) => !["Satisfied", "Not required"].includes(r.outcome),
              )?.title ?? d.next.label}
            </strong>
            <p>{d.next.explanation}</p>
          </div>
        </div>
        <p className="ac-muted">
          {d.next.owner} · {dateLabel(d.next.due)}
        </p>
      </section>
      <section className="ac-section">
        <h3>Supporting evidence</h3>
        <dl>
          <dt>Test evidence</dt>
          <dd>
            <Tag>
              {required ? `${accepted} / ${required} accepted` : "Not assessed"}
            </Tag>
          </dd>
          <dt>As-built release</dt>
          <dd>
            <Tag>
              {d.outcomes.technical === "Accepted"
                ? "Released"
                : "Pending issue"}
            </Tag>
          </dd>
          {d.requirements
            .filter((r) => r.gate === "Handover")
            .slice(0, 3)
            .map((r) => (
              <div key={r.id}>
                <dt>{r.source.kind}</dt>
                <dd>
                  <Tag>{r.outcome}</Tag>
                </dd>
              </div>
            ))}
        </dl>
        {technical.find((r) => r.source.href) && (
          <Link href={technical.find((r) => r.source.href)!.source.href!}>
            Open commissioning record →
          </Link>
        )}
      </section>
      <section className="ac-section">
        <h3>
          Handover pack{" "}
          <Tag>
            {d.manifests.some((m) => m.issue_id)
              ? "Issued"
              : d.manifests.length
                ? "Prepared"
                : "Not prepared"}
          </Tag>
        </h3>
        <p className="ac-muted">
          {d.checked_at
            ? `Sources current · Checked ${new Date(d.checked_at).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })} AEST`
            : `Source check: ${d.source_state === "Current" ? "Not checked" : d.source_state}`}
        </p>
        <button className="ac-button ac-primary ac-wide" onClick={onPrimary}>
          {d.next.label}
        </button>
        <div className="ac-detail-links">
          <Link
            href={`/projects/acceptance/stages/${d.stage.id}?${new URLSearchParams({ project: projectId, stage: d.stage.id }).toString()}`}
          >
            Open full record
          </Link>
          <Link
            href={`/projects/acceptance/history?project=${projectId}&stage=${d.stage.id}`}
          >
            View history →
          </Link>
        </div>
      </section>
      {full && (
        <div className="ac-actions">
          {action("Edit draft", "edit")}
          {action("Submit stage", "submit")}
          {action("Return review", "return")}
          {action("Create successor", "successor")}
          {action("Edit exact scope", "scope")}
        </div>
      )}
    </div>
  );
}
