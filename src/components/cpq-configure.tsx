"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type {
  Calculation,
  CalculationInput,
  Definition,
  LineDetail,
  Override,
  Scalar,
} from "../cpq/types";
import type { previewCalculation, previewAdoption } from "../cpq/runs";
import type { readRun, runHistory, readRevision } from "../cpq/reads";
import type { readDiscoveryWorkspace } from "../estimating/discovery-workspaces";
import type { readDraft, listDrafts } from "../cpq/drafts";
import { api, ErrorNotice } from "./business-ui";
import { useCrmCommand, useCrmResource } from "./crm-state";
import { usePublishRecordIdentity } from "../shell/record-identity";
import { Button, ButtonLink } from "./ui/button";
import { ProductIcon } from "./product-icons";
import {
  CpqFrame,
  CpqDraftBoundary,
  CpqNav,
  CpqHeader,
  CpqTabs,
  CpqField,
  CpqPill,
  CpqNotice,
  CpqDialog,
  CpqEmpty,
  useCpqCompany,
  money,
  quantity,
  stamp,
  type Wire,
} from "./cpq-ui";
import {
  CpqMaterials,
  CpqWhy,
  CpqAdjustment,
  CpqPricing,
  CpqMilestones,
} from "./cpq-results";
type Basis = Wire<Awaited<ReturnType<typeof previewCalculation>>>;
type Saved = Wire<Awaited<ReturnType<typeof readRun>>>;
type Draft = Wire<Awaited<ReturnType<typeof readDraft>>>["draft"];
type History = Wire<Awaited<ReturnType<typeof runHistory>>>;
type Receiving = Wire<Awaited<ReturnType<typeof previewAdoption>>>;
type Workspace = Wire<Awaited<ReturnType<typeof readDiscoveryWorkspace>>>;
function blankInput(d: Definition, b: Basis): CalculationInput {
  return {
    pricing_date: new Date().toISOString().slice(0, 10),
    instances: [
      {
        id: crypto.randomUUID(),
        label: "System 1",
        facts: Object.fromEntries(
          d.facts.map((f) => [f.key, b.source_facts[f.key]?.value ?? null]),
        ),
        ...(d.schema_version === 3 ? { not_applicable: [] } : {}),
      },
    ],
    overrides: [],
    ...(d.schema_version === 3 ? { pricing: null } : {}),
  };
}
function draftInput(
  draft: Draft | null,
  fallback: CalculationInput,
): CalculationInput {
  return draft ? (draft.content as unknown as CalculationInput) : fallback;
}
export function CpqConfigure({ id }: { id: string }) {
  const query = useSearchParams(),
    selectedCompany = useCpqCompany(),
    evaluation = query.get("evaluation"),
    draftId = query.get("draft");
  const workspace = useCrmResource<Workspace>(
    `estimating/workspaces/${id}`,
    true,
  );
  const option = workspace.data?.options.find(
    (x) =>
      x.option.id ===
      (query.get("option") ??
        query.get("option_id") ??
        workspace.data?.workspace.selected_option_id),
  );
  const company = workspace.data?.workspace.company_id ?? selectedCompany;
  const history = useCrmResource<History>(
    workspace.data ? `estimating/workspaces/${id}/cpq` : null,
    true,
  );
  const draftList = useCrmResource<
    Wire<Awaited<ReturnType<typeof listDrafts>>>
  >(
    !evaluation && company && option
      ? `cpq/drafts?company_id=${company}&kind=Configuration&estimating_workspace_id=${id}&option_id=${option.option.id}`
      : null,
    true,
  );
  const draft =
    draftList.data?.items.find((d) => (draftId ? d.id === draftId : true)) ??
    null;
  const runId =
    evaluation ??
    draft?.base_run_id ??
    history.data?.items.find((r) => r.option_id === option?.option.id)?.id;
  const saved = useCrmResource<Saved>(runId ? `cpq/runs/${runId}` : null, true);
  const basis = useCrmResource<Basis>(
    !evaluation && option
      ? `estimating/workspaces/${id}/cpq/preview?option_id=${option.option.id}&revision_id=${option.revision.id}`
      : null,
    true,
  );
  const revisionId = evaluation
    ? saved.data?.release_revision_id
    : (draft?.base_revision_id ?? saved.data?.release_revision_id);
  const revision = useCrmResource<
    Wire<Awaited<ReturnType<typeof readRevision>>>
  >(revisionId ? `cpq/revisions/${revisionId}` : null, true);
  const error =
    workspace.error ??
    history.error ??
    draftList.error ??
    saved.error ??
    basis.error ??
    revision.error;
  if (error)
    return (
      <CpqFrame
        menu={<CpqNav label="All configurations" href="/estimating/cpq" />}
      >
        <div className="cpq-scroll">
          <ErrorNotice error={error} />
          <ButtonLink href={`/estimating/discovery/${id}`}>
            Return to estimation wizard
          </ButtonLink>
        </div>
      </CpqFrame>
    );
  const ready =
    workspace.data &&
    option &&
    history.data &&
    (evaluation
      ? saved.data && revision.data
      : basis.data &&
        draftList.data &&
        (!runId || saved.data) &&
        (!revisionId || revision.data));
  if (!ready)
    return (
      <CpqFrame
        menu={<CpqNav label="All configurations" href="/estimating/cpq" />}
      >
        <div className="cpq-scroll" role="status">
          Loading configuration…
        </div>
      </CpqFrame>
    );
  return (
    <CpqDraftBoundary
      key={draft?.id ?? "saved"}
      href={
        saved.data
          ? `/estimating/cpq/${id}?option=${option!.option.id}&evaluation=${saved.data.id}`
          : `/estimating/discovery/${id}`
      }
    >
      <ConfigurationEditor
        key={evaluation ?? `${id}:${option!.option.id}:${draftId ?? "working"}`}
        workspace={workspace.data!}
        option={option!.option}
        basis={basis.data}
        saved={saved.data}
        initialDefinition={
          revision.data?.definition ?? basis.data!.release.definition
        }
        draft={draft}
        history={history.data!}
        historical={!!evaluation}
        refresh={() => {
          basis.reload();
          history.reload();
          draftList.reload();
          saved.reload();
        }}
      />
    </CpqDraftBoundary>
  );
}
function ConfigurationEditor({
  workspace,
  option,
  basis,
  saved,
  initialDefinition,
  draft,
  history,
  historical,
  refresh,
}: {
  workspace: Workspace;
  option: Workspace["options"][number]["option"];
  basis: Basis | null;
  saved: Saved | null;
  initialDefinition: Definition;
  draft: Draft | null;
  history: History;
  historical: boolean;
  refresh: () => void;
}) {
  const action = useRef<"save" | "draft" | "adopt">("save");
  // Shell top bar amendment R2/R4: the editor mounts only after every authorised read, and unmounts on
  // denial, so the breadcrumb names the configuration only while it is shown. A configuration has no
  // reference of its own (no SYN-CPQ identifier is invented), so it takes its deal's.
  usePublishRecordIdentity(
    workspace.context.display_number,
    `${workspace.context.title} · ${option.label}`,
  );
  const [hydrating, setHydrating] = useState(false);
  const [input, setInput] = useState<CalculationInput>(() =>
      draftInput(draft, saved?.input ?? blankInput(initialDefinition, basis!)),
    ),
    [definition, setDefinition] = useState(initialDefinition),
    [selected, setSelected] = useState("overview"),
    [tab, setTab] = useState("Configure"),
    [resultState, setResultState] = useState<{
      input: string;
      result: Calculation;
    } | null>(() =>
      saved && !draft
        ? { input: JSON.stringify(saved.input), result: saved.result }
        : null,
    ),
    [error, setError] = useState<unknown>(null),
    [previewing, setPreviewing] = useState(false),
    [summary, setSummary] = useState(false),
    [why, setWhy] = useState<LineDetail | null>(null),
    [adjust, setAdjust] = useState<LineDetail | null>(null),
    [orphan, setOrphan] = useState<Override | null>(null),
    [removalReason, setRemovalReason] = useState(""),
    [receiving, setReceiving] = useState<Receiving | null>(null),
    [adoptTitle, setAdoptTitle] = useState(""),
    [adoptScope, setAdoptScope] = useState({
      included: "",
      excluded: "",
      assumptions: "",
    }),
    [savedRun, setSavedRun] = useState(saved),
    [draftIdentity] = useState(draft?.id ?? crypto.randomUUID()),
    [draftVersion, setDraftVersion] = useState(draft?.version ?? 0),
    [initialHash, setInitialHash] = useState(
      draft?.binding_hash ?? saved?.binding_hash ?? basis?.binding_hash,
    ),
    [acceptedBasis, setAcceptedBasis] = useState(basis),
    [comparison, setComparison] = useState<{
      before: Calculation | null;
      after: Calculation;
      input: CalculationInput;
      basis: Basis;
    } | null>(null),
    [comparisonRun, setComparisonRun] = useState<Saved | null>(null),
    [reason, setReason] = useState(
      "Configuration inputs and pricing reviewed.",
    ),
    [adopted, setAdopted] = useState<string | null>(null);
  const command = useCrmCommand(
    (receipt) => {
      if (action.current === "adopt") {
        setAdopted(receipt.record_id);
        setReceiving(null);
        refresh();
        return;
      }
      if (action.current === "draft") {
        setDraftVersion(receipt.record_version);
        refresh();
        return;
      }
      setHydrating(true);
      void Promise.all([
        api<Saved>(`cpq/runs/${receipt.record_id}`),
        api<{ draft: Draft }>(`cpq/drafts/${draftIdentity}`),
      ])
        .then(([r, d]) => {
          setSavedRun(r);
          setDraftVersion(d.draft.version);
          setInput(r.input);
          setResultState({ input: JSON.stringify(r.input), result: r.result });
          refresh();
        })
        .catch(setError)
        .finally(() => setHydrating(false));
    },
    saved ? "Saved evaluation" : "Unsaved",
  );
  const sourceStale =
    !historical && !!basis && initialHash !== basis.binding_hash;
  const signature = JSON.stringify(input),
    result = historical
      ? (savedRun?.result ?? null)
      : (resultState?.result ?? savedRun?.result ?? null);
  const current =
    !historical && resultState?.input === signature && !sourceStale;
  const calculating = previewing && !sourceStale;
  const displayedCurrent = historical || current;
  const orphaned =
    current && result?.explanation
      ? input.overrides.filter(
          (o) => !result.explanation!.lines.some((l) => l.target === o.target),
        )
      : [];
  const busy = command.busy || command.uncertain || hydrating,
    editable = !historical && workspace.can_edit;
  useEffect(() => {
    if (historical || !acceptedBasis || sourceStale) return;
    let live = true;
    const timer = setTimeout(() => {
      setPreviewing(true);
      void api<{ result: Calculation }>(
        `estimating/workspaces/${workspace.workspace.id}/cpq/preview`,
        {
          option_id: option.id,
          revision_id: acceptedBasis.binding.revision_id,
          binding_hash: acceptedBasis.binding_hash,
          input: JSON.parse(signature),
        },
      )
        .then(
          (r) => {
            if (live) {
              setResultState({ input: signature, result: r.result });
              setError(null);
            }
          },
          (e) => {
            if (live) {
              setError(e);
              setResultState(null);
            }
          },
        )
        .finally(() => {
          if (live) setPreviewing(false);
        });
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [
    signature,
    historical,
    acceptedBasis,
    sourceStale,
    workspace.workspace.id,
    option.id,
  ]);
  function change(next: CalculationInput) {
    if (!editable || busy) return;
    setInput(next);
    command.dirty();
    setAdopted(null);
  }
  function fact(instance: string, key: string, value: Scalar) {
    change({
      ...input,
      instances: input.instances.map((i) =>
        i.id === instance ||
        definition.facts.find((f) => f.key === key)?.scope === "Global"
          ? {
              ...i,
              facts: { ...i.facts, [key]: value },
              ...(definition.schema_version === 3
                ? {
                    not_applicable: (i.not_applicable ?? []).filter(
                      (k) => k !== key,
                    ),
                  }
                : {}),
            }
          : i,
      ),
    });
  }
  async function compareActive() {
    if (!basis) return;
    setError(null);
    const next = {
      ...input,
      instances: input.instances.map((i) => ({
        ...i,
        facts: Object.fromEntries(
          basis.release.definition.facts.map((f) => [
            f.key,
            f.key in basis.source_facts
              ? basis.source_facts[f.key].value
              : (i.facts[f.key] ?? null),
          ]),
        ),
        ...(basis.release.definition.schema_version === 3
          ? {
              not_applicable: (i.not_applicable ?? []).filter((k) =>
                basis.release.definition.facts.some(
                  (f) => f.key === k && !f.binding,
                ),
              ),
            }
          : {}),
      })),
    };
    try {
      const r = await api<{ result: Calculation }>(
        `estimating/workspaces/${workspace.workspace.id}/cpq/preview`,
        {
          option_id: option.id,
          revision_id: basis.binding.revision_id,
          binding_hash: basis.binding_hash,
          input: next,
        },
      );
      setComparison({ before: result, after: r.result, input: next, basis });
    } catch (e) {
      setError(e);
    }
  }
  async function save() {
    if (!acceptedBasis || busy || !editable) return;
    if (current && result) {
      action.current = "save";
      await command.send(
        `estimating/workspaces/${workspace.workspace.id}/cpq`,
        {
          id: crypto.randomUUID(),
          option_id: option.id,
          revision_id: acceptedBasis.binding.revision_id,
          binding_hash: acceptedBasis.binding_hash,
          parent_id: savedRun?.id ?? null,
          input,
          reason,
          draft: {
            id: draftIdentity,
            expected_version: draftVersion,
            label: `${workspace.context.title} · ${option.label}`,
          },
        },
      );
    } else {
      action.current = "draft";
      await command.send("cpq/drafts", {
        id: draftIdentity,
        company_id: workspace.workspace.company_id,
        kind: "Configuration",
        release_id: null,
        estimating_workspace_id: workspace.workspace.id,
        option_id: option.id,
        discovery_revision_id: acceptedBasis.binding.revision_id,
        base_revision_id:
          definition === initialDefinition
            ? (draft?.base_revision_id ??
              savedRun?.release_revision_id ??
              acceptedBasis.release.id)
            : acceptedBasis.release.id,
        base_run_id: savedRun?.id ?? null,
        binding_hash: initialHash ?? acceptedBasis.binding_hash,
        label: `${workspace.context.title} · ${option.label}`,
        expected_version: draftVersion,
        content: input,
        reason,
      });
    }
  }
  async function openEstimatePreview() {
    if (!savedRun) return;
    try {
      const p = await api<Receiving>(`cpq/runs/${savedRun.id}/adoption`);
      setReceiving(p);
      setAdoptTitle(p.title ?? workspace.context.title);
      setAdoptScope(p.scope ?? { included: "", excluded: "", assumptions: "" });
    } catch (e) {
      setError(e);
    }
  }
  const canUse =
    editable &&
    !busy &&
    !command.hasUnsavedChanges &&
    !sourceStale &&
    savedRun?.result.ready &&
    JSON.stringify(savedRun.input) === signature;
  const selectedInstance = input.instances.find((i) => i.id === selected);
  const summaryContent = (
    <>
      <h2>Configuration summary</h2>
      <small>Viewing</small>
      <h3>
        {historical
          ? `Evaluation ${savedRun?.evaluation_number}`
          : "Working configuration"}
      </h3>
      <small>
        {option.label} · {definition.label}
      </small>
      <hr />
      <small>Proposed sell · excluding GST</small>
      <div className="cpq-total">AUD {money(result?.totals.sell)}</div>
      {(!result?.ready || (!historical && !current)) && (
        <CpqPill tone="warning">Indicative</CpqPill>
      )}
      <small>GST is calculated on the quotation (ES-05)</small>
      <dl>
        <dt>Included cost</dt>
        <dd>{money(result?.totals.cost)}</dd>
        <dt>Gross margin</dt>
        <dd>{result?.totals.margin_percent ?? "Unknown"}%</dd>
        <dt>Markup on cost</dt>
        <dd>{result?.totals.markup_percent ?? "Unknown"}%</dd>
        <dt>Systems</dt>
        <dd>{input.instances.length}</dd>
      </dl>
      <hr />
      <dl>
        <dt>Ruleset</dt>
        <dd>{definition.label}</dd>
        <dt>Last saved evaluation</dt>
        <dd>
          {savedRun
            ? `${savedRun.evaluation_number} · ${stamp(savedRun.updated_at)}`
            : "Not saved"}
        </dd>
        <dt>Source estimate</dt>
        <dd>
          {basis?.binding.estimate_version
            ? `v${basis.binding.estimate_version}`
            : "Not costed"}
        </dd>
      </dl>
      <hr />
      <CpqNotice tone={displayedCurrent && result?.ready ? "info" : "warning"}>
        {!displayedCurrent
          ? "The displayed totals are indicative. Resolve the current inputs and save a new evaluation before use."
          : result?.ready
            ? "Estimate review will be required after using this result."
            : `${result?.diagnostics.length ?? 0} checks to resolve before use.`}
      </CpqNotice>
      {editable && (
        <Button
          variant="primary"
          disabled={!canUse}
          onClick={() => void openEstimatePreview()}
        >
          Use in estimate
        </Button>
      )}
    </>
  );
  return (
    <CpqFrame
      menu={
        <>
          <CpqNav
            label="All configurations"
            href="/estimating/cpq"
            icon="collapse"
          />
          <hr />
          <CpqNav
            label="Solution overview"
            selected={selected === "overview"}
            onClick={() => {
              setSelected("overview");
              setTab("Configure");
            }}
            icon="products"
          />
          {input.instances.map((i, n) => (
            <CpqNav
              key={i.id}
              label={`${n + 1} · ${i.label}`}
              meta={
                result?.diagnostics.some((d) => d.instance_id === i.id)
                  ? "Needs attention"
                  : "Configuration"
              }
              selected={selected === i.id}
              onClick={() => {
                setSelected(i.id);
                setTab("Configure");
              }}
              icon="gear"
            />
          ))}
          <hr />
          <CpqNav
            label="Requirements · estimation wizard"
            href={`/estimating/discovery/${workspace.workspace.id}`}
            icon="nav-wizard"
          />
          {basis?.binding.estimate_id && (
            <CpqNav
              label={`Estimate v${basis.binding.estimate_version}`}
              href={`/estimating/estimates/${basis.binding.estimate_id}`}
              icon="estimate"
            />
          )}
          <CpqNav
            label="Rules studio"
            href="/estimating/rules"
            icon="documents"
          />
        </>
      }
    >
      <div className="cpq-workbench">
        <div className="cpq-main">
          <CpqHeader
            title={workspace.context.title}
            context={option.label}
            status={
              historical
                ? "Historical · read only"
                : command.hasUnsavedChanges
                  ? "Unsaved changes"
                  : command.status
            }
          >
            <Button onClick={() => setSummary(true)}>
              <ProductIcon name="list" />
              Summary
            </Button>
            {historical && (
              <ButtonLink
                href={`/estimating/cpq/${workspace.workspace.id}?option=${option.id}`}
              >
                Open working configuration
              </ButtonLink>
            )}
          </CpqHeader>
          {historical && (
            <div className="cpq-historical">
              Evaluation {savedRun?.evaluation_number} · saved{" "}
              {stamp(savedRun?.updated_at)}. This retained evaluation is read only.
            </div>
          )}
          <div className="cpq-readiness">
            <span>Readiness</span>
            <CpqPill tone={displayedCurrent && result?.ready ? "good" : "warning"}>
              {calculating
                ? "Recalculating"
                : !displayedCurrent
                  ? "Current inputs need evaluation"
                  : result?.ready
                    ? "Calculation complete"
                    : "Checks required"}
            </CpqPill>
            <CpqPill>Review after use</CpqPill>
            {sourceStale && (
              <Button variant="quiet" onClick={() => void compareActive()}>
                Source changed · compare current basis
              </Button>
            )}
          </div>
          <CpqTabs
            tabs={[
              "Configure",
              "Materials & labour",
              "Pricing",
              "Compare",
              "History",
            ]}
            current={tab}
            onChange={setTab}
          />
          <div className="cpq-phone-selector">
            <CpqField label="System">
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setTab("Configure");
                }}
              >
                <option value="overview">Solution overview</option>
                {input.instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </CpqField>
          </div>
          <div className="cpq-body">
            <div className="cpq-scroll">
              <div className="cpq-stack">
                <ErrorNotice error={command.error ?? error} focusOnError={false} />
                {command.uncertain && (
                  <CpqNotice tone="warning">
                    <p>
                      The save outcome is uncertain. Keep the original action until
                      its receipt is confirmed.
                    </p>
                    <Button
                      busy={command.busy}
                      onClick={() => void command.reconcile()}
                    >
                      Confirm original action
                    </Button>
                  </CpqNotice>
                )}
                {adopted && (
                  <CpqNotice tone="good">
                    The configuration was used in the estimate.{" "}
                    <Link href={`/estimating/estimates/${adopted}/review`}>
                      Open estimate review
                    </Link>
                    .
                  </CpqNotice>
                )}
                {tab === "Configure" &&
                  (selectedInstance ? (
                    <>
                      <div className="cpq-section-head">
                        <div>
                          <h2>
                            {input.instances.indexOf(selectedInstance) + 1} ·{" "}
                            {selectedInstance.label}
                          </h2>
                          <small>
                            {definition.label} · quantities follow the selected
                            release
                          </small>
                        </div>
                      </div>
                      <CpqField label="System name">
                        <input
                          readOnly={!editable}
                          disabled={busy}
                          value={selectedInstance.label}
                          maxLength={100}
                          onChange={(e) =>
                            change({
                              ...input,
                              instances: input.instances.map((i) =>
                                i.id === selected
                                  ? { ...i, label: e.target.value }
                                  : i,
                              ),
                            })
                          }
                        />
                      </CpqField>
                      {!!definition.facts.some((f) => f.binding) && (
                        <section className="cpq-stack-tight">
                          <h3>Facts from the estimate · read only here</h3>
                          <Link
                            href={`/estimating/discovery/${workspace.workspace.id}`}
                          >
                            Change in the estimation wizard
                          </Link>
                          <div className="cpq-fact-grid">
                            {definition.facts
                              .filter((f) => f.binding)
                              .map((f) => (
                                <div key={f.key}>
                                  <small>{f.label}</small>
                                  <strong>
                                    {selectedInstance.facts[f.key] === null
                                      ? "Unknown"
                                      : String(selectedInstance.facts[f.key])}{" "}
                                    {f.unit}
                                  </strong>
                                  <small>{f.source}</small>
                                </div>
                              ))}
                          </div>
                        </section>
                      )}
                      {definition.facts
                        .filter((f) => !f.binding)
                        .map((f) => {
                          const options = definition.design?.option_sets.find(
                              (s) => s.fact === f.key,
                            ),
                            value = selectedInstance.facts[f.key];
                          return (
                            <section key={f.key} className="cpq-stack-tight">
                              {options ? (
                                <>
                                  <div className="cpq-section-head">
                                    <h3>{f.label}</h3>
                                    <small>
                                      {f.required
                                        ? "Required · choose one"
                                        : "Choose one"}
                                    </small>
                                  </div>
                                  <div
                                    className="cpq-option-grid"
                                    role="radiogroup"
                                    aria-label={f.label}
                                  >
                                    {options.options.map((o) => {
                                      const availability =
                                          result?.explanation?.options.find(
                                            (x) =>
                                              x.instance_id === selected &&
                                              x.set === options.key &&
                                              x.value === o.value,
                                          ),
                                        available =
                                          availability?.available !== false;
                                      return (
                                        <label
                                          key={o.value}
                                          className="cpq-option"
                                          data-selected={value === o.value}
                                          data-unavailable={!available}
                                        >
                                          <input
                                            type="radio"
                                            name={f.key}
                                            value={o.value}
                                            checked={value === o.value}
                                            disabled={
                                              !editable || busy || !available
                                            }
                                            onChange={() =>
                                              fact(selected, f.key, o.value)
                                            }
                                          />
                                          <span>
                                            <strong>{o.label}</strong>
                                            <small>
                                              {value === o.value
                                                ? "Selected"
                                                : availability?.available === null
                                                  ? "Availability not yet known"
                                                  : available
                                                    ? "Available"
                                                    : o.reason}
                                            </small>
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </>
                              ) : (
                                <CpqField
                                  label={f.label + (f.required ? " *" : "")}
                                  help={
                                    <>
                                      {f.description ?? f.source} · {f.unit}
                                      {f.minimum != null
                                        ? ` · ${f.minimum} to ${f.maximum ?? "no maximum"}`
                                        : ""}
                                    </>
                                  }
                                >
                                  {f.type === "Boolean" ? (
                                    <select
                                      disabled={!editable || busy}
                                      value={
                                        value === null || value === undefined
                                          ? ""
                                          : String(value)
                                      }
                                      onChange={(e) =>
                                        fact(
                                          selected,
                                          f.key,
                                          e.target.value === ""
                                            ? null
                                            : e.target.value === "true",
                                        )
                                      }
                                    >
                                      <option value="">Unknown</option>
                                      <option value="true">Yes</option>
                                      <option value="false">No</option>
                                    </select>
                                  ) : f.type === "Choice" ? (
                                    <select
                                      disabled={!editable || busy}
                                      value={String(value ?? "")}
                                      onChange={(e) =>
                                        fact(
                                          selected,
                                          f.key,
                                          e.target.value || null,
                                        )
                                      }
                                    >
                                      <option value="">Unknown</option>
                                      {f.choices.map((c) => (
                                        <option key={c}>{c}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      readOnly={!editable}
                                      disabled={busy}
                                      inputMode={
                                        ["Integer", "Decimal"].includes(f.type)
                                          ? "decimal"
                                          : "text"
                                      }
                                      value={String(value ?? "")}
                                      maxLength={f.type === "Text" ? 500 : 30}
                                      placeholder="Unknown"
                                      onChange={(e) =>
                                        fact(
                                          selected,
                                          f.key,
                                          e.target.value || null,
                                        )
                                      }
                                    />
                                  )}
                                </CpqField>
                              )}
                              {definition.schema_version === 3 &&
                                !f.required &&
                                editable && (
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={
                                        selectedInstance.not_applicable?.includes(
                                          f.key,
                                        ) ?? false
                                      }
                                      disabled={busy}
                                      onChange={(e) =>
                                        change({
                                          ...input,
                                          instances: input.instances.map((i) =>
                                            i.id === selected
                                              ? {
                                                  ...i,
                                                  facts: {
                                                    ...i.facts,
                                                    [f.key]: null,
                                                  },
                                                  not_applicable: e.target.checked
                                                    ? [
                                                        ...(
                                                          i.not_applicable ?? []
                                                        ).filter(
                                                          (k) => k !== f.key,
                                                        ),
                                                        f.key,
                                                      ]
                                                    : (
                                                        i.not_applicable ?? []
                                                      ).filter((k) => k !== f.key),
                                                }
                                              : i,
                                          ),
                                        })
                                      }
                                    />{" "}
                                    Not applicable
                                  </label>
                                )}
                            </section>
                          );
                        })}
                      <Button onClick={() => setTab("Materials & labour")}>
                        Review materials & labour <ProductIcon name="expand" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="cpq-section-head">
                        <div>
                          <h2>Solution overview</h2>
                          <small>
                            {option.label} · {input.instances.length} systems
                          </small>
                        </div>
                        {editable && (
                          <Button
                            disabled={busy || input.instances.length >= 20}
                            onClick={() => {
                              const instance = blankInput(
                                definition,
                                acceptedBasis!,
                              ).instances[0];
                              instance.label = `System ${input.instances.length + 1}`;
                              change({
                                ...input,
                                instances: [...input.instances, instance],
                              });
                              setSelected(instance.id);
                            }}
                          >
                            <ProductIcon name="plus" />
                            Add system
                          </Button>
                        )}
                      </div>
                      {input.instances.map((i, n) => (
                        <section key={i.id} className="cpq-card cpq-section-head">
                          <div>
                            <h3>
                              {n + 1} · {i.label}
                            </h3>
                            <small>{definition.label}</small>
                          </div>
                          <Button onClick={() => setSelected(i.id)}>
                            Configure <ProductIcon name="expand" />
                          </Button>
                        </section>
                      ))}
                      {!!result?.explanation?.capacity.length && (
                        <section className="cpq-card cpq-stack-tight">
                          <h3>Shared controller capacity</h3>
                          {result.explanation.capacity.map((c) => (
                            <div className="cpq-section-head" key={c.key + c.group}>
                              <span>
                                {c.group} · {quantity(c.demand)} of{" "}
                                {quantity(c.capacity)} outputs
                              </span>
                              <CpqPill
                                tone={c.state === "Ready" ? "good" : "warning"}
                              >
                                {c.state}
                              </CpqPill>
                            </div>
                          ))}
                        </section>
                      )}
                      <CpqField label="Pricing date">
                        <input
                          type="date"
                          readOnly={!editable}
                          disabled={busy}
                          value={input.pricing_date}
                          onChange={(e) =>
                            change({ ...input, pricing_date: e.target.value })
                          }
                        />
                      </CpqField>
                      <CpqNotice>
                        Requirements are retained in the estimation wizard.
                        Configure systems here, save the evaluation, then review the
                        exact estimate handover.
                      </CpqNotice>
                    </>
                  ))}
                {tab === "Materials & labour" &&
                  (result ? (
                    <CpqMaterials
                      result={result}
                      definition={definition}
                      input={input}
                      readOnly={!editable || busy || !current}
                      onWhy={setWhy}
                      onAdjust={setAdjust}
                    />
                  ) : (
                    <CpqEmpty>
                      Complete the configuration to calculate materials and labour.
                    </CpqEmpty>
                  ))}
                {tab === "Pricing" && result && (
                  <CpqPricing
                    result={result}
                    input={input}
                    d={definition}
                    readOnly={!editable || busy}
                    onPricing={(pricing) => change({ ...input, pricing })}
                  />
                )}
                {tab === "Compare" && (
                  <>
                    <h2>Compare evaluations</h2>
                    <CpqField label="Compare with saved evaluation">
                      <select
                        value={comparisonRun?.id ?? ""}
                        onChange={(e) => {
                          if (e.target.value)
                            void api<Saved>(`cpq/runs/${e.target.value}`)
                              .then(setComparisonRun)
                              .catch(setError);
                          else setComparisonRun(null);
                        }}
                      >
                        <option value="">Choose an evaluation</option>
                        {history.items
                          .filter((r) => r.option_id === option.id)
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {stamp(r.saved_at)} · {r.state} ·{" "}
                              {money(r.totals.sell)}
                            </option>
                          ))}
                      </select>
                    </CpqField>
                    {comparisonRun && result && (
                      <Comparison before={comparisonRun.result} after={result} />
                    )}{" "}
                    {!historical && (
                      <Button disabled={busy} onClick={() => void compareActive()}>
                        Compare against current release and source
                      </Button>
                    )}
                  </>
                )}
                {tab === "History" && (
                  <>
                    <h2>Saved evaluation history</h2>
                    <p>
                      Each evaluation preserves its inputs, rule release, generated
                      lines and adjustments.
                    </p>
                    {history.items
                      .filter((r) => r.option_id === option.id)
                      .map((r) => (
                        <article className="cpq-card cpq-section-head" key={r.id}>
                          <div>
                            <Link
                              href={`/estimating/cpq/${workspace.workspace.id}?option=${option.id}&evaluation=${r.id}`}
                            >
                              Saved {stamp(r.saved_at)}
                            </Link>
                            <small className="cpq-subtext">
                              {r.input.overrides.length} adjustments ·{" "}
                              {r.diagnostic_count} checks ·{" "}
                              {r.parent_id
                                ? "Successor evaluation"
                                : "First evaluation"}
                            </small>
                          </div>
                          <strong>AUD {money(r.totals.sell)}</strong>
                          <CpqPill tone={r.state === "Ready" ? "good" : "warning"}>
                            {r.state}
                          </CpqPill>
                        </article>
                      ))}
                  </>
                )}
                {!!result?.diagnostics.length && (
                  <section
                    className="cpq-stack-tight"
                    aria-label="Calculation checks"
                  >
                    <h3>Before use in estimate</h3>
                    {result.diagnostics.map((d, n) => (
                      <CpqNotice key={n} tone="warning">
                        {d.message}
                      </CpqNotice>
                    ))}
                  </section>
                )}
                {!!orphaned.length && (
                  <section
                    className="cpq-stack-tight"
                    aria-label="Retained adjustments"
                  >
                    <h3>Adjustments without a generated line</h3>
                    <p>
                      These saved adjustments are retained. Restore their source
                      configuration or remove them with a reason before use.
                    </p>
                    {orphaned.map((o) => (
                      <article className="cpq-card" key={o.target + o.kind}>
                        <strong>
                          {o.kind} · {o.value ?? "Excluded"}
                        </strong>
                        <p>{o.reason}</p>
                        <small>{o.target}</small>
                        <Button
                          disabled={!editable || busy}
                          onClick={() => {
                            setOrphan(o);
                            setRemovalReason("");
                          }}
                        >
                          Remove retained adjustment
                        </Button>
                      </article>
                    ))}
                  </section>
                )}
              </div>
            </div>
          </div>
          {!historical && (
            <footer className="cpq-footer">
              <div>
                <strong role="status">
                  {calculating
                    ? "Recalculating…"
                    : command.hasUnsavedChanges
                      ? "Unsaved changes"
                      : command.status}
                </strong>
                <small>
                  {current
                    ? "Save the configuration before using it in the estimate."
                    : "Incomplete entries can be saved as a working draft."}
                </small>
              </div>
              <div className="cpq-actions">
                <Button
                  variant="primary"
                  busy={command.busy}
                  disabled={!editable || busy || calculating}
                  onClick={() => void save()}
                >
                  {current ? "Save configuration" : "Save working draft"}
                </Button>
                <Button
                  disabled={!canUse}
                  onClick={() => void openEstimatePreview()}
                >
                  Use in estimate
                </Button>
              </div>
            </footer>
          )}
        </div>
        {tab === "Configure" && (
          <aside className="cpq-summary">{summaryContent}</aside>
        )}
      </div>
      {summary && (
        <CpqDialog
          title="Configuration summary"
          drawer
          onClose={() => setSummary(false)}
        >
          <div className="cpq-summary cpq-summary-dialog">{summaryContent}</div>
        </CpqDialog>
      )}
      {why && result && (
        <CpqWhy
          line={why}
          result={result}
          definition={definition}
          input={input}
          onClose={() => setWhy(null)}
        />
      )}
      {adjust && (
        <CpqAdjustment
          line={adjust}
          onClose={() => setAdjust(null)}
          onApply={(kind, value, why) => {
            change({
              ...input,
              overrides: [
                ...input.overrides.filter(
                  (o) => o.target !== adjust.target || o.kind !== kind,
                ),
                ...(value ? [value] : []),
              ],
            });
            setReason(why);
            setAdjust(null);
          }}
        />
      )}
      {orphan && (
        <CpqDialog
          title="Remove retained adjustment"
          onClose={() => setOrphan(null)}
          footer={
            <>
              <Button onClick={() => setOrphan(null)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!removalReason.trim() || busy}
                onClick={() => {
                  change({
                    ...input,
                    overrides: input.overrides.filter(
                      (o) =>
                        o.target !== orphan.target || o.kind !== orphan.kind,
                    ),
                  });
                  setReason(removalReason.trim());
                  setOrphan(null);
                }}
              >
                Remove adjustment
              </Button>
            </>
          }
        >
          <div className="cpq-stack">
            <p>
              The source line is absent from this evaluation. Earlier saved
              evaluations retain the original adjustment.
            </p>
            <CpqField
              label="Removal reason"
              help="Retained with the next saved evaluation."
            >
              <textarea
                rows={3}
                maxLength={500}
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
              />
            </CpqField>
          </div>
        </CpqDialog>
      )}
      {comparison && (
        <CpqDialog
          title="Compare against current basis"
          onClose={() => setComparison(null)}
          footer={
            <>
              <Button onClick={() => setComparison(null)}>
                Keep current basis
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setAcceptedBasis(comparison.basis);
                  setInitialHash(comparison.basis.binding_hash);
                  setDefinition(comparison.basis.release.definition);
                  change(comparison.input);
                  setResultState({
                    input: JSON.stringify(comparison.input),
                    result: comparison.after,
                  });
                  setComparison(null);
                }}
              >
                Use this basis in the working configuration
              </Button>
            </>
          }
        >
          <div className="cpq-stack">
            <CpqNotice>
              Saved evaluations stay unchanged. Retained adjustments with a
              changed basis require review before estimate handover.
            </CpqNotice>
            <Comparison before={comparison.before} after={comparison.after} />
          </div>
        </CpqDialog>
      )}
      {receiving && savedRun && (
        <CpqDialog
          title="Use in estimate"
          onClose={() => {
            if (!busy) setReceiving(null);
          }}
          footer={
            <>
              <Button disabled={busy} onClick={() => setReceiving(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                busy={command.busy}
                disabled={
                  busy ||
                  !adoptTitle.trim() ||
                  Object.values(adoptScope).some((v) => !v.trim())
                }
                onClick={() => {
                  action.current = "adopt";
                  void command.send(`cpq/runs/${savedRun.id}/adoption`, {
                    preview_hash: receiving.preview_hash,
                    result_hash: receiving.result_hash,
                    estimate_id:
                      receiving.binding.estimate_id ?? crypto.randomUUID(),
                    title: adoptTitle,
                    scope: adoptScope,
                    reason:
                      "Use this exact saved CPQ evaluation in the selected estimate.",
                  });
                }}
              >
                Use saved evaluation
              </Button>
            </>
          }
        >
          <div className="cpq-stack">
            <CpqNotice>
              Creates estimate v{receiving.binding.estimate_version + 1} for
              review. {receiving.generated_lines.length} CPQ lines replace the
              previous CPQ contribution; {receiving.retained_lines.length} other
              lines are retained.
            </CpqNotice>
            <p>
              Saved evaluation {savedRun.evaluation_number} · proposed sell AUD{" "}
              {money(savedRun.result.totals.sell)}
            </p>
            <CpqField label="Estimate title">
              <input
                disabled={busy}
                value={adoptTitle}
                onChange={(e) => setAdoptTitle(e.target.value)}
              />
            </CpqField>
            <CpqMilestones proposals={receiving.milestone_proposals} />
            {(["included", "excluded", "assumptions"] as const).map((k) => (
              <CpqField key={k} label={k[0].toUpperCase() + k.slice(1)}>
                <textarea
                  rows={2}
                  disabled={busy}
                  value={adoptScope[k]}
                  onChange={(e) =>
                    setAdoptScope({ ...adoptScope, [k]: e.target.value })
                  }
                />
              </CpqField>
            ))}
            <ErrorNotice error={command.error} />
          </div>
        </CpqDialog>
      )}
    </CpqFrame>
  );
}
function Comparison({
  before,
  after,
}: {
  before: Calculation | null;
  after: Calculation;
}) {
  const targets = [
    ...new Set([...(before?.lines ?? []), ...after.lines].map((l) => l.target)),
  ];
  return (
    <div className="cpq-stack">
      <div className="cpq-grid">
        <section className="cpq-card">
          <h3>Before</h3>
          <strong>AUD {money(before?.totals.sell)}</strong>
          <small className="cpq-subtext">
            {before?.diagnostics.length ?? 0} checks
          </small>
        </section>
        <section className="cpq-card">
          <h3>After</h3>
          <strong>AUD {money(after.totals.sell)}</strong>
          <small className="cpq-subtext">
            {after.diagnostics.length} checks
          </small>
        </section>
      </div>
      <table className="cpq-table cpq-table-responsive">
        <thead>
          <tr>
            <th>Line</th>
            <th>Before quantity</th>
            <th>After quantity</th>
            <th>Before unit sell</th>
            <th>After unit sell</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => {
            const a = before?.lines.find((l) => l.target === t),
              b = after.lines.find((l) => l.target === t);
            return (
              <tr key={t}>
                <td>{(b ?? a)?.line.description}</td>
                <td data-label="Before quantity">
                  {a ? quantity(a.line.quantity) : "Added"}
                </td>
                <td data-label="After quantity">
                  {b ? quantity(b.line.quantity) : "Removed / unresolved"}
                </td>
                <td data-label="Before unit sell">
                  {money(a?.line.unit_sell)}
                </td>
                <td data-label="After unit sell">{money(b?.line.unit_sell)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {after.diagnostics.map((d, n) => (
        <CpqNotice tone="warning" key={n}>
          {d.message}
        </CpqNotice>
      ))}
    </div>
  );
}
