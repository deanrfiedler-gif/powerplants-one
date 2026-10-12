"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ErrorNotice } from "./business-ui";
import { useIdentity } from "./business-session";
import { denied, useCrmResource } from "./crm-state";
import { useScopePreferences } from "./scope-preferences";
import { useDiscoveryNavigation } from "./discovery-navigation";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { definition, views, viewLabels, type View } from "../estimating/specialist/definition";
import type { DraftProposal, Decision, NativePriceProposal } from "../estimating/specialist/types";
import { type DrawingModel, drawingErrors, num, readDrawing } from "../estimating/specialist/drawing";
import { configurationSignature, inputErrors, readinessGates, sectionIds, sheetGeometry, untestedOptions, type SectionId } from "../estimating/specialist/workbench";
import { useSpecialistCommand } from "./specialist-recovery";
import { WorkbenchHeader } from "./specialist-header";
import { ConfigureView } from "./specialist-configure";
import { DrawingsView } from "./specialist-drawings";
import { PartsView } from "./specialist-parts";
import { PricingView } from "./specialist-pricing";
import { CompareView } from "./specialist-compare";
import { DefinitionView, HistoryView } from "./specialist-records";
import { basePath, type Bench, type Detail, type Options, type Preview, type Receiving, type Register } from "./specialist-types";
import { Dialog, Notice, Pill, fmt, readable, runLabel, usePhone } from "./specialist-ui";
import "./specialist-workbench.css";

// ES-08 Screen Configurator Workbench. The shared shell owns the rail, header
// and viewport; this module owns its secondary menu, module header, views and
// scroll surface. The design board decision (docs/decisions/es08-design-board.md)
// fixes the composition; the recovered engine, commands, receipts and recovery
// are unchanged from the r03 workbench.
function Frame({ id, view, children, message = "" }: { id?: string; view?: string; children: ReactNode; message?: string }) {
  const identity = useIdentity(),
    preferences = useScopePreferences(`${identity.workspace_id}:${identity.actor_id}:es08`),
    menu = useSecondaryMenu(preferences.value.menu, (open) => preferences.save({ ...preferences.value, menu: open }));
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-specialist"
      name="Specialist configuration"
      menuId="es08-menu"
      contentId="es08-content"
      message={message}
      menu={
        <>
          <Link className="es08-back" href="/estimating">
            ← Back to estimating
          </Link>
          <h2 className="es08-menu-title">Specialist configuration</h2>
          <nav aria-label="Specialist configuration views" onClick={() => menu.closeOverlay(false)}>
            <Link href="/estimating/configurations" aria-current={!id ? "page" : undefined}>
              Configurations
            </Link>
            {id &&
              views.map((v, i) => (
                <Link key={v} href={`/estimating/configurations/${id}/${v}`} aria-current={view === v ? "page" : undefined}>
                  {viewLabels[i]}
                </Link>
              ))}
            <Link href="/estimating/discovery">Discovery workspaces</Link>
          </nav>
          <p className="es08-menu-note">
            Screen Systems
            <br />
            Synthetic review
            <br />
            Engineering approval remains open
          </p>
        </>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
export function SpecialistRegister() {
  const [search, setSearch] = useState(""),
    [state, setState] = useState("Active"),
    [before, setBefore] = useState<string | null>(null),
    query = useSearchParams(),
    workspace = query.get("estimating_workspace_id"),
    resource = useCrmResource<Register>(
      `${basePath}?state=${state}&search=${encodeURIComponent(search)}${workspace ? `&estimating_workspace_id=${workspace}` : ""}${before ? `&before=${before}` : ""}`,
      true,
    );
  return (
    <Frame>
      <div className="es08-scroll es08-register">
        <header className="es08-view-head">
          <div>
            <h1>Specialist configurations</h1>
            <p>Saved technical inputs, calculation evidence and reviewed estimate contributions for the Screen Systems family.</p>
          </div>
          {resource.data?.can_create && (
            <Link className="ppo-button ppo-button--primary" href={`/estimating/configurations/new${workspace ? `?estimating_workspace_id=${workspace}${query.get("option_id") ? `&option_id=${query.get("option_id")}` : ""}` : ""}`}>
              New configuration
            </Link>
          )}
        </header>
        <div className="es08-toolbar">
          <div className="es08-toolbar-left">
            <label className="es08-stack-label">
              Search configurations
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setBefore(null);
                }}
              />
            </label>
            <label className="es08-stack-label">
              Lifecycle
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setBefore(null);
                }}
              >
                <option>Active</option>
                <option>Archived</option>
              </select>
            </label>
          </div>
        </div>
        <ErrorNotice error={resource.error} />
        {resource.loading && <p role="status">Loading permitted configurations…</p>}
        {resource.data && (
          <section className="es08-card es08-table-card">
            <div className="es08-table-scroll" tabIndex={0} aria-label="Configuration register">
              <table className="es08-table">
                <thead>
                  <tr>
                    {["Configuration", "Family", "Alternative", "Coverage", "Source discovery", "Review run", "Owner", "Updated"].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resource.data.items.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link className="es08-strong" href={`/estimating/configurations/${c.id}/configure`}>
                          {c.name}
                        </Link>
                        <div className="es08-sub">
                          Draft v{c.version} · {c.state}
                        </div>
                      </td>
                      <td>Screen Systems</td>
                      <td>{c.option_label}</td>
                      <td>
                        {c.coverage.facility_ids.length} Facilities · {c.coverage.area_ids.length} areas
                      </td>
                      <td>
                        Revision {c.source_revision}
                        <div className="es08-sub">{c.scope_readiness}</div>
                      </td>
                      <td>{c.current_run_id ? <Pill tone="ok">Run saved</Pill> : <span className="es08-sub">No saved run</span>}</td>
                      <td className="es08-mono">{c.owner_id.slice(0, 8)}</td>
                      <td>{readable(c.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {resource.data.items.length === 0 && (
              <p className="es08-empty">{search ? "No permitted configurations match these filters." : "No configurations in this scope yet. Start from a saved discovery revision."}</p>
            )}
            <div className="es08-card-foot">
              <span className="es08-sub">{resource.data.items.length} shown</span>
              <span className="es08-record-actions">
                {before && (
                  <button type="button" className="ppo-button es08-button--sm" onClick={() => setBefore(null)}>
                    First page
                  </button>
                )}
                {resource.data.next_cursor && (
                  <button type="button" className="ppo-button es08-button--sm" onClick={() => setBefore(resource.data!.next_cursor)}>
                    Next page
                  </button>
                )}
              </span>
            </div>
          </section>
        )}
      </div>
    </Frame>
  );
}
export function SpecialistCreate() {
  const query = useSearchParams(),
    workspace = query.get("estimating_workspace_id"),
    resource = useCrmResource<Options>(`${basePath}/options${workspace ? `?estimating_workspace_id=${workspace}` : ""}`, true);
  return (
    <Frame>
      <div className="es08-scroll es08-register">
        <header className="es08-view-head">
          <div>
            <h1>New Screen Systems configuration</h1>
            <p>Choose an exact saved source. Creation saves a durable draft and creates no calculation run or cost lines.</p>
          </div>
        </header>
        <ErrorNotice error={resource.error} />
        {resource.data && <CreateForm options={resource.data} />}
      </div>
    </Frame>
  );
}
function CreateForm({ options }: { options: Options }) {
  const router = useRouter(),
    query = useSearchParams(),
    [index, setIndex] = useState(() => Math.max(0, options.sources.findIndex((s) => s.option_id === query.get("option_id")))),
    [name, setName] = useState("Screen Systems study"),
    [id] = useState(() => query.get("configuration_id") ?? crypto.randomUUID()),
    [coverage, setCoverage] = useState("FacilityScope"),
    source = options.sources[index],
    command = useSpecialistCommand(options, id, async () => {
      router.push(`/estimating/configurations/${id}/configure`);
    });
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("configuration_id", id);
    window.history.replaceState(null, "", url);
  }, [id]);
  if (!source)
    return (
      <p className="es08-empty">
        No editable saved discovery source is available. <Link href="/estimating/discovery">Save discovery first.</Link>
      </p>
    );
  return (
    <form
      className="es08-card es08-create"
      onSubmit={(e) => {
        e.preventDefault();
        const system = source.configuration?.systems.find((s) => s.id === coverage);
        void command.send(basePath, "CreateSpecialistConfiguration", {
          id,
          name,
          estimating_workspace_id: source.estimating_workspace_id,
          option_id: source.option_id,
          revision_id: source.revision_id,
          expected_workspace_version: source.expected_workspace_version,
          coverage: {
            kind: system ? "StructuredSystem" : "FacilityScope",
            system_id: system?.id ?? null,
            area_ids: system?.coverage.area_ids ?? [],
            facility_ids: system ? [] : source.facility_ids,
          },
          proposal: source.proposal,
          reason: "Create a scoped specialist review draft from the selected saved discovery",
        });
      }}
    >
      <label className="es08-stack-label">
        Configuration name
        <input required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="es08-stack-label">
        Saved source
        <select
          value={index}
          onChange={(e) => {
            setIndex(Number(e.target.value));
            setCoverage("FacilityScope");
          }}
        >
          {options.sources.map((s, i) => (
            <option key={s.revision_id} value={i}>
              {s.site} · {s.option_label} · discovery {s.revision} · {s.scope_readiness}
            </option>
          ))}
        </select>
      </label>
      <label className="es08-stack-label">
        Explicit coverage
        <select value={coverage} onChange={(e) => setCoverage(e.target.value)}>
          <option value="FacilityScope">Saved Facility scope ({source.facility_ids.length} Facilities)</option>
          {source.configuration?.systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.coverage.mode}
            </option>
          ))}
        </select>
      </label>
      <p className="es08-sub">Defaults retain recovered or synthetic assumption provenance. They are not confirmed customer requirements.</p>
      <ErrorNotice error={command.error} />
      <div className="es08-record-actions">
        <button type="submit" className="ppo-button ppo-button--primary" disabled={command.busy || command.pending}>
          Create configuration
        </button>
        {command.pending && (
          <>
            <button type="button" className="ppo-button" disabled={command.busy} onClick={() => command.recover(command.canRetry)}>
              Recover original creation
            </button>
            <button type="button" className="ppo-button" disabled={command.busy} onClick={() => command.resolve()}>
              Resolve original outcome
            </button>
          </>
        )}
      </div>
      <p role="status" className="es08-sub">
        {command.status}
      </p>
    </form>
  );
}
export function SpecialistWorkspace({ id }: { id: string }) {
  const path = usePathname(),
    view = path.split("/").at(-1) ?? "configure",
    resource = useCrmResource<Detail>(`${basePath}/${id}`, true);
  if (!views.includes(view as View))
    return (
      <Frame>
        <p className="es08-empty">Unknown specialist view.</p>
      </Frame>
    );
  return (
    <Frame id={id} view={view}>
      <ErrorNotice error={resource.error} />
      {resource.loading && (
        <div className="es08-loading" role="status" aria-busy="true">
          <span className="es08-skeleton es08-skeleton--title" />
          <span className="es08-skeleton es08-skeleton--line" />
          <span className="es08-skeleton es08-skeleton--block" />
          <span className="es08-sub">Loading the authorised configuration…</span>
        </div>
      )}
      {resource.data && <Editor key={`${resource.data.actor_id}:${id}`} initial={resource.data} view={view as View} reload={resource.reload} />}
    </Frame>
  );
}
// Drawing-only inputs are remembered in this browser beside the draft
// (docs/decisions/es08-design-board.md, D5/D14); they are not part of the
// saved run, and storage failure leaves the defaults.
function useDrawingModel(key: string, roof: string) {
  const [drawing, setDrawingState] = useState<DrawingModel>(() => {
    try {
      return readDrawing(JSON.parse(localStorage.getItem(key) ?? "null"), roof);
    } catch {
      return readDrawing(null, roof);
    }
  });
  const setDrawing = (next: DrawingModel) => {
    setDrawingState(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* The remembered drawing inputs are a convenience only. */
    }
  };
  return [drawing, setDrawing] as const;
}
function Editor({ initial, view, reload }: { initial: Detail; view: View; reload: () => void }) {
  const query = useSearchParams(),
    [data, setData] = useState(initial),
    [proposal, setProposal] = useState<DraftProposal>(initial.draft.proposal),
    [decisions, setDecisions] = useState<Decision[]>([]),
    [reason, setReason] = useState("Reviewed specialist configuration proposal"),
    [preview, setPreview] = useState<Preview | null>(null),
    [previewKey, setPreviewKey] = useState(""),
    [error, setError] = useState<unknown>(null),
    [working, setWorking] = useState<string | null>(null),
    [manualOpen, setManualOpen] = useState(false),
    [methodOpen, setMethodOpen] = useState(false),
    [receiving, setReceiving] = useState<Receiving | null>(null),
    [receivingError, setReceivingError] = useState<unknown>(null),
    [receivingDecisions, setReceivingDecisions] = useState<Decision[]>([]),
    [nativePrices, setNativePrices] = useState<NativePriceProposal[]>([]),
    [section, setSection] = useState<SectionId>(() => {
      const wanted = query.get("section");
      return sectionIds.includes(wanted as SectionId) ? (wanted as SectionId) : "structure";
    }),
    phone = usePhone();
  const id = data.configuration.id,
    path = `${basePath}/${id}`,
    [drawing, setDrawing] = useDrawingModel(`ppo:es08:drawing:${initial.workspace_id}:${initial.actor_id}:${id}:v1`, initial.draft.proposal.inputs.roof.raw),
    dirty = JSON.stringify(proposal) !== JSON.stringify(data.draft.proposal),
    proposalKey = JSON.stringify({ proposal, decisions, version: data.configuration.version }),
    fresh = previewKey === proposalKey || (!initial.can_edit && !dirty && !!data.current_run),
    calculation = preview?.calculation ?? data.current_run?.snapshot.calculation ?? null;
  const command = useSpecialistCommand(data, id, async () => {
    const current = await api<Detail>(path);
    setData(current);
    setProposal(current.draft.proposal);
    setDecisions([]);
    setPreview(null);
    setPreviewKey("");
    setReceiving(null);
    setReceivingError(null);
    setReceivingDecisions([]);
    reload();
  });
  const frozen = command.busy || command.pending || !initial.can_edit,
    navigation = useDiscoveryNavigation(dirty, command.busy || command.pending, `/estimating/configurations/${id}/`);
  useEffect(() => {
    if (
      // The command response can arrive before the background resource refresh.
      // An older resource snapshot must never roll an accepted version back.
      initial.configuration.version > data.configuration.version &&
      !dirty &&
      !command.pending &&
      !command.busy
    )
      queueMicrotask(() => {
        setData(initial);
        setProposal(initial.draft.proposal);
        setPreview(null);
        setReceiving(null);
      });
  }, [initial, data.configuration.version, dirty, command.pending, command.busy]);
  useEffect(() => {
    if (!initial.can_edit) return;
    let live = true;
    const timer = setTimeout(() => {
      void api<Preview>(`${path}/preview`, { expected_version: data.configuration.version, proposal, decisions }).then(
        (result) => {
          if (live) {
            setPreview(result);
            setPreviewKey(proposalKey);
            setError(null);
          }
        },
        (e) => {
          if (live) {
            setError(e);
            setPreviewKey("");
          }
        },
      );
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [path, proposalKey, proposal, decisions, data.configuration.version, initial.can_edit]);
  const change = (work: (p: DraftProposal) => void) => {
    if (frozen) return;
    setProposal((prior) => {
      const next = structuredClone(prior);
      work(next);
      return next;
    });
    setReceiving(null);
  };
  const saveDraft = () => command.send(`${path}/draft`, "SaveSpecialistDraft", { reason, expected_version: data.configuration.version, proposal });
  const saveReview = () =>
    command.send(`${path}/run`, "SaveSpecialistRun", { reason, expected_version: data.configuration.version, proposal, decisions, proposal_signature: preview?.proposal_signature });
  const decide = (key: string, choice: Decision["choice"], receivingChoice = false) => {
    const fn = receivingChoice ? setReceivingDecisions : setDecisions;
    fn((previous) => [...previous.filter((d) => d.key !== key), { key, choice, reason }]);
    if (receivingChoice) setReceiving(null);
  };
  const receivingRequest = () => ({
    run_id: data.current_run?.id,
    resolved_set_id: data.current_resolved?.id,
    resolved_set_hash: data.current_resolved?.content_hash,
    estimate_id: data.estimate?.id,
    estimate_version_id: data.estimate?.version_id,
    expected_configuration_version: data.configuration.version,
    expected_workspace_version: data.source.workspace_version,
    expected_estimate_version: data.estimate?.version,
    discovery_revision_id: data.current_run?.snapshot.binding.revision_id,
    source_context_hash: data.current_run?.snapshot.binding.context_hash,
    receiving_policy_id: data.receiving_policy.id,
    receiving_policy_hash: data.receiving_policy.hash,
    decisions: receivingDecisions,
    price_and_unit_proposals: nativePrices,
  });
  async function reviewReceiving() {
    setReceivingError(null);
    try {
      setReceiving(await api<Receiving>(`${path}/receiving-preview`, receivingRequest()));
    } catch (e) {
      setReceivingError(e);
      setReceiving(null);
    }
  }
  const apply = () => command.send(`${path}/apply`, "ApplySpecialistConfiguration", { ...receivingRequest(), reason, proposal_signature: receiving?.proposal_signature });
  const spanWidth = num(proposal.inputs.span.raw),
    screenHeight = num(proposal.inputs.height.raw),
    dErrors = useMemo(
      () => drawingErrors(drawing, Number.isFinite(spanWidth) && spanWidth > 0 ? spanWidth : null, Number.isFinite(screenHeight) ? screenHeight : null),
      [drawing, spanWidth, screenHeight],
    ),
    geometry = useMemo(() => sheetGeometry(calculation, proposal), [calculation, proposal]),
    gates = useMemo(() => readinessGates({ calculation, proposal, drawing, runSequence: data.current_run?.sequence ?? null }), [calculation, proposal, drawing, data.current_run?.sequence]),
    bench: Bench = {
      id,
      path,
      data,
      proposal,
      change,
      canEdit: initial.can_edit,
      frozen,
      dirty,
      fresh,
      calculating: initial.can_edit && !fresh,
      calculation,
      preview: fresh ? preview : null,
      decisions,
      decide,
      drawing,
      setDrawing,
      drawingErrors: dErrors,
      errors: inputErrors(calculation),
      untested: untestedOptions(calculation, proposal),
      geometry,
      signature: configurationSignature(calculation),
      gates,
      reason,
      setReason,
      command,
      saveDraft,
      saveReview,
      working,
      openWorking: setWorking,
      openManual: () => setManualOpen(true),
      nativePrices,
      setNativePrices: (v) => {
        setNativePrices(v);
        setReceiving(null);
      },
      receiving,
      receivingError,
      receivingDecisions,
      reviewReceiving,
      cancelReceiving: () => {
        setReceiving(null);
        setReceivingDecisions([]);
      },
      apply,
      phone,
    };
  if (denied(command.error) || denied(error) || denied(receivingError)) return <ErrorNotice error={command.error ?? error ?? receivingError} />;
  return (
    <div className="es08-layout">
      <div className="es08-main">
        <div className="es08-scroll">
          <WorkbenchHeader bench={bench} view={view} onMethod={() => setMethodOpen(true)} />
          <div className="es08-notices">
            {initial.configuration.version !== data.configuration.version && dirty && (
              <Notice tone="warn" title="The server version changed" role="alert">
                Your proposal is retained in this browser; compare the latest version before saving.
              </Notice>
            )}
            {!initial.can_edit && (
              <Notice tone="info" title="Read-only">
                You can inspect, compare and export. Editing and saving are disabled: {initial.edit_blocker}
              </Notice>
            )}
            <ErrorNotice error={error} />
            <ErrorNotice error={command.error} />
            {command.pending && (
              <Notice
                tone="warn"
                title={command.status}
                action={
                  <>
                    <button type="button" className="ppo-button es08-button--sm" disabled={command.busy} onClick={() => command.recover()}>
                      Check original receipt
                    </button>
                    {command.canRetry && (
                      <button type="button" className="ppo-button es08-button--sm" disabled={command.busy} onClick={() => command.recover(true)}>
                        Retry original unchanged
                      </button>
                    )}
                    <button type="button" className="ppo-button es08-button--sm" disabled={command.busy} onClick={() => command.resolve()}>
                      Resolve original outcome
                    </button>
                  </>
                }
              >
                A missing receipt is not proof of failure. Resolution accepts the original or permanently closes it before a new intent.
              </Notice>
            )}
          </div>
          {view === "configure" && <ConfigureView bench={bench} section={section} setSection={setSection} />}
          {view === "drawings" && <DrawingsView bench={bench} />}
          {view === "parts" && <PartsView bench={bench} />}
          {view === "pricing" && <PricingView bench={bench} />}
          {view === "compare" && <CompareView bench={bench} />}
          {view === "definition" && <DefinitionView bench={bench} />}
          {view === "history" && <HistoryView bench={bench} />}
        </div>
        <footer className="es08-actions">
          <label className="es08-stack-label es08-reason">
            Reason for next saved change
            <input maxLength={1000} value={reason} disabled={frozen} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button type="button" className="ppo-button" disabled={command.busy} onClick={() => {
            setPreviewKey("");
            void api<Preview>(`${path}/preview`, { expected_version: data.configuration.version, proposal, decisions }).then((p) => {
              setPreview(p);
              setPreviewKey(proposalKey);
            }, setError);
          }}>
            Review calculation
          </button>
          <button type="button" className="ppo-button ppo-button--primary" disabled={frozen || !reason.trim()} onClick={() => void saveDraft()}>
            Save draft
          </button>
          <span role="status" className="es08-sub es08-action-status">
            {command.status}
          </span>
        </footer>
      </div>
      {manualOpen && (
        <ManualReview bench={bench} close={() => setManualOpen(false)} />
      )}
      {methodOpen && <MethodDialog bench={bench} close={() => setMethodOpen(false)} />}
      {navigation.leave && (
        <Dialog title="Unsaved configuration changes" close={navigation.stay}>
          <p>{command.pending ? "Resolve the original operation before leaving this proposal." : "Save this draft or discard only the local changes before leaving."}</p>
          <div className="es08-record-actions">
            <button type="button" className="ppo-button" onClick={navigation.stay}>
              Stay
            </button>
            <button
              type="button"
              className="ppo-button ppo-button--primary"
              disabled={command.pending || command.busy}
              onClick={async () => {
                if (await saveDraft()) navigation.proceed();
              }}
            >
              Save draft and leave
            </button>
            <button type="button" className="ppo-button" disabled={command.pending || command.busy} onClick={navigation.proceed}>
              Discard local changes
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
function ManualReview({ bench, close }: { bench: Bench; close: () => void }) {
  const { proposal, change, frozen, fresh, preview, reason, setReason } = bench,
    basis = preview?.calculation.manual_basis_hash ?? null,
    total = definition.manual_rows.length;
  return (
    <Dialog title={`Review ${total} manual quantities`} close={close} wide className="es08-dialog--side">
      <p className="es08-sub">Review every value, including unresolved and zero. This records review against the current noncommercial basis and retains all findings.</p>
      {!fresh && <p className="es08-tone-warn">The preview is being refreshed; recording waits for the current basis.</p>}
      <ul className="es08-manual-list">
        {definition.manual_rows.map((row) => {
          const key = `CE-LINE-${row}`,
            m = proposal.manual_quantities[key],
            recorded = basis !== null && m.basis_hash === basis;
          return (
            <li key={key} className="es08-manual">
              <div className="es08-manual-head">
                <span>
                  <span className="es08-mono es08-strong">{key}</span> · {definition.lines.find((l) => l.row === row)?.label}
                </span>
                <Pill tone={recorded ? "ok" : "warn"}>{recorded ? "Review recorded" : "Needs review"}</Pill>
              </div>
              <div className="es08-edit-grid">
                <label>
                  Quantity (blank means unresolved)
                  <input
                    inputMode="decimal"
                    disabled={frozen}
                    value={m.value ?? ""}
                    onChange={(e) =>
                      change((p) => {
                        p.manual_quantities[key].value = e.target.value === "" ? null : e.target.value;
                        p.manual_quantities[key].basis_hash = null;
                      })
                    }
                  />
                </label>
                <label>
                  Review reason
                  <input
                    disabled={frozen}
                    value={m.reason}
                    onChange={(e) =>
                      change((p) => {
                        p.manual_quantities[key].reason = e.target.value;
                        p.manual_quantities[key].basis_hash = null;
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="ppo-button es08-button--sm"
                  disabled={frozen || !fresh || !basis || !m.reason.trim() || recorded}
                  onClick={() =>
                    change((p) => {
                      p.manual_quantities[key].basis_hash = basis;
                    })
                  }
                >
                  {recorded ? "Review recorded" : "Record this review"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <label className="es08-stack-label">
        Reason for explicit review of all displayed values
        <input value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="es08-record-actions">
        <button
          type="button"
          className="ppo-button ppo-button--primary"
          disabled={frozen || !fresh || !basis || !reason.trim()}
          onClick={() => {
            change((p) => {
              for (const m of Object.values(p.manual_quantities)) {
                m.basis_hash = basis;
                m.reason = reason;
              }
            });
            close();
          }}
        >
          Record review of all {total} displayed values
        </button>
      </div>
    </Dialog>
  );
}
function MethodDialog({ bench, close }: { bench: Bench; close: () => void }) {
  const { data, geometry: g } = bench;
  return (
    <Dialog title="Method & limitations" close={close} wide>
      <dl className="es08-rows es08-rows--tight">
        <div>
          <dt>Quantity definition</dt>
          <dd className="es08-mono">{definition.quantity_version}</dd>
        </div>
        <div>
          <dt>Native engine</dt>
          <dd className="es08-mono">{definition.engine_version}</dd>
        </div>
        <div>
          <dt>Part identity</dt>
          <dd className="es08-mono">{definition.part_version}</dd>
        </div>
        <div>
          <dt>Configuration signature</dt>
          <dd className="es08-mono">CFG {bench.signature}</dd>
        </div>
        <div>
          <dt>Saved run</dt>
          <dd>{data.current_run ? `${runLabel(data.current_run.sequence)} · ${readable(data.current_run.created_at)}` : "None yet"}</dd>
        </div>
        {g && (
          <div>
            <dt>Current geometry</dt>
            <dd>
              {fmt(g.width, 1)} × {fmt(g.length, 1)} m · {g.count} cuts of {fmt(g.cut, 1)} × {g.clothWidth} m
            </dd>
          </div>
        )}
      </dl>
      <h3>Method</h3>
      <ul className="es08-list">
        <li>Quantities follow the recovered rules of {definition.quantity_version}; the native engine reproduces them with exact rational arithmetic. No rule is added or changed by this workbench.</li>
        <li>Every drawing reads the same calculation: the plan, cross section, longitudinal section, bay section and screen cut cannot disagree with the quantities.</li>
        <li>Roof profile, pitch, gutter height, roof width, vent and roll width are drawing-only inputs remembered in this browser. They have no quantity consumer, so a drawing error withholds the drawings and never the quantities.</li>
        <li>The price bridge applies the recovered rounding policy (DEC-R1). The receiving estimate applies its own contract after handover; any difference is a named reconciliation line there.</li>
        <li>Roll fit is a check, not a procurement rule (DEC-R2): Not checked shows a notice; Too narrow blocks sending to the estimate, never saving a run.</li>
      </ul>
      <h3>Limitations</h3>
      <ul className="es08-list">
        <li>Estimating study only. Trusses, drive layout and screen parking are schematic; hems, seams, attachments, loads and connections are not drawn. Sheets are marked not for fabrication.</li>
        <li>Untested options are calculated and shown, but no historical quote exercises them; the Release gate counts them.</li>
        <li>Torque bands are recovered comparison bands, not motor selection or approved capacity.</li>
        <li>PPO part identities are provisional; MYOB mapping, catalogue prices and supplier evidence remain open.</li>
        <li>All names, rates, runs and figures in this prototype are synthetic.</li>
      </ul>
    </Dialog>
  );
}
