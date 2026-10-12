"use client";
import Link from "next/link";
import { RecordIdentity } from "../shell/record-identity";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
import { useDiscoveryNavigation } from "./discovery-navigation";
import { RegisterTable } from "./ui/register-table";
import { FertigationArtifacts } from "./fertigation-artifacts";
import { FertigationImport } from "./fertigation-import";
import {
  CalculationDelta,
  FertigationComparison,
  scopeDifferences,
} from "./fertigation-comparison";
import { FertigationHistoryActions } from "./fertigation-history-actions";
import { ReadinessSummary } from "./fertigation-cockpit";
import { TraceDrawer } from "./fertigation-trace";
import { ResolveDrawer } from "./fertigation-resolve";
import {
  resolvables,
  type Resolvable,
} from "../estimating/fertigation/resolutions";
import type { TraceKey } from "../estimating/fertigation/trace";
import { declarations } from "../estimating/fertigation/declarations";
import {
  withLabels,
  countsByView,
  severityCounts,
} from "../estimating/fertigation/guidance";
import {
  FertigationFrame,
  FertigationSectionPicker,
  fertigationViews,
  type FertigationView,
} from "./fertigation-frame";
import { FertigationHeader, PhoneBar, type StatusTone } from "./fertigation-header";
import {
  FertigationDialog,
  FertigationEditor,
  human,
  newRecord,
  ObjectFields,
  registerNames,
  type Register,
} from "./fertigation-fields";
import { blankScope } from "../estimating/fertigation/definition";
import type { Calculation, Scope } from "../estimating/fertigation/types";
import type { SourceBinding } from "../estimating/fertigation/storage-types";
import {
  Button,
  Chip,
  Empty,
  Find,
  Hint,
  Icon,
  Notice,
  PageFoot,
  Panel,
  when,
} from "./fertigation-ui";
import { OverviewView } from "./fertigation-views/overview";
import { GrowingView } from "./fertigation-views/growing";
import { WaterView } from "./fertigation-views/water";
import { RecipesView } from "./fertigation-views/recipes";
import { ControlsView } from "./fertigation-views/controls";
import { OperatingView } from "./fertigation-views/operating";
import { ConfiguratorView } from "./fertigation-views/configurator";
import { EvidenceView } from "./fertigation-views/evidence";
import { ReviewView } from "./fertigation-views/review";
import type { Detail, EditorRegister, ViewContext } from "./fertigation-views/context";

const base = "estimating/fertigation";
type SourceOption = {
  estimating_workspace_id: string;
  expected_workspace_version: number;
  option_id: string;
  option_label: string;
  revision_id: string;
  revision: number;
  scope_readiness: string;
  site: string;
  facility_ids: string[];
  configuration: {
    systems: {
      id: string;
      name: string;
      family: string;
      coverage: { area_ids: string[] };
    }[];
  } | null;
  proposal: Scope;
};
type Summary = {
  id: string;
  name: string;
  display_number: string;
  version: number;
  current_revision_id: string;
  updated_at: string;
  state: string;
  owner_id: string;
  option_id: string;
  estimating_workspace_id: string;
};

/* ---------- Scope register ---------- */

export function FertigationRegister() {
  const params = useSearchParams(),
    [search, setSearch] = useState(""),
    [before, setBefore] = useState<string | null>(null);
  const context = new URLSearchParams();
  for (const key of ["estimating_workspace_id", "option_id"])
    if (params.get(key)) context.set(key, params.get(key)!);
  const resource = useCrmResource<{
    items: Summary[];
    next_cursor: string | null;
    can_create?: boolean;
  }>(
    `${base}?${context}&search=${encodeURIComponent(search)}${before ? `&before=${encodeURIComponent(before)}` : ""}`,
    true,
  );
  return (
    <FertigationFrame>
      <div className="fn-scroll">
        <div className="fn-page fn-page-register">
          <header className="fn-page-head">
            <div className="fn-page-title">
              <p className="fn-eyebrow">Estimating · ES-02</p>
              <h1>Priva Fertigation Configurator</h1>
              <p className="fn-lede">Native scopes linked to exact saved Discovery alternatives.</p>
            </div>
            <div className="fn-page-actions">
              <Find value={search} onChange={(v) => { setSearch(v); setBefore(null); }} label="Search scopes" placeholder="Find a scope" />
              {resource.data?.can_create && (
                <Link className="fn-button fn-primary" href={`/estimating/fertigation/new?${context}`}>
                  <Icon name="plus" className="fn-button-icon" />
                  <span>New fertigation scope</span>
                </Link>
              )}
            </div>
          </header>
          <ErrorNotice error={resource.error} />
          {resource.loading && !resource.data && (
            <p role="status" className="fn-loading">Loading permitted scopes…</p>
          )}
          {resource.data && (
            <Panel title="Saved scopes" count={resource.data.items.length} flush className="fn-register-panel"
              subtitle="Each scope is bound to one saved Discovery alternative; manufacturer confirmation remains separate"
              foot={
                <div className="fn-paging">
                  <span>{resource.data.items.length} shown</span>
                  <span className="fn-paging-actions">
                    {before && <Button variant="quiet" size="sm" onClick={() => setBefore(null)}>First page</Button>}
                    {resource.data.next_cursor && (
                      <Button variant="quiet" size="sm" onClick={() => setBefore(resource.data!.next_cursor)}>Next page</Button>
                    )}
                  </span>
                </div>
              }
            >
              {resource.data.items.length ? (
                <RegisterTable variant="panel" stale={resource.loading} caption="Saved fertigation scopes; the scope name opens its workspace.">
                  <thead>
                    <tr>
                      <th scope="col"><span className="ppo-register-label">Scope</span></th>
                      <th scope="col"><span className="ppo-register-label">Reference</span></th>
                      <th scope="col" className="fn-col-num"><span className="ppo-register-label">Revision</span></th>
                      <th scope="col"><span className="ppo-register-label">State</span></th>
                      <th scope="col"><span className="ppo-register-label">Updated</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {resource.data.items.map((row) => (
                      <tr key={row.id}>
                        <td className="ppo-register-wrap fn-col-label">
                          <Link href={`/estimating/fertigation/${row.id}`} className="fn-row-title">{row.name}</Link>
                        </td>
                        <td><code className="fn-ref">{row.display_number}</code></td>
                        <td className="fn-col-num">{row.version}</td>
                        <td>
                          <Chip tone={row.state === "Archived" ? "neutral" : "existing"}>{row.state}</Chip>
                        </td>
                        <td>{when(row.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </RegisterTable>
              ) : (
                <Empty
                  icon={search ? "search" : "leaf"}
                  title={search ? "No matching scopes" : "No saved fertigation scope"}
                  action={
                    search ? (
                      <Button variant="secondary" size="sm" onClick={() => setSearch("")}>Clear search</Button>
                    ) : resource.data.can_create ? (
                      <Link className="fn-button fn-primary" href={`/estimating/fertigation/new?${context}`}>
                        <span>Create native fertigation scope from saved Discovery</span>
                      </Link>
                    ) : undefined
                  }
                >
                  {search
                    ? "Try a different reference or clear the search."
                    : "Create a scope from a saved Discovery alternative. Unknown production context and technical inputs may remain incomplete."}
                </Empty>
              )}
            </Panel>
          )}
        </div>
      </div>
    </FertigationFrame>
  );
}

/* ---------- Create ---------- */

export function FertigationCreate() {
  const params = useSearchParams(),
    router = useRouter(),
    workspace = params.get("estimating_workspace_id");
  const options = useCrmResource<{ sources: SourceOption[] }>(
    `${base}/options${workspace ? `?estimating_workspace_id=${encodeURIComponent(workspace)}` : ""}`,
    true,
  );
  const [selected, setSelected] = useState(params.get("option_id") ?? ""),
    [name, setName] = useState("Untitled fertigation scope"),
    [context, setContext] = useState(blankScope().production_context),
    [systemId, setSystemId] = useState(""),
    [savedId, setSavedId] = useState<string | null>(null),
    [importPending, setImportPending] = useState(false);
  const command = useCrmCommand(
    (receipt) => setSavedId(receipt.record_id),
    "Not yet saved",
    undefined,
    false,
  );
  const source =
    options.data?.sources.find((x) => x.option_id === selected) ??
    (options.data?.sources.length === 1 ? options.data.sources[0] : undefined);
  const pending = command.busy || command.uncertain || importPending,
    navigation = useDiscoveryNavigation(command.hasUnsavedChanges, pending);
  useEffect(() => {
    if (savedId && !command.hasUnsavedChanges && !pending)
      router.push(`/estimating/fertigation/${savedId}`);
  }, [savedId, command.hasUnsavedChanges, pending, router]);
  if (denied(options.error) || denied(command.error))
    return <ErrorNotice error={options.error ?? command.error} />;
  return (
    <FertigationFrame message={command.status}>
      <div className="fn-scroll">
        <div className="fn-page fn-page-create">
          <header className="fn-page-head">
            <div className="fn-page-title">
              <p className="fn-eyebrow">Priva Fertigation Configurator · create</p>
              <h1>Create native fertigation scope</h1>
              <p className="fn-lede">
                Capture a proposal against a saved Discovery revision. Existing Site, Facility and installed Asset
                records retain their identity.
              </p>
            </div>
          </header>
          <ErrorNotice error={options.error ?? command.error} />
          {options.loading && <p role="status" className="fn-loading">Loading permitted Discovery sources…</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!source || pending) return;
              const proposal = { ...source.proposal, name, production_context: context },
                system = source.configuration?.systems.find((x) => x.id === systemId);
              void command.send(base, {
                id: crypto.randomUUID(),
                name,
                reason: "Create native fertigation scope from saved Discovery",
                estimating_workspace_id: source.estimating_workspace_id,
                option_id: source.option_id,
                revision_id: source.revision_id,
                expected_workspace_version: source.expected_workspace_version,
                coverage: {
                  system_id: systemId || null,
                  area_ids: system?.coverage.area_ids ?? [],
                  facility_ids: source.facility_ids,
                },
                proposal,
              });
            }}
          >
            <fieldset disabled={pending}>
              <Panel title="Scope and Discovery source" subtitle="The saved alternative supplies the customer, site and facilities; the scope adds its own technical records.">
                <div className="fn-fields">
                  <label className="fn-field">
                    <span>Scope name</span>
                    <input value={name} maxLength={200} required onChange={(e) => { setName(e.target.value); command.dirty(); }} />
                  </label>
                  <label className="fn-field">
                    <span>Saved Discovery alternative</span>
                    <select required value={source?.option_id ?? ""} onChange={(e) => { setSelected(e.target.value); setSystemId(""); command.dirty(); }}>
                      <option value="">Select a saved alternative</option>
                      {options.data?.sources.map((x) => (
                        <option key={x.option_id} value={x.option_id}>
                          {x.option_label} · Revision {x.revision} · {x.scope_readiness}
                        </option>
                      ))}
                    </select>
                  </label>
                  {source && (
                    <label className="fn-field">
                      <span>Saved Fertigation system (optional)</span>
                      <select value={systemId} onChange={(e) => { setSystemId(e.target.value); command.dirty(); }}>
                        <option value="">Scope-level association; system not assigned</option>
                        {source.configuration?.systems.filter((x) => x.family === "Fertigation").map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                {source && (
                  <Notice tone="info">
                    Origin: saved Discovery revision {source.revision}. {source.site || "Site context retained in the source binding"}. Optional missing technical data remains incomplete.
                  </Notice>
                )}
                {!options.loading && options.data?.sources.length === 0 && (
                  <Notice tone="warning">No eligible saved Discovery sources. Open Discovery and save an active alternative first.</Notice>
                )}
              </Panel>
              <Panel title="Production context" subtitle="Business context, growing system and physical process are independent. Unknown is a valid starting point.">
                <ObjectFields
                  value={context as unknown as Record<string, unknown>}
                  template={context as unknown as Record<string, unknown>}
                  scope={blankScope()}
                  update={(value) => { setContext(value as unknown as Scope["production_context"]); command.dirty(); }}
                  prefix="create-context"
                />
              </Panel>
              <div className="fn-actions fn-create-actions">
                <Button variant="primary" icon="save" disabled={!source || pending} type="submit">
                  {command.busy ? "Creating…" : "Create saved scope"}
                </Button>
                <Link href="/estimating/discovery" className="fn-button fn-button-quiet"><span>Return to Discovery</span></Link>
              </div>
            </fieldset>
          </form>
          {source && (
            <FertigationImport
              source={{
                name,
                estimating_workspace_id: source.estimating_workspace_id,
                option_id: source.option_id,
                revision_id: source.revision_id,
                expected_workspace_version: source.expected_workspace_version,
                coverage: {
                  system_id: systemId || null,
                  area_ids: source.configuration?.systems.find((s) => s.id === systemId)?.coverage.area_ids ?? [],
                  facility_ids: source.facility_ids,
                },
              }}
              disabled={command.busy || command.uncertain}
              onPendingChange={setImportPending}
              onImported={(id) => { command.discard(); setSavedId(id); }}
            />
          )}
          {command.uncertain && (
            <Button variant="secondary" onClick={() => void command.reconcile()}>Confirm original create</Button>
          )}
          {navigation.leave && (
            <FertigationDialog title="Leave unsaved scope?" close={navigation.stay} decision>
              <div className="fn-dialog-body">
                <p>Keep this proposal here, or explicitly discard it.</p>
                <div className="fn-actions">
                  <Button variant="primary" onClick={navigation.stay}>Stay</Button>
                  <Button variant="secondary" disabled={pending} onClick={navigation.proceed}>Discard and leave</Button>
                </div>
              </div>
            </FertigationDialog>
          )}
        </div>
      </div>
    </FertigationFrame>
  );
}

/* ---------- Workspace ---------- */

export function FertigationWorkspace({ id }: { id: string }) {
  const params = useSearchParams(),
    revision = params.get("revision_id"),
    resource = useCrmResource<Detail>(
      `${base}/${id}${revision ? `?revision_id=${encodeURIComponent(revision)}` : ""}`,
      true,
    );
  return (
    <>
      {resource.loading && !resource.data && (
        <FertigationFrame>
          <div className="fn-scroll">
            <div className="fn-page">
              <div className="fn-skeleton" aria-hidden="true">
                <span /><span /><span /><span />
              </div>
              <p role="status" className="fn-loading">Loading exact permitted scope…</p>
            </div>
          </div>
        </FertigationFrame>
      )}
      <ErrorNotice error={resource.error} />
      {resource.data && (
        <Workspace
          key={`${id}:${revision ?? "current"}`}
          data={resource.data}
          reload={resource.reload}
        />
      )}
    </>
  );
}

function Workspace({ data, reload }: { data: Detail; reload: () => void }) {
  const params = useSearchParams(),
    scopeId = data.scope.id;
  const initialView =
    fertigationViews.find(([id]) => id === params.get("view"))?.[0] ?? "overview";
  const [view, setView] = useState<FertigationView>(initialView),
    [section, setSection] = useState<Register>("valves"),
    [draft, setDraft] = useState<Scope | null>(null),
    [baseRevision, setBaseRevision] = useState<Detail["revision"] | null>(null),
    [baseVersion, setBaseVersion] = useState<number | null>(null),
    [reason, setReason] = useState(""),
    [editor, setEditor] = useState<{ register: EditorRegister; id?: string; record: object } | null>(null),
    [editorOpen, setEditorOpen] = useState(false),
    [error, setError] = useState<unknown>(null),
    [preview, setPreview] = useState<{ proposal: Scope; calculation: Calculation } | null>(null),
    [previewBusy, setPreviewBusy] = useState(false),
    [acceptedVersion, setAcceptedVersion] = useState(0),
    [artifactPending, setArtifactPending] = useState(false),
    [inspectHistory, setInspectHistory] = useState<boolean | null>(null),
    [historyPending, setHistoryPending] = useState(false),
    [historyDirty, setHistoryDirty] = useState(false),
    [historyEpoch, setHistoryEpoch] = useState(0),
    [trace, setTrace] = useState<TraceKey | null>(null),
    [compareDraft, setCompareDraft] = useState(false),
    [resolving, setResolving] = useState<Resolvable[] | null>(null),
    [declaring, setDeclaring] = useState<string | null>(null);
  const [artifactsVisited, setArtifactsVisited] = useState(
    initialView === "evidence" || initialView === "review",
  );
  const [sourceReview, setSourceReview] = useState<{
    expected_version: number;
    expected_revision_id: string;
    before: SourceBinding;
    after: SourceBinding;
    proposal_signature: string;
  } | null>(null);
  const [removal, setRemoval] = useState<{ register: Register; id: string; label: string } | null>(null);
  const continuation = useRef<(() => void) | null>(null),
    generation = useRef(0),
    previewRun = useRef(0);
  const command = useCrmCommand(
    (receipt) => {
      setAcceptedVersion(receipt.record_version);
      setDraft(null);
      setBaseRevision(null);
      setBaseVersion(null);
      setReason("");
      setEditor(null);
      setEditorOpen(false);
      reload();
      const next = continuation.current;
      continuation.current = null;
      next?.();
    },
    "Saved revision",
    undefined,
    false,
  );
  const pending = command.busy || command.uncertain || artifactPending || historyPending,
    dirty = command.hasUnsavedChanges,
    navigation = useDiscoveryNavigation(
      dirty || historyDirty || (!!editor && data.can_edit && !params.has("revision_id")),
      pending,
    );
  const proposal = draft ?? data.revision.proposal,
    historical = params.has("revision_id"),
    canEdit =
      data.can_edit && !historical && !pending && !historyDirty && acceptedVersion <= data.scope.version;
  const activeCalculation =
    preview?.proposal === proposal ? preview.calculation : !draft ? data.calculation : null;
  const sourceHref = `/estimating/discovery/${data.scope.estimating_workspace_id}?option=${data.scope.option_id}`;
  const reportHref = `/api/v1/${base}/${scopeId}/report?revision_id=${data.revision.id}&audience=customer`;
  const conflict = baseVersion !== null && baseVersion !== data.scope.version;
  function update(next: Scope) {
    if (!canEdit) return;
    if (!draft) {
      setBaseRevision(data.revision);
      setBaseVersion(data.scope.version);
    }
    setDraft(next);
    command.dirty();
    setPreview(null);
    setError(null);
    generation.current++;
  }
  function changeView(next: FertigationView) {
    if (pending) return;
    if (next === "evidence" || next === "review") setArtifactsVisited(true);
    setView(next);
    const q = new URLSearchParams(location.search);
    q.set("view", next);
    if (!dirty && !editorOpen) history.replaceState(null, "", `${location.pathname}?${q}`);
    document.querySelector<HTMLElement>("#ppo-fertigation .fn-scroll")?.scrollTo({ top: 0 });
  }
  function edit(register: EditorRegister, record?: object) {
    if (
      editor?.register === register &&
      (record ? editor.id === (record as { id?: string }).id : true)
    ) {
      setEditorOpen(true);
      return;
    }
    if (editor && canEdit) {
      setError({
        message:
          "Your previous editor entries are kept in memory. Resume or discard that editor before opening another record.",
      });
      return;
    }
    const item = record ?? newRecord(register as Register);
    setEditor({ register, id: (item as { id?: string }).id, record: item });
    setEditorOpen(true);
  }
  async function calculate() {
    const currentGeneration = generation.current,
      run = ++previewRun.current;
    setPreviewBusy(true);
    setError(null);
    try {
      const response = await api<{ calculation: Calculation }>(`${base}/${scopeId}/preview`, {
        expected_version: baseVersion ?? data.scope.version,
        proposal,
      });
      if (generation.current === currentGeneration)
        setPreview({ proposal, calculation: response.calculation });
    } catch (e) {
      if (generation.current === currentGeneration) setError(e);
    } finally {
      if (previewRun.current === run) setPreviewBusy(false);
    }
  }
  function save(after?: () => void) {
    if (!canEdit || !dirty || conflict || editor || historyDirty) return;
    continuation.current = after ?? null;
    void command.send(`${base}/${scopeId}/revisions`, {
      reason: reason.trim() || "Save reviewed scope changes",
      expected_version: baseVersion ?? data.scope.version,
      expected_revision_id: (baseRevision ?? data.revision).id,
      source_context_hash: (baseRevision ?? data.revision).binding.upstream_context_hash,
      proposal,
    });
  }
  const canSave = canEdit && dirty && !conflict && !editor && !historyDirty;
  const [status, statusTone]: [string, StatusTone] = pending
    ? [
        historyPending
          ? "History action pending"
          : artifactPending
            ? "Evidence or review action pending"
            : command.status,
        "pending",
      ]
    : conflict
      ? ["Conflict — proposal retained", "conflict"]
      : editor && canEdit
        ? ["Editor entries not yet applied", "dirty"]
        : dirty
          ? ["Unsaved changes", "dirty"]
          : acceptedVersion > data.scope.version
            ? ["Saved — loading accepted revision", "saved"]
            : data.scope.state === "Archived"
              ? [`Archived · saved revision ${data.revision.version}`, "readonly"]
              : historical
                ? ["Historical revision · read-only", "readonly"]
                : [`Saved revision ${data.revision.version}`, "saved"];
  if (denied(command.error) || denied(error)) return <ErrorNotice error={command.error ?? error} />;
  // Guidance always reads one consistent pair: the calculation on screen and
  // the proposal it was calculated from. A changed, uncalculated draft falls
  // back to the saved revision and says so.
  const guidanceScope = activeCalculation ? proposal : data.revision.proposal,
    guidanceCalculation = activeCalculation ?? data.calculation,
    guidanceBasis = !activeCalculation
      ? `saved revision ${data.revision.version}; draft not recalculated`
      : activeCalculation === data.calculation
        ? `saved revision ${data.revision.version}`
        : "calculated draft",
    viewCounts = countsByView(guidanceScope, guidanceCalculation.findings),
    totalCounts = severityCounts(guidanceCalculation.findings);
  // Resolutions are offered only when the calculation on screen belongs to
  // the current proposal, so an applied edit never discards draft changes.
  const resolveList = activeCalculation ? resolvables(proposal, activeCalculation) : [];
  const declarationList = declarations(guidanceScope, guidanceCalculation),
    declarable = (code: string) =>
      activeCalculation
        ? declarationList.find((d) => d.codes.includes(code) && d.options.some((o) => o.transform))
        : undefined;
  const resolveFor = (match: (key: string) => boolean) => {
    const items = resolveList.filter((r) => match(r.key));
    if (items.length) setResolving(items);
  };
  async function previewProposal(next: Scope) {
    const response = await api<{ calculation: Calculation }>(`${base}/${scopeId}/preview`, {
      expected_version: baseVersion ?? data.scope.version,
      proposal: next,
    });
    return response.calculation;
  }
  function openRecord(recordId: string) {
    for (const register of Object.keys(registerNames) as Register[]) {
      const record = proposal[register].find((r) => r.id === recordId);
      if (record) {
        edit(register, record);
        return;
      }
    }
  }
  function remove(register: Register, recordId: string) {
    const text = JSON.stringify({
      ...proposal,
      [register]: proposal[register].filter((row) => row.id !== recordId),
    });
    if (text.includes(recordId)) {
      setError({
        message:
          "This record is still referenced. Edit its group, allocation, control or source relationships explicitly before removal.",
      });
      return;
    }
    setRemoval({
      register,
      id: recordId,
      label: proposal[register].find((row) => row.id === recordId)!.label,
    });
  }
  const ctx: ViewContext = {
    data,
    scopeId,
    proposal,
    draft,
    calculation: activeCalculation,
    guidanceScope,
    guidanceCalculation,
    guidanceBasis,
    canEdit,
    historical,
    dirty,
    pending,
    previewBusy,
    section,
    setSection,
    calculate: () => void calculate(),
    update,
    edit,
    remove,
    changeView,
    trace: setTrace,
    resolveList,
    resolveFor,
    declarationList,
    declarable,
    declare: setDeclaring,
    openRecord,
    openHistory: () => setInspectHistory(true),
    reportHref,
  };
  const captured = data.revision.binding.captured_discovery;
  const site = captured?.site?.display_name ?? null,
    customer = captured?.organisation?.display_name ?? null;
  const views: Record<FertigationView, React.ReactNode> = {
    overview: <OverviewView ctx={ctx} />,
    growing: <GrowingView ctx={ctx} />,
    water: <WaterView ctx={ctx} />,
    recipes: <RecipesView ctx={ctx} />,
    controls: <ControlsView ctx={ctx} />,
    operating: <OperatingView ctx={ctx} />,
    configurator: <ConfiguratorView ctx={ctx} />,
    evidence: <EvidenceView ctx={ctx} />,
    review: <ReviewView ctx={ctx} />,
  };
  return (
    <FertigationFrame
      view={view}
      onView={changeView}
      sourceHref={sourceHref}
      message={status}
      counts={{ ...viewCounts, review: totalCounts }}
      summary={<ReadinessSummary compact counts={totalCounts} basis={guidanceBasis} />}
      edition={guidanceCalculation.edition}
    >
      <RecordIdentity reference={data.scope.display_number} title={data.scope.name} />
      <FertigationHeader
        name={proposal.name}
        reference={data.scope.display_number}
        status={status}
        statusTone={statusTone}
        savedAt={statusTone === "saved" || statusTone === "readonly" ? when(data.revision.created_at) : undefined}
        historical={historical}
        dirty={dirty}
        canSave={canSave}
        onHistory={() => setInspectHistory(true)}
        onSave={() => save()}
        onCompare={() => setCompareDraft(true)}
        onValves={() => {
          changeView("growing");
          setSection("valves");
        }}
        reportHref={reportHref}
        exportHref={`/api/v1/estimating/fertigation/${scopeId}/export?revision_id=${data.revision.id}&format=json`}
        valveExportHref={`/api/v1/estimating/fertigation/${scopeId}/export?revision_id=${data.revision.id}&format=valves`}
        compact={view !== "overview"}
        site={site}
        customer={customer}
        binding={`Bound to Discovery alternative ${data.source.option_label} · revision ${data.source.revision} · ${data.source.changed ? "source changed" : "source unchanged"}`}
        sourceChanged={!!data.source.changed}
        state={data.scope.state}
        scenarios={proposal.scenarios.map((s) => ({ id: s.id, label: s.label }))}
        scenarioId={proposal.selected_scenario_id}
        onScenario={(id) => update({ ...proposal, selected_scenario_id: id })}
        scenarioDisabled={!canEdit}
      />
      <PhoneBar reportHref={reportHref} canSave={canSave} historical={historical} onSave={() => save()} />
      <div className="fn-scroll">
        <div className="fn-page" data-view={view}>
          <FertigationSectionPicker view={view} onView={changeView} counts={{ ...viewCounts, review: totalCounts }} />
          <div className="fn-messages">
            <ErrorNotice error={command.error ?? error} />
            {historyDirty && !inspectHistory && (
              <Notice tone="warning">
                History action entries are kept in memory. Complete or discard that action before editing this scope.{" "}
                <button type="button" className="fn-link" onClick={() => setInspectHistory(true)}>Resume history action</button>
              </Notice>
            )}
            {editor && !editorOpen && canEdit && (
              <Notice tone="warning">
                Editor entries are kept in memory. Apply them to the draft before saving.{" "}
                <button type="button" className="fn-link" onClick={() => setEditorOpen(true)}>Resume kept editor</button>{" "}
                <button type="button" className="fn-link" onClick={() => { setEditor(null); setError(null); }}>Discard editor entries</button>
              </Notice>
            )}
            {command.uncertain && (
              <Notice tone="warning">
                The outcome is unknown. Editing is paused while the original operation is confirmed.{" "}
                <button type="button" className="fn-link" onClick={() => void command.reconcile()}>Confirm original save</button>
              </Notice>
            )}
            {conflict && (
              <Notice tone="danger">
                Another revision was saved. Your proposal remains in memory. Open history to compare the exact saved revisions before starting a successor.{" "}
                <button type="button" className="fn-link" onClick={() => setInspectHistory(true)}>Open history</button>
              </Notice>
            )}
            {data.edit_blocker && <Notice tone="neutral">{data.edit_blocker}</Notice>}
            {data.source.changed && (
              <Notice tone="warning">
                Upstream Discovery or Facility context changed. The captured source remains exact.{" "}
                <button
                  type="button"
                  className="fn-link"
                  disabled={!canEdit || conflict}
                  onClick={() =>
                    void api<NonNullable<typeof sourceReview>>(`${base}/${scopeId}/source-preview`, {
                      revision_id: data.source.current_revision_id,
                      coverage: {
                        system_id: data.revision.binding.system_id,
                        area_ids: data.revision.binding.area_ids,
                        facility_ids: data.revision.binding.facility_ids,
                      },
                    }).then(setSourceReview, setError)
                  }
                >
                  Review changed source
                </button>
              </Notice>
            )}
            {historical && (
              <Notice tone="neutral">
                Revision {data.revision.version} · {when(data.revision.created_at)}. Inputs, results and retained reports are shown as saved. Nothing can be edited here.{" "}
                <Link href={`/estimating/fertigation/${scopeId}`}>Return to current revision</Link>
              </Notice>
            )}
            {dirty && !historical && (
              <div className="fn-save-bar">
                <label className="fn-field fn-save-reason">
                  <span>Revision reason</span>
                  <input
                    value={reason}
                    maxLength={1000}
                    placeholder="Why this revision is being saved"
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <p className="fn-save-hint">
                  A new revision requires a fresh review of its purpose and conditions. Earlier saved outputs stay
                  exact; estimates are not repriced.
                </p>
              </div>
            )}
          </div>
          {views[view]}
          {artifactsVisited && (
            <div hidden={view !== "evidence" && view !== "review"} className="fn-artifacts-host">
              <FertigationArtifacts
                scopeId={scopeId}
                scopeVersion={data.scope.version}
                revisionId={data.revision.id}
                revisionNumber={data.revision.version}
                workspaceId={data.scope.estimating_workspace_id}
                optionLabel={data.source.option_label}
                canEdit={data.can_edit && !historical}
                dirty={dirty}
                view={view === "evidence" ? "evidence" : view === "review" ? "review" : "other"}
                onPendingChange={setArtifactPending}
                evidenceIds={proposal.evidence.map((e) => e.id)}
                onAddEvidence={(evidence) => update({ ...proposal, evidence: [...proposal.evidence, evidence] })}
              />
            </div>
          )}
          <PageFoot
            left={`Fertigation scope · calculation edition ${guidanceCalculation.edition}`}
            right={`${data.scope.display_number} · Revision ${data.revision.version} · synthetic data`}
          />
        </div>
      </div>
      {editor && (
        <FertigationEditor
          key={`${editor.register}:${editor.id ?? "singleton"}`}
          open={editorOpen}
          title={`${canEdit ? "Edit" : "View"} ${editor.register in registerNames ? registerNames[editor.register as Register][1] : human(editor.register)}`}
          record={editor.record}
          scope={proposal}
          readOnly={!canEdit}
          close={() => setEditorOpen(false)}
          onApply={(record) => {
            const key = editor.register;
            if (Array.isArray(proposal[key])) {
              const rows = proposal[key] as { id: string; label: string }[];
              const row = record as { id: string; label: string };
              if (!row.label?.trim())
                throw { message: "Enter a label / reference before applying this record." };
              update({
                ...proposal,
                [key]: rows.some((x) => x.id === row.id)
                  ? rows.map((x) => (x.id === row.id ? row : x))
                  : [...rows, row],
              });
            } else update({ ...proposal, [key]: record });
            setEditorOpen(false);
            setEditor(null);
          }}
        />
      )}
      {inspectHistory !== null && (
        <History
          key={historyEpoch}
          open={inspectHistory}
          data={data}
          close={() => setInspectHistory(false)}
          blocked={dirty || !!editor || artifactPending || command.busy || command.uncertain}
          historical={historical}
          pending={historyPending}
          onPendingChange={setHistoryPending}
          onDirtyChange={setHistoryDirty}
          onChanged={reload}
        />
      )}
      {removal && (
        <FertigationDialog title="Remove record from draft?" close={() => setRemoval(null)} decision>
          <div className="fn-dialog-body">
            <p>
              Remove {removal.label} from this working scope. No remaining group, allocation, source or control
              record refers to this identity. Its owned service allocations will leave this draft with it.
            </p>
            <p>
              Earlier saved revisions, outputs, reviews and installed Assets remain unchanged. This becomes a saved
              removal only after Save revision.
            </p>
            <div className="fn-actions">
              <Button
                variant="danger"
                disabled={!canEdit}
                onClick={() => {
                  update({
                    ...proposal,
                    [removal.register]: proposal[removal.register].filter((row) => row.id !== removal.id),
                  });
                  setReason(reason || `Remove ${removal.label} from the proposed scope`);
                  setRemoval(null);
                }}
              >
                Remove from draft
              </Button>
              <Button variant="secondary" onClick={() => setRemoval(null)}>Keep record</Button>
            </div>
          </div>
        </FertigationDialog>
      )}
      {compareDraft && (
        <FertigationDialog title={`Compare the working draft with revision ${data.revision.version}`} close={() => setCompareDraft(false)}>
          <div className="fn-dialog-body">
            {!draft ? (
              <p>The draft has no unsaved changes.</p>
            ) : !activeCalculation ? (
              <>
                <Notice tone="info">Calculate the draft to compare its results. Input changes are listed below either way.</Notice>
                <Button variant="secondary" icon="calculate" disabled={previewBusy || pending} onClick={() => void calculate()}>
                  {previewBusy ? "Calculating…" : "Validate & calculate draft"}
                </Button>
              </>
            ) : (
              <CalculationDelta
                beforeScope={data.revision.proposal}
                before={data.calculation}
                afterScope={proposal}
                after={activeCalculation}
                beforeLabel={`Revision ${data.revision.version}`}
                afterLabel="Working draft"
              />
            )}
            {draft && <DraftInputChanges before={data.revision.proposal} after={draft} />}
            <Hint>
              Revision {data.revision.version} stays read-only. Saving creates a new revision with the reason you
              enter; earlier outputs keep their binding.
            </Hint>
          </div>
        </FertigationDialog>
      )}
      {resolving && activeCalculation && (
        <ResolveDrawer
          items={resolving}
          scope={proposal}
          calculation={activeCalculation}
          canEdit={canEdit}
          preview={previewProposal}
          apply={(next, calculation) => {
            update(next);
            setPreview({ proposal: next, calculation });
          }}
          close={() => setResolving(null)}
        />
      )}
      {declaring && activeCalculation && (
        <ResolveDrawer
          title="Make a declaration"
          itemLabel="Declaration"
          tone="declaration"
          items={declarationList}
          initialKey={declaring}
          keepOpen
          scope={proposal}
          calculation={activeCalculation}
          canEdit={canEdit}
          preview={previewProposal}
          apply={(next, calculation) => {
            update(next);
            setPreview({ proposal: next, calculation });
          }}
          close={() => setDeclaring(null)}
        />
      )}
      {trace && (
        <TraceDrawer
          scope={guidanceScope}
          calculation={guidanceCalculation}
          traceKey={trace}
          onTrace={setTrace}
          onView={changeView}
          close={() => setTrace(null)}
        />
      )}
      {sourceReview && (
        <FertigationDialog title="Review upstream source refresh" close={() => setSourceReview(null)}>
          <div className="fn-dialog-body">
            <p>
              This creates a new scope revision with the reviewed current source. Earlier revisions and outputs
              retain the original binding. No estimate is repriced.
            </p>
            <dl className="fn-facts">
              <div><dt>Captured Discovery revision</dt><dd>{sourceReview.before.revision_id}</dd></div>
              <div><dt>Proposed Discovery revision</dt><dd>{sourceReview.after.revision_id}</dd></div>
              <div>
                <dt>Current Facility observations</dt>
                <dd>
                  {sourceReview.after.facility_observations.map((o) => `${o.id} · version ${o.version}`).join("; ") || "None selected"}
                </dd>
              </div>
            </dl>
            <div className="fn-actions">
              <Button
                variant="primary"
                disabled={pending}
                onClick={() => {
                  void command.send(`${base}/${scopeId}/refresh-source`, {
                    reason: reason.trim() || "Explicitly reviewed upstream source refresh",
                    revision_id: sourceReview.after.revision_id,
                    coverage: {
                      system_id: sourceReview.after.system_id,
                      area_ids: sourceReview.after.area_ids,
                      facility_ids: sourceReview.after.facility_ids,
                    },
                    expected_version: sourceReview.expected_version,
                    expected_revision_id: sourceReview.expected_revision_id,
                    proposal_signature: sourceReview.proposal_signature,
                    proposal,
                  });
                  setSourceReview(null);
                }}
              >
                Accept source refresh as new revision
              </Button>
              <Button variant="secondary" onClick={() => setSourceReview(null)}>Keep captured source</Button>
            </div>
          </div>
        </FertigationDialog>
      )}
      {navigation.leave && (
        <FertigationDialog title="Unsaved scope changes" close={navigation.stay} decision>
          <div className="fn-dialog-body">
            <p>
              {pending
                ? "Confirm the original operation before leaving."
                : "Keep the working proposal, save a revision before leaving, or explicitly discard it."}
            </p>
            <div className="fn-actions">
              <Button variant="secondary" onClick={navigation.stay}>Stay</Button>
              <Button variant="primary" icon="save" disabled={pending || !canSave} onClick={() => save(navigation.proceed)}>
                Save then continue
              </Button>
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => {
                  command.discard();
                  setDraft(null);
                  setEditor(null);
                  setHistoryEpoch((value) => value + 1);
                  setHistoryDirty(false);
                  setInspectHistory(null);
                  navigation.proceed();
                }}
              >
                Discard and leave
              </Button>
            </div>
          </div>
        </FertigationDialog>
      )}
    </FertigationFrame>
  );
}

/* ---------- History ---------- */

function History({
  data,
  open,
  close,
  blocked,
  historical,
  pending,
  onPendingChange,
  onDirtyChange,
  onChanged,
}: {
  data: Detail;
  open: boolean;
  close: () => void;
  blocked: boolean;
  historical: boolean;
  pending: boolean;
  onPendingChange: (value: boolean) => void;
  onDirtyChange: (value: boolean) => void;
  onChanged: () => void;
}) {
  const scopeId = data.scope.id;
  const [before, setBefore] = useState<string | null>(null),
    resource = useCrmResource<{
      items: { id: string; version: number; reason: string; created_at: string; content_hash: string }[];
      next_cursor: string | null;
    }>(open ? `${base}/${scopeId}/history${before ? `?before=${encodeURIComponent(before)}` : ""}` : null, true);
  return (
    <FertigationDialog title="History & exact revisions" close={close} open={open} closeDisabled={pending} decision>
      <div className="fn-dialog-body">
        <p className="fn-subtle">
          Every link rechecks access to that exact saved source. Origin Discovery: {data.revision.binding.revision_id}.
        </p>
        <ErrorNotice error={resource.error} />
        {resource.loading && <p className="fn-loading">Loading history…</p>}
        <ol className="fn-history">
          {resource.data?.items.map((r) => (
            <li key={r.id} className={r.id === data.revision.id ? "fn-history-current" : undefined}>
              <span className="fn-history-dot" aria-hidden="true" />
              <div>
                <Link href={`/estimating/fertigation/${scopeId}?revision_id=${r.id}`} className="fn-history-title">
                  Revision {r.version}
                </Link>
                <small>{r.reason} · {when(r.created_at)}</small>
                <code>{r.content_hash}</code>
              </div>
            </li>
          ))}
        </ol>
        {resource.data?.next_cursor && (
          <Button variant="quiet" size="sm" onClick={() => setBefore(resource.data!.next_cursor)}>Older revisions</Button>
        )}
        <FertigationHistoryActions
          scope={data.scope}
          savedRevision={data.revision.id}
          revisions={resource.data?.items ?? []}
          canEdit={data.can_edit && !historical}
          blocked={blocked}
          open={open}
          onPendingChange={onPendingChange}
          onDirtyChange={onDirtyChange}
          onChanged={() => {
            resource.reload();
            onChanged();
          }}
        />
        {resource.data && <FertigationComparison scopeId={scopeId} revisions={resource.data.items} />}
      </div>
    </FertigationDialog>
  );
}

function DraftInputChanges({ before, after }: { before: Scope; after: Scope }) {
  const changes = scopeDifferences(before, after);
  // Show record labels rather than identities; whole records read as added
  // or removed instead of their serialised content.
  const readable = (text: string) => {
    const labelled = (value: string) => withLabels(after, withLabels(before, value));
    if (text.startsWith("[")) {
      try {
        const list = JSON.parse(text) as unknown[];
        if (list.every((v) => typeof v === "string"))
          return list.map((v) => labelled(v as string)).join(", ") || "None";
      } catch {
        /* not a list of identities */
      }
    }
    return labelled(text);
  };
  const rows = changes.map((c) => ({
    field: readable(c.field.replace(/ \[[0-9a-f-]{36}\]/gi, "")),
    before: c.before.startsWith("{") ? "Present" : readable(c.before),
    after:
      c.after.startsWith("{") && c.before === "Not present"
        ? "Added"
        : c.after === "Not present"
          ? "Removed"
          : c.after.startsWith("{")
            ? "Changed"
            : readable(c.after),
  }));
  return (
    <>
      <h3>Input changes</h3>
      <p>
        {rows.length} changed {rows.length === 1 ? "field" : "fields"}.
      </p>
      {rows.length > 0 && (
        <div className="fn-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Field / record</th>
                <th scope="col">Saved</th>
                <th scope="col">Draft</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((c, i) => (
                <tr key={i}>
                  <td>{c.field}</td>
                  <td>{c.before}</td>
                  <td>{c.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 100 && <p>Showing the first 100 changes.</p>}
    </>
  );
}
