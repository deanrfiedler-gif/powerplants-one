"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useIdentity } from "../../../components/business-session";
import {
  useResource,
  ErrorNotice,
  friendly,
  type Envelope,
} from "../../../components/business-ui";
import { Button } from "../../../components/ui/button";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../../shell/secondary-menu";
import type { EngineeringPackage } from "../../model";
import {
  controlModules,
  controlHref,
  controlKind,
  type ControlModule,
} from "../navigation";
import {
  deliverableState,
  sourceBlockers,
  sourceIds,
  type ControlRecord,
} from "../model";
import type { ControlRead } from "../reads";
import { RecordDetail } from "./record-detail";
import { RecordEditor } from "./record-editor";
import { ActionForm, type ActionRequest } from "./action-form";

export function ControlEntry({ module }: { module: ControlModule }) {
  const [query, setQuery] = useState(""),
    [cursor, setCursor] = useState<string | null>(null);
  const read = useResource<Envelope<EngineeringPackage>>(
    `engineering?q=${encodeURIComponent(query)}${cursor ? `&cursor=${cursor}` : ""}`,
  );
  return (
    <div id="ppo-engineering-control">
      <section className="ec-entry" aria-busy={read.loading}>
        <h1>{controlModules[module].title}</h1>
        <p>Choose the Engineering package whose technical records you need.</p>
        <label>
          Search package, project or customer
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(null);
            }}
          />
        </label>
        <ErrorNotice error={read.error} />
        {read.loading && <p role="status">Loading permitted packages…</p>}
        {read.data && !read.error && (
          <>
            <ul className="ec-entry-list">
              {read.data.items.map((p) => (
                <li key={p.id}>
                  <Link href={controlHref(p.id, module)}>{p.title}</Link>
                  <p>
                    {p.display_number} · {p.customer_name} ·{" "}
                    {p.context_reference} · {p.discipline}
                  </p>
                  <p>
                    {p.owner_name} · {p.required_date ?? "Date needed"} ·{" "}
                    {p.next_action}
                  </p>
                </li>
              ))}
            </ul>
            {!read.data.items.length && (
              <p>
                {query
                  ? "No packages match this search. Clear the search to see permitted packages."
                  : "No Engineering packages are available to this identity."}
              </p>
            )}
            {read.data.next_cursor && (
              <Button onClick={() => setCursor(read.data!.next_cursor)}>
                Next packages
              </Button>
            )}
            {cursor && (
              <Button onClick={() => setCursor(null)}>First packages</Button>
            )}
          </>
        )}
        <Link href="/engineering">Engineering work packages and intake</Link>
      </section>
    </div>
  );
}
export function ControlWorkspace(props: {
  packageId: string;
  module: ControlModule;
  view?: string;
}) {
  const identity = useIdentity();
  return (
    <Workspace
      key={`${identity.workspace_id}:${identity.actor_id}:${props.packageId}:${props.module}`}
      {...props}
    />
  );
}
function Workspace({
  packageId,
  module,
  view = controlModules[module].views[0][0],
}: {
  packageId: string;
  module: ControlModule;
  view?: string;
}) {
  const router = useRouter(),
    search = useSearchParams(),
    selectedId = search.get("record");
  const read = useResource<ControlRead>(
    `engineering/${packageId}/control${selectedId ? `?record_id=${encodeURIComponent(selectedId)}` : ""}`,
  );
  const [menuOpen, setMenuOpen] = useState(false),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [query, setQuery] = useState(""),
    [queue, setQueue] = useState("all"),
    [editor, setEditor] = useState<{
      record?: ControlRecord;
      successor?: boolean;
    } | null>(null),
    [action, setAction] = useState<ActionRequest | null>(null),
    [message, setMessage] = useState("");
  const kind = controlKind(module, view),
    data = read.data,
    records = data?.records[kind] ?? [];
  const selected = selectedId
    ? records.find((r) => r.id === selectedId)
    : undefined;
  const returnTo = useRef<string | null>(null),
    inspectorHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (read.loading) return;
    if (selectedId) inspectorHeading.current?.focus();
    else if (returnTo.current) {
      const opener = document.getElementById(returnTo.current);
      if (opener) {
        opener.focus();
        returnTo.current = null;
      }
    }
  }, [selectedId, read.loading]);
  const released = (r: ControlRecord) =>
    kind === "deliverable" &&
    data!.records.issue.some(
      (i) =>
        i.state === "Issued" &&
        !sourceBlockers(i.content.source_ids, data!.sources).length &&
        !data!.native_sources.some(
          (n) =>
            n.issue_id === i.id &&
            data!.sources.some(
              (s) => s.id === n.source_id && s.use !== "Current",
            ),
        ) &&
        data!.records.review.some(
          (review) =>
            review.id === i.content.review_id &&
            review.content.document_revision_ids.some((id) =>
              data!.document_revisions.some(
                (d) =>
                  d.id === id &&
                  d.document_id ===
                    (r as ControlRecord<"deliverable">).content.document_id &&
                  data!.sources.some(
                    (s) => s.id === d.source_id && s.use === "Current",
                  ),
              ),
            ),
        ),
    );
  const status = (r: ControlRecord) =>
    kind === "deliverable"
      ? deliverableState(r as ControlRecord<"deliverable">, released(r))
      : r.state;
  const filtered = records.filter(
    (r) =>
      (!query ||
        [r.reference, r.title, r.state]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (queue === "all" ||
        (queue === "mine" && r.owner_id === data?.actor_id) ||
        (queue === "waiting" &&
          [
            "Draft",
            "Submitted",
            "Open",
            "Answered",
            "Planned",
            "InProgress",
          ].includes(r.state)) ||
        (queue === "overdue" &&
          !!r.due_date &&
          r.due_date <
            new Date().toLocaleDateString("en-CA", {
              timeZone: "Australia/Brisbane",
            }))),
  );
  const saved = () => {
    read.reload();
    setMessage("Saved. The register is refreshing from the server.");
  };
  const stale = !!read.error || read.loading;
  const nav = (
    <>
      <div className="mw-menu-title">
        <strong>{controlModules[module].title}</strong>
        <span>Engineering package</span>
      </div>
      <nav aria-label={controlModules[module].title}>
        <ul>
          {controlModules[module].views.map(([key, label]) => (
            <li key={key}>
              <Link
                href={controlHref(
                  packageId,
                  module,
                  key,
                  module === "basis" ? (selectedId ?? undefined) : undefined,
                )}
                aria-current={view === key ? "page" : undefined}
                onClick={() => menu.closeOverlay(false)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Related Engineering workflows">
        <ul>
          {Object.entries(controlModules)
            .filter(([key]) => key !== module)
            .map(([key, definition]) => (
              <li key={key}>
                <Link href={controlHref(packageId, key as ControlModule)}>
                  {definition.title}
                </Link>
              </li>
            ))}
          <li>
            <Link href={`/engineering/${packageId}/materials`}>
              Released materials & substitutions
            </Link>
          </li>
          <li>
            <Link href={`/engineering/${packageId}/changes`}>
              Change-impact review
            </Link>
          </li>
          <li>
            <Link href={`/engineering/commissioning?package=${packageId}`}>
              Commissioning & as-built
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
  return (
    <SecondaryMenuFrame
      id="ppo-engineering-control"
      name={controlModules[module].title}
      menuId="ec-menu"
      contentId="ec-content"
      state={menu}
      menu={nav}
      message={message}
    >
      <div className="ec-workspace" aria-busy={read.loading}>
        <header className="ec-context">
          <h1>{controlModules[module].title}</h1>
          {data && (
            <>
              <strong>{data.package.title}</strong>
              <p>
                {data.package.display_number} · {data.package.customer_name} ·{" "}
                {data.package.context_reference} · {data.package.discipline}
              </p>
              <p>
                Package owner: {data.package.owner_name} ·{" "}
                {data.package.site_id
                  ? (data.site_name ?? "Site name unavailable")
                  : "Site not yet supplied"}
              </p>
            </>
          )}
          <div className="ec-links">
            <Link href={`/engineering/${packageId}`}>Package coordination</Link>
            <Link
              href={`/engineering/${packageId}/materials/history?tab=sources`}
            >
              Retained source adapter
            </Link>
            <Link href={`/engineering/${module}`}>Choose package</Link>
          </div>
        </header>
        <ErrorNotice error={read.error} />
        {read.loading && (
          <p role="status">Loading exact Engineering records…</p>
        )}
        {data && !read.error && (
          <>
            <div className="ec-toolbar">
              <label>
                Search records
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <label>
                Work queue
                <select
                  value={queue}
                  onChange={(e) => setQueue(e.target.value)}
                >
                  <option value="all">All records</option>
                  <option value="mine">Assigned to me</option>
                  <option value="waiting">Work waiting</option>
                  <option value="overdue">Overdue</option>
                </select>
              </label>
              {data.can.author && kind !== "issue" && (
                <Button
                  disabled={stale}
                  variant="primary"
                  onClick={() =>
                    kind === "review"
                      ? setAction({
                          action: "submit_review",
                          kind,
                          label: "Submit exact review",
                        })
                      : setEditor({})
                  }
                >
                  {kind === "review" ? "Submit exact review" : `Add ${kind}`}
                </Button>
              )}
              <Button disabled={read.loading} onClick={read.reload}>
                Refresh
              </Button>
            </div>
            <p className="ec-notice">
              {data.policy.configured
                ? data.policy.label
                : "Authority not configured — cannot review or issue"}{" "}
              ·{" "}
              {data.can.author
                ? "Draft authoring available"
                : "Read-only authoring"}{" "}
              ·{" "}
              {controlModules[module].views.find(([key]) => key === view)?.[1]}
            </p>
            <div className="ec-split" data-selected={!!selected}>
              <section
                className="ec-register"
                aria-label={`${friendly(kind)} register`}
              >
                <ul>
                  {filtered.map((r) => (
                    <li key={r.id} data-selected={r.id === selected?.id}>
                      <Link
                        id={`ec-record-${r.id}`}
                        href={controlHref(packageId, module, view, r.id)}
                        aria-current={
                          r.id === selected?.id ? "true" : undefined
                        }
                      >
                        <strong>{r.title}</strong>
                        <span>
                          {r.reference} · revision {r.revision}
                        </span>
                      </Link>
                      <p>
                        {status(r)} ·{" "}
                        {data.people.find((p) => p.id === r.owner_id)
                          ?.display_name ?? "Owner unavailable"}{" "}
                        · {r.due_date ?? "Date needed"}
                      </p>
                      {sourceBlockers(sourceIds(r.content), data.sources)
                        .length > 0 && (
                        <p className="ec-warning">
                          Source reassessment required
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {!filtered.length && (
                  <div className="ec-empty">
                    <h2>
                      {records.length ? "No records match" : "No records yet"}
                    </h2>
                    <p>
                      {records.length
                        ? "Clear the search or change the work queue."
                        : kind === "issue"
                          ? "Complete an exact review, then an authorised issuer can prepare its formal issue."
                          : `Add a ${kind} to retain accountable work and exact evidence in this package.`}
                    </p>
                  </div>
                )}
              </section>
              {selected && (
                <aside
                  className="ec-inspector"
                  aria-label="Selected Engineering record"
                >
                  <div className="ec-inspector-head">
                    <h2 ref={inspectorHeading} tabIndex={-1}>
                      {selected.title}
                    </h2>
                    <Button
                      onClick={() => {
                        returnTo.current = `ec-record-${selected.id}`;
                        router.push(controlHref(packageId, module, view));
                      }}
                    >
                      Close inspector
                    </Button>
                  </div>
                  <fieldset className="ec-detail" disabled={stale}>
                    <RecordDetail
                      data={data}
                      kind={kind}
                      record={selected}
                      view={view}
                      edit={(successor) =>
                        setEditor({ record: selected, successor })
                      }
                      act={setAction}
                    />
                  </fieldset>
                </aside>
              )}
            </div>
          </>
        )}
      </div>
      {data && !read.error && editor && (
        <RecordEditor
          key={editor.record?.id ?? "new"}
          data={data}
          kind={kind}
          record={editor.record}
          successor={editor.successor}
          view={view}
          onClose={() => setEditor(null)}
          onSaved={saved}
        />
      )}
      {data && !read.error && action && (
        <ActionForm
          data={data}
          request={action}
          onClose={() => setAction(null)}
          onSaved={saved}
        />
      )}
    </SecondaryMenuFrame>
  );
}
