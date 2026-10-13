"use client";
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { FontAwesomeGlyph } from "./font-awesome";
import { specialistFontAwesome } from "./font-awesome-icons";

// Small controls the ES-08 Screen Configurator Workbench views share. They are
// drawn to the design board (docs/decisions/es08-design-board.md): segmented
// buttons replace selects (departure D10), status is always stated in words
// with a tone only reinforcing it, and every target is at least 44 px high.

export type SpecialistIconName =
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "close"
  | "search"
  | "download"
  | "print"
  | "arrow-right"
  | "warning"
  | "info"
  | "check"
  | "drawing"
  | "spinner";
const paths: Record<SpecialistIconName, ReactNode> = {
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  print: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="1.5" />
      <path d="M6 14h12v7H6z" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </>
  ),
  check: <path d="m5 12 5 5 9-10" />,
  drawing: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 12h18" />
      <path d="M9 4v16" />
      <path d="M15 4v16" />
    </>
  ),
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
};
export function Icon({ name }: { name: SpecialistIconName }) {
  return (
    <FontAwesomeGlyph
      icon={specialistFontAwesome[name]}
      className="es08-icon"
      fallback={
        <svg className="es08-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {paths[name]}
        </svg>
      }
    />
  );
}

export type Tone = "ok" | "warn" | "neutral" | "info" | "danger" | "untested";
export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`es08-pill es08-pill--${tone} ${className}`}>{children}</span>;
}
export function Dot({ tone }: { tone: Tone }) {
  return <span className={`es08-dot es08-dot--${tone}`} aria-hidden="true" />;
}

export type SegmentOption = { value: string; label: ReactNode; disabled?: boolean; name?: string };
// One choice shown as a row of pressed buttons. The group carries the label so
// assistive technology reads the question, then each option's pressed state.
export function Segmented({
  options,
  value,
  onChange,
  disabled = false,
  label,
  labelledBy,
  size = "md",
  fill = false,
  className = "",
}: {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  labelledBy?: string;
  size?: "sm" | "md";
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={`es08-seg es08-seg--${size} ${fill ? "es08-seg--fill" : ""} ${className}`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          disabled={disabled || o.disabled}
          aria-label={o.name}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Notice({
  tone,
  title,
  children,
  action,
  role = "status",
  icon,
}: {
  tone: "warn" | "info" | "danger" | "ok" | "untested";
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert" | "none";
  icon?: SpecialistIconName;
}) {
  const glyph = icon ?? (tone === "danger" || tone === "warn" ? "warning" : tone === "ok" ? "check" : "info");
  return (
    <section className={`es08-notice es08-notice--${tone}`} role={role === "none" ? undefined : role}>
      <Icon name={glyph} />
      <div className="es08-notice-body">
        {title && <h3>{title}</h3>}
        {children && <div className="es08-notice-text">{children}</div>}
        {action && <div className="es08-notice-action">{action}</div>}
      </div>
    </section>
  );
}

export function Dialog({
  title,
  close,
  children,
  wide = false,
  className = "",
  id,
  description,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  wide?: boolean;
  className?: string;
  id?: string;
  description?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    heading = useId();
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null,
      d = ref.current!;
    d.showModal();
    return () => {
      d.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      id={id}
      ref={ref}
      className={`es08-dialog ${wide ? "es08-dialog--wide" : ""} ${className}`}
      aria-labelledby={heading}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <header className="es08-dialog-head">
        {description ? <div><h2 id={heading}>{title}</h2><div className="es08-dialog-description">{description}</div></div> : <h2 id={heading}>{title}</h2>}
        <button type="button" className="es08-icon-button" onClick={close} aria-label={`Close ${title}`}>
          <Icon name="close" />
        </button>
      </header>
      <div className="es08-dialog-body">{children}</div>
    </dialog>
  );
}

const subscribeTo = (query: string) => (changed: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
const phoneSubscribe = subscribeTo("(max-width: 780px)"),
  compactSubscribe = subscribeTo("(max-width: 1100px)");
export const usePhone = () =>
  useSyncExternalStore(phoneSubscribe, () => window.matchMedia("(max-width: 780px)").matches, () => false);
export const useCompact = () =>
  useSyncExternalStore(compactSubscribe, () => window.matchMedia("(max-width: 1100px)").matches, () => false);

export const fmt = (x: number | null | undefined, dp = 0) =>
  x === null || x === undefined || !Number.isFinite(x)
    ? "—"
    : x.toLocaleString("en-AU", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const money = (display: string | null | undefined, sign = false) => {
  if (display === null || display === undefined || display === "") return "Unavailable";
  const n = Number(display);
  if (!Number.isFinite(n)) return display;
  const s = `$${Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return n < 0 ? `−${s}` : sign && n > 0 ? `+${s}` : s;
};
export const readable = (value: string | Date | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-AU", {
        timeZone: "Australia/Brisbane",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";
export const runLabel = (sequence: number | null | undefined) =>
  sequence ? `R${String(sequence).padStart(2, "0")}` : "—";
