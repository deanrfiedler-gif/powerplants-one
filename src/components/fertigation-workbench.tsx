"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import { denied, useCrmCommand, useCrmResource } from "./crm-state";
import { useDiscoveryNavigation } from "./discovery-navigation";
import { RecordTabs } from "./record-ui";
import { FertigationArtifacts } from "./fertigation-artifacts";
import { FertigationImport } from "./fertigation-import";
import { FertigationComparison } from "./fertigation-comparison";
import { FertigationHistoryActions } from "./fertigation-history-actions";
import { FertigationScenarios } from "./fertigation-scenarios";
import { FertigationCandidateDetails } from "./fertigation-candidate-details";
import {
  FertigationFrame,
  fertigationViews,
  type FertigationView,
} from "./fertigation-frame";
import {
  FertigationDialog,
  FertigationEditor,
  human,
  newRecord,
  ObjectFields,
  registerNames,
  type Register,
} from "./fertigation-fields";
import { blankScope, families } from "../estimating/fertigation/definition";
import type {
  Calculation,
  Result,
  Scope,
} from "../estimating/fertigation/types";
import type {
  FertigationRecord,
  ScopeRevision,
  SourceBinding,
} from "../estimating/fertigation/storage-types";

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
type Detail = {
  scope: FertigationRecord;
  revision: ScopeRevision;
  source: {
    workspace_version: number;
    option_label: string;
    revision: number;
    scope_readiness: string;
    selected: boolean;
    current_revision_id: string;
    context_hash: string;
    changed?: boolean;
  };
  calculation: Calculation;
  can_edit: boolean;
  edit_blocker: string | null;
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
const when = (date: string | Date) => new Date(date).toLocaleString("en-AU");
const show = (result?: Result) =>
  !result
    ? "Not assessed"
    : result.state === "known" && result.value !== null
      ? `${Number(result.value.toPrecision(8)).toLocaleString("en-AU")} ${result.unit}`
      : human(result.state);
function ResultValue({ result }: { result: Result }) {
  return (
    <span title={result.reason}>
      {show(result)}
      {result.state !== "known" && <small> · {result.reason}</small>}
    </span>
  );
}

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
        <header className="fn-heading">
          <div>
            <h1>Priva Fertigation Configurator</h1>
            <p>Native scopes linked to exact saved Discovery alternatives.</p>
          </div>
          {resource.data?.can_create && (
            <Link
              className="fn-button fn-primary"
              href={`/estimating/fertigation/new?${context}`}
            >
              New fertigation scope
            </Link>
          )}
        </header>
        <div className="fn-toolbar">
          <label>
            Search scopes
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setBefore(null);
              }}
            />
          </label>
        </div>
        <ErrorNotice error={resource.error} />
        {resource.loading && <p role="status">Loading permitted scopes…</p>}
        {resource.data && (
          <>
            {resource.data.items.length ? (
              <div className="fn-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Scope</th>
                      <th>Revision</th>
                      <th>State</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resource.data.items.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <Link href={`/estimating/fertigation/${row.id}`}>
                            {row.name}
                          </Link>
                          <br />
                          <small>{row.display_number}</small>
                        </td>
                        <td>{row.version}</td>
                        <td>
                          {row.state}
                          <br />
                          <small>Manufacturer confirmation separate</small>
                        </td>
                        <td>{when(row.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="fn-empty">
                <h2>
                  {search ? "No matching scopes" : "No saved fertigation scope"}
                </h2>
                <p>
                  {search
                    ? "Try a different reference or clear the search."
                    : "Create a scope from a saved Discovery alternative. Unknown production context and technical inputs may remain incomplete."}
                </p>
                {search && (
                  <button onClick={() => setSearch("")}>Clear filters</button>
                )}
              </div>
            )}
            <div className="fn-actions">
              {before && (
                <button onClick={() => setBefore(null)}>First page</button>
              )}
              {resource.data.next_cursor && (
                <button onClick={() => setBefore(resource.data!.next_cursor)}>
                  Next page
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </FertigationFrame>
  );
}

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
        <h1>Create native fertigation scope</h1>
        <p>
          Capture a proposal against a saved Discovery revision. Existing Site,
          Facility and installed Asset records retain their identity.
        </p>
        <ErrorNotice error={options.error ?? command.error} />
        {options.loading && (
          <p role="status">Loading permitted Discovery sources…</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!source || pending) return;
            const proposal = {
                ...source.proposal,
                name,
                production_context: context,
              },
              system = source.configuration?.systems.find(
                (x) => x.id === systemId,
              );
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
            <div className="fn-fields">
              <label>
                Scope name
                <input
                  value={name}
                  maxLength={200}
                  required
                  onChange={(e) => {
                    setName(e.target.value);
                    command.dirty();
                  }}
                />
              </label>
              <label>
                Saved Discovery alternative
                <select
                  required
                  value={source?.option_id ?? ""}
                  onChange={(e) => {
                    setSelected(e.target.value);
                    setSystemId("");
                    command.dirty();
                  }}
                >
                  <option value="">Select a saved alternative</option>
                  {options.data?.sources.map((x) => (
                    <option key={x.option_id} value={x.option_id}>
                      {x.option_label} · Revision {x.revision} ·{" "}
                      {x.scope_readiness}
                    </option>
                  ))}
                </select>
              </label>
              {source && (
                <label>
                  Saved Fertigation system (optional)
                  <select
                    value={systemId}
                    onChange={(e) => {
                      setSystemId(e.target.value);
                      command.dirty();
                    }}
                  >
                    <option value="">
                      Scope-level association; system not assigned
                    </option>
                    {source.configuration?.systems
                      .filter((x) => x.family === "Fertigation")
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </div>
            {source && (
              <p className="fn-note">
                Origin: saved Discovery revision {source.revision}.{" "}
                {source.site || "Site context retained in the source binding"}.
                Optional missing technical data remains incomplete.
              </p>
            )}
            <section className="fn-section">
              <h2>Production context</h2>
              <p>
                Business context, growing system and physical process are
                independent. Unknown is a valid starting point.
              </p>
              <ObjectFields
                value={context as unknown as Record<string, unknown>}
                template={context as unknown as Record<string, unknown>}
                scope={blankScope()}
                update={(value) => {
                  setContext(value as unknown as Scope["production_context"]);
                  command.dirty();
                }}
                prefix="create-context"
              />
            </section>
            <div className="fn-actions">
              <button
                className="fn-primary"
                disabled={!source || pending}
                type="submit"
              >
                {command.busy ? "Creating…" : "Create saved scope"}
              </button>
              <Link href="/estimating/discovery">Return to Discovery</Link>
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
                area_ids:
                  source.configuration?.systems.find((s) => s.id === systemId)
                    ?.coverage.area_ids ?? [],
                facility_ids: source.facility_ids,
              },
            }}
            disabled={command.busy || command.uncertain}
            onPendingChange={setImportPending}
            onImported={(id) => {
              command.discard();
              setSavedId(id);
            }}
          />
        )}
        {!options.loading && options.data?.sources.length === 0 && (
          <p className="fn-note">
            No eligible saved Discovery sources. Open Discovery and save an
            active alternative first.
          </p>
        )}
        {command.uncertain && (
          <button onClick={() => void command.reconcile()}>
            Confirm original create
          </button>
        )}
        {navigation.leave && (
          <FertigationDialog
            title="Leave unsaved scope?"
            close={navigation.stay}
            decision
          >
            <div className="fn-dialog-body">
              <p>Keep this proposal here, or explicitly discard it.</p>
              <div className="fn-actions">
                <button onClick={navigation.stay}>Stay</button>
                <button disabled={pending} onClick={navigation.proceed}>
                  Discard and leave
                </button>
              </div>
            </div>
          </FertigationDialog>
        )}
      </div>
    </FertigationFrame>
  );
}

export function FertigationWorkspace({ id }: { id: string }) {
  const params = useSearchParams(),
    revision = params.get("revision_id"),
    resource = useCrmResource<Detail>(
      `${base}/${id}${revision ? `?revision_id=${encodeURIComponent(revision)}` : ""}`,
      true,
    );
  return (
    <>
      {resource.loading && <p role="status">Loading exact permitted scope…</p>}
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
    fertigationViews.find(([id]) => id === params.get("view"))?.[0] ??
    "overview";
  const [view, setView] = useState<FertigationView>(initialView),
    [section, setSection] = useState<Register>("valves"),
    [draft, setDraft] = useState<Scope | null>(null),
    [baseRevision, setBaseRevision] = useState<ScopeRevision | null>(null),
    [baseVersion, setBaseVersion] = useState<number | null>(null),
    [reason, setReason] = useState(""),
    [editor, setEditor] = useState<{
      register:
        | Register
        | "production_context"
        | "hydraulics"
        | "services"
        | "resilience"
        | "groscales";
      id?: string;
      record: object;
    } | null>(null),
    [editorOpen, setEditorOpen] = useState(false),
    [error, setError] = useState<unknown>(null),
    [preview, setPreview] = useState<{
      proposal: Scope;
      calculation: Calculation;
    } | null>(null),
    [previewBusy, setPreviewBusy] = useState(false),
    [acceptedVersion, setAcceptedVersion] = useState(0),
    [artifactPending, setArtifactPending] = useState(false),
    [inspectHistory, setInspectHistory] = useState<boolean | null>(null),
    [historyPending, setHistoryPending] = useState(false),
    [historyDirty, setHistoryDirty] = useState(false),
    [historyEpoch, setHistoryEpoch] = useState(0);
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
  const [removal, setRemoval] = useState<{
    register: Register;
    id: string;
    label: string;
  } | null>(null);
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
  const pending =
      command.busy || command.uncertain || artifactPending || historyPending,
    dirty = command.hasUnsavedChanges,
    navigation = useDiscoveryNavigation(
      dirty ||
        historyDirty ||
        (!!editor && data.can_edit && !params.has("revision_id")),
      pending,
    );
  const proposal = draft ?? data.revision.proposal,
    historical = params.has("revision_id"),
    canEdit =
      data.can_edit &&
      !historical &&
      !pending &&
      !historyDirty &&
      acceptedVersion <= data.scope.version;
  const activeCalculation =
    preview?.proposal === proposal
      ? preview.calculation
      : !draft
        ? data.calculation
        : null;
  const sourceHref = `/estimating/discovery/${data.scope.estimating_workspace_id}?option=${data.scope.option_id}`;
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
    if (!dirty && !editorOpen)
      history.replaceState(null, "", `${location.pathname}?${q}`);
  }
  function edit(
    register: typeof editor extends infer E
      ? E extends { register: infer R }
        ? R
        : never
      : never,
    record?: object,
  ) {
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
      const response = await api<{ calculation: Calculation }>(
        `${base}/${scopeId}/preview`,
        { expected_version: baseVersion ?? data.scope.version, proposal },
      );
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
      source_context_hash: (baseRevision ?? data.revision).binding
        .upstream_context_hash,
      proposal,
    });
  }
  const status = pending
    ? historyPending
      ? "History action pending"
      : artifactPending
        ? "Evidence or review action pending"
        : command.status
    : conflict
      ? "Conflict — proposal retained"
      : editor && canEdit
        ? "Editor entries not yet applied"
        : dirty
          ? "Unsaved changes"
          : acceptedVersion > data.scope.version
            ? "Saved — loading accepted revision"
            : data.scope.state === "Archived"
              ? `Archived · saved revision ${data.revision.version}`
              : historical
                ? "Historical revision · read-only"
                : `Saved revision ${data.revision.version}`;
  if (denied(command.error) || denied(error))
    return <ErrorNotice error={command.error ?? error} />;
  const sectionRegisters: Record<string, Register[]> = {
    growing: ["valves", "masters", "areas", "crop_groups"],
    water: ["sources", "pipes", "filters", "water_samples"],
    recipes: ["recipes", "stocks", "channels"],
    controls: ["controllers", "banks", "sensors", "strategies"],
    operating: ["groups", "scenarios"],
    configurator: ["candidates"],
    evidence: ["evidence", "actions"],
  };
  const registers = sectionRegisters[view] ?? [],
    selectedRegister = registers.includes(section) ? section : registers[0];
  return (
    <FertigationFrame
      view={view}
      onView={changeView}
      sourceHref={sourceHref}
      message={status}
    >
      <header className="fn-context">
        <div>
          <h1>Priva Fertigation Configurator</h1>
          <p>
            {proposal.name} · {data.scope.display_number} · Discovery{" "}
            {data.source.option_label} / r{data.source.revision}
          </p>
          <span className="fn-status" role="status">
            {status}
          </span>
        </div>
        <div className="fn-actions">
          <button
            onClick={() => {
              changeView("growing");
              setSection("valves");
            }}
          >
            Irrigation valves
          </button>
          {!historical && (
            <button
              className="fn-primary"
              onClick={() => save()}
              disabled={!canEdit || !dirty || conflict || !!editor}
            >
              Save revision
            </button>
          )}
        </div>
      </header>
      <div className="fn-scroll">
        <ErrorNotice error={command.error ?? error} />
        {historyDirty && !inspectHistory && (
          <p className="fn-note fn-warning">
            History action entries are kept in memory. Complete or discard that
            action before editing this scope.{" "}
            <button onClick={() => setInspectHistory(true)}>
              Resume history action
            </button>
          </p>
        )}
        {editor && !editorOpen && canEdit && (
          <p className="fn-note fn-warning">
            Editor entries are kept in memory. Apply them to the draft before
            saving.{" "}
            <button onClick={() => setEditorOpen(true)}>
              Resume kept editor
            </button>{" "}
            <button
              onClick={() => {
                setEditor(null);
                setError(null);
              }}
            >
              Discard editor entries
            </button>
          </p>
        )}
        {command.uncertain && (
          <p className="fn-note fn-warning">
            The outcome is unknown. Editing is paused while the original
            operation is confirmed.{" "}
            <button onClick={() => void command.reconcile()}>
              Confirm original save
            </button>
          </p>
        )}
        {conflict && (
          <p className="fn-note fn-warning">
            Another revision was saved. Your proposal remains in memory. Open
            history to compare the exact saved revisions before starting a
            successor.{" "}
            <button onClick={() => setInspectHistory(true)}>
              Open history
            </button>
          </p>
        )}
        {data.edit_blocker && (
          <p className="fn-note fn-warning">{data.edit_blocker}</p>
        )}
        {data.source.changed && (
          <p className="fn-note fn-warning">
            Upstream Discovery or Facility context changed. The captured source
            remains exact.{" "}
            <button
              disabled={!canEdit || conflict}
              onClick={() =>
                void api<NonNullable<typeof sourceReview>>(
                  `${base}/${scopeId}/source-preview`,
                  {
                    revision_id: data.source.current_revision_id,
                    coverage: {
                      system_id: data.revision.binding.system_id,
                      area_ids: data.revision.binding.area_ids,
                      facility_ids: data.revision.binding.facility_ids,
                    },
                  },
                ).then(setSourceReview, setError)
              }
            >
              Review changed source
            </button>
          </p>
        )}
        {historical && (
          <p className="fn-note">
            Exact saved revision {data.revision.version},{" "}
            {when(data.revision.created_at)}.{" "}
            <Link href={`/estimating/fertigation/${scopeId}`}>
              Open current scope
            </Link>
          </p>
        )}
        {view === "overview" && (
          <>
            <section className="fn-section">
              <div className="fn-heading">
                <h2>Production context</h2>
                <button
                  disabled={!canEdit}
                  onClick={() =>
                    edit("production_context", proposal.production_context)
                  }
                >
                  Edit production context
                </button>
              </div>
              <p>{proposal.production_context.tags.map(human).join(" · ")}</p>
              <p>
                {proposal.production_context.crop_description ||
                  "Crop or plant description not recorded"}
              </p>
              <div className="fn-fields">
                <p>
                  <strong>Growing system</strong>
                  <br />
                  {human(proposal.production_context.growing_system)}
                </p>
                <p>
                  <strong>Irrigation method</strong>
                  <br />
                  {human(proposal.production_context.application_method)}
                </p>
                <p>
                  <strong>Hydraulic arrangement</strong>
                  <br />
                  {human(proposal.production_context.hydraulic_arrangement)}
                </p>
                <p>
                  <strong>Source</strong>
                  <br />
                  {proposal.production_context.source_note || "Not recorded"}
                </p>
              </div>
              <p className="fn-note">
                Canonical Facility facts remain source observations. Context
                labels do not certify a process, controller, licence or
                equipment selection.
              </p>
            </section>
            <section className="fn-section">
              <div className="fn-heading">
                <h2>Scope at a glance</h2>
                <button
                  disabled={previewBusy || pending}
                  onClick={() => void calculate()}
                >
                  {previewBusy ? "Calculating…" : "Validate & calculate draft"}
                </button>
              </div>
              {!activeCalculation ? (
                <p className="fn-note">
                  Draft changed. Recalculate to inspect the current proposal;
                  saved results remain attached to the earlier revision.
                </p>
              ) : (
                <div className="fn-metrics">
                  {[
                    ["Connected flow", activeCalculation.connected_flow_m3h],
                    ["Operating peak", activeCalculation.operating_peak_m3h],
                    ["Daily crop demand", activeCalculation.daily_demand_m3],
                    ["Represented area", activeCalculation.area_m2],
                    ["Containers", activeCalculation.containers],
                    ["Plants", activeCalculation.plants],
                  ].map(([label, result]) => (
                    <div className="fn-metric" key={label as string}>
                      <small>{label as string}</small>
                      <strong>{show(result as Result)}</strong>
                      <small>{(result as Result).reason}</small>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="fn-section">
              <h2>Saved origin & exact revision</h2>
              <div className="fn-fields">
                <p>
                  <strong>Captured customer</strong>
                  <br />
                  {data.revision.binding.captured_discovery?.organisation
                    .display_name ?? "Not recorded"}
                </p>
                <p>
                  <strong>Captured Site</strong>
                  <br />
                  {data.revision.binding.captured_discovery?.site
                    ?.display_name ?? "Not recorded"}
                </p>
              </div>
              <p className="fn-subtle">
                Exact Discovery source: {data.revision.binding.revision_id}.
                Additional Facility observations are captured separately by
                version; editing this proposal does not change canonical
                Facilities.
              </p>
              <p>
                Native scope revision {data.revision.version} is bound to
                Discovery revision {data.source.revision}. Existing manual
                estimates and issued documents remain separate.
              </p>
              <p>
                <Link
                  href={`/estimating/fertigation/${scopeId}?revision_id=${data.revision.id}`}
                >
                  Open this exact saved revision
                </Link>
              </p>
              <p className="fn-subtle">
                Saved {when(data.revision.created_at)} ·{" "}
                {data.revision.content_hash}
              </p>
            </section>
          </>
        )}
        {registers.length > 0 && (
          <>
            <h2>{fertigationViews.find(([id]) => id === view)![1]}</h2>
            {registers.length > 1 && (
              <RecordTabs
                id="fertigation-register"
                label={`${view} registers`}
                tabs={registers.map((id) => ({
                  id,
                  label: registerNames[id][0],
                }))}
                value={selectedRegister}
                onChange={(value) => setSection(value as Register)}
              />
            )}
            <section
              role={registers.length > 1 ? "tabpanel" : undefined}
              id={`fertigation-register-panel-${selectedRegister}`}
              aria-labelledby={
                registers.length > 1
                  ? `fertigation-register-tab-${selectedRegister}`
                  : undefined
              }
            >
              <ScopeRegister
                key={selectedRegister}
                register={selectedRegister}
                scope={proposal}
                canEdit={canEdit}
                calculation={activeCalculation}
                onEdit={(record) => edit(selectedRegister, record)}
                onAdd={() => edit(selectedRegister)}
                onRemove={(recordId) => {
                  const text = JSON.stringify({
                    ...proposal,
                    [selectedRegister]: proposal[selectedRegister].filter(
                      (row) => row.id !== recordId,
                    ),
                  });
                  if (text.includes(recordId)) {
                    setError({
                      message:
                        "This record is still referenced. Edit its group, allocation, control or source relationships explicitly before removal.",
                    });
                    return;
                  }
                  setRemoval({
                    register: selectedRegister,
                    id: recordId,
                    label: proposal[selectedRegister].find(
                      (row) => row.id === recordId,
                    )!.label,
                  });
                }}
              />
            </section>
          </>
        )}
        {view === "growing" && (
          <Topology
            scope={proposal}
            onValve={(valve) => edit("valves", valve)}
          />
        )}
        {view === "water" && (
          <section className="fn-section">
            <div className="fn-heading">
              <h2>Pump duty & curve evidence</h2>
              <button
                disabled={!canEdit}
                onClick={() => edit("hydraulics", proposal.hydraulics)}
              >
                Edit hydraulic basis
              </button>
            </div>
            <p>
              {proposal.hydraulics.pump_model || "Pump not recorded"}. Required
              duty uses entered losses at their recorded flow basis.
            </p>
            {activeCalculation && (
              <p>
                Required head:{" "}
                <ResultValue
                  result={activeCalculation.hydraulic.required_head_m}
                />{" "}
                · Curve head:{" "}
                <ResultValue
                  result={activeCalculation.hydraulic.curve_head_m}
                />
              </p>
            )}
            <p className="fn-note">
              Edit the hydraulic basis to capture exact curve points and source
              conditions. No extrapolation or computed operating point is
              implied.
            </p>
          </section>
        )}
        {view === "recipes" && (
          <p className="fn-note">
            Record an attributed requirement and its confirmed basis. EC does
            not establish composition; pH difference does not establish an acid
            dose.
          </p>
        )}
        {view === "controls" && (
          <section className="fn-section">
            <div className="fn-heading">
              <h2>GroScales scope</h2>
              <button
                disabled={!canEdit}
                onClick={() => edit("groscales", proposal.groscales)}
              >
                Edit GroScales scope
              </button>
            </div>
            <p>
              Required: {human(proposal.groscales.required)} ·{" "}
              {human(proposal.groscales.mode)}
            </p>
            <p className="fn-note">
              Powerplants working scoping requirement: GroScales / Moisture
              Balance needs Compact CC or Connext, rather than Compass. Exact
              model, software, licences and wired/wireless hardware require
              manufacturer confirmation.
            </p>
            {activeCalculation && (
              <div className="fn-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Bank</th>
                      <th>Required</th>
                      <th>Available</th>
                      <th>Spare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCalculation.io.map((row) => (
                      <tr key={row.bank_id}>
                        <td>
                          {
                            proposal.banks.find((x) => x.id === row.bank_id)
                              ?.label
                          }
                        </td>
                        <td>
                          <ResultValue result={row.required} />
                        </td>
                        <td>
                          <ResultValue result={row.available} />
                        </td>
                        <td>
                          <ResultValue result={row.spare} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {view === "operating" && (
          <>
            <section className="fn-section">
              <h2>Scenario for review & output</h2>
              <label>
                Selected saved scenario
                <select
                  disabled={!canEdit}
                  value={proposal.selected_scenario_id ?? ""}
                  onChange={(e) =>
                    update({
                      ...proposal,
                      selected_scenario_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">Not selected</option>
                  {proposal.scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="fn-note">
                One shared sequential circuit. Group order is explicit;
                scenarios share the physical registers. Recirculating
                consumption and independent parallel circuits remain outside
                this model.
              </p>
              <button
                disabled={previewBusy || pending}
                onClick={() => void calculate()}
              >
                Validate & calculate draft
              </button>
              {activeCalculation && (
                <>
                  <p>
                    Cycle:{" "}
                    <ResultValue
                      result={activeCalculation.schedule.cycle_seconds}
                    />
                  </p>
                  <p>
                    Final storage:{" "}
                    <ResultValue result={activeCalculation.storage.final_m3} />
                  </p>
                  <div className="fn-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Group</th>
                          <th>Delivery start (s)</th>
                          <th>Delivery end (s)</th>
                          <th>Finish (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCalculation.schedule.events
                          .slice(0, 100)
                          .map((event, i) => (
                            <tr key={i}>
                              <td>
                                {
                                  proposal.groups.find(
                                    (x) => x.id === event.group_id,
                                  )?.label
                                }
                              </td>
                              <td>{event.start}</td>
                              <td>{event.end}</td>
                              <td>{event.finish}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {activeCalculation.schedule.events.length > 100 && (
                    <p>
                      Showing the first 100 events. Exact saved output retains
                      the complete schedule.
                    </p>
                  )}
                </>
              )}
            </section>
            <FertigationScenarios
              proposal={proposal}
              dirty={dirty}
              revision={data.revision.version}
              blocked={pending || !!editor}
            />
          </>
        )}
        {view === "configurator" && (
          <section className="fn-section">
            <h2>Candidate assessment</h2>
            <p>
              Requested families: {families.join(", ")}. Add an exact configured
              candidate and its entered limits; absent manufacturer evidence
              stays unverified.
            </p>
            <button
              disabled={previewBusy || pending}
              onClick={() => void calculate()}
            >
              Validate & compare candidates
            </button>
            {activeCalculation?.candidates.map((candidate) => (
              <div className="fn-note" key={candidate.id}>
                <strong>
                  {
                    proposal.candidates.find((x) => x.id === candidate.id)
                      ?.label
                  }
                  : {human(candidate.status)}
                </strong>
                {candidate.failures.map((x) => (
                  <p key={x}>{x}</p>
                ))}
                {candidate.unknowns.map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </div>
            ))}
            {activeCalculation && (
              <FertigationCandidateDetails
                scope={proposal}
                calculation={activeCalculation}
              />
            )}
          </section>
        )}
        {view === "evidence" && (
          <section className="fn-section">
            <h2>Services, access & resilience</h2>
            <div className="fn-actions">
              <button
                disabled={!canEdit}
                onClick={() => edit("services", proposal.services)}
              >
                Edit services & access
              </button>
              <button
                disabled={!canEdit}
                onClick={() => edit("resilience", proposal.resilience)}
              >
                Edit alarms & responsibilities
              </button>
            </div>
            <p className="fn-note">
              Evidence references preserve attribution, exact source revision
              and applicability. Prepare original PNG evidence below, then add
              its reference to a saved successor. Other file formats and malware
              scanning are not configured; a text reference alone does not claim
              retained bytes.
            </p>
          </section>
        )}
        {view === "review" && (
          <>
            <section className="fn-section">
              <div className="fn-heading">
                <h2>Findings & review impact</h2>
                <button
                  disabled={previewBusy || pending}
                  onClick={() => void calculate()}
                >
                  Validate & calculate draft
                </button>
              </div>
              {!activeCalculation ? (
                <p>Recalculate the changed draft to see current findings.</p>
              ) : (
                <>
                  <p>
                    {activeCalculation.findings.length} findings ·{" "}
                    {activeCalculation.edition}. No engineering or manufacturer
                    approval is implied.
                  </p>
                  <ul className="fn-findings">
                    {activeCalculation.findings.map((f) => (
                      <li key={f.id}>
                        <strong>
                          {human(f.severity)} · {f.message}
                        </strong>
                        <small>{f.field}</small>
                        {f.record_id && (
                          <button
                            onClick={() => {
                              for (const register of Object.keys(
                                registerNames,
                              ) as Register[]) {
                                const record = proposal[register].find(
                                  (r) => r.id === f.record_id,
                                );
                                if (record) {
                                  edit(register, record);
                                  return;
                                }
                              }
                            }}
                          >
                            Open affected record
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="fn-note fn-warning">
                Engineering approval is not configured. Review notes retain
                outstanding conditions; technical suitability and automatic
                costing remain held.
              </p>
            </section>
            <section className="fn-section">
              <h2>Revision & output</h2>
              <div className="fn-actions">
                <button onClick={() => setInspectHistory(true)}>
                  History & exact revisions
                </button>
                <a
                  className="fn-button"
                  href={`/api/v1/${base}/${scopeId}/export?revision_id=${data.revision.id}`}
                  download
                >
                  Export exact saved scope
                </a>
                <a
                  className="fn-button"
                  href={`/api/v1/${base}/${scopeId}/report?revision_id=${data.revision.id}&audience=internal`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open saved internal report
                </a>
              </div>
              <p>
                Outputs refer to saved revision {data.revision.version}; draft
                edits are not included.
              </p>
            </section>
          </>
        )}
        {artifactsVisited && (
          <div hidden={view !== "evidence" && view !== "review"}>
            <FertigationArtifacts
              scopeId={scopeId}
              scopeVersion={data.scope.version}
              revisionId={data.revision.id}
              workspaceId={data.scope.estimating_workspace_id}
              canEdit={data.can_edit && !historical}
              dirty={dirty}
              onPendingChange={setArtifactPending}
              evidenceIds={proposal.evidence.map((e) => e.id)}
              onAddEvidence={(evidence) =>
                update({
                  ...proposal,
                  evidence: [...proposal.evidence, evidence],
                })
              }
            />
          </div>
        )}
        {dirty && (
          <section className="fn-section">
            <label>
              Revision reason
              <input
                value={reason}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <p className="fn-note">
              A new revision requires a fresh review of its purpose and
              conditions. Earlier saved outputs stay exact. Estimates are not
              repriced.
            </p>
          </section>
        )}
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
                throw {
                  message:
                    "Enter a label / reference before applying this record.",
                };
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
          blocked={
            dirty ||
            !!editor ||
            artifactPending ||
            command.busy ||
            command.uncertain
          }
          historical={historical}
          pending={historyPending}
          onPendingChange={setHistoryPending}
          onDirtyChange={setHistoryDirty}
          onChanged={reload}
        />
      )}
      {removal && (
        <FertigationDialog
          title="Remove record from draft?"
          close={() => setRemoval(null)}
          decision
        >
          <div className="fn-dialog-body">
            <p>
              Remove {removal.label} from this working scope. No remaining
              group, allocation, source or control record refers to this
              identity. Its owned service allocations will leave this draft with
              it.
            </p>
            <p>
              Earlier saved revisions, outputs, reviews and installed Assets
              remain unchanged. This becomes a saved removal only after Save
              revision.
            </p>
            <div className="fn-actions">
              <button
                disabled={!canEdit}
                onClick={() => {
                  update({
                    ...proposal,
                    [removal.register]: proposal[removal.register].filter(
                      (row) => row.id !== removal.id,
                    ),
                  });
                  setReason(
                    reason || `Remove ${removal.label} from the proposed scope`,
                  );
                  setRemoval(null);
                }}
              >
                Remove from draft
              </button>
              <button onClick={() => setRemoval(null)}>Keep record</button>
            </div>
          </div>
        </FertigationDialog>
      )}
      {sourceReview && (
        <FertigationDialog
          title="Review upstream source refresh"
          close={() => setSourceReview(null)}
        >
          <div className="fn-dialog-body">
            <p>
              This creates a new scope revision with the reviewed current
              source. Earlier revisions and outputs retain the original binding.
              No estimate is repriced.
            </p>
            <dl>
              <dt>Captured Discovery revision</dt>
              <dd>{sourceReview.before.revision_id}</dd>
              <dt>Proposed Discovery revision</dt>
              <dd>{sourceReview.after.revision_id}</dd>
              <dt>Current Facility observations</dt>
              <dd>
                {sourceReview.after.facility_observations
                  .map((o) => `${o.id} · version ${o.version}`)
                  .join("; ") || "None selected"}
              </dd>
            </dl>
            <div className="fn-actions">
              <button
                className="fn-primary"
                disabled={pending}
                onClick={() => {
                  void command.send(`${base}/${scopeId}/refresh-source`, {
                    reason:
                      reason.trim() ||
                      "Explicitly reviewed upstream source refresh",
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
              </button>
              <button onClick={() => setSourceReview(null)}>
                Keep captured source
              </button>
            </div>
          </div>
        </FertigationDialog>
      )}
      {navigation.leave && (
        <FertigationDialog
          title="Unsaved scope changes"
          close={navigation.stay}
          decision
        >
          <div className="fn-dialog-body">
            <p>
              {pending
                ? "Confirm the original operation before leaving."
                : "Keep the working proposal, save a revision before leaving, or explicitly discard it."}
            </p>
            <div className="fn-actions">
              <button onClick={navigation.stay}>Stay</button>
              <button
                disabled={
                  pending ||
                  !canEdit ||
                  !dirty ||
                  conflict ||
                  !!editor ||
                  historyDirty
                }
                onClick={() => save(navigation.proceed)}
              >
                Save then continue
              </button>
              <button
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
              </button>
            </div>
          </div>
        </FertigationDialog>
      )}
    </FertigationFrame>
  );
}

function ScopeRegister({
  register,
  scope,
  canEdit,
  calculation,
  onEdit,
  onAdd,
  onRemove,
}: {
  register: Register;
  scope: Scope;
  canEdit: boolean;
  calculation: Calculation | null;
  onEdit: (record: object) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [phase, setPhase] = useState(""),
    [page, setPage] = useState(0),
    [area, setArea] = useState(""),
    [master, setMaster] = useState("");
  const rows = scope[register],
    filtered = useMemo(
      () =>
        rows
          .filter(
            (row) =>
              row.label.toLowerCase().includes(search.toLowerCase()) &&
              (!phase || ("phase" in row && row.phase === phase)) &&
              (!master || ("master_id" in row && row.master_id === master)) &&
              (!area ||
                ("allocations" in row &&
                  row.allocations.some(
                    (allocation) =>
                      allocation.area_id === area ||
                      scope.crop_groups.some(
                        (crop) =>
                          crop.id === allocation.crop_group_id &&
                          crop.area_id === area,
                      ),
                  ))),
          )
          .toSorted(
            (a, b) =>
              a.label.localeCompare(b.label) || a.id.localeCompare(b.id),
          ),
      [rows, search, phase, master, area, scope.crop_groups],
    );
  return (
    <>
      <div className="fn-heading">
        <div>
          <h2>{registerNames[register][0]}</h2>
          <small>
            {rows.length} in this {canEdit ? "working scope" : "saved revision"}{" "}
            · {filtered.length} matching
          </small>
        </div>
        {canEdit && (
          <button className="fn-primary" onClick={onAdd}>
            + Add {registerNames[register][1]}
          </button>
        )}
      </div>
      <div className="fn-toolbar">
        <label>
          Search {registerNames[register][0].toLowerCase()}
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {register !== "evidence" && (
          <label>
            Phase filter
            <select
              value={phase}
              onChange={(e) => {
                setPhase(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All phases</option>
              {["unknown", "existing", "proposed", "future", "excluded"].map(
                (p) => (
                  <option key={p} value={p}>
                    {human(p)}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
        {register === "valves" && (
          <>
            <label>
              Area filter
              <select
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All areas</option>
                {scope.areas.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Master filter
              <select
                value={master}
                onChange={(e) => {
                  setMaster(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All masters</option>
                {scope.masters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="fn-empty">
          <h3>
            {rows.length
              ? "No matching records"
              : `No ${registerNames[register][0].toLowerCase()} yet`}
          </h3>
          <p>
            {rows.length
              ? "Change the filters; all working records are retained."
              : "Add the known identity and source. Missing optional technical details can remain unknown."}
          </p>
          {rows.length ? (
            <button
              onClick={() => {
                setSearch("");
                setPhase("");
                setMaster("");
                setArea("");
                setPage(0);
              }}
            >
              Clear filters
            </button>
          ) : (
            canEdit && (
              <button onClick={onAdd}>Add {registerNames[register][1]}</button>
            )
          )}
        </div>
      ) : (
        <div className="fn-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Label / reference</th>
                <th>Phase / source</th>
                {register === "valves" && (
                  <>
                    <th>Hydraulic basis</th>
                    <th>Flow</th>
                    <th>Served allocations</th>
                  </>
                )}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(page * 25, page * 25 + 25).map((row) => (
                <tr key={row.id}>
                  <td>
                    <button className="fn-link" onClick={() => onEdit(row)}>
                      {row.label}
                    </button>
                  </td>
                  <td>
                    {"phase" in row
                      ? human(row.phase)
                      : "kind" in row
                        ? human(row.kind)
                        : "Not recorded"}
                  </td>
                  {register === "valves" && "flow_basis" in row && (
                    <>
                      <td>
                        {human(row.flow_basis)}
                        <br />
                        <small>
                          {row.master_id
                            ? scope.masters.find((x) => x.id === row.master_id)
                                ?.label
                            : "Master unassigned"}
                        </small>
                      </td>
                      <td>
                        {show(
                          calculation?.valve_flows.find((x) => x.id === row.id)
                            ?.flow,
                        )}
                      </td>
                      <td>{row.allocations.length}</td>
                    </>
                  )}
                  <td>
                    <div className="fn-actions">
                      <button onClick={() => onEdit(row)}>
                        {canEdit ? "Edit" : "View"}
                      </button>
                      {canEdit && (
                        <button onClick={() => onRemove(row.id)}>Remove</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="fn-actions">
        {page > 0 && (
          <button onClick={() => setPage(page - 1)}>Previous 25</button>
        )}
        {(page + 1) * 25 < filtered.length && (
          <button onClick={() => setPage(page + 1)}>Next 25</button>
        )}
      </div>
    </>
  );
}

function Topology({
  scope,
  onValve,
}: {
  scope: Scope;
  onValve: (record: Scope["valves"][number]) => void;
}) {
  if (!scope.valves.length) return null;
  return (
    <section className="fn-section">
      <h2>Represented valve paths</h2>
      <p>
        Concept only · not to scale · not for construction. Each physical valve
        is shown with its actual recorded source and master.
      </p>
      <div className="fn-table-scroll">
        <svg
          className="fn-graph"
          role="img"
          aria-label="Water sources through assigned masters to irrigation valves"
          viewBox={`0 0 850 ${Math.max(90, scope.valves.slice(0, 8).length * 64 + 30)}`}
        >
          {scope.valves.slice(0, 8).map((v, index) => {
            const y = index * 64 + 20;
            return (
              <g key={v.id}>
                <path
                  d={`M220 ${y + 20}H300M530 ${y + 20}H610`}
                  fill="none"
                  stroke="#828e9f"
                  strokeWidth="2"
                />
                <rect
                  x="0"
                  y={y}
                  width="220"
                  height="42"
                  rx="5"
                  fill="#f6f7f9"
                  stroke="#cbd2dc"
                />
                <text x="10" y={y + 26} fontSize="13" fill="#242a37">
                  {(
                    scope.sources.find(
                      (x) =>
                        x.id ===
                        (v.source_id ??
                          scope.masters.find(
                            (master) => master.id === v.master_id,
                          )?.source_id),
                    )?.label ?? "Source unassigned"
                  ).slice(0, 29)}
                </text>
                <rect
                  x="300"
                  y={y}
                  width="230"
                  height="42"
                  rx="5"
                  fill="#f6f7f9"
                  stroke="#cbd2dc"
                />
                <text x="310" y={y + 26} fontSize="13" fill="#242a37">
                  {(
                    scope.masters.find((x) => x.id === v.master_id)?.label ??
                    "Master unassigned"
                  ).slice(0, 30)}
                </text>
                <rect
                  x="610"
                  y={y}
                  width="230"
                  height="42"
                  rx="5"
                  fill="#edf5e9"
                  stroke="#90ac83"
                />
                <text x="620" y={y + 26} fontSize="13" fill="#242a37">
                  {v.label.slice(0, 30)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="fn-actions">
        {scope.valves.slice(0, 8).map((v) => (
          <button key={v.id} onClick={() => onValve(v)}>
            Open {v.label}
          </button>
        ))}
      </div>
      {scope.valves.length > 8 && (
        <p>
          First eight physical paths shown; the valve register exposes all
          records.
        </p>
      )}
    </section>
  );
}

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
      items: {
        id: string;
        version: number;
        reason: string;
        created_at: string;
        content_hash: string;
      }[];
      next_cursor: string | null;
    }>(
      open
        ? `${base}/${scopeId}/history${before ? `?before=${encodeURIComponent(before)}` : ""}`
        : null,
      true,
    );
  return (
    <FertigationDialog
      title="History & exact revisions"
      close={close}
      open={open}
      closeDisabled={pending}
    >
      <div className="fn-dialog-body">
        <p>
          Every link rechecks access to that exact saved source. Origin
          Discovery: {data.revision.binding.revision_id}.
        </p>
        <ErrorNotice error={resource.error} />
        {resource.loading && <p>Loading history…</p>}
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
        {resource.data && (
          <FertigationComparison
            scopeId={scopeId}
            revisions={resource.data.items}
          />
        )}
        {resource.data?.items.map((r) => (
          <section className="fn-section" key={r.id}>
            <h3>
              <Link
                href={`/estimating/fertigation/${scopeId}?revision_id=${r.id}`}
              >
                Revision {r.version}
              </Link>
            </h3>
            <p>
              {r.reason} · {when(r.created_at)}
            </p>
            <small>{r.content_hash}</small>
          </section>
        ))}
        {resource.data?.next_cursor && (
          <button onClick={() => setBefore(resource.data!.next_cursor)}>
            Older revisions
          </button>
        )}
      </div>
    </FertigationDialog>
  );
}
