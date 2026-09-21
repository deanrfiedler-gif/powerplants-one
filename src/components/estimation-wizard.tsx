"use client";
import Link from "next/link";
import { SpecialistEntry } from "./specialist-entry";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  api,
  ErrorNotice,
  Field,
  SelectField,
  ValidationFields,
} from "./business-ui";
import { useCrmResource, useCrmCommand, denied } from "./crm-state";
import { useIdentity } from "./business-session";
import { RecordTabs } from "./record-ui";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { useScopePreferences } from "./scope-preferences";
import { useDiscoveryNavigation } from "./discovery-navigation";
import {
  DiscoveryFields,
  activeInput,
  blankDiscovery,
  type FormOptions,
} from "./discovery-fields";
import {
  AreasEditor,
  FamilyOverview,
  ResponsibilitiesEditor,
  SystemsEditor,
} from "./configuration-editor";
import { ProposalEditor, ScopeView } from "./discovery-screens";
import {
  configurationCounts,
  emptyConfiguration,
  type Configuration,
  type DiscoveryFinding,
} from "../estimating/configuration-definition";
import { discoveryDefinition } from "../estimating/discovery-definition";
import { calculate, decimal, scaled } from "../estimating/math";
import type { DiscoveryInput } from "../estimating/discovery";
import type { DiscoveryRevision } from "../estimating/discovery-workspace-context";
import type {
  readDiscoveryWorkspace,
  previewDiscoveryChange,
} from "../estimating/discovery-workspaces";
import type {
  readDiscoverySummary,
  listDiscoveryHistory,
  compareDiscoverySources,
  readConfigurationEvidence,
  listDiscoveryCostVersions,
} from "../estimating/discovery-reads";
import "./discovery.css";
import "./estimation-wizard.css";
type Detail = Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
type Summary = Awaited<ReturnType<typeof readDiscoverySummary>>;
type Preview = Awaited<ReturnType<typeof previewDiscoveryChange>>;
const steps = [
  "Requirements",
  "Configuration",
  "Scope & delivery",
  "Pricing",
  "Review",
] as const;
type Step = (typeof steps)[number];
const money = (amount: string | null) =>
  amount === null
    ? "Price pending"
    : `AUD ${amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
const date = (value: string | Date) =>
  new Date(value).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });
function Dialog({
  title,
  children,
  close,
  inspect = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  inspect?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`es02-dialog${inspect ? " es02-inspector" : ""}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="es02-section-title">
        <h2>{title}</h2>
        <button type="button" onClick={close} aria-label={`Close ${title}`}>
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
function SummaryPanel({
  summary,
  version,
  label,
  selected,
  dirty,
  readiness,
  config,
  findings,
  effort,
  evaluated,
  costingUrl,
  onStep,
  onTab,
}: {
  summary: ReturnType<typeof useCrmResource<Summary>>;
  version: number;
  label: string;
  selected: boolean;
  dirty: boolean;
  readiness: string;
  config: Configuration | undefined;
  findings: DiscoveryFinding[];
  effort: string;
  evaluated: boolean;
  costingUrl: string | null;
  onStep: (s: Step) => void;
  onTab: (s: string) => void;
}) {
  const s = summary.data,
    counts = config ? configurationCounts(config, findings) : null;
  return (
    <aside className="es02-summary" aria-label="Estimate summary">
      <h2>Estimate summary</h2>
      <h3>Alternative {label}</h3>
      <p>
        {selected
          ? "Selected alternative"
          : "Viewed alternative · not selected"}
      </p>
      <p>
        Viewing: {dirty ? "working copy of" : "saved discovery"} r
        {String(version).padStart(2, "0")}
      </p>
      <p>
        Discovery readiness: <strong>{readiness}</strong>
      </p>
      {counts && (
        <p>
          {counts.growing_areas} growing areas · {counts.systems} systems ·{" "}
          {evaluated
            ? `${counts.to_confirm} to confirm`
            : "configuration not checked"}
        </p>
      )}
      <hr />
      <ErrorNotice error={summary.error} />
      {summary.loading && <p role="status">Loading saved estimate…</p>}
      {s?.status === "NoEstimate" && <p>Not yet costed</p>}
      {s?.status === "Unavailable" && (
        <p>Saved estimate unavailable under current access.</p>
      )}
      {s?.status === "Available" && (
        <>
          <h3>
            Saved estimate · Estimate v{String(s.version).padStart(2, "0")}
          </h3>
          <p className="es02-money">{money(s.sell_total)}</p>
          <p>Excluding tax · tax not calculated</p>
          <p>
            Cost basis:{" "}
            {s.basis
              ? `Discovery r${String(s.basis.revision).padStart(2, "0")}`
              : "E1 manual basis — E2 questionnaire not recorded"}
          </p>
          {s.basis && (version !== s.basis.revision || dirty) && (
            <p>
              Newer discovery is not yet costed. Saved prices remain unchanged.
            </p>
          )}
          <Link href={`/estimating/estimates/${s.estimate_id}`}>
            Open manual estimate
          </Link>
        </>
      )}
      <hr />
      {findings
        .filter((f) => f.step === "Configuration")
        .map((f) => (
          <button
            className="es02-finding"
            type="button"
            key={f.key}
            onClick={() => onStep("Configuration")}
          >
            {f.message}
          </button>
        ))}
      <p>Estimating effort: {effort}</p>
      {costingUrl && (
        <Link href={costingUrl}>Review scope for manual costing</Link>
      )}
      <p>Delivery routing: Not configured</p>
      <button type="button" onClick={() => onTab("Alternatives")}>
        Compare alternatives
      </button>
      <button type="button" onClick={() => onTab("Revisions")}>
        View revision history
      </button>
      <small>Synthetic preview</small>
    </aside>
  );
}
function Pricing({ summary }: { summary: Summary | null }) {
  const [search, setSearch] = useState(""),
    [view, setView] = useState("Line items");
  if (!summary || summary.status !== "Available")
    return (
      <p>
        {summary?.status === "Unavailable"
          ? "Saved estimate unavailable."
          : "No saved manual prices for this alternative. Unpriced scope is not zero."}
      </p>
    );
  const total = calculate(summary.lines),
    shown = total.items.filter((l) =>
      `${l.description} ${l.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  return (
    <>
      <h2>Saved manual prices · Estimate v{summary.version}</h2>
      <p>
        Basis:{" "}
        {summary.basis
          ? `Discovery r${summary.basis.revision}`
          : "E1 manual basis"}
        . AUD · Excluding tax · tax not calculated.
      </p>
      <div className="es02-toolbar">
        <Field
          label="Search saved lines"
          name="price-search"
          value={search}
          onChange={setSearch}
        />
        <SelectField
          label="Pricing view"
          name="price-view"
          value={view}
          onChange={setView}
          options={["Line items", "Cost types"].map((id) => ({
            id,
            display_name: id,
          }))}
        />
      </div>
      <div className="es02-table-scroll">
        <table>
          {view === "Line items" ? (
            <>
              <thead>
                <tr>
                  {[
                    "Description",
                    "Category",
                    "Quantity",
                    "Unit",
                    "Unit cost",
                    "Cost total",
                    "Unit sell",
                    "Sell total",
                    "Source",
                    "Effective date",
                    "Allowance",
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id}>
                    {[
                      l.description,
                      l.category,
                      l.quantity,
                      l.unit,
                      l.unit_cost,
                      l.cost_total,
                      l.unit_sell,
                      l.sell_total,
                      l.source,
                      l.effective_date,
                      l.allowance === undefined
                        ? "Not recorded"
                        : l.allowance
                          ? "Yes"
                          : "No",
                    ].map((v, i) => (
                      <td key={i}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th>Cost type</th>
                  <th>Shown cost</th>
                  <th>Shown sell</th>
                </tr>
              </thead>
              <tbody>
                {[
                  "Product",
                  "Labour",
                  "Freight",
                  "Engineering",
                  "Subcontract",
                ].map((category) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>
                      {decimal(
                        shown
                          .filter((l) => l.category === category)
                          .reduce((n, l) => n + scaled(l.cost_total, 2), 0n),
                      )}
                    </td>
                    <td>
                      {decimal(
                        shown
                          .filter((l) => l.category === category)
                          .reduce((n, l) => n + scaled(l.sell_total, 2), 0n),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
      <p>
        Shown lines:{" "}
        {money(
          shown.length
            ? decimal(shown.reduce((n, l) => n + scaled(l.sell_total, 2), 0n))
            : null,
        )}{" "}
        · Saved total: {money(summary.sell_total)}
      </p>
      <p>
        Margin: {total.margin_percent ?? "Not applicable"}% · Markup:{" "}
        {total.markup_percent ?? "Not applicable"}%
      </p>
      <p>
        Packages have no adopted saved membership. Supplier-price refresh and
        specialist calculators are not integrated. Manual prices remain
        authoritative for this saved version.
      </p>
      <Link href={`/estimating/estimates/${summary.estimate_id}`}>
        Open manual estimate and View/Create Draft quotation
      </Link>
    </>
  );
}
type CostChoice = { estimate_id: string; version_id: string };
function CostSelector({
  id,
  optionId,
  label,
  value,
  onChange,
}: {
  id: string;
  optionId: string | null;
  label: string;
  value: CostChoice | null;
  onChange: (value: CostChoice | null) => void;
}) {
  const [before, setBefore] = useState<number | null>(null);
  const versions = useCrmResource<
    Awaited<ReturnType<typeof listDiscoveryCostVersions>>
  >(
    optionId
      ? `estimating/workspaces/${id}/cost-versions?option_id=${optionId}${before ? `&before=${before}` : ""}`
      : null,
    true,
  );
  return (
    <div>
      <SelectField
        label={`${label} saved estimate version (optional)`}
        name={`${label}-cost`}
        value={value?.version_id ?? ""}
        options={
          versions.data?.items.map((v) => ({
            id: v.id,
            display_name: `Estimate v${v.version} · ${money(v.amount)} · ${v.basis ? `basis Discovery r${v.basis.revision}` : "E1 manual basis"}`,
          })) ?? []
        }
        onChange={(id) => {
          const v = versions.data?.items.find((v) => v.id === id);
          onChange(v ? { estimate_id: v.estimate_id, version_id: v.id } : null);
        }}
      />
      <ErrorNotice error={versions.error} />
      {versions.data?.status === "NoEstimate" && <p>Not yet costed</p>}
      {versions.data?.status === "Unavailable" && (
        <p>Saved estimate unavailable</p>
      )}
      {before && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setBefore(null);
          }}
        >
          Latest {label.toLowerCase()} prices
        </button>
      )}
      {versions.data?.next && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setBefore(versions.data!.next);
          }}
        >
          Older {label.toLowerCase()} prices
        </button>
      )}
    </div>
  );
}
function History({
  id,
  optionId,
  detail,
  onStartingPoint,
}: {
  id: string;
  optionId: string;
  detail: Detail;
  onStartingPoint: (r: DiscoveryRevision) => void;
}) {
  const [before, setBefore] = useState<number | null>(null),
    [baseline, setBaseline] = useState(""),
    [target, setTarget] = useState(""),
    [error, setError] = useState<unknown>(null),
    [comparison, setComparison] = useState<Awaited<
      ReturnType<typeof compareDiscoverySources>
    > | null>(null),
    [inspect, setInspect] = useState<DiscoveryRevision | null>(null);
  const history = useCrmResource<
    Awaited<ReturnType<typeof listDiscoveryHistory>>
  >(
    `estimating/workspaces/${id}/history?option_id=${optionId}${before ? `&before=${before}` : ""}`,
    true,
  );
  const [baselineCost, setBaselineCost] = useState<CostChoice | null>(null),
    [targetCost, setTargetCost] = useState<CostChoice | null>(null);
  const sources = [
    ...(history.data?.items.map((r) => ({
      id: r.id,
      option_id: optionId,
      display_name: `Viewed alternative · r${r.version} · ${r.scope_readiness}`,
    })) ?? []),
    ...detail.options
      .filter((o) => o.option.id !== optionId)
      .map((o) => ({
        id: o.revision.id,
        option_id: o.option.id,
        display_name: `Alternative ${o.option.label} · r${o.revision.version} · ${o.revision.scope_readiness}`,
      })),
  ];
  return (
    <section>
      <h2>Immutable discovery revisions</h2>
      <p>
        Comparison uses exact saved sources. Unsaved working changes are outside
        this comparison.
      </p>
      <ErrorNotice error={history.error ?? error} />
      {history.loading && <p role="status">Loading permitted history…</p>}
      <div className="es02-table-scroll">
        <table>
          <thead>
            <tr>
              {[
                "Revision",
                "Source",
                "Author",
                "Saved",
                "Reason",
                "Readiness",
                "Actions",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.data?.items.map((r) => (
              <tr key={r.id}>
                <td>r{r.version}</td>
                <td>
                  {r.copied_from_id
                    ? "Copied source"
                    : r.predecessor_id
                      ? "Successor"
                      : "Original"}
                </td>
                <td>{r.author}</td>
                <td>{date(r.created_at)}</td>
                <td>{r.reason}</td>
                <td>
                  {r.kind === "LegacyManual"
                    ? "E1 manual basis — E2 questionnaire not recorded"
                    : r.scope_readiness}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() =>
                      void api<DiscoveryRevision>(
                        `estimating/workspaces/${id}/revisions?revision_id=${r.id}`,
                      ).then(setInspect, setError)
                    }
                  >
                    Inspect revision
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="es02-toolbar">
        <button
          type="button"
          disabled={before === null}
          onClick={() => setBefore(null)}
        >
          Latest revisions
        </button>
        <button
          type="button"
          disabled={!history.data?.next}
          onClick={() => setBefore(history.data!.next)}
        >
          Older revisions
        </button>
      </div>
      <div className="e2-grid">
        <SelectField
          label="Baseline saved revision"
          name="baseline"
          value={baseline}
          options={sources}
          onChange={(v) => {
            setBaseline(v);
            setBaselineCost(null);
            setComparison(null);
          }}
        />
        <SelectField
          label="Target saved revision"
          name="target"
          value={target}
          options={sources}
          onChange={(v) => {
            setTarget(v);
            setTargetCost(null);
            setComparison(null);
          }}
        />
      </div>
      <div className="e2-grid">
        <CostSelector
          key={`baseline:${baseline}`}
          id={id}
          optionId={sources.find((s) => s.id === baseline)?.option_id ?? null}
          label="Baseline"
          value={baselineCost}
          onChange={(v) => {
            setBaselineCost(v);
            setComparison(null);
          }}
        />
        <CostSelector
          key={`target:${target}`}
          id={id}
          optionId={sources.find((s) => s.id === target)?.option_id ?? null}
          label="Target"
          value={targetCost}
          onChange={(v) => {
            setTargetCost(v);
            setComparison(null);
          }}
        />
      </div>
      <button
        type="button"
        disabled={!baseline || !target}
        onClick={() => {
          setComparison(null);
          setError(null);
          void api<Awaited<ReturnType<typeof compareDiscoverySources>>>(
            `estimating/workspaces/${id}/compare`,
            {
              baseline_id: baseline,
              target_id: target,
              baseline_cost: baselineCost,
              target_cost: targetCost,
            },
          ).then(setComparison, setError);
        }}
      >
        Compare saved revisions
      </button>
      {comparison && (
        <section aria-label="Saved revision comparison">
          <h3>
            Alternative {comparison.baseline.option_label} r
            {comparison.baseline.revision} → Alternative{" "}
            {comparison.target.option_label} r{comparison.target.revision}
          </h3>
          <p>
            {comparison.baseline.id} → {comparison.target.id}
          </p>
          {(["baseline", "target"] as const).map((side) => (
            <p key={side}>
              {side === "baseline" ? "Baseline" : "Target"} saved money:{" "}
              {comparison.costs[side]
                ? `Estimate v${comparison.costs[side].version} · ${money(comparison.costs[side].amount)} · Excluding tax · basis ${comparison.costs[side].discovery_basis ? `Discovery r${comparison.costs[side].discovery_basis.revision}` : "E1 manual basis"}`
                : "No saved estimate version selected"}
            </p>
          ))}
          {comparison.costs.baseline?.amount != null &&
            comparison.costs.target?.amount != null && (
              <p>
                Saved sell difference:{" "}
                {money(
                  decimal(
                    scaled(comparison.costs.target.amount, 2) -
                      scaled(comparison.costs.baseline.amount, 2),
                  ),
                )}{" "}
                · AUD, excluding tax. Exact saved versions only.
              </p>
            )}
          {!comparison.differences.length ? (
            <p>No differences</p>
          ) : (
            comparison.differences.map((d) => (
              <details key={`${d.entity}:${d.entity_id}:${d.field}`}>
                <summary>
                  {d.change} · {d.entity} · {d.field}
                </summary>
                <div className="es02-diff">
                  <div>
                    <strong>Before</strong>
                    <pre>{JSON.stringify(d.before, null, 2)}</pre>
                  </div>
                  <div>
                    <strong>After</strong>
                    <pre>{JSON.stringify(d.after, null, 2)}</pre>
                  </div>
                </div>
              </details>
            ))
          )}
        </section>
      )}
      {inspect && (
        <Dialog
          inspect
          title={`Saved discovery r${inspect.version}`}
          close={() => setInspect(null)}
        >
          <p>
            {inspect.reason} · {date(inspect.created_at)}
          </p>
          {inspect.input ? (
            <ScopeView
              input={inspect.input}
              context={inspect.observed_context}
            />
          ) : (
            <p>E1 manual basis — E2 questionnaire not recorded.</p>
          )}
          {inspect.input?.configuration && (
            <pre>{JSON.stringify(inspect.input.configuration, null, 2)}</pre>
          )}
          {detail.can_edit &&
            inspect.input &&
            inspect.option_id === optionId && (
              <button
                type="button"
                onClick={() => {
                  onStartingPoint(inspect);
                  setInspect(null);
                }}
              >
                Use as starting point
              </button>
            )}
        </Dialog>
      )}
    </section>
  );
}
export function DiscoveryDetail({ id }: { id: string }) {
  const data = useCrmResource<Detail>(`estimating/workspaces/${id}`, true),
    identity = useIdentity();
  return (
    <>
      {data.loading && <p role="status">Loading permitted discovery…</p>}
      <ErrorNotice error={data.error} />
      {data.data && (
        <Wizard
          key={`${identity.actor_id}:${id}`}
          data={data.data}
          reload={data.reload}
        />
      )}
    </>
  );
}
function Wizard({ data: d, reload }: { data: Detail; reload: () => void }) {
  const params = useSearchParams(),
    identity = useIdentity(),
    id = d.workspace.id;
  const [viewed, setViewed] = useState(
      params.get("option") ?? d.workspace.selected_option_id,
    ),
    [tab, setTab] = useState("Discovery"),
    [step, setStep] = useState<Step>(
      steps.find((s) => s === params.get("step")) ?? "Requirements",
    ),
    [draft, setDraft] = useState<DiscoveryInput | null>(null),
    [base, setBase] = useState<{ version: number; revision_id: string } | null>(
      null,
    ),
    [historical, setHistorical] = useState<string | null>(null),
    [accepted, setAccepted] = useState(0),
    [savingReview, setSavingReview] = useState(false),
    [branch, setBranch] = useState<"Fresh" | "CopyDiscovery" | null>(null),
    [action, setAction] = useState<"Select" | "Archive" | "Reopen" | null>(
      null,
    ),
    [evidence, setEvidence] = useState<{ selected?: string } | null>(null),
    [lookupSearch, setLookupSearch] = useState(""),
    [reason, setReason] = useState("");
  const current =
      d.options.find((o) => o.option.id === viewed) ??
      d.options.find((o) => o.option.id === d.workspace.selected_option_id)!,
    r = current.revision;
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [actionBase, setActionBase] = useState<{
    expected_version: number;
    expected_revision_id: string;
    expected_selected_option_id: string;
  } | null>(null);
  const continuation = useRef<(() => void) | null>(null);
  const command = useCrmCommand(
    (receipt) => {
      setAccepted(receipt.record_version);
      setDraft(null);
      setBase(null);
      setSavingReview(false);
      setBranch(null);
      setAction(null);
      setReason("");
      setHistorical(null);
      reload();
      const next = continuation.current;
      continuation.current = null;
      next?.();
    },
    "Saved workspace",
    undefined,
    false,
  );
  const frozen = command.busy || command.uncertain,
    dirty = command.hasUnsavedChanges,
    navigation = useDiscoveryNavigation(dirty, frozen),
    preferences = useScopePreferences(
      `${identity.workspace_id}:${identity.actor_id}:es02`,
    ),
    menu = useSecondaryMenu(preferences.value.menu, (open) =>
      preferences.save({ ...preferences.value, menu: open }),
    );
  const input =
      draft ??
      (r.input
        ? {
            ...r.input,
            answers: [
              ...r.input.answers,
              ...r.retained_hidden_answers.filter(
                (a) =>
                  !r.input!.answers.some(
                    (x) => x.question_id === a.question_id,
                  ),
              ),
            ],
          }
        : null),
    canEdit = d.can_edit && current.option.state === "Active",
    scope = input?.scope;
  const optionPath = `estimating/workspaces/form-options?opportunity_id=${d.workspace.opportunity_id}&workspace_id=${id}&scope_mode=${scope?.mode ?? "Site"}${scope?.site_id ? `&site_id=${scope.site_id}` : ""}`;
  const options = useCrmResource<FormOptions>(
    canEdit
      ? `${optionPath}&selected_facility_ids=${scope?.facility_ids.join(",") ?? ""}&selected_equipment_ids=${scope?.equipment_ids.join(",") ?? ""}&search=${encodeURIComponent(lookupSearch)}`
      : null,
    true,
  );
  const available: FormOptions = options.data ?? {
    opportunity: {
      id: d.workspace.opportunity_id,
      title: d.context.title,
      version: d.workspace.version,
      site_id: r.site_id,
    },
    owner: { id: d.workspace.owner_id, display_name: d.context.owner },
    definition: discoveryDefinition,
    definition_hash: r.input?.definition_hash ?? "",
    sites: r.observed_context?.site
      ? [
          {
            id: r.site_id!,
            display_name: r.observed_context.site.display_name,
            version: r.observed_context.site.version,
          },
        ]
      : [],
    facilities:
      r.observed_context?.facilities.map((f) => ({
        id: f.id,
        display_name: f.name,
        version: f.version,
      })) ?? [],
    equipment:
      r.observed_context?.equipment.map((e) => ({
        id: e.id,
        display_name: `${e.display_number} · ${e.description}`,
        identity_status: e.identity_status,
        lifecycle_status: e.lifecycle_status,
        version: e.version,
      })) ?? [],
    owners: [{ id: d.workspace.owner_id, display_name: d.context.owner }],
    limits: { sites: 100, facilities: 100, equipment: 100 },
    more: { sites: false, facilities: false, equipment: false },
  };
  const summary = useCrmResource<Summary>(
    `estimating/workspaces/${id}/summary?option_id=${current.option.id}`,
    true,
  );
  const proposal = input
    ? {
        kind: "Save",
        option_id: current.option.id,
        expected_version: base?.version ?? d.workspace.version,
        expected_revision_id: base?.revision_id ?? r.id,
        discovery: activeInput(input, available),
        ...(historical ? { historical_source_id: historical } : {}),
      }
    : null;
  const signature = JSON.stringify(proposal),
    [preview, setPreview] = useState<{
      signature: string;
      result: Preview | null;
      error: unknown;
    } | null>(null);
  useEffect(() => {
    if (
      !dirty ||
      !canEdit ||
      signature === "null" ||
      frozen ||
      branch ||
      action
    )
      return;
    let live = true;
    const payload = JSON.parse(signature);
    const timer = setTimeout(() => {
      void api<Preview>(`estimating/workspaces/${id}/preview`, payload).then(
        (result) => {
          if (live) setPreview({ signature, result, error: null });
        },
        (error) => {
          if (live) setPreview({ signature, result: null, error });
        },
      );
    }, 450);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [signature, dirty, canEdit, frozen, branch, action, id]); // Exact proposal signature owns this preview.
  const evaluated = dirty
    ? preview?.signature === signature
      ? preview.result?.compiled
      : null
    : current.evaluation;
  const findings: DiscoveryFinding[] = [
    ...(evaluated?.findings ?? []),
    ...(evaluated?.open_items
      .filter((item) => !item.key.startsWith("ConfigurationFollowUp:"))
      .map((item) => ({
        key: item.key,
        entity_id: null,
        field: item.key,
        category: item.blocks_scope
          ? ("Readiness" as const)
          : ("Information" as const),
        step: ([
          "Q01",
          "Q02",
          "Q03",
          "Site",
          "Effort",
          "UnsupportedScope",
        ].includes(item.key)
          ? "Requirements"
          : ["Q05", "Q06"].includes(item.key)
            ? "Configuration"
            : "Scope & delivery") as DiscoveryFinding["step"],
        message: `${discoveryDefinition.questions.find((q) => q.id === item.key)?.label ?? item.key}: ${item.follow_up.reason}`,
        action: "ReviewField" as const,
      })) ?? []),
  ];
  const readiness = dirty
    ? (evaluated?.scope_readiness ??
      (preview?.signature === signature && preview.error
        ? "Not checked"
        : "Checking…"))
    : r.scope_readiness;
  const unchanged =
    preview?.signature === signature &&
    preview.result?.compiled.content_hash === r.content_hash &&
    !historical;
  const validPreview =
    preview?.signature === signature && !unchanged ? preview.result : null;
  const update = (value: DiscoveryInput) => {
    if (!canEdit || frozen) return;
    setBase(base ?? { version: d.workspace.version, revision_id: r.id });
    setDraft(value);
    command.dirty();
  };
  const updateConfig = (configuration: Configuration) =>
    input &&
    update({
      ...input,
      configuration,
      scope: {
        ...input.scope,
        facility_ids: [
          ...new Set([
            ...input.scope.facility_ids,
            ...configuration.areas.flatMap((a) =>
              a.facility_id &&
              available.facilities.some((f) => f.id === a.facility_id)
                ? [a.facility_id]
                : [],
            ),
            ...configuration.evidence.flatMap((e) =>
              e.source_type === "Facility" &&
              e.source_id &&
              available.facilities.some((source) => source.id === e.source_id)
                ? [e.source_id]
                : [],
            ),
          ]),
        ],
        equipment_ids: [
          ...new Set([
            ...input.scope.equipment_ids,
            ...configuration.systems.flatMap((s) =>
              s.equipment_ids.filter((id) =>
                available.equipment.some((e) => e.id === id),
              ),
            ),
            ...configuration.evidence.flatMap((e) =>
              e.source_type === "Asset" &&
              e.source_id &&
              available.equipment.some((source) => source.id === e.source_id)
                ? [e.source_id]
                : [],
            ),
          ]),
        ],
      },
    });
  const goOption = (id: string) =>
    navigation.request(() => {
      command.discard();
      setDraft(null);
      setBase(null);
      setHistorical(null);
      setViewed(id);
      setReason("");
    });
  const chooseAction = (a: typeof action) =>
    navigation.request(() => {
      command.discard();
      setDraft(null);
      setBase(null);
      setActionBase({
        expected_version: d.workspace.version,
        expected_revision_id: r.id,
        expected_selected_option_id: d.workspace.selected_option_id,
      });
      setAction(a);
    });
  const beginBranch = (mode: "Fresh" | "CopyDiscovery") =>
    navigation.request(() => {
      command.discard();
      setDraft(null);
      setBase(null);
      setBranch(mode);
    });
  const afterRead = accepted <= d.workspace.version;
  const costing =
    !dirty &&
    canEdit &&
    current.option.id === d.workspace.selected_option_id &&
    r.kind === "Discovery" &&
    r.scope_readiness === "Complete";
  if (denied(command.error) || denied(options.error) || denied(preview?.error))
    return (
      <ErrorNotice error={command.error ?? options.error ?? preview?.error} />
    );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-estimate-wizard"
      name="Estimating"
      menuId="es02-menu"
      contentId="es02-content"
      message={command.status}
      menu={
        <>
          <div className="mw-menu-title">
            <strong>Estimating</strong>
          </div>
          <nav aria-label="Estimating destinations">
            <ul>
              <li>
                <Link href="/estimating/discovery">Discovery register</Link>
              </li>
              <li>
                <Link href={`/estimating/discovery/${id}`} aria-current="page">
                  Estimation Wizard
                </Link>
              </li>
              <li><SpecialistEntry workspaceId={id} optionId={current.option.id}/></li>
              <li>
                <Link href="/estimating">Manual estimates</Link>
              </li>
              {summary.data?.status === "Available" && (
                <li>
                  <Link
                    href={`/estimating/estimates/${summary.data.estimate_id}`}
                  >
                    Draft quotations
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </>
      }
    >
      <div className="es02-layout">
        <div className="es02-main">
          <header className="es02-context">
            <h1>{d.context.title}</h1>
            <button
              type="button"
              className="es02-summary-toggle"
              aria-label={`${summaryOpen ? "Hide" : "Show"} estimate summary`}
              aria-pressed={summaryOpen}
              onClick={() => setSummaryOpen(!summaryOpen)}
            >
              Summary
            </button>
            <p>
              {r.observed_context?.organisation.display_name ??
                "Customer context"}{" "}
              ·{" "}
              {r.observed_context?.site?.display_name ??
                r.input?.scope.mode ??
                "Legacy scope"}{" "}
              · Owner: {d.context.owner}
            </p>
            <SelectField
              disabled={frozen}
              label="Viewed alternative"
              name="viewed-option"
              value={current.option.id}
              options={d.options.map((o) => ({
                id: o.option.id,
                display_name: `${o.option.label} · ${o.option.id === d.workspace.selected_option_id ? "Selected" : "Alternative"} · ${o.option.state}`,
              }))}
              onChange={goOption}
            />
            <p>
              {dirty ? "Working copy based on" : "Saved"} Discovery r
              {String(r.version).padStart(2, "0")} ·{" "}
              {dirty ? "Unsaved changes" : date(r.created_at)}
            </p>
          </header>
          <RecordTabs
            id="es02-tabs"
            label="Estimating workspace views"
            tabs={[
              { id: "Discovery", label: "Discovery" },
              { id: "Alternatives", label: `Alternatives ${d.options.length}` },
              {
                id: "Revisions",
                label:
                  current.history_count === null
                    ? "Revisions"
                    : `Revisions ${current.history_count}`,
              },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div
            className="es02-scroll"
            role="tabpanel"
            id={`es02-tabs-panel-${tab}`}
            aria-labelledby={`es02-tabs-tab-${tab}`}
          >
            {!afterRead ? (
              <p role="status">
                Save accepted. Loading the acknowledged revision…
              </p>
            ) : (
              <>
                {!d.can_edit && (
                  <p>
                    Current permission, estimating ownership or commercial state
                    holds new changes. Permitted saved scope and costs remain
                    available.
                  </p>
                )}
                {
                  <div key={current.option.id} hidden={tab !== "Discovery"}>
                    <nav className="es02-steps" aria-label="Discovery steps">
                      {steps.map((s, i) => (
                        <button
                          type="button"
                          key={s}
                          aria-label={`${i + 1}. ${s}`}
                          aria-current={step === s ? "step" : undefined}
                          onClick={() => setStep(s)}
                        >
                          {i + 1}. {s}
                          <small aria-hidden="true">
                            {s === "Pricing"
                              ? summary.data?.status === "Available"
                                ? `Saved v${summary.data.version}`
                                : "Price pending"
                              : !evaluated
                                ? "Not checked"
                                : s === "Review"
                                  ? readiness
                                  : findings.some(
                                        (f) =>
                                          f.step === s &&
                                          f.category === "Readiness",
                                      )
                                    ? "Needs review"
                                    : "Checked"}
                          </small>
                        </button>
                      ))}
                    </nav>
                    {!input ? (
                      <>
                        <p>E1 manual basis — E2 questionnaire not recorded.</p>
                        {canEdit && options.data && (
                          <button
                            type="button"
                            onClick={() =>
                              update({
                                ...blankDiscovery(options.data!, r.site_id),
                                configuration: emptyConfiguration(),
                              })
                            }
                          >
                            Start discovery proposal
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {base && base.version !== d.workspace.version && (
                          <div role="alert">
                            <p>
                              The workspace changed. Your proposal is retained.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setTab("Revisions");
                              }}
                            >
                              Compare current saved revision
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setBase({
                                  version: d.workspace.version,
                                  revision_id: r.id,
                                })
                              }
                            >
                              Keep proposal and review against current revision
                            </button>
                          </div>
                        )}
                        <ValidationFields
                          error={
                            preview?.signature === signature
                              ? preview.error
                              : null
                          }
                        >
                          <div className="es02-fields">
                            {
                              <>
                                {input.configuration && (
                                  <div hidden={step !== "Requirements"}>
                                    <FamilyOverview
                                      value={input.configuration}
                                      onConfigure={() =>
                                        setStep("Configuration")
                                      }
                                    />
                                    <AreasEditor
                                      readOnly={
                                        !canEdit || frozen || !options.data
                                      }
                                      evaluated={!!evaluated}
                                      value={input.configuration}
                                      onChange={updateConfig}
                                      options={available}
                                      findings={findings}
                                      onEvidence={(selected) =>
                                        setEvidence({ selected })
                                      }
                                    />
                                  </div>
                                )}
                                <div hidden={step !== "Configuration"}>
                                  {input.configuration ? (
                                    <SystemsEditor
                                      readOnly={
                                        !canEdit || frozen || !options.data
                                      }
                                      evaluated={!!evaluated}
                                      value={input.configuration}
                                      onChange={updateConfig}
                                      options={available}
                                      findings={findings}
                                      onEvidence={(selected) =>
                                        setEvidence({ selected })
                                      }
                                    />
                                  ) : (
                                    <>
                                      <p>
                                        Structured systems were not recorded in
                                        this legacy revision. Its questionnaire
                                        and saved cost basis remain exact.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateConfig(emptyConfiguration())
                                        }
                                      >
                                        Add structured configuration to this
                                        proposal
                                      </button>
                                    </>
                                  )}
                                </div>
                                {input.configuration && (
                                  <div hidden={step !== "Scope & delivery"}>
                                    <ResponsibilitiesEditor
                                      readOnly={
                                        !canEdit || frozen || !options.data
                                      }
                                      evaluated={!!evaluated}
                                      value={input.configuration}
                                      onChange={updateConfig}
                                      options={available}
                                      findings={findings}
                                      onEvidence={(selected) =>
                                        setEvidence({ selected })
                                      }
                                    />
                                  </div>
                                )}
                                <fieldset
                                  hidden={
                                    step === "Pricing" || step === "Review"
                                  }
                                  className="es02-fields"
                                  disabled={!canEdit || frozen || !options.data}
                                >
                                  <Field
                                    label="Search permitted Facility/equipment candidates"
                                    name="source-search"
                                    value={lookupSearch}
                                    onChange={setLookupSearch}
                                    hint="Search is scoped to this Site; current selections remain available beyond the first page."
                                  />
                                  <DiscoveryFields
                                    value={input}
                                    options={available}
                                    step={
                                      step === "Pricing" || step === "Review"
                                        ? "Requirements"
                                        : step
                                    }
                                    onChange={update}
                                  />
                                </fieldset>
                              </>
                            }
                          </div>
                        </ValidationFields>
                        {step === "Pricing" && (
                          <Pricing summary={summary.data} />
                        )}
                        {step === "Review" && (
                          <section aria-label="Discovery review">
                            <h2>Discovery readiness: {readiness}</h2>
                            <p>
                              Configuration confirmation is not engineering
                              certification or commercial approval.
                            </p>
                            {findings.map((f) => (
                              <button
                                className="es02-finding"
                                key={f.key}
                                type="button"
                                onClick={() => setStep(f.step)}
                              >
                                {f.message}
                              </button>
                            ))}
                            {evaluated?.open_items.map((item) => (
                              <p key={item.key}>
                                {item.key}: {item.follow_up.reason}{" "}
                                {item.blocks_scope
                                  ? "· Keeps discovery incomplete"
                                  : "· Owned follow-up"}
                              </p>
                            ))}
                            <ScopeView
                              input={input}
                              context={r.observed_context}
                            />
                            <p>
                              Delivery routing: Not configured. Survey, supplier
                              source and specialist calculator integrations are
                              unavailable; manual attributed discovery remains
                              usable.
                            </p>
                            <button
                              type="button"
                              onClick={() => setTab("Revisions")}
                            >
                              Compare revisions
                            </button>
                            {summary.data?.status === "Available" && (
                              <Link
                                href={`/estimating/estimates/${summary.data.estimate_id}`}
                              >
                                Open manual estimate and View/Create Draft
                                quotation
                              </Link>
                            )}
                          </section>
                        )}
                        {(step === "Pricing" || step === "Review") &&
                          !costing && (
                            <p>
                              Review scope for manual costing requires saved,
                              selected, Active, Complete discovery and current
                              owner/group authority. Save and adoption are
                              separate actions.
                            </p>
                          )}
                      </>
                    )}
                  </div>
                }
                {tab === "Alternatives" && (
                  <section>
                    <h2>Commercial alternatives</h2>
                    <p>
                      Viewing does not select an alternative. The ten-option
                      limit includes archived originals.
                    </p>
                    <div className="es02-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            {[
                              "Alternative",
                              "Selected",
                              "State",
                              "Current revision",
                              "Readiness",
                              "Saved estimate",
                              "Amount (AUD, ex tax)",
                              "Cost basis",
                              "Owner",
                              "Updated",
                              "Actions",
                            ].map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {d.options.map((o) => (
                            <tr key={o.option.id}>
                              <td>{o.option.label}</td>
                              <td>
                                {o.option.id === d.workspace.selected_option_id
                                  ? "Selected"
                                  : "Unselected"}
                              </td>
                              <td>{o.option.state}</td>
                              <td>r{o.revision.version}</td>
                              <td>{o.revision.scope_readiness}</td>
                              <td>
                                {o.cost.status === "Available"
                                  ? `v${o.cost.version}`
                                  : o.cost.status === "NoEstimate"
                                    ? "Not yet costed"
                                    : "Unavailable"}
                              </td>
                              <td>
                                {o.cost.status === "Available"
                                  ? money(o.cost.amount ?? null)
                                  : "—"}
                              </td>
                              <td>
                                {o.cost.status === "Available"
                                  ? o.cost.basis
                                    ? `Discovery r${o.cost.basis.revision}`
                                    : "E1 manual basis"
                                  : "—"}
                              </td>
                              <td>{d.context.owner}</td>
                              <td>{date(o.revision.created_at)}</td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => goOption(o.option.id)}
                                >
                                  View alternative {o.option.label}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="es02-toolbar">
                      <button
                        type="button"
                        disabled={!canEdit || d.options.length >= 10 || frozen}
                        onClick={() => beginBranch("Fresh")}
                      >
                        Create fresh alternative
                      </button>
                      <button
                        type="button"
                        disabled={
                          !canEdit ||
                          !r.input ||
                          d.options.length >= 10 ||
                          frozen
                        }
                        onClick={() => beginBranch("CopyDiscovery")}
                      >
                        Copy discovery to alternative
                      </button>
                      <button
                        type="button"
                        disabled={
                          !canEdit ||
                          current.option.id ===
                            d.workspace.selected_option_id ||
                          frozen
                        }
                        onClick={() => chooseAction("Select")}
                      >
                        Select this option
                      </button>
                      {current.option.state === "Archived" ? (
                        <button
                          type="button"
                          disabled={!d.can_edit || frozen}
                          onClick={() => chooseAction("Reopen")}
                        >
                          Reopen this option
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            !canEdit ||
                            current.option.id ===
                              d.workspace.selected_option_id ||
                            frozen
                          }
                          onClick={() => chooseAction("Archive")}
                        >
                          Archive this option
                        </button>
                      )}
                      <button type="button" onClick={() => setTab("Revisions")}>
                        Compare alternatives
                      </button>
                    </div>
                  </section>
                )}
                {tab === "Revisions" && (
                  <History
                    key={current.option.id}
                    id={id}
                    optionId={current.option.id}
                    detail={d}
                    onStartingPoint={(source) =>
                      navigation.request(() => {
                        const v = structuredClone(source.input!);
                        const follow_up = {
                          owner_id: d.workspace.owner_id,
                          reason: "",
                        };
                        v.answers = v.answers.map((a) =>
                          a.state === "Confirmed"
                            ? { ...a, state: "Answered", follow_up }
                            : a,
                        );
                        if (v.configuration) {
                          v.configuration.facts = v.configuration.facts.map(
                            (f) =>
                              f.state === "Confirmed"
                                ? { ...f, state: "Answered", follow_up }
                                : f,
                          );
                          v.configuration.areas = v.configuration.areas.map(
                            (a) =>
                              a.state === "Confirmed"
                                ? { ...a, state: "Answered", follow_up }
                                : a,
                          );
                          v.configuration.responsibilities =
                            v.configuration.responsibilities.map((a) =>
                              a.state === "Confirmed"
                                ? { ...a, state: "Answered", follow_up }
                                : a,
                            );
                        }
                        update(v);
                        setHistorical(source.id);
                        setTab("Discovery");
                      })
                    }
                  />
                )}
              </>
            )}
            {dirty && unchanged && <p>No scope changes to save.</p>}
            <ErrorNotice error={command.error} />
            {dirty && preview?.signature === signature && (
              <ErrorNotice error={preview.error} />
            )}
            {command.uncertain && !savingReview && (
              <button
                type="button"
                disabled={command.busy}
                onClick={() => void command.reconcile()}
              >
                Confirm original save outcome
              </button>
            )}
          </div>
          <footer className="es02-bottom">
            <span>
              {dirty ? "Working copy of discovery" : "Saved discovery"} r
              {String(r.version).padStart(2, "0")}
            </span>
            <button
              type="button"
              disabled={step === "Requirements"}
              onClick={() => {
                setTab("Discovery");
                setStep(steps[Math.max(0, steps.indexOf(step) - 1)]);
              }}
            >
              Previous
            </button>
            <button
              type="button"
              className="es02-primary"
              disabled={!dirty || !validPreview || frozen || !canEdit}
              onClick={() => setSavingReview(true)}
            >
              Save discovery revision
            </button>
            <button
              type="button"
              disabled={step === "Review"}
              onClick={() => {
                setTab("Discovery");
                setStep(steps[Math.min(4, steps.indexOf(step) + 1)]);
              }}
            >
              Continue →
            </button>
          </footer>
        </div>
        {summaryOpen && (
          <SummaryPanel
            summary={summary}
            version={r.version}
            label={current.option.label}
            selected={current.option.id === d.workspace.selected_option_id}
            dirty={dirty}
            readiness={readiness}
            config={input?.configuration}
            findings={findings}
            effort={input?.effort.value ?? "Not recorded"}
            evaluated={!!evaluated}
            costingUrl={
              costing
                ? `/estimating/discovery/${id}/costing?option=${current.option.id}`
                : null
            }
            onStep={(s) => {
              setTab("Discovery");
              setStep(s);
            }}
            onTab={setTab}
          />
        )}
      </div>
      {savingReview && validPreview && (
        <SaveReview
          key={signature}
          preview={validPreview}
          reason={reason}
          setReason={setReason}
          busy={frozen}
          error={command.error}
          uncertain={command.uncertain}
          reconcile={() => void command.reconcile()}
          close={() => {
            if (!frozen) {
              setSavingReview(false);
              continuation.current = null;
            }
          }}
          save={(questions, configuration) =>
            void command.send(`estimating/workspaces/${id}`, {
              ...proposal,
              revision_id: crypto.randomUUID(),
              context_hash: validPreview.context_hash,
              comparison_hash: validPreview.comparison_hash,
              confirmed_question_ids: questions,
              ...(input?.configuration
                ? { configuration_confirmations: configuration }
                : {}),
              reason,
            })
          }
        />
      )}
      {navigation.leave && !savingReview && (
        <Dialog title="Unsaved discovery" close={navigation.stay}>
          <p>
            {frozen
              ? "Reconcile the original save before leaving."
              : "Keep this proposal, save a revision, or explicitly discard working changes."}
          </p>
          <button type="button" onClick={navigation.stay}>
            Stay
          </button>
          <button
            type="button"
            disabled={frozen || !validPreview || !canEdit}
            onClick={() => {
              continuation.current = navigation.proceed;
              setSavingReview(true);
            }}
          >
            Save revision then continue
          </button>
          <button
            type="button"
            disabled={frozen}
            onClick={() => {
              command.discard();
              setDraft(null);
              setBase(null);
              navigation.proceed();
            }}
          >
            Discard working changes then continue
          </button>
        </Dialog>
      )}
      {branch && options.data && (
        <Dialog
          title="New alternative"
          close={() => {
            if (!frozen) {
              setBranch(null);
              command.discard();
            }
          }}
        >
          <ProposalEditor
            initialOptions={options.data}
            opportunityId={d.workspace.opportunity_id}
            command={command}
            detail={d}
            editor={{
              kind: branch,
              optionId: current.option.id,
              siteId: r.site_id,
              scopeMode: r.input?.scope.mode ?? "Site",
            }}
          />
        </Dialog>
      )}
      {action && (
        <Dialog
          title={`${action} alternative ${current.option.label}`}
          close={() => {
            if (!frozen) setAction(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void command.send(`estimating/workspaces/${id}/options`, {
                action,
                option_id: current.option.id,
                ...actionBase,
                reason,
              });
            }}
          >
            <Field
              label="Option action reason"
              name="reason"
              value={reason}
              onChange={setReason}
              maxLength={1000}
              required
            />
            <button disabled={frozen} type="submit">
              Confirm {action.toLowerCase()}
            </button>
          </form>
        </Dialog>
      )}
      {evidence && input?.configuration && (
        <EvidenceDialog
          id={id}
          revision={r}
          selected={evidence.selected}
          value={input.configuration}
          onChange={updateConfig}
          options={available}
          canEdit={canEdit && !frozen}
          close={() => setEvidence(null)}
        />
      )}
    </SecondaryMenuFrame>
  );
}
function SaveReview({
  preview,
  reason,
  setReason,
  save,
  busy,
  error,
  uncertain,
  reconcile,
  close,
}: {
  preview: Preview;
  reason: string;
  setReason: (v: string) => void;
  save: (
    questions: string[],
    config: Preview["configuration_confirmations"],
  ) => void;
  busy: boolean;
  error: unknown;
  uncertain: boolean;
  reconcile: () => void;
  close: () => void;
}) {
  const [questions, setQuestions] = useState<string[]>([]),
    [facts, setFacts] = useState<string[]>([]);
  return (
    <Dialog title="Review discovery revision" close={close}>
      <ErrorNotice error={error} />
      {uncertain && (
        <button type="button" onClick={reconcile}>
          Confirm original save outcome
        </button>
      )}
      <p>
        Proposed readiness: {preview.compiled.scope_readiness}. Saving creates
        an immutable revision; saved prices remain unchanged.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(
            questions,
            preview.configuration_confirmations.filter((f) =>
              facts.includes(f.fact_id),
            ),
          );
        }}
      >
        <Field
          label="Discovery change reason"
          name="reason"
          value={reason}
          onChange={setReason}
          required
          maxLength={1000}
        />
        <fieldset disabled={busy}>
          {preview.required_confirmation_ids.map((id) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={questions.includes(id)}
                onChange={(e) =>
                  setQuestions(
                    e.target.checked
                      ? [...questions, id]
                      : questions.filter((v) => v !== id),
                  )
                }
              />
              I confirm {id} in this exact proposal
            </label>
          ))}
          {preview.configuration_confirmations.map((f) => (
            <label key={f.fact_id}>
              <input
                type="checkbox"
                checked={facts.includes(f.fact_id)}
                onChange={(e) =>
                  setFacts(
                    e.target.checked
                      ? [...facts, f.fact_id]
                      : facts.filter((id) => id !== f.fact_id),
                  )
                }
              />
              I confirm{" "}
              {preview.compiled.input.configuration?.areas.find(
                (a) => a.id === f.fact_id,
              )?.label ??
                preview.compiled.input.configuration?.responsibilities.find(
                  (r) => r.id === f.fact_id,
                )?.work ??
                (() => {
                  const fact = preview.compiled.input.configuration?.facts.find(
                    (v) => v.id === f.fact_id,
                  );
                  return fact
                    ? `${preview.compiled.input.configuration?.systems.find((s) => s.id === fact.system_id)?.name} · ${fact.field} (${fact.unit}): ${fact.value}`
                    : "configuration fact";
                })()}{" "}
              with the reviewed value, units and sources
            </label>
          ))}
        </fieldset>
        <button
          className="es02-primary"
          type="submit"
          disabled={
            busy ||
            !reason.trim() ||
            questions.length !== preview.required_confirmation_ids.length ||
            facts.length !== preview.configuration_confirmations.length
          }
        >
          Confirm save discovery revision
        </button>
      </form>
    </Dialog>
  );
}
function EvidenceDialog({
  id,
  revision,
  selected,
  value,
  onChange,
  options,
  canEdit,
  close,
}: {
  id: string;
  revision: DiscoveryRevision;
  selected?: string;
  value: Configuration;
  onChange: (v: Configuration) => void;
  options: FormOptions;
  canEdit: boolean;
  close: () => void;
}) {
  const saved = useCrmResource<
      Awaited<ReturnType<typeof readConfigurationEvidence>>
    >(`estimating/workspaces/${id}/evidence?revision_id=${revision.id}`, true),
    [chosen, setChosen] = useState(selected ?? "");
  const evidence = value.evidence.find((e) => e.id === chosen);
  const sourceOptions =
    evidence?.source_type === "Asset"
      ? options.equipment
      : evidence?.source_type === "Facility"
        ? options.facilities
        : evidence?.source_type === "Site"
          ? options.sites
          : [];
  const editEvidence = (patch: Partial<Configuration["evidence"][number]>) =>
    evidence &&
    onChange({
      ...value,
      evidence: value.evidence.map((e) =>
        e.id === evidence.id ? { ...e, ...patch } : e,
      ),
    });
  return (
    <Dialog inspect title="Configuration evidence" close={close}>
      <ErrorNotice error={saved.error} />
      <p>
        Recorded observations are retained with each revision. Manual
        attribution is text, and source access is checked independently.
      </p>
      <SelectField
        label="Evidence observation"
        name="evidence-choice"
        value={chosen}
        options={value.evidence.map((e) => ({
          id: e.id,
          display_name: e.observation || "New observation",
        }))}
        onChange={setChosen}
      />
      {evidence && (
        <fieldset disabled={!canEdit}>
          <SelectField
            label="Evidence source type"
            name="evidence.source-type"
            value={evidence.source_type}
            options={["Manual", "Asset", "Facility", "Site"].map((id) => ({
              id,
              display_name: id,
            }))}
            onChange={(source_type) =>
              editEvidence({
                source_type: source_type as typeof evidence.source_type,
                source_id: null,
                source_version: null,
              })
            }
          />
          {evidence.source_type !== "Manual" && (
            <>
              <SelectField
                label="Permitted evidence source"
                name="evidence.source-id"
                value={evidence.source_id ?? ""}
                options={sourceOptions}
                onChange={(id) => {
                  const source = sourceOptions.find((s) => s.id === id);
                  editEvidence({
                    source_id: source?.id ?? null,
                    source_version: source?.version ?? null,
                  });
                }}
              />
              {sourceOptions.some(
                (s) =>
                  s.id === evidence.source_id &&
                  s.version !== evidence.source_version,
              ) && (
                <button
                  type="button"
                  onClick={() =>
                    editEvidence({
                      source_version: sourceOptions.find(
                        (s) => s.id === evidence.source_id,
                      )!.version,
                    })
                  }
                >
                  Use reviewed current source version
                </button>
              )}
            </>
          )}
          <Field
            label="Observation"
            name="evidence.observation"
            value={evidence.observation}
            multiline
            maxLength={1000}
            onChange={(observation) =>
              onChange({
                ...value,
                evidence: value.evidence.map((e) =>
                  e.id === evidence.id ? { ...e, observation } : e,
                ),
              })
            }
          />
          <Field
            label="Observed business date"
            name="evidence.date"
            type="date"
            value={evidence.observed_on}
            onChange={(observed_on) =>
              onChange({
                ...value,
                evidence: value.evidence.map((e) =>
                  e.id === evidence.id ? { ...e, observed_on } : e,
                ),
              })
            }
          />
          <Field
            label="Evidence note"
            name="evidence.note"
            value={evidence.note ?? ""}
            multiline
            maxLength={500}
            onChange={(note) =>
              onChange({
                ...value,
                evidence: value.evidence.map((e) =>
                  e.id === evidence.id ? { ...e, note: note || null } : e,
                ),
              })
            }
          />
          <p>
            Source: {evidence.source_type}
            {evidence.source_id
              ? ` · ${evidence.source_id} · recorded version ${evidence.source_version}`
              : " · attributed text"}
          </p>
          {evidence.source_id && (
            <p>
              Current source:{" "}
              {saved.data?.current.find((e) => e.id === evidence.id)
                ?.version === evidence.source_version
                ? "Matches recorded version"
                : "Review current source before saving"}
            </p>
          )}
        </fieldset>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={() => {
            const id = crypto.randomUUID();
            onChange({
              ...value,
              evidence: [
                ...value.evidence,
                {
                  id,
                  lineage: null,
                  source_type: "Manual",
                  source_id: null,
                  source_version: null,
                  observation: "",
                  observed_on: "",
                  note: null,
                },
              ],
            });
            setChosen(id);
          }}
        >
          + Add manual evidence
        </button>
      )}
      <h3>Permitted equipment sources</h3>
      {options.equipment.map((e) => (
        <p key={e.id}>
          <a href={`/equipment/${e.id}`} target="_blank" rel="noreferrer">
            {e.display_name}
          </a>
        </p>
      ))}
      {value.follow_ups.map((f) => (
        <p key={f.id}>
          {f.reason} ·{" "}
          {options.owners.find((o) => o.id === f.owner_id)?.display_name ??
            "Recorded owner"}{" "}
          · {f.due_on ? `Recorded due ${f.due_on}` : "Due date unknown"}
          {f.activity_id && (
            <span>
              {" "}
              · Activity current date:{" "}
              {saved.data?.activities.find((a) => a.id === f.activity_id)
                ?.due_at ?? "Unknown"}
            </span>
          )}
        </p>
      ))}
    </Dialog>
  );
}
