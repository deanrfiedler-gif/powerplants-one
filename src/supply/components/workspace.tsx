"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useShell } from "../../components/shell-provider";
import { usePlatformResource } from "../../components/platform-resource";
import { Button } from "../../components/ui/button";
import { ErrorNotice, friendly, Stamp } from "../../components/business-ui";
import { WorklistPanel } from "../../components/crm-worklist-tools";
import { usePublishPageDescription } from "../../shell/page-description";
import {
  factSpecs,
  recordFields,
  latestFact,
  completeness,
  type Fact,
  type FactKind,
} from "../model";
import { supplyPages, returnViews } from "../navigation";
import type { SupplyWorkspace, register, options } from "../reads";
import { useSupplyCommand, Recovery } from "./recovery";
import { RecordForm, FactForm, AllocationForm } from "./forms";
type Panel =
  | { type: "create" | "edit" | "allocate" }
  | { type: "fact"; kind: FactKind; previous?: Fact };
export function SupplyWorkspacePage({ slug }: { slug: string }) {
  const { context } = useShell();
  return <Workspace key={`${context?.preference_scope}:${slug}`} slug={slug} />;
}
function Workspace({ slug }: { slug: string }) {
  const page = supplyPages.find((p) => p.slug === slug)!;
  const params = useSearchParams(),
    pathname = usePathname();
  const selected = params.get("record"),
    search = params.get("q") ?? "",
    filter = params.get("completeness") ?? "",
    view = params.get("view") ?? "register";
  const [panel, setPanel] = useState<Panel | null>(null),
    [history, setHistory] = useState(false);
  const focusAfterClose = useRef<string | null>(null);
  const detailRegion = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (selected && window.matchMedia("(max-width: 780px)").matches) {
      detailRegion.current?.focus();
      detailRegion.current?.scrollIntoView({ block: "start" });
    }
  }, [selected]);
  function openPanel(value: Panel, focusKey: string) {
    focusAfterClose.current = focusKey;
    setPanel(value);
  }
  const list = usePlatformResource<Awaited<ReturnType<typeof register>>>(
    `supply/records?kind=${page.kind}&q=${encodeURIComponent(search)}&completeness=${encodeURIComponent(filter)}`,
  );
  const detail = usePlatformResource<SupplyWorkspace>(
      selected ? `supply/records/${selected}` : null,
      false,
    ),
    opts = usePlatformResource<Awaited<ReturnType<typeof options>>>(
      "supply/options",
      false,
    );
  const refresh = () => {
    detail.reload();
    list.reload();
    opts.reload();
  };
  const command = useSupplyCommand(refresh);
  useEffect(() => {
    if (panel || detail.loading || !focusAfterClose.current) return;
    const control = document.querySelector<HTMLButtonElement>(
      `[data-supply-action="${focusAfterClose.current}"]`,
    );
    if (control && !control.disabled) {
      control.focus({ preventScroll: true });
      focusAfterClose.current = null;
    }
  }, [panel, detail.loading, detail.data, command.pending]);
  usePublishPageDescription(page.title, page.intro);
  function query(key: string, value: string, push = false) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const url = `${pathname}${next.size ? `?${next}` : ""}`;
    window.history[push ? "pushState" : "replaceState"](null, "", url);
  }
  const r = detail.data?.record;
  const activeView = returnViews.find((v) => v.id === view) ?? returnViews[0];
  const actionKinds =
    page.scope === "SC-08" && view !== "register"
      ? page.actions.filter((k) =>
          (activeView.kinds as readonly string[]).includes(k),
        )
      : page.actions;
  const visibleFacts = (
    history ? detail.data?.facts : detail.data?.current_facts
  )?.filter((f) => actionKinds.includes(f.kind));
  function openFact(kind: FactKind) {
    const latest = detail.data
      ? latestFact(detail.data.facts, kind)
      : undefined;
    const single = [
      "Purchase",
      "Promise",
      "Reservation",
      "Substitution",
      "ReturnAuthorisation",
      "Disposition",
      "CustomerOutcome",
      "Claim",
      "Custody",
    ];
    openPanel(
      {
        type: "fact",
        kind,
        previous: single.includes(kind) ? latest : undefined,
      },
      kind,
    );
  }
  const canCreate = opts.data?.can_create?.[page.kind] ?? false;
  return (
    <section
      id="ppo-supply"
      className="supply-workspace"
      aria-label={page.title}
    >
      <header className="supply-header">
        <div>
          <p className="supply-eyebrow">
            Supply Chain · {page.scope} · Synthetic
          </p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
        </div>
        <Button
          variant="primary"
          disabled={!opts.data || !canCreate || !!command.pending}
          data-supply-action="create"
          onClick={() => openPanel({ type: "create" }, "create")}
        >
          New {page.kind.toLowerCase()}
        </Button>
      </header>
      <nav className="supply-routes" aria-label="Supply Chain workflows">
        {supplyPages
          .filter((p) => p.rail === page.rail)
          .map((p) => (
            <Link
              key={p.slug}
              href={`/supply/${p.slug}`}
              aria-current={p.slug === slug ? "page" : undefined}
            >
              {p.title}
            </Link>
          ))}
      </nav>
      <Recovery command={command} />
      {page.scope === "SC-08" && (
        <nav className="supply-tabs" aria-label="Returns workspaces">
          {returnViews.map((v) => (
            <Button
              key={v.id}
              aria-pressed={view === v.id}
              onClick={() => query("view", v.id, true)}
            >
              {v.label}
            </Button>
          ))}
        </nav>
      )}
      {page.scope === "SC-05" && (
        <aside className="supply-notice">
          <strong>Source reservation command: Not configured</strong>
          <p>
            Unknown availability stays unknown. No unit conversion or inventory
            posting is performed.
          </p>
          <Link href="/supply/dispatch">
            Review recorded reservation evidence with fulfilment
          </Link>
        </aside>
      )}
      <form className="supply-filters" onSubmit={(e) => e.preventDefault()}>
        <label>
          Search worklist
          <input
            type="search"
            value={search}
            onChange={(e) => query("q", e.target.value)}
          />
        </label>
        <label>
          Source completeness
          <select
            value={filter}
            onChange={(e) => query("completeness", e.target.value)}
          >
            <option value="">All permitted records</option>
            {completeness.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <Button
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.delete("q");
            next.delete("completeness");
            window.history.replaceState(
              null,
              "",
              `${pathname}${next.size ? `?${next}` : ""}`,
            );
          }}
        >
          Clear filters
        </Button>
        <Button onClick={refresh}>Refresh evidence</Button>
      </form>
      <ErrorNotice error={list.error} />
      <ErrorNotice error={opts.error} />
      <div className={`supply-columns${selected ? " has-selection" : ""}`}>
        <section className="supply-worklist" aria-label="Supply Chain worklist">
          <h2>
            {page.kind === "Supply"
              ? "Supply lines"
              : page.kind === "Custody"
                ? "Custody records"
                : `${page.kind} register`}
          </h2>
          {list.loading ? (
            <p role="status">Loading permitted records…</p>
          ) : (
            list.data && (
              <>
                <p>
                  {list.data.items.length} matching of {list.data.total}{" "}
                  permitted · {list.data.completeness}
                </p>
                {list.data.items.map((item) => (
                  <article
                    key={item.id}
                    className={selected === item.id ? "selected" : ""}
                  >
                    <Button
                      variant="quiet"
                      aria-pressed={selected === item.id}
                      onClick={() => {
                        setPanel(null);
                        query("record", item.id, true);
                      }}
                    >
                      <strong>{item.title}</strong>
                    </Button>
                    <p>{item.reference}</p>
                    <p>
                      {item.quantity} {item.unit} · {item.item}
                    </p>
                    <p>
                      <span className="supply-status">{item.completeness}</span>{" "}
                      · version {item.version}
                    </p>
                    <p>{item.next_action}</p>
                    <small>
                      Observed <Stamp value={item.observed_at} />
                    </small>
                  </article>
                ))}
                {!list.data.items.length && (
                  <p>
                    {search || filter
                      ? "No records match these filters. Clear filters to recover the permitted worklist."
                      : "No permitted records yet. Create a record with its source context to begin."}
                  </p>
                )}
              </>
            )
          )}
        </section>
        <section
          ref={detailRegion}
          tabIndex={-1}
          className="supply-detail"
          aria-label="Selected Supply Chain record"
        >
          {selected && (
            <Button className="supply-back-to-list" onClick={() => query("record", "", true)}>
              Back to worklist
            </Button>
          )}
          {!selected ? (
            <div className="supply-empty">
              <h2>Select a record</h2>
              <p>
                Open a line to review its evidence, quantities, history and next
                action.
              </p>
            </div>
          ) : detail.loading ? (
            <p role="status">Loading exact record and evidence…</p>
          ) : (
            <ErrorNotice error={detail.error} />
          )}
          {r && detail.data && (
            <>
              <header>
                <p>
                  {r.reference} · saved version {r.version}
                </p>
                <h2>{r.title}</h2>
                <p>
                  {r.quantity} {r.unit} · {r.item}
                </p>
                <p>
                  <span className="supply-status">{r.completeness}</span> ·
                  Source time <Stamp value={r.observed_at} />
                </p>
                <p>{r.source_reference}</p>
                <p>
                  <strong>Next action:</strong> {r.next_action}
                </p>
              </header>
              <nav
                className="supply-links"
                aria-label="Canonical record handovers"
              >
                {detail.data.links.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </nav>
              {detail.data.basis && (
                <section className="supply-summary">
                  <h3>{detail.data.basis.readiness.state}</h3>
                  <p>
                    Evidenced usable allocation: {detail.data.basis.usable}{" "}
                    {r.unit} · Shortage:{" "}
                    {detail.data.basis.readiness.shortage ?? "Unknown"}
                  </p>
                  <small>
                    Demand version {detail.data.basis.demand_version}; source
                    evidence above. Material scope only; technical release,
                    booking, site readiness and Finance remain separate.
                  </small>
                </section>
              )}
              {detail.data.fulfilment &&
                ["SC-06", "SC-07"].includes(page.scope) && (
                  <dl className="supply-metrics">
                    {Object.entries(detail.data.fulfilment).map(
                      ([key, value]) => (
                        <div key={key}>
                          <dt>{friendly(key)}</dt>
                          <dd>
                            {value} {r.unit}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                )}
              <div className="supply-actions">
                <Button
                  data-supply-action="edit"
                  onClick={() => openPanel({ type: "edit" }, "edit")}
                  disabled={!detail.data.capabilities.edit || !!command.pending}
                >
                  Revise record
                </Button>
                {["Demand", "Supply"].includes(r.kind) && (
                  <Button
                    data-supply-action="allocate"
                    onClick={() => openPanel({ type: "allocate" }, "allocate")}
                    disabled={
                      !opts.data ||
                      !detail.data.capabilities.edit ||
                      !!command.pending
                    }
                  >
                    Allocate to a line
                  </Button>
                )}
                {actionKinds
                  .filter((k) => detail.data!.capabilities[k])
                  .map((k) => (
                    <Button
                      key={k}
                      data-supply-action={k}
                      onClick={() => openFact(k)}
                      disabled={!!command.pending}
                    >
                      {factSpecs[k].title}
                    </Button>
                  ))}
              </div>
              {!detail.data.capabilities.edit && (
                <p className="supply-notice">
                  Read-only record: the current identity has no coordination
                  edit authority.
                </p>
              )}
              {page.scope === "SC-08" &&
                view === "credits" &&
                !detail.data.capabilities.Credit && (
                  <p className="supply-notice">
                    Restricted Finance projection unavailable for this identity.
                    Credit values, references and counts are not returned.
                  </p>
                )}
              <details>
                <summary>Record context and source observations</summary>
                <dl className="supply-context">
                  {recordFields[r.kind].map((f) => (
                    <div key={f.key}>
                      <dt>{f.label}</dt>
                      <dd>{r.data[f.key] ?? "Unknown / not linked"}</dd>
                    </div>
                  ))}
                  {r.external_key && (
                    <div>
                      <dt>Qualified source key</dt>
                      <dd>{Object.values(r.external_key).join(" / ")}</dd>
                    </div>
                  )}
                </dl>
              </details>
              {!!detail.data.allocations.length && (
                <section>
                  <h3>Line allocations</h3>
                  {detail.data.allocations.map((a) => (
                    <article key={a.id}>
                      <p>
                        {a.basis}: {a.quantity} {a.unit} · version {a.version}
                      </p>
                      <Link
                        href={`/supply/material-readiness?record=${a.demand_id}`}
                      >
                        Demand line
                      </Link>{" "}
                      ·{" "}
                      <Link href={`/supply/shipments?record=${a.supply_id}`}>
                        Supply line
                      </Link>
                    </article>
                  ))}
                </section>
              )}
              <section>
                <div className="supply-section-title">
                  <h3>Workflow evidence</h3>
                  <Button
                    aria-pressed={history}
                    onClick={() => setHistory((v) => !v)}
                  >
                    {history
                      ? "Show current evidence"
                      : "Include original captures"}
                  </Button>
                </div>
                {visibleFacts?.map((f) => (
                  <article className="supply-fact" key={f.id}>
                    <h4>
                      {factSpecs[f.kind].title} ·{" "}
                      {f.data.state ?? f.completeness}
                    </h4>
                    <p>
                      Capture version {f.version} · observed{" "}
                      <Stamp value={f.observed_at} />
                    </p>
                    <dl>
                      {Object.entries(f.data)
                        .filter(
                          ([key]) => f.kind !== "Assessment" || key !== "basis",
                        )
                        .map(([key, value]) => (
                          <div key={key}>
                            <dt>
                              {factSpecs[f.kind].fields.find(
                                (s) => s.key === key,
                              )?.label ?? friendly(key)}
                            </dt>
                            <dd>{value ?? "Unknown"}</dd>
                          </div>
                        ))}
                    </dl>
                    {f.kind === "Assessment" && f.data.basis && (
                      <AssessmentEvidence value={f.data.basis} />
                    )}
                    <p>{f.evidence}</p>
                    {f.attachment_id && (
                      <a
                        href={`/api/v1/supply/evidence/${f.attachment_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open exact photo evidence
                      </a>
                    )}
                    {f.activity_id && (
                      <p>
                        <Link href={`/work/${f.activity_id}`}>
                          Open owned impact Activity
                        </Link>
                      </p>
                    )}
                    {detail.data!.current_facts.some(
                      (current) => current.id === f.id,
                    ) &&
                      detail.data!.capabilities[f.kind] && (
                        <Button
                          onClick={() =>
                            openPanel(
                              {
                                type: "fact",
                                kind: f.kind,
                                previous: f,
                              },
                              f.kind,
                            )
                          }
                        >
                          Review / correct capture
                        </Button>
                      )}
                  </article>
                ))}
                {!visibleFacts?.length && (
                  <p>No evidence is recorded for this workflow view.</p>
                )}
              </section>
              <details>
                <summary>
                  Retained record revisions ({detail.data.history.length})
                </summary>
                {detail.data.history.map((h) => (
                  <article key={h.version}>
                    <h4>Version {h.version}</h4>
                    <p>{h.snapshot.last_reason}</p>
                    <p>
                      {h.snapshot.quantity} {h.snapshot.unit} ·{" "}
                      {h.snapshot.completeness}
                    </p>
                    <p>
                      Required: {h.snapshot.data.required_on ?? "Unknown"} ·
                      ETA: {h.snapshot.data.eta ?? "Unknown"}
                    </p>
                  </article>
                ))}
              </details>
            </>
          )}
        </section>
      </div>
      {panel && (opts.data || panel.type === "fact") && (
        <WorklistPanel
          title={
            panel.type === "fact"
              ? factSpecs[panel.kind].title
              : panel.type === "allocate"
                ? "Allocate material"
                : panel.type === "edit"
                  ? "Revise coordination record"
                  : `New ${page.kind.toLowerCase()}`
          }
          onClose={() => {
            if (
              !command.busy &&
              window.confirm(
                "Close this form? Unsaved entries will be discarded; any original pending save remains recoverable.",
              )
            )
              setPanel(null);
          }}
        >
          <Recovery command={command} />
          {panel.type === "create" || panel.type === "edit" ? (
            <RecordForm
              key={`${panel.type}-${r?.id ?? "new"}`}
              kind={panel.type === "edit" && r ? r.kind : page.kind}
              record={panel.type === "edit" ? r : undefined}
              options={opts.data!}
              command={command}
              onDone={() => setPanel(null)}
            />
          ) : r && panel.type === "allocate" ? (
            <AllocationForm
              record={r}
              allocations={detail.data?.allocations ?? []}
              options={opts.data!}
              command={command}
              onDone={() => setPanel(null)}
            />
          ) : r && panel.type === "fact" ? (
            <FactForm
              key={`${panel.kind}-${panel.previous?.id ?? "new"}`}
              kind={panel.kind}
              record={r}
              previous={panel.previous}
              facts={detail.data?.current_facts ?? []}
              fieldCaptures={detail.data?.field_captures ?? []}
              command={command}
              onDone={() => setPanel(null)}
            />
          ) : null}
        </WorklistPanel>
      )}
    </section>
  );
}
function AssessmentEvidence({ value }: { value: string }) {
  let basis: {
    demand_version: number;
    sources: {
      id: string;
      version: number;
      observed_at: string;
      completeness: string;
      usable: string | null;
    }[];
  };
  try {
    basis = JSON.parse(value);
  } catch {
    return <p>The exact assessment basis needs recovery.</p>;
  }
  return (
    <details>
      <summary>Exact assessed source versions</summary>
      <p>Demand version {basis.demand_version}</p>
      {basis.sources.map((source) => (
        <p key={source.id}>
          <Link href={`/supply/stock?record=${source.id}`}>
            Source version {source.version}
          </Link>{" "}
          · {source.completeness} · usable {source.usable ?? "Unknown"} ·{" "}
          <Stamp value={source.observed_at} />
        </p>
      ))}
    </details>
  );
}
