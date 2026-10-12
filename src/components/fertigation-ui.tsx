"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import type {
  Phase,
  Result,
  ResultState,
} from "../estimating/fertigation/types";
import type { EvidenceStrength } from "../estimating/fertigation/guidance";
import { formatTimestamp } from "../shell/date-format";
import { FertigationIcon, type FertigationIconName } from "./fertigation-icons";

/*
 * The fertigation workbench's presentation kit, built to the design board's
 * design language (board I): page heads, panels, metric tiles, chips, value
 * tokens, notices and controls. Nothing here calculates a value; every number
 * comes from the scope or the engine and is only formatted.
 */

/* ---------- numbers and results ---------- */

export const known = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** Whole numbers print whole; others to `digits` decimals (default one). */
export const fmt = (v: number, digits = 1) =>
  v.toLocaleString("en-AU", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : digits,
    maximumFractionDigits: digits,
  });

export const fmtInt = (v: number) =>
  Math.round(v).toLocaleString("en-AU", { maximumFractionDigits: 0 });

export const quantity = (
  v: number | null | undefined,
  unit: string,
  digits = 1,
) => (known(v) ? `${fmt(v, digits)}${unit ? ` ${unit}` : ""}` : null);

/** The engine's own words for a result that is not a number. */
export const stateLabel = (state: ResultState) =>
  state === "known"
    ? "Known"
    : state === "unknown"
      ? "Unknown"
      : state === "not_applicable"
        ? "Not applicable"
        : "Outside the supported model";

export const resultText = (r: Result | undefined, digits = 1) =>
  !r
    ? "Not assessed"
    : r.state === "known" && known(r.value)
      ? `${fmt(r.value, digits)} ${r.unit}`.trim()
      : stateLabel(r.state);

/** Minutes of the day as a clock: 360 → 06:00. */
export const clock = (minutes: number) => {
  const m = Math.round(minutes);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export const when = (date: string | Date) =>
  formatTimestamp(typeof date === "string" ? date : date.toISOString());

/* ---------- icons and controls ---------- */

export function Icon({
  name,
  className = "fn-icon",
}: {
  name: FertigationIconName;
  className?: string;
}) {
  return <FertigationIcon name={name} className={className} />;
}

type ButtonVariant = "primary" | "secondary" | "quiet" | "link" | "danger";
type ButtonSize = "md" | "sm";
const buttonClass = (
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) =>
  [
    "fn-button",
    variant === "primary" ? "fn-primary" : `fn-button-${variant}`,
    size === "sm" ? "fn-button-sm" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: FertigationIconName;
}) {
  return (
    <button {...props} type={type} className={buttonClass(variant, size, className)}>
      {icon && <Icon name={icon} className="fn-button-icon" />}
      <span>{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: FertigationIconName;
}) {
  return (
    <a {...props} className={buttonClass(variant, size, className)}>
      {icon && <Icon name={icon} className="fn-button-icon" />}
      <span>{children}</span>
    </a>
  );
}

/** A search field for a register: the label is visible to assistive technology. */
export function Find({
  value,
  onChange,
  label,
  placeholder = "Find in register",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label className="fn-find" htmlFor={id}>
      <span className="fn-sr">{label}</span>
      <Icon name="search" className="fn-find-icon" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/* ---------- chips and tokens ---------- */

export type ChipTone =
  | "conflict"
  | "incomplete"
  | "review"
  | "success"
  | "neutral"
  | "info"
  | "assumed"
  | "documented"
  | "observed"
  | "unknown"
  | "existing"
  | "proposed"
  | "future"
  | "excluded"
  | "calculated"
  | "entered"
  | "declared"
  | "outline";

export function Chip({
  tone = "neutral",
  icon,
  children,
  title,
  className,
}: {
  tone?: ChipTone;
  icon?: FertigationIconName;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      className={`fn-chip fn-chip-${tone}${className ? ` ${className}` : ""}`}
      title={title}
    >
      {icon && <Icon name={icon} className="fn-chip-icon" />}
      {children}
    </span>
  );
}

const phaseWords: Record<Phase, [string, ChipTone]> = {
  existing: ["Existing", "existing"],
  proposed: ["Proposed", "proposed"],
  future: ["Future", "future"],
  excluded: ["Excluded", "excluded"],
  unknown: ["Phase not recorded", "unknown"],
};
export function PhaseChip({ phase }: { phase: Phase }) {
  const [label, tone] = phaseWords[phase] ?? phaseWords.unknown;
  return <Chip tone={tone}>{label}</Chip>;
}

const evidenceWords: Record<EvidenceStrength, [string, ChipTone]> = {
  document_reference: ["Documented", "documented"],
  observation: ["Observed", "observed"],
  assumption: ["Assumed", "assumed"],
  none: ["No evidence", "unknown"],
};
export function EvidenceChip({ strength }: { strength: EvidenceStrength }) {
  const [label, tone] = evidenceWords[strength];
  return <Chip tone={tone}>{label}</Chip>;
}

export type Basis = "assumed" | "calculated" | "entered" | "declared";
const basisWords: Record<Basis, [string, ChipTone]> = {
  assumed: ["Assumed", "assumed"],
  calculated: ["Calculated", "calculated"],
  entered: ["Entered", "entered"],
  declared: ["Declared", "declared"],
};
/** Says whether a figure is assumed, entered, declared or calculated by the engine. */
export function BasisTag({ basis }: { basis: Basis }) {
  const [label, tone] = basisWords[basis];
  return <Chip tone={tone}>{label}</Chip>;
}

/** A value the scope does not establish: dashed, never a zero or a blank. */
export function Token({
  children,
  title,
  tone = "dashed",
}: {
  children: ReactNode;
  title?: string;
  tone?: "dashed" | "plain";
}) {
  return (
    <span className={`fn-token fn-token-${tone}`} title={title}>
      {children}
    </span>
  );
}

/** An entered quantity, or the "Not recorded" token in its place. */
export function Entered({
  value,
  unit,
  digits = 1,
  missing = "Not recorded",
}: {
  value: number | null | undefined;
  unit: string;
  digits?: number;
  missing?: string;
}) {
  return known(value) ? (
    <span className="fn-num">
      {fmt(value, digits)}
      {unit && <small> {unit}</small>}
    </span>
  ) : (
    <Token>{missing}</Token>
  );
}

/** An engine result, or its state and reason in the engine's own words. */
export function ResultValue({
  result,
  digits = 1,
  excludedLabel = "Excluded in scenario",
}: {
  result: Result | undefined;
  digits?: number;
  excludedLabel?: string;
}) {
  if (!result) return <Token>Not assessed</Token>;
  if (result.state === "known" && known(result.value))
    return (
      <span className="fn-num" title={result.reason || undefined}>
        {fmt(result.value, digits)}
        {result.unit && <small> {result.unit}</small>}
      </span>
    );
  return (
    <Token title={result.reason || undefined}>
      {result.state === "not_applicable" ? excludedLabel : stateLabel(result.state)}
    </Token>
  );
}

/* ---------- layout ---------- */

export function PageHead({
  eyebrow,
  title,
  lede,
  actions,
  id,
}: {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  actions?: ReactNode;
  id?: string;
}) {
  return (
    <header className="fn-page-head">
      <div className="fn-page-title">
        <p className="fn-eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        {lede && <p className="fn-lede">{lede}</p>}
      </div>
      {actions && <div className="fn-page-actions">{actions}</div>}
    </header>
  );
}

export function PageFoot({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <footer className="fn-page-foot">
      <span>{left}</span>
      <span>{right}</span>
    </footer>
  );
}

export function Panel({
  title,
  count,
  subtitle,
  actions,
  children,
  foot,
  tone,
  className,
  flush = false,
  id,
  as = "section",
}: {
  title: ReactNode;
  count?: number;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  foot?: ReactNode;
  tone?: "conflict" | "warning" | "proposed";
  className?: string;
  /** The body meets the panel's edges: for tables and charts. */
  flush?: boolean;
  id?: string;
  as?: "section" | "article" | "aside";
}) {
  const generated = useId();
  const titleId = id ?? generated;
  const Tag = as;
  return (
    <Tag
      className={[
        "fn-panel",
        tone ? `fn-panel-${tone}` : "",
        flush ? "fn-panel-flush" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={titleId}
    >
      <header className="fn-panel-head">
        <div className="fn-panel-title">
          <h3 id={titleId}>
            {title}
            {count !== undefined && (
              <span className="fn-count" aria-label={`${count} records`}>
                {count}
              </span>
            )}
          </h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="fn-panel-actions">{actions}</div>}
      </header>
      {children !== undefined && (
        <div className="fn-panel-body">{children}</div>
      )}
      {foot && <footer className="fn-panel-foot">{foot}</footer>}
    </Tag>
  );
}

export function Columns({
  children,
  template = "1fr 1fr",
  className,
}: {
  children: ReactNode;
  template?: string;
  className?: string;
}) {
  return (
    <div
      className={`fn-columns${className ? ` ${className}` : ""}`}
      style={{ gridTemplateColumns: template }}
    >
      {children}
    </div>
  );
}

export function Tiles({ children }: { children: ReactNode }) {
  return <div className="fn-tiles">{children}</div>;
}

export function Tile({
  label,
  value,
  unit,
  tag,
  foot,
  tone,
  action,
  size = "md",
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  tag?: ReactNode;
  foot?: ReactNode;
  tone?: "conflict" | "warning";
  action?: ReactNode;
  /** "sm" for a textual value such as an edition or a name. */
  size?: "md" | "sm";
}) {
  return (
    <div className={`fn-tile${tone ? ` fn-tile-${tone}` : ""}${size === "sm" ? " fn-tile-sm" : ""}`}>
      <div className="fn-tile-head">
        <span className="fn-tile-label">{label}</span>
        {tag}
      </div>
      <div className="fn-tile-value">
        <strong>{value}</strong>
        {unit && <small>{unit}</small>}
      </div>
      {foot && <div className="fn-tile-foot">{foot}</div>}
      {action && <div className="fn-tile-action">{action}</div>}
    </div>
  );
}

/** Label and value rows: shed services, a strategy's fields, a project brief. */
export function Facts({
  rows,
  className,
}: {
  rows: [ReactNode, ReactNode][];
  className?: string;
}) {
  return (
    <dl className={`fn-facts${className ? ` ${className}` : ""}`}>
      {rows.map(([label, value], i) => (
        <div key={i}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** An even-bordered message: no coloured left rule (notice accent rule, option B). */
export function Notice({
  tone = "info",
  children,
  role,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success" | "neutral";
  children: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  const icon: FertigationIconName =
    tone === "danger" || tone === "warning"
      ? "conflict"
      : tone === "success"
        ? "check"
        : "info";
  return (
    <p className={`fn-notice fn-notice-${tone}${className ? ` ${className}` : ""}`} role={role}>
      <Icon name={icon} className="fn-notice-icon" />
      <span>{children}</span>
    </p>
  );
}

export function Steps({
  items,
}: {
  items: { title: ReactNode; detail?: ReactNode; done?: boolean }[];
}) {
  return (
    <ol className="fn-steps">
      {items.map((s, i) => (
        <li key={i} className={s.done ? "fn-step-done" : undefined}>
          <span className="fn-step-number" aria-hidden="true">
            {s.done ? <Icon name="check" className="fn-step-icon" /> : i + 1}
          </span>
          <span className="fn-step-body">
            <strong>{s.title}</strong>
            {s.detail && <small>{s.detail}</small>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Empty({
  icon = "info",
  title,
  children,
  action,
}: {
  icon?: FertigationIconName;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="fn-empty">
      <Icon name={icon} className="fn-empty-icon" />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action && <div className="fn-empty-action">{action}</div>}
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { swatch: string; label: ReactNode }[];
}) {
  return (
    <ul className="fn-legend">
      {items.map((it, i) => (
        <li key={i}>
          <span className={`fn-swatch ${it.swatch}`} aria-hidden="true" />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/** A quiet explanatory line under a chart or table. */
export function Hint({ children }: { children: ReactNode }) {
  return <p className="fn-hint">{children}</p>;
}

/* ---------- measurement ---------- */

/** The element's rendered width, so charts draw at real pixels and their text never scales. */
export function useContainerWidth<T extends HTMLElement>(initial = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Round axis steps: 1, 2, 2.5, 5 or 10 × a power of ten. */
export function niceStep(max: number, target = 5) {
  if (!(max > 0)) return 1;
  const raw = max / target,
    power = 10 ** Math.floor(Math.log10(raw)),
    unit = raw / power;
  return (
    (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) *
    power
  );
}
