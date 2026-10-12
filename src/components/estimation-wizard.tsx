"use client";
import Link from "next/link";
import { SpecialistEntry } from "./specialist-entry";
import { WorkspaceSalesBriefs } from "./sales-estimating-link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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
  answerText,
  blankDiscovery,
  type FormOptions,
} from "./discovery-fields";
import {
  AreasEditor,
  FamilyOverview,
  ResponsibilitiesEditor,
  SystemsEditor,
  type Focus,
} from "./configuration-editor";
import { ProposalEditor, ScopeView } from "./discovery-screens";
import {
  FertigationReceivedNotes,
  FertigationReceivedNotesResource,
} from "./fertigation-received-notes";
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
import {
  ChangeMarker,
  Dot,
  Icon,
  Row,
  StateTag,
  TableScroll,
  Tag,
  pad,
  plural,
  type Tone,
} from "./estimation-wizard-ui";
import "./discovery.css";
import "./estimation-wizard.css";

// ES-02 Estimation Wizard · discovery workspace. Composition from design board r01
// "In the app · ES-02 r04" (boards 05, S1–S5, V1–V6, X1–X4, R1–R4); behaviour from
// build plan r04. One opportunity, one site, one viewed alternative; five steps keep one
// working copy; Save creates an immutable revision. Review here is a completeness and
// source check, never approval (ES-04).

type Detail = Awaited<ReturnType<typeof readDiscoveryWorkspace>>;
type Summary = Awaited<ReturnType<typeof readDiscoverySummary>>;
type Preview = Awaited<ReturnType<typeof previewDiscoveryChange>>;
type Comparison = Awaited<ReturnType<typeof compareDiscoverySources>>;
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
const shortDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-AU", {
    timeZone: "Australia/Brisbane",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const shortDateTime = (value: string | Date) =>
  `${shortDate(value)} · ${new Date(value).toLocaleTimeString("en-AU", {
    timeZone: "Australia/Brisbane",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
const longDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-AU", {
    timeZone: "Australia/Brisbane",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const rev = (version: number) => `r${pad(version)}`;
const wideQuery = "(min-width: 1441px)";
const subscribeWide = (changed: () => void) => {
  const media = window.matchMedia(wideQuery);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
const valueText = (value: unknown): string =>
  value === null || value === undefined
    ? "Not recorded"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : typeof value === "object"
        ? Array.isArray(value)
          ? value.map(valueText).join(", ") || "None"
          : Object.entries(value as Record<string, unknown>)
              .map(([k, v]) => `${k}: ${valueText(v)}`)
              .join("\n")
        : String(value);

// A modal dialog: head, body and footer, 640 px, closed by Escape, Cancel or the owner.
function Dialog({
  title,
  subtitle,
  children,
  footer,
  close,
  wide = false,
  label,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  close: () => void;
  wide?: boolean;
  label?: string;
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
      className={`es02-dialog${wide ? " es02-dialog-wide" : ""}`}
      aria-label={label ?? title}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="es02-dialog-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          type="button"
          className="es02-button es02-button-icon"
          onClick={close}
          aria-label={`Close ${title}`}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="es02-dialog-body">{children}</div>
      {footer && <div className="es02-dialog-foot">{footer}</div>}
    </dialog>
  );
}

// A right-side panel that overlays the summary and never replaces it (board P7). It does
// not trap focus; Escape, the close control or the owner closes it.
function Panel({
  eyebrow,
  title,
  tag,
  children,
  footer,
  close,
  label,
}: {
  eyebrow: string;
  title: string;
  tag?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  close: () => void;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    latestClose = useRef(close);
  useEffect(() => {
    latestClose.current = close;
  }, [close]);
  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.show();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latestClose.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      d.close();
    };
  }, []);
  return (
    <dialog ref={ref} className="es02-panel" aria-label={label}>
      <div className="es02-panel-head">
        <div>
          <span className="es02-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          {tag}
        </div>
        <button
          type="button"
          className="es02-button es02-button-icon"
          onClick={close}
          aria-label={`Close ${label}`}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="es02-panel-body">{children}</div>
      {footer && <div className="es02-panel-foot">{footer}</div>}
    </dialog>
  );
}

function Strip({
  tone = "neutral",
  icon = "info",
  role,
  title,
  children,
  actions,
}: {
  tone?: "neutral" | "info" | "warning" | "danger";
  icon?: "info" | "warning";
  role?: "alert" | "status";
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={`es02-strip es02-strip-${tone}`} role={role}>
      <Icon name={icon} />
      <div className="es02-strip-text">
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
      {actions && <div className="es02-strip-actions">{actions}</div>}
    </div>
  );
}

type StepStatus = { text: string; tone?: Tone };
function SummaryPanel({
  summary,
  version,
  label,
  selected,
  dirty,
  readOnly,
  readiness,
  config,
  findings,
  effort,
  evaluated,
  costingUrl,
  onFinding,
  onTab,
  close,
}: {
  summary: ReturnType<typeof useCrmResource<Summary>>;
  version: number;
  label: string;
  selected: boolean;
  dirty: boolean;
  readOnly: boolean;
  readiness: string;
  config: Configuration | undefined;
  findings: DiscoveryFinding[];
  effort: string;
  evaluated: boolean;
  costingUrl: string | null;
  onFinding: (f: DiscoveryFinding) => void;
  onTab: (s: string) => void;
  close?: () => void;
}) {
  const s = summary.data,
    counts = config ? configurationCounts(config, findings) : null,
    readinessTone: Tone =
      readiness === "Complete"
        ? "success"
        : readiness === "Incomplete"
          ? "warning"
          : "neutral";
  const order = (f: DiscoveryFinding) => {
    const i = config?.systems.findIndex((s) => s.id === f.entity_id) ?? -1;
    return i < 0 ? 1000 : i;
  };
  const open = findings
    .filter((f) => f.category === "Readiness")
    .sort((a, b) => order(a) - order(b) || a.key.localeCompare(b.key));
  const system = (f: DiscoveryFinding) =>
    config?.systems.find((x) => x.id === f.entity_id)?.name ??
    config?.areas.find((x) => x.id === f.entity_id)?.label ??
    config?.responsibilities.find((x) => x.id === f.entity_id)?.work ??
    null;
  return (
    <aside className="es02-summary" aria-label="Estimate summary">
      {close && (
        <button
          type="button"
          className="es02-button es02-button-icon es02-summary-close"
          onClick={close}
          aria-label="Close estimate summary"
        >
          <Icon name="close" />
        </button>
      )}
      <h2>Estimate summary</h2>
      <span className="es02-summary-eyebrow">Viewing</span>
      <span className="es02-summary-viewing">
        {dirty ? `Working copy of ${rev(version)}` : `Discovery ${rev(version)} · saved`}
      </span>
      <div className="es02-summary-tags">
        {dirty ? (
          <>
            <Tag tone="warning" dot>
              Unsaved changes
            </Tag>
            <Tag>Working preview</Tag>
          </>
        ) : readOnly ? (
          <Tag>View only</Tag>
        ) : (
          <Tag>Saved discovery</Tag>
        )}
      </div>
      <span className="es02-summary-eyebrow">
        Alternative {label} ·{" "}
        {selected ? "Selected alternative" : "Viewed alternative · not selected"}
      </span>
      <dl className="es02-rows">
        <Row label="Discovery readiness">
          <Tag tone={readinessTone}>{readiness}</Tag>
        </Row>
        {counts && (
          <>
            <Row label="Growing areas">{counts.growing_areas}</Row>
            <Row label="Systems">{counts.systems}</Row>
            <Row label="Systems to confirm">
              {evaluated ? counts.to_confirm : "Not checked"}
            </Row>
          </>
        )}
      </dl>
      <hr />
      <ErrorNotice error={summary.error} />
      {summary.loading && (
        <p className="es02-subtle" role="status">
          Loading saved estimate…
        </p>
      )}
      {s?.status === "NoEstimate" && (
        <>
          <span className="es02-summary-eyebrow">Saved estimate</span>
          <span className="es02-summary-viewing">Not yet costed</span>
          <p className="es02-subtle">
            No amount is borrowed from another alternative.
          </p>
        </>
      )}
      {s?.status === "Unavailable" && (
        <>
          <span className="es02-summary-eyebrow">Saved estimate</span>
          <span className="es02-summary-viewing">Unavailable</span>
          <p className="es02-subtle">
            Saved estimate unavailable under current access.
          </p>
        </>
      )}
      {s?.status === "Available" && (
        <>
          <span className="es02-summary-eyebrow">
            Saved estimate · Estimate v{pad(s.version)}
          </span>
          <span className="es02-money">{money(s.sell_total)}</span>
          <span className="es02-subtle">Excluding tax · tax not calculated</span>
          <dl className="es02-rows">
            <Row label="Cost basis">
              {s.basis
                ? `Discovery ${rev(s.basis.revision)}`
                : "E1 manual basis — E2 questionnaire not recorded"}
            </Row>
          </dl>
          {s.basis && (version !== s.basis.revision || dirty) && (
            <Strip tone="info">
              Newer discovery is not yet costed. Saved prices remain unchanged.
            </Strip>
          )}
          <Link
            href={`/estimating/estimates/${s.estimate_id}`}
            className="es02-button"
          >
            <Icon name="external" className="es02-icon es02-icon-sm" />
            Open manual estimate
          </Link>
        </>
      )}
      <hr />
      <h3>
        To confirm
        <span className="es02-count">{evaluated ? open.length : "–"}</span>
      </h3>
      {!evaluated ? (
        <p className="es02-subtle">Checked once the working preview returns.</p>
      ) : open.length === 0 ? (
        <p className="es02-subtle">Nothing is waiting to be confirmed.</p>
      ) : (
        <div className="es02-summary-findings">
          {open.map((f) => {
            const name = system(f);
            return (
              <button
                type="button"
                key={f.key}
                className="es02-summary-finding"
                onClick={() => onFinding(f)}
              >
                <Dot tone="warning" />
                <span>
                  <strong>{name ? f.message.replace(` — ${name}`, "") : f.message}</strong>
                  <small>
                    {name ? `${name} · ` : ""}
                    {f.step}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <dl className="es02-rows">
        <Row label="Estimating effort">{effort}</Row>
        <Row label="Delivery routing">Not configured</Row>
      </dl>
      <div className="es02-summary-links">
        {costingUrl && (
          <Link href={costingUrl} className="es02-link">
            <Icon name="arrow-right" className="es02-icon es02-icon-sm" />
            Review scope for manual costing
          </Link>
        )}
        <button
          type="button"
          className="es02-link"
          onClick={() => onTab("Alternatives")}
        >
          <Icon name="compare" className="es02-icon es02-icon-sm" />
          Compare alternatives
        </button>
        <button
          type="button"
          className="es02-link"
          onClick={() => onTab("Revisions")}
        >
          <Icon name="history" className="es02-icon es02-icon-sm" />
          View revision history
        </button>
      </div>
      <small className="es02-summary-foot">
        Counts use the whole viewed working scope, not the current table filter.
        Synthetic preview.
      </small>
    </aside>
  );
}

function Pricing({
  summary,
  revision,
  dirty,
  costing,
  costingUrl,
  selected,
  readiness,
}: {
  summary: Summary | null;
  revision: number;
  dirty: boolean;
  costing: boolean;
  costingUrl: string;
  selected: boolean;
  readiness: string;
}) {
  const [search, setSearch] = useState(""),
    [view, setView] = useState<"Line items" | "Cost types">("Line items");
  const costingReason = dirty
    ? "Save discovery before reviewing it for costing. The saved revision must also be Complete."
    : readiness !== "Complete"
      ? `Discovery ${rev(revision)} is ${readiness}. Only a saved, Complete, selected discovery can be adopted.`
      : !selected
        ? "Only the selected alternative can be reviewed for costing."
        : "Review scope for manual costing requires current owner authority and an Active alternative.";
  const basisStrip =
    summary?.status === "Available" ? (
      <Strip
        tone="info"
        title={`Cost basis: ${summary.basis ? `Discovery ${rev(summary.basis.revision)}` : "E1 manual basis"} · Estimate v${pad(summary.version)}`}
        actions={
          <Link
            href={`/estimating/estimates/${summary.estimate_id}`}
            className="es02-button"
          >
            <Icon name="external" className="es02-icon es02-icon-sm" />
            Open manual estimate
          </Link>
        }
      >
        {summary.basis && (summary.basis.revision !== revision || dirty)
          ? `Newer discovery is not yet costed. Saved prices remain unchanged. ${dirty ? `This working copy and ${rev(revision)} are` : `${rev(revision)} is`} not a costing basis.`
          : "Saved prices are exact saved versions. Discovery edits never reprice them."}
      </Strip>
    ) : (
      <Strip
        tone="neutral"
        title={
          summary?.status === "Unavailable"
            ? "Saved estimate unavailable"
            : "Not yet costed"
        }
      >
        {summary?.status === "Unavailable"
          ? "The saved estimate is outside current access. Unpriced scope is not zero."
          : "No saved manual prices for this alternative. Unpriced scope is not zero."}
      </Strip>
    );
  const adoption = (
    <div className="es02-actions" style={{ margin: "4px 0 14px" }}>
      {costing ? (
        <Link href={costingUrl} className="es02-button">
          <Icon name="arrow-right" className="es02-icon es02-icon-sm" />
          Review scope for manual costing
        </Link>
      ) : (
        <>
          <button type="button" className="es02-button" disabled>
            <Icon name="arrow-right" className="es02-icon es02-icon-sm" />
            Review scope for manual costing
          </button>
          <span className="es02-reason">{costingReason}</span>
        </>
      )}
    </div>
  );
  if (!summary || summary.status !== "Available")
    return (
      <section className="es02-section" aria-label="Pricing">
        {basisStrip}
        {adoption}
      </section>
    );
  const total = calculate(summary.lines),
    shown = total.items.filter((l) =>
      `${l.description} ${l.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    allowances = total.items.filter((l) => l.allowance === true),
    allowanceTotal = decimal(
      allowances.reduce((n, l) => n + scaled(l.sell_total, 2), 0n),
    ),
    costTotal = decimal(
      total.items.reduce((n, l) => n + scaled(l.cost_total, 2), 0n),
    );
  const categories = ["Product", "Labour", "Freight", "Engineering", "Subcontract"];
  return (
    <section className="es02-section" aria-label="Pricing">
      {basisStrip}
      {adoption}
      <div className="es02-section-head">
        <div>
          <h2>Saved estimate lines</h2>
          <p>
            Estimate v{pad(summary.version)} · on{" "}
            {summary.basis
              ? `Discovery ${rev(summary.basis.revision)}`
              : "E1 manual basis"}
          </p>
        </div>
      </div>
      <div className="es02-toolbar">
        <div className="es02-actions" role="group" aria-label="Pricing view">
          {(["Line items", "Cost types"] as const).map((v) => (
            <button
              key={v}
              type="button"
              className="es02-button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <span className="es02-spacer" />
        <div className="es02-search">
          <Icon name="search" className="es02-icon es02-icon-sm" />
          <Field
            label="Search saved lines"
            name="price-search"
            placeholder="Search saved lines"
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>
      <TableScroll label="Saved estimate lines table">
        <table>
          {view === "Line items" ? (
            <>
              <thead>
                <tr>
                  {[
                    ["Description"],
                    ["Category"],
                    ["Qty", "num"],
                    ["Unit"],
                    ["Unit cost", "num"],
                    ["Cost total", "num"],
                    ["Unit sell", "num"],
                    ["Sell total", "num"],
                    ["Source · effective"],
                    ["Allowance"],
                  ].map(([h, num]) => (
                    <th key={h} scope="col" className={num ? "es02-num" : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.description}</strong>
                    </td>
                    <td>{l.category}</td>
                    <td className="es02-num">{l.quantity}</td>
                    <td>{l.unit}</td>
                    <td className="es02-num">{l.unit_cost}</td>
                    <td className="es02-num">{l.cost_total}</td>
                    <td className="es02-num">{l.unit_sell}</td>
                    <td className="es02-num">{l.sell_total}</td>
                    <td>
                      <span className="es02-secondary">
                        {l.source}
                        {l.effective_date ? ` · ${l.effective_date}` : ""}
                      </span>
                    </td>
                    <td>
                      {l.allowance === undefined ? (
                        <span className="es02-secondary">Not recorded</span>
                      ) : l.allowance ? (
                        <Tag tone="warning">Allowance</Tag>
                      ) : (
                        <span className="es02-secondary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th scope="col">Cost type</th>
                  <th scope="col" className="es02-num">
                    Lines
                  </th>
                  <th scope="col" className="es02-num">
                    Shown cost
                  </th>
                  <th scope="col" className="es02-num">
                    Shown sell
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const lines = shown.filter((l) => l.category === category);
                  return (
                    <tr key={category}>
                      <td>
                        <strong>{category}</strong>
                      </td>
                      <td className="es02-num">{lines.length}</td>
                      <td className="es02-num">
                        {decimal(lines.reduce((n, l) => n + scaled(l.cost_total, 2), 0n))}
                      </td>
                      <td className="es02-num">
                        {decimal(lines.reduce((n, l) => n + scaled(l.sell_total, 2), 0n))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}
        </table>
      </TableScroll>
      <p className="es02-table-foot">
        <span>
          <strong>
            {shown.length === total.items.length
              ? plural(total.items.length, "line")
              : `${shown.length} of ${plural(total.items.length, "line")}`}
          </strong>{" "}
          · {plural(allowances.length, "allowance")}
          {search
            ? ` · shown ${money(decimal(shown.reduce((n, l) => n + scaled(l.sell_total, 2), 0n)))}`
            : ""}
        </span>
        <span>AUD · excluding tax · tax not calculated</span>
      </p>
      <div className="es02-tiles">
        <div className="es02-tile">
          <span>Cost total</span>
          <strong className="es02-tile-money">{money(costTotal)}</strong>
          <small>Internal · permitted users only</small>
        </div>
        <div className="es02-tile">
          <span>Sell total</span>
          <strong className="es02-tile-money">{money(summary.sell_total)}</strong>
          <small>Estimate v{pad(summary.version)} · excluding tax</small>
        </div>
        <div className="es02-tile">
          <span>Margin</span>
          <strong>
            {total.margin_percent === null || total.margin_percent === undefined
              ? "Not applicable"
              : `${total.margin_percent}%`}
          </strong>
          <small>
            Calculated · markup{" "}
            {total.markup_percent === null || total.markup_percent === undefined
              ? "n/a"
              : `${total.markup_percent}%`}
            . Not an approval gate.
          </small>
        </div>
        <div className="es02-tile">
          <span>Allowances</span>
          <strong className="es02-tile-money">{money(allowanceTotal)}</strong>
          <small>
            {allowances.length
              ? `${plural(allowances.length, "line")} · need confirming`
              : "No allowance lines"}
          </small>
        </div>
      </div>
      <p className="es02-note">
        Exact base-10 arithmetic on the saved version. Approval and pricing
        exceptions belong to Estimate review (ES-04); supplier source validity to
        ES-03. Packages have no adopted saved membership and supplier-price
        refresh is not configured. Screen Systems contributions can be reviewed
        and explicitly adopted through the specialist workbench; saved quantities,
        prices and their exact source basis remain unchanged until a successor
        estimate is saved.
      </p>
    </section>
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
        empty={
          versions.data?.status === "NoEstimate"
            ? "Not yet costed"
            : versions.data?.status === "Unavailable"
              ? "Saved estimate unavailable"
              : "No saved estimate version"
        }
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
      <div className="es02-actions">
        {before && (
          <button
            type="button"
            className="es02-link"
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
            className="es02-link"
            onClick={() => {
              onChange(null);
              setBefore(versions.data!.next);
            }}
          >
            Older {label.toLowerCase()} prices
          </button>
        )}
      </div>
    </div>
  );
}

function ComparisonView({ comparison }: { comparison: Comparison }) {
  const counts = comparison.differences.reduce<Record<string, number>>(
    (acc, d) => ({ ...acc, [d.change]: (acc[d.change] ?? 0) + 1 }),
    {},
  );
  const side = (which: "baseline" | "target") => {
    const r = comparison[which],
      cost = comparison.costs[which];
    return (
      <div className="es02-compare-side">
        <span>{which === "baseline" ? "Baseline" : "Target"}</span>
        <strong>
          Alternative {r.option_label} · Discovery {rev(r.revision)}
        </strong>
        <p>
          {longDate(r.created_at)} · <StateTag value={r.readiness} />
        </p>
        <p>
          {cost
            ? `Estimate v${pad(cost.version)} · ${money(cost.amount)} · excluding tax · basis ${cost.discovery_basis ? `Discovery ${rev(cost.discovery_basis.revision)}` : "E1 manual basis"}`
            : "No saved estimate version selected"}
        </p>
      </div>
    );
  };
  return (
    <section
      className="es02-section"
      aria-label="Saved revision comparison"
    >
      <div className="es02-section-head">
        <div>
          <h2>Saved revision comparison</h2>
          <p>
            Alternative {comparison.baseline.option_label}{" "}
            {rev(comparison.baseline.revision)} → Alternative{" "}
            {comparison.target.option_label} {rev(comparison.target.revision)} ·
            exact saved sources only · matched by stable ID, not by label
          </p>
        </div>
      </div>
      <div className="es02-compare-sides">
        {side("baseline")}
        {side("target")}
      </div>
      <div className="es02-compare-counts">
        {["Added", "Changed", "Removed"].map((c) => (
          <span key={c} className="es02-change">
            <ChangeMarker change={c} /> {counts[c] ?? 0}
          </span>
        ))}
        {comparison.costs.baseline?.amount != null &&
          comparison.costs.target?.amount != null && (
            <span>
              Saved sell difference{" "}
              <strong>
                {money(
                  decimal(
                    scaled(comparison.costs.target.amount, 2) -
                      scaled(comparison.costs.baseline.amount, 2),
                  ),
                )}
              </strong>{" "}
              · AUD, excluding tax
            </span>
          )}
        <span className="es02-subtle">
          Unsaved edits are outside this comparison.
        </span>
      </div>
      {!comparison.differences.length ? (
        <p className="es02-empty">No differences between the two saved sources.</p>
      ) : (
        <TableScroll label="Saved revision differences table">
          <table>
            <thead>
              <tr>
                <th scope="col">Record</th>
                <th scope="col">Field</th>
                <th scope="col">
                  {rev(comparison.baseline.revision)} · before
                </th>
                <th scope="col">{rev(comparison.target.revision)} · after</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {comparison.differences.map((d) => (
                <tr key={`${d.entity}:${d.entity_id}:${d.field}`}>
                  <td>
                    <strong>{d.entity}</strong>
                    <br />
                    <span className="es02-secondary">{String(d.entity_id).slice(0, 8)}…</span>
                  </td>
                  <td>{d.field}</td>
                  <td className="es02-wrap">
                    <pre className="es02-value">{valueText(d.before)}</pre>
                  </td>
                  <td className="es02-wrap">
                    <pre className="es02-value">{valueText(d.after)}</pre>
                  </td>
                  <td>
                    <ChangeMarker change={d.change} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
      <p className="es02-note">
        Blank, None declared, deferred, zero and missing are shown as distinct
        values.
      </p>
    </section>
  );
}

function History({
  id,
  optionId,
  optionLabel,
  detail,
  summary,
  dirty,
  workingVersion,
  canSave,
  onSave,
  onStartingPoint,
  compareRequest,
}: {
  id: string;
  optionId: string;
  optionLabel: string;
  detail: Detail;
  summary: Summary | null;
  dirty: boolean;
  workingVersion: number;
  canSave: boolean;
  onSave: () => void;
  onStartingPoint: (r: DiscoveryRevision) => void;
  compareRequest: number;
}) {
  const [before, setBefore] = useState<number | null>(null),
    [baseline, setBaseline] = useState(""),
    [target, setTarget] = useState(""),
    [readinessFilter, setReadinessFilter] = useState(""),
    [error, setError] = useState<unknown>(null),
    [comparison, setComparison] = useState<Comparison | null>(null),
    [inspect, setInspect] = useState<DiscoveryRevision | null>(null);
  const history = useCrmResource<
    Awaited<ReturnType<typeof listDiscoveryHistory>>
  >(
    `estimating/workspaces/${id}/history?option_id=${optionId}${before ? `&before=${before}` : ""}`,
    true,
  );
  const [baselineCost, setBaselineCost] = useState<CostChoice | null>(null),
    [targetCost, setTargetCost] = useState<CostChoice | null>(null);
  const compareRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (compareRequest)
      compareRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [compareRequest]);
  const items = history.data?.items ?? [];
  const sources = [
    ...items.map((r) => ({
      id: r.id,
      option_id: optionId,
      display_name: `Alternative ${optionLabel} · ${rev(r.version)} · ${r.scope_readiness}`,
    })),
    ...detail.options
      .filter((o) => o.option.id !== optionId)
      .map((o) => ({
        id: o.revision.id,
        option_id: o.option.id,
        display_name: `Alternative ${o.option.label} · ${rev(o.revision.version)} · ${o.revision.scope_readiness}`,
      })),
  ];
  const compare = (a: string, b: string, ac = baselineCost, tc = targetCost) => {
    setComparison(null);
    setError(null);
    void api<Comparison>(`estimating/workspaces/${id}/compare`, {
      baseline_id: a,
      target_id: b,
      baseline_cost: ac,
      target_cost: tc,
    }).then(setComparison, setError);
  };
  const shown = items.filter(
    (r) => !readinessFilter || r.scope_readiness === readinessFilter,
  );
  const basisVersion =
    summary?.status === "Available" ? (summary.basis?.revision ?? null) : null;
  return (
    <>
      <section className="es02-section" aria-label="Revisions">
        <div className="es02-section-head">
          <div>
            <h2>Revisions · Alternative {optionLabel}</h2>
            <p>
              Immutable saved discovery. Filters and sorting change the view
              only; comparison uses exact saved sources.
            </p>
          </div>
        </div>
        {dirty && (
          <Strip
            tone="warning"
            title={`Working copy · based on ${rev(workingVersion)}`}
            actions={
              <button
                type="button"
                className="es02-button es02-button-primary"
                disabled={!canSave}
                aria-label="Save discovery revision from revisions"
                onClick={onSave}
              >
                Save discovery revision
              </button>
            }
          >
            Unsaved changes. Not a revision until you save it.
          </Strip>
        )}
        <ErrorNotice error={history.error ?? error} />
        <div className="es02-toolbar">
          <SelectField
            label="Readiness filter"
            name="readiness-filter"
            value={readinessFilter}
            empty="All readiness"
            options={[
              { id: "Complete", display_name: "Complete" },
              { id: "Incomplete", display_name: "Incomplete" },
              { id: "NotRecorded", display_name: "Not recorded" },
            ]}
            onChange={setReadinessFilter}
          />
          <span className="es02-spacer" />
          <button
            type="button"
            className="es02-button"
            disabled={before === null}
            onClick={() => setBefore(null)}
          >
            Latest revisions
          </button>
          <button
            type="button"
            className="es02-button"
            disabled={!history.data?.next}
            onClick={() => setBefore(history.data!.next)}
          >
            Older revisions
          </button>
          <button
            type="button"
            className="es02-button"
            onClick={() =>
              compareRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
            }
          >
            <Icon name="compare" className="es02-icon es02-icon-sm" />
            Compare revisions
          </button>
        </div>
        {history.loading && (
          <p className="es02-note" role="status">
            Loading permitted history…
          </p>
        )}
        <TableScroll label="Discovery revisions table">
          <table>
            <thead>
              <tr>
                {[
                  "Revision",
                  "Predecessor / source",
                  "Author",
                  "Saved",
                  "Reason",
                  "Readiness",
                  "Estimate basis",
                  "Actions",
                ].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const previous = items.find((x) => x.version < r.version);
                return (
                  <tr key={r.id}>
                    <td>
                      <strong>{rev(r.version)}</strong>
                    </td>
                    <td>
                      {r.copied_from_id
                        ? "Copied source"
                        : r.predecessor_id
                          ? rev(Math.max(1, r.version - 1))
                          : "Original"}
                    </td>
                    <td>{r.author}</td>
                    <td>{shortDateTime(r.created_at)}</td>
                    <td className="es02-wrap">{r.reason}</td>
                    <td>
                      {r.kind === "LegacyManual" ? (
                        <Tag>Legacy manual basis</Tag>
                      ) : (
                        <StateTag value={r.scope_readiness} />
                      )}
                    </td>
                    <td>
                      {basisVersion === r.version && summary?.status === "Available" ? (
                        `Estimate v${pad(summary.version)}`
                      ) : (
                        <span className="es02-secondary">—</span>
                      )}
                    </td>
                    <td>
                      <span className="es02-row-actions">
                        <button
                          type="button"
                          className="es02-button es02-button-sm"
                          onClick={() =>
                            void api<DiscoveryRevision>(
                              `estimating/workspaces/${id}/revisions?revision_id=${r.id}`,
                            ).then(setInspect, setError)
                          }
                        >
                          View
                        </button>
                        {previous && (
                          <button
                            type="button"
                            className="es02-button es02-button-sm"
                            onClick={() => {
                              setBaseline(previous.id);
                              setTarget(r.id);
                              setBaselineCost(null);
                              setTargetCost(null);
                              compare(previous.id, r.id, null, null);
                              compareRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
                            }}
                          >
                            Compare with {rev(previous.version)}
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
        {history.data && (
          <p className="es02-table-foot">
            <span>
              <strong>{plural(items.length, "revision")}</strong> · Alternative{" "}
              {optionLabel} · every saved revision is retained
            </span>
            <span>Times are server times, Australia/Brisbane.</span>
          </p>
        )}
      </section>
      <section className="es02-section" aria-label="Compare saved sources" ref={compareRef}>
        <div className="es02-section-head">
          <div>
            <h2>Compare saved sources</h2>
            <p>
              Any two saved revisions, from this or another alternative, with an
              optional exact saved estimate version on each side. Nothing here
              changes a record.
            </p>
          </div>
        </div>
        <div className="es02-grid-2">
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
        <div className="es02-actions">
          <button
            type="button"
            className="es02-button es02-button-primary"
            disabled={!baseline || !target}
            onClick={() => compare(baseline, target)}
          >
            <Icon name="compare" className="es02-icon es02-icon-sm" />
            Compare saved revisions
          </button>
          {baseline && target && baseline === target && (
            <span className="es02-reason">Choose two different saved sources.</span>
          )}
        </div>
      </section>
      {comparison && <ComparisonView comparison={comparison} />}
      {inspect && (
        <Dialog
          wide
          title={`Saved discovery ${rev(inspect.version)}`}
          subtitle={`${inspect.reason} · ${date(inspect.created_at)}`}
          close={() => setInspect(null)}
          footer={
            <>
              <span>Saved revisions are immutable.</span>
              {detail.can_edit && inspect.input && inspect.option_id === optionId && (
                <button
                  type="button"
                  className="es02-button es02-button-primary"
                  onClick={() => {
                    onStartingPoint(inspect);
                    setInspect(null);
                  }}
                >
                  Use as starting point
                </button>
              )}
            </>
          }
        >
          {inspect.input ? (
            <ScopeView input={inspect.input} context={inspect.observed_context} />
          ) : (
            <p>E1 manual basis — E2 questionnaire not recorded.</p>
          )}
          {inspect.input?.configuration && (
            <details>
              <summary>Structured configuration (as saved)</summary>
              <pre>{JSON.stringify(inspect.input.configuration, null, 2)}</pre>
            </details>
          )}
          <FertigationReceivedNotesResource
            key={inspect.id}
            workspaceId={id}
            revisionId={inspect.id}
          />
        </Dialog>
      )}
    </>
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

// Changes between the saved revision and the working copy, named for the save dialog.
function changesSince(
  before: DiscoveryInput | null,
  after: DiscoveryInput,
): { label: string; change: "Added" | "Changed" | "Removed" }[] {
  const out: { label: string; change: "Added" | "Changed" | "Removed" }[] = [];
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const compareSet = <T extends { id: string }>(
    label: string,
    name: (x: T) => string,
    a: T[] = [],
    b: T[] = [],
  ) => {
    for (const x of b) {
      const y = a.find((v) => v.id === x.id);
      if (!y) out.push({ label: `${label} · ${name(x)}`, change: "Added" });
      else if (!same(x, y)) {
        const fields = Object.keys(x).filter(
          (k) => !same((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k]),
        );
        out.push({
          label: `${name(x)} · ${fields.join(", ").replace(/_/g, " ")}`,
          change: "Changed",
        });
      }
    }
    for (const y of a)
      if (!b.some((x) => x.id === y.id))
        out.push({ label: `${label} · ${name(y)}`, change: "Removed" });
  };
  const bc = before?.configuration,
    ac = after.configuration;
  compareSet("Area", (a) => a.label || "New area", bc?.areas, ac?.areas);
  compareSet("System", (s) => s.name || "New system", bc?.systems, ac?.systems);
  compareSet(
    "Fact",
    (f) =>
      `${ac?.systems.find((s) => s.id === f.system_id)?.name ?? "System"} · ${f.field}`,
    bc?.facts,
    ac?.facts,
  );
  compareSet("Evidence", (e) => e.observation || "New observation", bc?.evidence, ac?.evidence);
  compareSet("Work item", (r) => r.work || "New work item", bc?.responsibilities, ac?.responsibilities);
  compareSet("Follow-up", (f) => f.reason || "New follow-up", bc?.follow_ups, ac?.follow_ups);
  for (const x of after.answers) {
    const y = before?.answers.find((a) => a.question_id === x.question_id);
    const label = `${x.question_id} · ${discoveryDefinition.questions.find((q) => q.id === x.question_id)?.label ?? x.question_id}`;
    if (!y) {
      if (x.state !== "Empty") out.push({ label, change: "Added" });
    } else if (!same(x, y)) out.push({ label, change: "Changed" });
  }
  if (before && !same(before.scope, after.scope))
    out.push({ label: "Scope membership", change: "Changed" });
  if (before && !same(before.effort, after.effort))
    out.push({ label: "Estimating effort", change: "Changed" });
  return out;
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
    [reason, setReason] = useState(""),
    [focus, setFocus] = useState<Focus | null>(null),
    [sheetOpen, setSheetOpen] = useState(false),
    [compareRequest, setCompareRequest] = useState(0);
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
    );
  // Board P3: with no remembered choice the Estimating menu starts collapsed at 1440 px
  // and below, so the summary keeps 380 px and the main column 960 px; a remembered
  // choice always wins.
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(wideQuery).matches,
    () => true,
  );
  const menu = useSecondaryMenu(
    preferences.value.menuSet ? preferences.value.menu : wide,
    (open) => preferences.save({ ...preferences.value, menu: open, menuSet: true }),
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
  const previewFailed = preview?.signature === signature && !!preview.error;
  const readiness = dirty
    ? (evaluated?.scope_readiness ??
      (previewFailed ? "Not checked" : "Checking…"))
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
  const chooseAction = (a: typeof action, optionId = current.option.id) =>
    navigation.request(() => {
      const target = d.options.find((o) => o.option.id === optionId) ?? current;
      command.discard();
      setDraft(null);
      setBase(null);
      setHistorical(null);
      setViewed(target.option.id);
      setActionBase({
        expected_version: d.workspace.version,
        expected_revision_id: target.revision.id,
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
  const selected = current.option.id === d.workspace.selected_option_id;
  const costing =
    !dirty &&
    canEdit &&
    selected &&
    r.kind === "Discovery" &&
    r.scope_readiness === "Complete";
  const costingUrl = `/estimating/discovery/${id}/costing?option=${current.option.id}`;
  const stale = !!base && base.version !== d.workspace.version;
  const openStep = useCallback((s: Step) => {
    setTab("Discovery");
    setStep(s);
  }, []);
  // Board P9: a finding opens its step and its field, keeping the working copy.
  const openFinding = (f: DiscoveryFinding) => {
    openStep(f.step);
    setSheetOpen(false);
    if (f.entity_id)
      setFocus((prev) => ({
        entity_id: f.entity_id,
        field: f.field,
        nonce: (prev?.nonce ?? 0) + 1,
      }));
    else {
      const element =
        f.field === "Site"
          ? "scope.mode"
          : f.field === "Effort"
            ? "effort.value"
            : /^Q\d\d$/.test(f.field)
              ? `${f.field}.state`
              : null;
      window.setTimeout(() => {
        const node = element ? document.getElementById(element) : null;
        node?.scrollIntoView({ block: "center" });
        node?.focus({ preventScroll: true });
      }, 60);
    }
  };
  const stepStatus = (s: Step): StepStatus => {
    if (s === "Pricing")
      return summary.data?.status === "Available"
        ? {
            text: summary.data.basis
              ? `Costed on ${rev(summary.data.basis.revision)}`
              : `Saved v${pad(summary.data.version)}`,
          }
        : {
            text:
              summary.data?.status === "Unavailable"
                ? "Unavailable"
                : "Not yet costed",
          };
    if (!evaluated) return { text: readiness === "Checking…" ? "Checking…" : "Not checked" };
    if (s === "Review")
      return {
        text: readiness,
        tone: readiness === "Complete" ? "success" : undefined,
      };
    const own = findings.filter(
      (f) => f.step === s && f.category === "Readiness",
    );
    if (s === "Configuration") {
      const n = new Set(own.map((f) => f.entity_id ?? f.key)).size;
      return n ? { text: `${n} to confirm` } : { text: "Complete", tone: "success" };
    }
    return own.length
      ? { text: "Needs review" }
      : { text: "Complete", tone: "success" };
  };
  const saveReason = !canEdit
    ? current.option.state === "Archived"
      ? "Archived alternative"
      : "View only"
    : frozen
      ? command.uncertain
        ? "Save outcome unknown"
        : "Saving…"
      : !dirty
        ? null
        : unchanged
          ? "No scope changes to save"
          : previewFailed
            ? "Fix the items the check reported"
            : !validPreview
              ? "Checking…"
              : null;
  const saveDisabled = !dirty || !validPreview || frozen || !canEdit;
  const workingLabel = command.uncertain
    ? "Save outcome unknown · reconciling"
    : stale
      ? `Working copy based on ${rev(r.version)} · current is ${rev(d.workspace.version)}`
      : dirty
        ? `Working copy of discovery ${rev(r.version)}`
        : canEdit
          ? `Saved discovery ${rev(r.version)}`
          : `Viewing saved discovery ${rev(r.version)}`;
  const answer = (q: string) => input?.answers.find((a) => a.question_id === q);
  const tags = input?.scope.systems.map((s) => s.tag) ?? [];
  const stepSelect = (
    <div className="es02-step-select">
      <button
        type="button"
        className="es02-button"
        aria-label="Previous step"
        disabled={step === "Requirements"}
        onClick={() => openStep(steps[Math.max(0, steps.indexOf(step) - 1)])}
      >
        <Icon name="arrow-left" />
      </button>
      <SelectField
        label={`Step ${steps.indexOf(step) + 1} of ${steps.length}`}
        name="step-select"
        value={step}
        empty="Choose a step"
        options={steps.map((s, i) => ({
          id: s,
          display_name: `${i + 1}. ${s} · ${stepStatus(s).text}`,
        }))}
        onChange={(s) => {
          if (steps.includes(s as Step)) openStep(s as Step);
        }}
      />
      <button
        type="button"
        className="es02-button"
        aria-label="Next step"
        disabled={step === "Review"}
        onClick={() => openStep(steps[Math.min(4, steps.indexOf(step) + 1)])}
      >
        <Icon name="arrow-right" />
      </button>
    </div>
  );
  const summaryBar = (
    <div className="es02-summary-bar" aria-label="Estimate summary bar">
      <span>
        <Tag
          tone={
            readiness === "Complete"
              ? "success"
              : readiness === "Incomplete"
                ? "warning"
                : "neutral"
          }
        >
          {readiness}
        </Tag>
        {input?.configuration && evaluated
          ? `${plural(configurationCounts(input.configuration, findings).to_confirm, "system")} to confirm`
          : "Not checked"}
      </span>
      <span>
        {summary.data?.status === "Available" ? (
          <>
            Saved estimate v{pad(summary.data.version)}
            {summary.data.basis ? ` · on ${rev(summary.data.basis.revision)}` : ""}{" "}
            <strong>{money(summary.data.sell_total)}</strong>
          </>
        ) : summary.data?.status === "Unavailable" ? (
          "Saved estimate unavailable"
        ) : (
          "Not yet costed"
        )}
      </span>
      <button
        type="button"
        className="es02-button"
        onClick={() => setSheetOpen(true)}
        aria-haspopup="dialog"
      >
        <Icon name="summary" className="es02-icon es02-icon-sm" />
        Summary
      </button>
    </div>
  );
  const summaryPanel = (close?: () => void) => (
    <SummaryPanel
      summary={summary}
      version={r.version}
      label={current.option.label}
      selected={selected}
      dirty={dirty}
      readOnly={!canEdit}
      readiness={readiness}
      config={input?.configuration}
      findings={findings}
      effort={input?.effort.value ?? "Not recorded"}
      evaluated={!!evaluated}
      costingUrl={costing ? costingUrl : null}
      onFinding={openFinding}
      onTab={(t) => {
        setTab(t);
        setSheetOpen(false);
        if (t === "Revisions") setCompareRequest(0);
      }}
      close={close}
    />
  );
  if (denied(command.error) || denied(options.error) || denied(preview?.error))
    return (
      <ErrorNotice error={command.error ?? options.error ?? preview?.error} />
    );
  const menuLink = (href: string, icon: Parameters<typeof Icon>[0]["name"], label: string, current = false) => (
    <Link href={href} aria-current={current ? "page" : undefined}>
      <Icon name={icon} className="mw-icon" />
      <span>{label}</span>
    </Link>
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
              <li>{menuLink("/estimating/discovery", "summary", "Discovery register")}</li>
              <li>{menuLink(`/estimating/discovery/${id}`, "controls", "Estimation Wizard", true)}</li>
              <li>
                <SpecialistEntry workspaceId={id} optionId={current.option.id} />
              </li>
              <li>
                {menuLink(
                  `/estimating/fertigation?estimating_workspace_id=${id}&option_id=${current.option.id}`,
                  "water",
                  "Priva Fertigation Configurator",
                )}
              </li>
              <li>{menuLink("/estimating?tab=estimates", "document", "Saved manual estimates")}</li>
              {summary.data?.status === "Available" && (
                <li>
                  {menuLink(
                    `/estimating/estimates/${summary.data.estimate_id}`,
                    "copy",
                    "Draft quotations",
                  )}
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
            <div className="es02-context-identity">
              <div className="es02-context-title">
                <h1>{d.context.title}</h1>
                <Tag>Synthetic preview</Tag>
              </div>
              <p className="es02-context-meta">
                {r.observed_context?.organisation.display_name ??
                  "Customer context"}{" "}
                ·{" "}
                {r.observed_context?.site?.display_name ??
                  r.input?.scope.mode ??
                  "Legacy scope"}{" "}
                · Owner {d.context.owner}
              </p>
              <p className="es02-context-state">
                {command.uncertain ? (
                  <>
                    <Dot tone="warning" />
                    Save outcome unknown · reconciling
                  </>
                ) : dirty ? (
                  <>
                    <Dot tone="warning" />
                    Working copy of {rev(r.version)} · Unsaved changes
                  </>
                ) : (
                  <>
                    <Dot tone="neutral" />
                    Saved discovery {rev(r.version)} · {shortDateTime(r.created_at)}
                    {!canEdit ? " · view only" : ""}
                  </>
                )}
              </p>
            </div>
            <div className="es02-context-controls">
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
              <button
                type="button"
                className="es02-button es02-summary-toggle"
                aria-label={`${summaryOpen ? "Hide" : "Show"} estimate summary`}
                aria-pressed={summaryOpen}
                onClick={() =>
                  menu.docked ? setSummaryOpen(!summaryOpen) : setSheetOpen(true)
                }
              >
                <Icon name="summary" className="es02-icon es02-icon-sm" />
                Summary
              </button>
            </div>
          </header>
          <RecordTabs
            id="es02-tabs"
            label="Estimating workspace views"
            tabs={[
              { id: "Discovery", label: "Discovery" },
              {
                id: "Alternatives",
                label: (
                  <>
                    Alternatives <span className="es02-count">{d.options.length}</span>
                  </>
                ),
              },
              {
                id: "Revisions",
                label:
                  current.history_count === null ? (
                    "Revisions"
                  ) : (
                    <>
                      Revisions <span className="es02-count">{current.history_count}</span>
                    </>
                  ),
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
              <p className="es02-note" role="status">
                Save accepted. Loading the acknowledged revision…
              </p>
            ) : (
              <>
                {command.uncertain && (
                  <Strip
                    tone="warning"
                    icon="warning"
                    role="alert"
                    title="We couldn’t confirm whether the save completed"
                    actions={
                      !savingReview && (
                        <button
                          type="button"
                          className="es02-button"
                          disabled={command.busy}
                          onClick={() => void command.reconcile()}
                        >
                          Confirm original save outcome
                        </button>
                      )
                    }
                  >
                    We’re checking with the server using the original request.
                    Editing is paused so nothing conflicts with it. Your working
                    copy is kept.
                  </Strip>
                )}
                {!d.can_edit && (
                  <Strip tone="neutral" title="View only">
                    You can read this saved discovery and its permitted amounts.
                    Changing it needs edit access, estimating ownership and a
                    commercial state that allows changes.
                  </Strip>
                )}
                {d.can_edit && current.option.state === "Archived" && (
                  <Strip
                    tone="neutral"
                    icon="warning"
                    title={`Alternative ${current.option.label} is archived`}
                    actions={
                      <button
                        type="button"
                        className="es02-button"
                        disabled={frozen}
                        onClick={() => chooseAction("Reopen")}
                      >
                        Reopen
                      </button>
                    }
                  >
                    Saved discovery and permitted amounts stay readable. Reopening
                    asks for a reason and does not select the alternative.
                  </Strip>
                )}
                {stale && (
                  <Strip
                    tone="warning"
                    icon="warning"
                    role="alert"
                    title="The workspace changed. Your proposal is retained."
                    actions={
                      <>
                        <button
                          type="button"
                          className="es02-button"
                          onClick={() => {
                            setTab("Revisions");
                            setCompareRequest((n) => n + 1);
                          }}
                        >
                          Compare current saved revision
                        </button>
                        <button
                          type="button"
                          className="es02-button"
                          onClick={() =>
                            setBase({
                              version: d.workspace.version,
                              revision_id: r.id,
                            })
                          }
                        >
                          Keep proposal and review against current revision
                        </button>
                      </>
                    }
                  >
                    Alternative {current.option.label} is now at workspace
                    version {d.workspace.version}; a save based on{" "}
                    {rev(base!.version)} would be refused. Your working copy is
                    kept, still based on {rev(base!.version)}.
                  </Strip>
                )}
                <div key={current.option.id} hidden={tab !== "Discovery"}>
                  <nav className="es02-steps" aria-label="Discovery steps">
                    {steps.map((s, i) => {
                      const status = stepStatus(s);
                      return (
                        <button
                          type="button"
                          className="es02-step"
                          key={s}
                          aria-label={`${i + 1}. ${s}`}
                          aria-current={step === s ? "step" : undefined}
                          onClick={() => setStep(s)}
                        >
                          <strong>
                            {i + 1}. {s}
                          </strong>
                          <small aria-hidden="true" data-tone={status.tone}>
                            {status.tone === "success" && (
                              <Icon name="check" className="es02-icon" />
                            )}
                            {status.text}
                          </small>
                        </button>
                      );
                    })}
                  </nav>
                  {stepSelect}
                  {summaryBar}
                  {!input ? (
                    <section className="es02-section">
                      <Strip
                        tone="neutral"
                        title="E1 manual basis — E2 questionnaire not recorded"
                        actions={
                          canEdit &&
                          options.data && (
                            <button
                              type="button"
                              className="es02-button es02-button-primary"
                              onClick={() =>
                                update({
                                  ...blankDiscovery(options.data!, r.site_id),
                                  configuration: emptyConfiguration(),
                                })
                              }
                            >
                              Start discovery proposal
                            </button>
                          )
                        }
                      >
                        Missing questionnaire values are never manufactured. A
                        discovery proposal starts a structured record beside the
                        exact legacy basis.
                      </Strip>
                    </section>
                  ) : (
                    <>
                      <ValidationFields
                        error={
                          preview?.signature === signature ? preview.error : null
                        }
                      >
                        <div className="es02-fields">
                          <div hidden={step !== "Requirements"}>
                            <section className="es02-section" aria-label="Opportunity & site">
                              <div className="es02-section-head">
                                <div>
                                  <h2>Opportunity & site</h2>
                                  <p>
                                    Resolved from canonical records. Editing scope
                                    here does not change those records.
                                  </p>
                                </div>
                              </div>
                              <div className="es02-grid-3">
                                <div className="es02-field">
                                  <span className="es02-label">Opportunity</span>
                                  <div className="es02-readonly">{d.context.title}</div>
                                  <small>Workspace version {d.workspace.version}</small>
                                </div>
                                <div className="es02-field">
                                  <span className="es02-label">Customer</span>
                                  <div className="es02-readonly">
                                    {r.observed_context?.organisation.display_name ?? "Customer context"}
                                  </div>
                                </div>
                                <div className="es02-field">
                                  <span className="es02-label">Site</span>
                                  <div className="es02-readonly">
                                    {r.observed_context?.site?.display_name ??
                                      (input.scope.mode === "NoSiteRequired"
                                        ? "No Site required"
                                        : "Not yet established")}
                                  </div>
                                  <small>One site per saved revision</small>
                                </div>
                                <div className="es02-field">
                                  <span className="es02-label">Estimating owner</span>
                                  <div className="es02-readonly">
                                    {d.context.owner}
                                    <Icon name="user" className="es02-icon es02-icon-sm" />
                                  </div>
                                </div>
                                <div className="es02-field">
                                  <span className="es02-label">Delivery routing</span>
                                  <div className="es02-readonly">Not configured</div>
                                  <small>
                                    Stays Not configured until a routing rule set is adopted.
                                  </small>
                                </div>
                              </div>
                              <div className="es02-context-panels">
                                <WorkspaceSalesBriefs id={id} />
                                <FertigationReceivedNotes items={current.fertigation_handovers} />
                              </div>
                              <fieldset className="es02-fields" disabled={!canEdit || frozen || !options.data}>
                                <DiscoveryFields
                                  value={input}
                                  options={available}
                                  step="Requirements"
                                  part="scope"
                                  onChange={update}
                                />
                                <Field
                                  label="Search permitted Facility/equipment candidates"
                                  name="source-search"
                                  value={lookupSearch}
                                  onChange={setLookupSearch}
                                  hint="Search is scoped to this Site; current selections remain available beyond the first page."
                                />
                              </fieldset>
                            </section>
                            <section className="es02-section" aria-label="Brief">
                              <div className="es02-section-head">
                                <div>
                                  <h2>Brief</h2>
                                  <p>
                                    Answers keep their state and source. An Assumed
                                    answer does not satisfy a required Confirmed one.
                                  </p>
                                </div>
                              </div>
                              <fieldset className="es02-fields" disabled={!canEdit || frozen || !options.data}>
                                <DiscoveryFields
                                  value={input}
                                  options={available}
                                  step="Requirements"
                                  part="brief"
                                  onChange={update}
                                />
                              </fieldset>
                            </section>
                            {input.configuration && (
                              <>
                                <AreasEditor
                                  readOnly={!canEdit || frozen || !options.data}
                                  evaluated={!!evaluated}
                                  value={input.configuration}
                                  onChange={updateConfig}
                                  options={available}
                                  findings={findings}
                                  onEvidence={(selected) => setEvidence({ selected })}
                                  focus={step === "Requirements" ? focus : null}
                                />
                                <FamilyOverview
                                  value={input.configuration}
                                  onConfigure={() => setStep("Configuration")}
                                  variant="full"
                                />
                              </>
                            )}
                          </div>
                          <div hidden={step !== "Configuration"}>
                            {input.configuration ? (
                              <SystemsEditor
                                readOnly={!canEdit || frozen || !options.data}
                                evaluated={!!evaluated}
                                value={input.configuration}
                                onChange={updateConfig}
                                options={available}
                                findings={findings}
                                onEvidence={(selected) => setEvidence({ selected })}
                                focus={step === "Configuration" ? focus : null}
                              />
                            ) : (
                              <section className="es02-section">
                                <Strip
                                  tone="neutral"
                                  title="Structured systems were not recorded in this legacy revision"
                                  actions={
                                    canEdit && (
                                      <button
                                        type="button"
                                        className="es02-button es02-button-primary"
                                        onClick={() => updateConfig(emptyConfiguration())}
                                      >
                                        Add structured configuration to this proposal
                                      </button>
                                    )
                                  }
                                >
                                  Its questionnaire and saved cost basis remain exact.
                                </Strip>
                              </section>
                            )}
                            <section className="es02-section" aria-label="Configuration questions">
                              <div className="es02-section-head">
                                <div>
                                  <h2>Configuration questions</h2>
                                  <p>
                                    Questionnaire answers that describe the configuration
                                    in words. They do not generate systems or lines.
                                  </p>
                                </div>
                              </div>
                              <fieldset className="es02-fields" disabled={!canEdit || frozen || !options.data}>
                                <DiscoveryFields
                                  value={input}
                                  options={available}
                                  step="Configuration"
                                  onChange={update}
                                />
                              </fieldset>
                            </section>
                          </div>
                          <div hidden={step !== "Scope & delivery"}>
                            {input.configuration && (
                              <ResponsibilitiesEditor
                                readOnly={!canEdit || frozen || !options.data}
                                evaluated={!!evaluated}
                                value={input.configuration}
                                onChange={updateConfig}
                                options={available}
                                findings={findings}
                                onEvidence={(selected) => setEvidence({ selected })}
                                focus={step === "Scope & delivery" ? focus : null}
                              />
                            )}
                            <div className="es02-cards">
                              <div className="es02-card">
                                <div className="es02-card-head">
                                  <strong>Exclusions</strong>
                                  <Tag>
                                    {answer("Q02")?.value &&
                                    typeof answer("Q02")!.value === "object"
                                      ? "None declared"
                                      : answer("Q02")?.value
                                        ? "Declared"
                                        : "Not captured"}
                                  </Tag>
                                </div>
                                <p>{answerText(answer("Q02")?.value ?? null)}</p>
                                <p className="es02-subtle">
                                  “No exclusions declared” is its own answer. It is
                                  different from not yet captured.
                                </p>
                              </div>
                              <div className="es02-card">
                                <div className="es02-card-head">
                                  <strong>Assumptions</strong>
                                  <StateTag value={answer("Q03")?.state ?? "Empty"} />
                                </div>
                                <p>{answerText(answer("Q03")?.value ?? null)}</p>
                                <p className="es02-subtle">
                                  Assumed answers still need confirming before discovery
                                  can be Complete.
                                </p>
                              </div>
                            </div>
                            <section className="es02-section" aria-label="Delivery questions">
                              <div className="es02-section-head">
                                <div>
                                  <h2>Delivery questions</h2>
                                  <p>
                                    {tags.length
                                      ? `Shown for the work in scope: ${tags
                                          .map((t) => t.replace(/([a-z])([A-Z])/g, "$1 $2"))
                                          .join(", ")}.`
                                      : "Choose the work in scope in the Brief to see its delivery questions."}{" "}
                                    Delivery routing stays Not configured; requested
                                    dates do not create commitments.
                                  </p>
                                </div>
                              </div>
                              <fieldset className="es02-fields" disabled={!canEdit || frozen || !options.data}>
                                <DiscoveryFields
                                  value={input}
                                  options={available}
                                  step="Scope & delivery"
                                  onChange={update}
                                />
                              </fieldset>
                            </section>
                          </div>
                        </div>
                      </ValidationFields>
                      {step === "Pricing" && (
                        <Pricing
                          summary={summary.data}
                          revision={r.version}
                          dirty={dirty}
                          costing={costing}
                          costingUrl={costingUrl}
                          selected={selected}
                          readiness={readiness}
                        />
                      )}
                      {step === "Review" && (
                        <section className="es02-section" aria-label="Discovery review">
                          <div className="es02-tiles">
                            <div className="es02-tile">
                              <span>Discovery readiness</span>
                              <div className="es02-tile-tags">
                                <Tag
                                  tone={
                                    readiness === "Complete"
                                      ? "success"
                                      : readiness === "Incomplete"
                                        ? "warning"
                                        : "neutral"
                                  }
                                >
                                  {readiness}
                                </Tag>
                              </div>
                              <small>
                                {dirty ? "Working preview of this copy" : "Saved with this revision"}
                              </small>
                            </div>
                            <div className="es02-tile">
                              <span>Last saved revision</span>
                              <div className="es02-tile-tags">
                                <strong>{rev(r.version)}</strong>
                                <StateTag value={r.kind === "LegacyManual" ? "Legacy manual basis" : r.scope_readiness} />
                              </div>
                              <small>{longDate(r.created_at)}</small>
                            </div>
                            <div className="es02-tile">
                              <span>Cost basis</span>
                              <strong>
                                {summary.data?.status === "Available"
                                  ? `${summary.data.basis ? `Discovery ${rev(summary.data.basis.revision)}` : "E1 manual basis"} · Estimate v${pad(summary.data.version)}`
                                  : summary.data?.status === "Unavailable"
                                    ? "Unavailable"
                                    : "Not yet costed"}
                              </strong>
                              <small>
                                {summary.data?.status === "Available"
                                  ? `${money(summary.data.sell_total)} · excluding tax`
                                  : "No amount is borrowed from another alternative"}
                              </small>
                            </div>
                            <div className="es02-tile">
                              <span>Draft quotation</span>
                              <strong>
                                {summary.data?.status === "Available"
                                  ? `From Estimate v${pad(summary.data.version)}`
                                  : "Needs a saved estimate"}
                              </strong>
                              <small>Prepared from the manual estimate; render state is not approval.</small>
                            </div>
                          </div>
                          <div className="es02-section-head">
                            <div>
                              <h2>Findings by effect</h2>
                              <p>Each finding opens its step and field. Your working copy is kept.</p>
                            </div>
                          </div>
                          {(() => {
                            const blocking = findings.filter((f) => f.category === "Readiness"),
                              informational = findings.filter((f) => f.category === "Information"),
                              adoption = [
                                ...(dirty ? [{ key: "unsaved", text: "Save discovery before reviewing it for costing", meta: "Unsaved changes" }] : []),
                                ...(readiness !== "Complete" ? [{ key: "readiness", text: `Discovery ${rev(r.version)} is ${readiness === "Checking…" || readiness === "Not checked" ? "not yet checked" : readiness}, so it cannot become the cost basis`, meta: "Readiness" }] : []),
                                ...(!selected ? [{ key: "selected", text: `Alternative ${current.option.label} is not the selected alternative`, meta: "Selection" }] : []),
                                ...(current.option.state !== "Active" ? [{ key: "state", text: `Alternative ${current.option.label} is ${current.option.state.toLowerCase()}`, meta: "State" }] : []),
                                ...(!d.can_edit ? [{ key: "authority", text: "Current authority holds adoption", meta: "Access" }] : []),
                              ],
                              saving = previewFailed ? 1 : 0;
                            const group = (
                              title: string,
                              note: string,
                              count: number,
                              body: ReactNode,
                              tone: Tone = count ? "warning" : "success",
                            ) => (
                              <div className="es02-finding-group">
                                <div className="es02-finding-head">
                                  {tone === "success" ? (
                                    <span className="es02-finding-icon" data-tone="success">
                                      <Icon name="check" />
                                    </span>
                                  ) : tone === "neutral" ? (
                                    <Icon name="info" />
                                  ) : (
                                    <Dot tone="warning" />
                                  )}
                                  <strong>{title}</strong>
                                  <span>{note}</span>
                                  <span className="es02-count">{count}</span>
                                </div>
                                {body}
                              </div>
                            );
                            const row = (f: DiscoveryFinding) => (
                              <button type="button" key={f.key} className="es02-finding-row" onClick={() => openFinding(f)}>
                                <span>{f.message}</span>
                                <small>
                                  {f.step}
                                  {f.entity_id ? ` · ${f.field.replace(/([a-z])([A-Z])/g, "$1 $2")}` : ""}
                                </small>
                                <Icon name="chevron-right" className="es02-icon es02-icon-sm" />
                              </button>
                            );
                            return (
                              <>
                                {group(
                                  "Prevents saving",
                                  "Malformed, invalid or denied values",
                                  saving,
                                  saving ? (
                                    <div style={{ padding: "8px 14px" }}>
                                      <ErrorNotice error={preview?.error} focusOnError={false} />
                                    </div>
                                  ) : (
                                    <p>
                                      {dirty && unchanged
                                        ? "No scope changes to save."
                                        : "Nothing prevents saving this working copy."}
                                    </p>
                                  ),
                                )}
                                {group(
                                  "Prevents Complete discovery",
                                  "Saving is still allowed",
                                  blocking.length,
                                  blocking.length ? blocking.map(row) : <p>No open readiness findings.</p>,
                                  !evaluated ? "neutral" : blocking.length ? "warning" : "success",
                                )}
                                {group(
                                  "Prevents current scope adoption",
                                  summary.data?.status === "Available" && summary.data.basis
                                    ? `Costing stays on Discovery ${rev(summary.data.basis.revision)}`
                                    : "No costing basis adopted yet",
                                  adoption.length,
                                  adoption.length ? (
                                    adoption.map((a) => (
                                      <div key={a.key} className="es02-finding-row">
                                        <span>{a.text}</span>
                                        <small>{a.meta}</small>
                                      </div>
                                    ))
                                  ) : (
                                    <p>This saved, Complete, selected discovery can be reviewed for manual costing.</p>
                                  ),
                                )}
                                {group(
                                  "Informational",
                                  "Review items, not blockers",
                                  informational.length + 1,
                                  <>
                                    {informational.map(row)}
                                    <div className="es02-finding-row">
                                      <span>Delivery routing is Not configured</span>
                                      <small>Scope & delivery</small>
                                    </div>
                                  </>,
                                  "neutral",
                                )}
                              </>
                            );
                          })()}
                          {(() => {
                            const config = input.configuration;
                            const unanswered = input.answers.filter(
                              (a) => a.state === "Empty" || a.state === "Deferred" || a.value === "Unknown",
                            );
                            const assumed =
                              input.answers.filter((a) => a.state === "Assumed").length +
                              (config
                                ? [...config.areas, ...config.facts, ...config.responsibilities].filter(
                                    (x) => x.state === "Assumed",
                                  ).length
                                : 0);
                            const gaps = config?.responsibilities.filter((x) => x.party === "Unknown").length ?? 0;
                            const q02 = answer("Q02");
                            return (
                              <div className="es02-facts-grid">
                                <div>
                                  <span>Evidence recorded</span>
                                  <strong>
                                    {config ? plural(config.evidence.length, "observation") : "No structured configuration"}
                                  </strong>
                                </div>
                                <div>
                                  <span>Unanswered requirements</span>
                                  <strong>
                                    {unanswered.length
                                      ? unanswered.map((a) => `${a.question_id} ${a.state === "Deferred" ? "Deferred" : a.value === "Unknown" ? "Unknown" : "Empty"}`).join(" · ")
                                      : "None"}
                                  </strong>
                                </div>
                                <div>
                                  <span>Assumptions</span>
                                  <strong>{assumed ? `${assumed} Assumed` : "None"}</strong>
                                </div>
                                <div>
                                  <span>Exclusions</span>
                                  <strong>
                                    {q02?.value && typeof q02.value === "object"
                                      ? "None declared"
                                      : q02?.value
                                        ? "Declared"
                                        : "Not captured"}
                                  </strong>
                                </div>
                                <div>
                                  <span>Responsibility gaps</span>
                                  <strong>{gaps}</strong>
                                </div>
                                <div>
                                  <span>Cost-basis alignment</span>
                                  <strong>
                                    {summary.data?.status === "Available"
                                      ? summary.data.basis
                                        ? summary.data.basis.revision === r.version && !dirty
                                          ? `Estimate v${pad(summary.data.version)} on ${rev(r.version)} · aligned`
                                          : `Estimate v${pad(summary.data.version)} on ${rev(summary.data.basis.revision)} · ${dirty ? "working copy" : rev(r.version)} not yet costed`
                                        : "E1 manual basis · no discovery basis"
                                      : "Not yet costed"}
                                  </strong>
                                </div>
                              </div>
                            );
                          })()}
                          <div className="es02-card">
                            <div className="es02-card-head">
                              <strong>Actions</strong>
                              <span className="es02-subtle" style={{ marginLeft: "auto", fontSize: 13 }}>
                                Review is a completeness and source check, not commercial approval.
                              </span>
                            </div>
                            <div className="es02-actions">
                              <button
                                type="button"
                                className="es02-button es02-button-primary"
                                disabled={saveDisabled}
                                aria-label="Save discovery revision from review"
                                onClick={() => setSavingReview(true)}
                              >
                                <Icon name="save" className="es02-icon es02-icon-sm" />
                                Save discovery revision
                              </button>
                              <button
                                type="button"
                                className="es02-button"
                                onClick={() => {
                                  setTab("Revisions");
                                  setCompareRequest((n) => n + 1);
                                }}
                              >
                                <Icon name="compare" className="es02-icon es02-icon-sm" />
                                Compare revisions
                              </button>
                              {costing ? (
                                <Link href={costingUrl} className="es02-button">
                                  Review scope for manual costing
                                </Link>
                              ) : (
                                <button type="button" className="es02-button" disabled>
                                  Review scope for manual costing
                                </button>
                              )}
                              {summary.data?.status === "Available" && (
                                <Link href={`/estimating/estimates/${summary.data.estimate_id}`} className="es02-button">
                                  <Icon name="external" className="es02-icon es02-icon-sm" />
                                  Open manual estimate and Draft quotation
                                </Link>
                              )}
                            </div>
                            <p className="es02-note">
                              Review scope for manual costing needs a saved, Complete,
                              selected discovery. The server assigns the revision number
                              and time when it accepts a save. Survey, supplier source and
                              specialist calculator integrations are unavailable; manual
                              attributed discovery remains usable.
                            </p>
                          </div>
                          <details className="es02-details" style={{ marginTop: 14 }}>
                            <summary>
                              Full proposal as it will be saved
                              <Icon name="chevron-down" className="es02-icon es02-icon-sm es02-icon-toggle" />
                            </summary>
                            <div className="es02-details-body">
                              <ScopeView input={input} context={r.observed_context} />
                            </div>
                          </details>
                        </section>
                      )}
                    </>
                  )}
                </div>
                {tab === "Alternatives" && (
                  <section className="es02-section" aria-label="Alternatives">
                    <div className="es02-section-head">
                      <div>
                        <h2>Alternatives</h2>
                        <p>
                          Commercial alternatives for this workspace, each with its
                          own revision chain.
                        </p>
                      </div>
                      <div className="es02-actions">
                        <button
                          type="button"
                          className="es02-button"
                          onClick={() => {
                            setTab("Revisions");
                            setCompareRequest((n) => n + 1);
                          }}
                        >
                          <Icon name="compare" className="es02-icon es02-icon-sm" />
                          Compare alternatives
                        </button>
                        <button
                          type="button"
                          className="es02-button"
                          disabled={!canEdit || !r.input || d.options.length >= 10 || frozen}
                          onClick={() => beginBranch("CopyDiscovery")}
                        >
                          <Icon name="copy" className="es02-icon es02-icon-sm" />
                          Copy discovery to alternative
                        </button>
                        <button
                          type="button"
                          className="es02-button es02-button-primary"
                          disabled={!canEdit || d.options.length >= 10 || frozen}
                          onClick={() => beginBranch("Fresh")}
                        >
                          <Icon name="plus" className="es02-icon es02-icon-sm" />
                          New alternative
                        </button>
                      </div>
                    </div>
                    {d.options.length >= 10 && (
                      <Strip tone="neutral" icon="warning" title="Alternative limit reached">
                        Ten alternatives, archived included. Nothing is deleted to free a slot.
                      </Strip>
                    )}
                    <TableScroll label="Alternatives table">
                      <table>
                        <thead>
                          <tr>
                            {[
                              "Alternative",
                              "Selected",
                              "State",
                              "Current discovery",
                              "Scope readiness",
                              "Estimate",
                              "Priced amount",
                              "Updated",
                              "Owner",
                              "Actions",
                            ].map((h) => (
                              <th key={h} scope="col" className={h === "Priced amount" ? "es02-num" : undefined}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {d.options.map((o) => {
                            const isCurrent = o.option.id === current.option.id,
                              isSelected = o.option.id === d.workspace.selected_option_id;
                            return (
                              <tr key={o.option.id} data-selected={isCurrent}>
                                <td>
                                  <strong>{o.option.label}</strong>
                                  {isCurrent ? <span className="es02-secondary"> · viewing</span> : null}
                                </td>
                                <td>
                                  {isSelected ? <Tag tone="success">Selected</Tag> : <span className="es02-secondary">—</span>}
                                </td>
                                <td>
                                  <StateTag value={o.option.state} />
                                </td>
                                <td>
                                  {rev(o.revision.version)}
                                  <span className="es02-secondary">
                                    {" · "}
                                    {isCurrent && dirty
                                      ? "working copy"
                                      : o.revision.copied_from_id
                                        ? "copy"
                                        : o.revision.predecessor_id
                                          ? "saved"
                                          : "fresh"}
                                  </span>
                                </td>
                                <td>
                                  <StateTag value={o.revision.kind === "LegacyManual" ? "Legacy manual basis" : o.revision.scope_readiness} />
                                </td>
                                <td>
                                  {o.cost.status === "Available" ? (
                                    <>
                                      Estimate v{pad(o.cost.version)}
                                      <span className="es02-secondary">
                                        {" · "}
                                        {o.cost.basis ? `on ${rev(o.cost.basis.revision)}` : "E1 manual basis"}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="es02-secondary">
                                      {o.cost.status === "NoEstimate" ? "Not yet costed" : "Unavailable"}
                                    </span>
                                  )}
                                </td>
                                <td className="es02-num">
                                  {o.cost.status === "Available" ? money(o.cost.amount ?? null) : <span className="es02-secondary">—</span>}
                                </td>
                                <td>{shortDate(o.revision.created_at)}</td>
                                <td>{d.context.owner}</td>
                                <td>
                                  <span className="es02-row-actions">
                                    <button
                                      type="button"
                                      className="es02-button es02-button-sm"
                                      aria-label={`View alternative ${o.option.label}`}
                                      disabled={isCurrent}
                                      onClick={() => {
                                        goOption(o.option.id);
                                        setTab("Discovery");
                                      }}
                                    >
                                      View
                                    </button>
                                    <AlternativeMenu
                                      label={o.option.label}
                                      selected={isSelected}
                                      state={o.option.state}
                                      canEdit={canEdit}
                                      canReopen={d.can_edit}
                                      frozen={frozen}
                                      onAction={(a) => chooseAction(a, o.option.id)}
                                    />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </TableScroll>
                    <div className="es02-actions es02-viewed-actions">
                      <span className="es02-reason">
                        Viewed alternative {current.option.label}
                        {selected ? " · selected" : ""}
                      </span>
                      <button
                        type="button"
                        className="es02-button"
                        disabled={!canEdit || selected || frozen}
                        onClick={() => chooseAction("Select")}
                      >
                        Select this option
                      </button>
                      {current.option.state === "Archived" ? (
                        <button
                          type="button"
                          className="es02-button"
                          disabled={!d.can_edit || frozen}
                          onClick={() => chooseAction("Reopen")}
                        >
                          Reopen this option
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="es02-button"
                          disabled={!canEdit || selected || frozen}
                          onClick={() => chooseAction("Archive")}
                        >
                          Archive this option
                        </button>
                      )}
                    </div>
                    <p className="es02-table-foot">
                      <span>
                        <strong>{d.options.length} of 10 alternatives</strong> ·{" "}
                        {d.options.filter((o) => o.option.state === "Archived").length} archived ·
                        archived alternatives still count towards the limit
                      </span>
                      <span>
                        Amounts come from each alternative’s own saved estimate. Alternatives are never summed.
                      </span>
                    </p>
                    <div className="es02-cards">
                      <div className="es02-card">
                        <div className="es02-card-head">
                          <Icon name="eye" />
                          <strong>Viewing is not selecting</strong>
                        </div>
                        <p>Viewing, editing or comparing another alternative never changes the selected alternative.</p>
                      </div>
                      <div className="es02-card">
                        <div className="es02-card-head">
                          <Icon name="copy" />
                          <strong>Copies start unconfirmed</strong>
                        </div>
                        <p>A copied alternative keeps the source lineage; copied Confirmed answers become Answered and no costs are copied.</p>
                      </div>
                      <div className="es02-card">
                        <div className="es02-card-head">
                          <Icon name="archive" />
                          <strong>Selected cannot be archived</strong>
                        </div>
                        <p>Select, archive and reopen each ask for a reason. Reopening does not select.</p>
                      </div>
                    </div>
                  </section>
                )}
                {tab === "Revisions" && (
                  <History
                    key={`history:${current.option.id}`}
                    id={id}
                    optionId={current.option.id}
                    optionLabel={current.option.label}
                    detail={d}
                    summary={summary.data}
                    dirty={dirty}
                    workingVersion={r.version}
                    canSave={!saveDisabled}
                    onSave={() => setSavingReview(true)}
                    compareRequest={compareRequest}
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
                          v.configuration.facts = v.configuration.facts.map((f) =>
                            f.state === "Confirmed" ? { ...f, state: "Answered", follow_up } : f,
                          );
                          v.configuration.areas = v.configuration.areas.map((a) =>
                            a.state === "Confirmed" ? { ...a, state: "Answered", follow_up } : a,
                          );
                          v.configuration.responsibilities = v.configuration.responsibilities.map((a) =>
                            a.state === "Confirmed" ? { ...a, state: "Answered", follow_up } : a,
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
            <ErrorNotice error={command.error} />
            {dirty && preview?.signature === signature && tab !== "Discovery" && (
              <ErrorNotice error={preview.error} />
            )}
          </div>
          <footer className="es02-bottom">
            <span className="es02-bottom-state">
              <Dot tone={dirty || command.uncertain ? "warning" : "neutral"} />
              {workingLabel}
              {tab !== "Discovery" && dirty ? " is kept while you view other records." : ""}
            </span>
            {saveReason && dirty && (
              <span className="es02-reason">{saveReason}</span>
            )}
            <button
              type="button"
              className="es02-button es02-summary-toggle"
              onClick={() => {
                // Phones show the summary as a section after the form; wider
                // overlay widths open it as a sheet.
                if (menu.phone)
                  document
                    .querySelector("#ppo-estimate-wizard .es02-layout > .es02-summary")
                    ?.scrollIntoView({ block: "start", behavior: "smooth" });
                else setSheetOpen(true);
              }}
            >
              <Icon name="summary" className="es02-icon es02-icon-sm" />
              Summary
            </button>
            {tab === "Discovery" ? (
              <button
                type="button"
                className="es02-button es02-step-nav"
                disabled={step === "Requirements"}
                onClick={() => openStep(steps[Math.max(0, steps.indexOf(step) - 1)])}
              >
                <Icon name="arrow-left" className="es02-icon es02-icon-sm" />
                Previous
              </button>
            ) : (
              <button
                type="button"
                className="es02-button es02-step-nav"
                onClick={() => setTab("Discovery")}
              >
                <Icon name="arrow-left" className="es02-icon es02-icon-sm" />
                Return to Discovery
              </button>
            )}
            <button
              type="button"
              className="es02-button es02-button-primary"
              disabled={saveDisabled}
              onClick={() => setSavingReview(true)}
            >
              Save discovery revision
            </button>
            {tab === "Discovery" && (
              <button
                type="button"
                className="es02-button es02-step-nav"
                disabled={step === "Review"}
                onClick={() => openStep(steps[Math.min(4, steps.indexOf(step) + 1)])}
              >
                Continue
                <Icon name="arrow-right" className="es02-icon es02-icon-sm" />
              </button>
            )}
          </footer>
        </div>
        {summaryOpen && summaryPanel()}
        {sheetOpen && (
          <SummarySheet close={() => setSheetOpen(false)}>
            {summaryPanel(() => setSheetOpen(false))}
          </SummarySheet>
        )}
      </div>
      {savingReview && validPreview && (
        <SaveReview
          key={signature}
          preview={validPreview}
          optionLabel={current.option.label}
          version={r.version}
          changes={changesSince(r.input, input!)}
          findings={findings}
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
        <Dialog
          title="Unsaved discovery"
          subtitle={`Working copy of discovery ${rev(r.version)}`}
          close={navigation.stay}
          footer={
            <>
              <button type="button" className="es02-button" onClick={navigation.stay}>
                Stay
              </button>
              <button
                type="button"
                className="es02-button es02-button-primary"
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
                className="es02-button es02-button-danger"
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
            </>
          }
        >
          <p>
            {frozen
              ? "Reconcile the original save before leaving."
              : "Keep this proposal, save a revision, or explicitly discard working changes. Unsaved changes are not kept after the page closes."}
          </p>
        </Dialog>
      )}
      {branch && options.data && (
        <Dialog
          wide
          title="New alternative"
          subtitle={
            branch === "Fresh"
              ? "A fresh alternative starts its own revision chain with no copied answers."
              : `Copies Alternative ${current.option.label}’s discovery ${rev(r.version)}. Confirmed answers become Answered; no costs are copied.`
          }
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
          subtitle={
            action === "Select"
              ? "Selecting changes which alternative the workspace carries forward. It does not approve anything."
              : action === "Archive"
                ? "An archived alternative keeps its saved revisions and still counts towards the limit of ten."
                : "Reopening restores the alternative for editing. It does not select it."
          }
          close={() => {
            if (!frozen) setAction(null);
          }}
        >
          <form
            id="es02-option-action"
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
            <div className="es02-dialog-actions">
              <button
                type="button"
                className="es02-button"
                disabled={frozen}
                onClick={() => setAction(null)}
              >
                Cancel
              </button>
              <button className="es02-button es02-button-primary" disabled={frozen} type="submit">
                Confirm {action.toLowerCase()}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {evidence && input?.configuration && (
        <EvidencePanel
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

function AlternativeMenu({
  label,
  selected,
  state,
  canEdit,
  canReopen,
  frozen,
  onAction,
}: {
  label: string;
  selected: boolean;
  state: "Active" | "Archived";
  canEdit: boolean;
  canReopen: boolean;
  frozen: boolean;
  onAction: (a: "Select" | "Archive" | "Reopen") => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="es02-menu-root"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        className="es02-button es02-button-sm es02-button-icon"
        aria-label={`More actions for alternative ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="more" className="es02-icon es02-icon-sm" />
      </button>
      {open && (
        <div className="es02-menu-list" role="menu" aria-label={`Alternative ${label} actions`} onClick={() => setOpen(false)}>
          {state === "Archived" ? (
            <button type="button" role="menuitem" disabled={!canReopen || frozen} onClick={() => onAction("Reopen")}>
              Reopen alternative {label}
            </button>
          ) : (
            <>
              <button type="button" role="menuitem" disabled={!canEdit || selected || frozen} onClick={() => onAction("Select")}>
                Select alternative {label}
              </button>
              <button type="button" role="menuitem" disabled={!canEdit || selected || frozen} onClick={() => onAction("Archive")}>
                Archive alternative {label}
              </button>
            </>
          )}
        </div>
      )}
    </span>
  );
}

function SummarySheet({ children, close }: { children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="es02-summary-sheet"
      aria-label="Estimate summary sheet"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {children}
    </dialog>
  );
}

function SaveReview({
  preview,
  optionLabel,
  version,
  changes,
  findings,
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
  optionLabel: string;
  version: number;
  changes: ReturnType<typeof changesSince>;
  findings: DiscoveryFinding[];
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
  const proposed = preview.compiled.scope_readiness,
    blocking = findings.filter((f) => f.category === "Readiness").length,
    confirmations = preview.required_confirmation_ids.length + preview.configuration_confirmations.length;
  const ready =
    !busy &&
    reason.trim() !== "" &&
    questions.length === preview.required_confirmation_ids.length &&
    facts.length === preview.configuration_confirmations.length;
  const describe = (f: Preview["configuration_confirmations"][number]) => {
    const c = preview.compiled.input.configuration;
    const area = c?.areas.find((a) => a.id === f.fact_id);
    if (area) return `${area.label} · Area · ${area.state} · ${area.source || "no source"}`;
    const resp = c?.responsibilities.find((r) => r.id === f.fact_id);
    if (resp) return `${resp.work} · Work item · ${resp.party} · ${resp.source || "no source"}`;
    const fact = c?.facts.find((v) => v.id === f.fact_id);
    return fact
      ? `${c?.systems.find((s) => s.id === fact.system_id)?.name} · ${fact.field.replace(/([a-z])([A-Z])/g, "$1 $2")} · ${fact.value ?? "no value"}${fact.unit === "Zones" ? " zones" : ""} · ${fact.source || "no source"}`
      : "configuration fact";
  };
  return (
    <Dialog
      title="Save discovery revision"
      label="Review discovery revision"
      subtitle={`Alternative ${optionLabel} · saves an immutable successor to ${rev(version)}`}
      close={close}
      footer={
        <>
          <span>The server assigns the revision number and time.</span>
          <button type="button" className="es02-button" disabled={busy} onClick={close}>
            Cancel
          </button>
          <button
            className="es02-button es02-button-primary"
            type="submit"
            form="es02-save-review"
            disabled={!ready}
            aria-label="Confirm save discovery revision"
          >
            <Icon name="save" className="es02-icon es02-icon-sm" />
            Save discovery revision
          </button>
        </>
      }
    >
      <ErrorNotice error={error} />
      {uncertain && (
        <button type="button" className="es02-button" onClick={reconcile}>
          Confirm original save outcome
        </button>
      )}
      <Strip tone="info">
        {proposed === "Complete"
          ? "This revision will be saved as Complete. Saved prices remain unchanged; adoption as a cost basis is a separate step."
          : `Incomplete discovery can be saved. It stays Incomplete until the ${plural(blocking, "open finding")} ${blocking === 1 ? "is" : "are"} resolved.`}
      </Strip>
      <h3>Changes since {rev(version)}</h3>
      {changes.length ? (
        <ul className="es02-changes">
          {changes.slice(0, 12).map((c, i) => (
            <li key={i}>
              <span>{c.label}</span>
              <span>{c.change}</span>
            </li>
          ))}
          {changes.length > 12 && (
            <li>
              <span className="es02-subtle">and {changes.length - 12} more</span>
              <span />
            </li>
          )}
        </ul>
      ) : (
        <p className="es02-subtle">
          The working copy differs from {rev(version)} in ways this summary does not
          list; the saved comparison shows every field.
        </p>
      )}
      <form
        id="es02-save-review"
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
          multiline
          maxLength={1000}
          hint="Required. Shown with the revision in history."
        />
        {confirmations > 0 && (
          <fieldset disabled={busy} className="es02-confirm">
            <legend>Confirm reviewed values</legend>
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
                <span
                  title={discoveryDefinition.questions.find((q) => q.id === id)?.label ?? id}
                >
                  I confirm {id} in this exact proposal
                </span>
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
                <span>
                  I confirm {describe(f)} — with the reviewed value, units and sources
                </span>
              </label>
            ))}
          </fieldset>
        )}
      </form>
    </Dialog>
  );
}

function EvidencePanel({
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
    [chosen, setChosen] = useState(selected ?? value.evidence[0]?.id ?? "");
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
  const currentVersion = evidence
    ? saved.data?.current.find((e) => e.id === evidence.id)?.version
    : undefined;
  const sourceState = !evidence
    ? null
    : evidence.source_type === "Manual"
      ? "Attributed text"
      : !evidence.source_id
        ? "No source chosen"
        : saved.loading
          ? "Checking current source…"
          : currentVersion === undefined
            ? "Source unavailable under current access"
            : currentVersion === evidence.source_version
              ? "Matches recorded version"
              : "Review current source before saving";
  const citing = evidence
    ? [
        ...value.facts
          .filter((f) => f.evidence_ids.includes(evidence.id))
          .map((f) => ({
            key: f.id,
            title: `${f.value ?? "No value"}${f.unit === "Zones" ? " zones" : ""}`,
            meta: `${f.role} · ${value.systems.find((s) => s.id === f.system_id)?.name ?? "System"}`,
            state: f.state === "Unknown" ? "Not verified" : f.state,
          })),
        ...value.systems
          .filter((s) => s.evidence_ids.includes(evidence.id))
          .map((s) => ({ key: s.id, title: s.name || "New system", meta: "System evidence", state: "Cited" })),
        ...value.areas
          .filter((a) => a.evidence_ids.includes(evidence.id))
          .map((a) => ({ key: a.id, title: a.label || "New area", meta: "Area evidence", state: a.state })),
      ]
    : [];
  const addManual = () => {
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
  };
  return (
    <Panel
      eyebrow="Evidence"
      label="Configuration evidence"
      title={evidence ? evidence.observation || "New observation" : "Configuration evidence"}
      tag={
        sourceState && (
          <StateTag value={sourceState} />
        )
      }
      close={close}
      footer={
        <>
          {evidence?.source_type === "Asset" && evidence.source_id && (
            <a className="es02-button" href={`/equipment/${evidence.source_id}`} target="_blank" rel="noreferrer">
              <Icon name="external" className="es02-icon es02-icon-sm" />
              Open source record
            </a>
          )}
          <p>
            This panel reads the recorded evidence. It does not replace the
            estimate summary or change any fact on its own.
          </p>
        </>
      }
    >
      <ErrorNotice error={saved.error} />
      <SelectField
        label="Evidence observation"
        name="evidence-choice"
        value={chosen}
        empty={value.evidence.length ? "Choose an observation…" : "No evidence recorded yet"}
        options={value.evidence.map((e) => ({
          id: e.id,
          display_name: e.observation || "New observation",
        }))}
        onChange={setChosen}
      />
      {canEdit && (
        <div className="es02-actions" style={{ marginBottom: 10 }}>
          <button type="button" className="es02-button es02-button-sm" onClick={addManual}>
            <Icon name="plus" className="es02-icon es02-icon-sm" />
            Add manual evidence
          </button>
        </div>
      )}
      {evidence && (
        <>
          <div className="es02-panel-row">
            <span>Source type</span>
            {evidence.source_type === "Manual"
              ? "Manual · attributed text"
              : `${evidence.source_type} · permitted record`}
          </div>
          <div className="es02-panel-row">
            <span>Recorded version</span>
            {evidence.source_id
              ? `${evidence.source_id} · recorded version ${evidence.source_version ?? "unknown"}`
              : "No source record"}
            {evidence.observed_on ? ` · observed ${longDate(evidence.observed_on)}` : ""}
          </div>
          <div className="es02-panel-row">
            <span>Current state</span>
            {sourceState}
          </div>
          {evidence.observation && (
            <blockquote className="es02-panel-quote">{evidence.observation}</blockquote>
          )}
          <fieldset disabled={!canEdit} className="es02-fields">
            <h3 className="es02-h3">Recorded observation</h3>
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
                    className="es02-button es02-button-sm"
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
              onChange={(observation) => editEvidence({ observation })}
            />
            <Field
              label="Observed business date"
              name="evidence.date"
              type="date"
              value={evidence.observed_on}
              onChange={(observed_on) => editEvidence({ observed_on })}
            />
            <Field
              label="Evidence note"
              name="evidence.note"
              value={evidence.note ?? ""}
              multiline
              maxLength={500}
              onChange={(note) => editEvidence({ note: note || null })}
            />
          </fieldset>
          <h3 className="es02-h3">Facts citing this evidence</h3>
          {citing.length ? (
            <div className="es02-panel-facts">
              {citing.map((c) => (
                <div key={c.key} className="es02-panel-fact">
                  <span>
                    <strong>{c.title}</strong>{" "}
                    <span className="es02-secondary">· {c.meta}</span>
                  </span>
                  <StateTag value={c.state} />
                </div>
              ))}
            </div>
          ) : (
            <p className="es02-note">No working fact, system or area cites this observation yet.</p>
          )}
        </>
      )}
      <h3 className="es02-h3">Permitted equipment sources</h3>
      <div className="es02-sources">
        {options.equipment.length === 0 && (
          <p className="es02-note">No permitted equipment in this Site.</p>
        )}
        {options.equipment.map((e) => (
          <a key={e.id} href={`/equipment/${e.id}`} target="_blank" rel="noreferrer">
            {e.display_name}
          </a>
        ))}
      </div>
      {value.follow_ups.length > 0 && (
        <>
          <h3 className="es02-h3">Discovery follow-ups</h3>
          <div className="es02-panel-facts">
            {value.follow_ups.map((f) => (
              <div key={f.id} className="es02-panel-fact">
                <span>
                  <strong>{f.reason || "New follow-up"}</strong>{" "}
                  <span className="es02-secondary">
                    · {options.owners.find((o) => o.id === f.owner_id)?.display_name ?? "Recorded owner"} ·{" "}
                    {f.due_on ? `Recorded due ${longDate(f.due_on)}` : "Due date unknown"}
                    {f.activity_id
                      ? ` · Activity current date: ${saved.data?.activities.find((a) => a.id === f.activity_id)?.due_at ?? "Unknown"}`
                      : ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
