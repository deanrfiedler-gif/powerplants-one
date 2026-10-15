"use client";
import { Children, cloneElement, Component, isValidElement, useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useIdentity } from "./business-session";
import { useShell } from "./shell-provider";
import { useScopePreferences } from "./scope-preferences";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { ProductIcon, type ProductIconName } from "./product-icons";
import { Button } from "./ui/button";
import "./cpq.css";
export type Wire<T> = T extends Date
  ? string
  : T extends Array<infer E>
    ? Wire<E>[]
    : T extends object
      ? { [K in keyof T]: Wire<T[K]> }
      : T;
export const money = (v: string | null | undefined) =>
  v == null
    ? "Unknown"
    : Number(v).toLocaleString("en-AU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
export const quantity = (v: string | null | undefined) =>
  v == null
    ? "Unknown"
    : Number(v).toLocaleString("en-AU", { maximumFractionDigits: 3 });
export const stamp = (v: string | Date | null | undefined) =>
  v
    ? new Date(v).toLocaleString("en-AU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not saved";
// Working drafts deliberately retain incomplete JSON. A malformed imported
// draft must remain saved without taking down the structured editor.
export class CpqDraftBoundary extends Component<
  { children: ReactNode; href: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <CpqFrame
        menu={<CpqNav label="Back to saved record" href={this.props.href} />}
      >
        <div className="cpq-scroll">
          <CpqNotice tone="warning">
            <p>
              This working draft cannot be displayed in the form. Its saved
              content has been retained.
            </p>
            <Link href={this.props.href}>Open the saved source record</Link>
          </CpqNotice>
        </div>
      </CpqFrame>
    );
  }
}
export function useCpqCompany() {
  const context = useShell().context;
  const companies = context?.companies ?? [];
  return (
    context?.working_company_id ??
    (companies.length === 1 ? companies[0].id : null)
  );
}
export function CpqFrame({
  children,
  menu,
  name = "Configure & price",
  collapsed = false,
}: {
  children: ReactNode;
  menu: ReactNode;
  name?: string;
  collapsed?: boolean;
}) {
  const p = useIdentity(),
    prefs = useScopePreferences(`${p.workspace_id}:${p.actor_id}:cpq:${name}`);
  const state = useSecondaryMenu(
    prefs.value.menuSet ? prefs.value.menu : !collapsed,
    (open) => prefs.save({ ...prefs.value, menu: open }),
  );
  return (
    <SecondaryMenuFrame
      state={state}
      id="ppo-cpq"
      name={name}
      menuId="cpq-menu"
      contentId="cpq-content"
      message=""
      menu={
        <nav
          className="cpq-outline"
          aria-label={name}
          onClick={() => state.closeOverlay(false)}
        >
          {menu}
        </nav>
      }
    >
      {children}
    </SecondaryMenuFrame>
  );
}
export function CpqNav({
  label,
  meta,
  selected,
  onClick,
  href,
  icon = "list",
}: {
  label: string;
  meta?: string;
  selected?: boolean;
  onClick?: () => void;
  href?: string;
  icon?: ProductIconName;
}) {
  const content = (
    <>
      <ProductIcon name={icon} />
      <span>
        {label}
        {meta && <small>{meta}</small>}
      </span>
    </>
  );
  return href ? (
    <Link
      className="cpq-nav"
      href={href}
      aria-current={selected ? "page" : undefined}
    >
      {content}
    </Link>
  ) : (
    <button
      className="cpq-nav"
      type="button"
      aria-current={selected ? "page" : undefined}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
// `record` draws CPQ / Context header 475:120225 as the rule editor uses it (frames 486:641 and
// 488:1029): a 40 px title row with its "⋯" menu, then 14 px meta with the save state and its dot.
export function CpqHeader({
  title,
  context,
  status,
  children,
  record = false,
  dot,
}: {
  title: string;
  context: ReactNode;
  status?: string;
  children?: ReactNode;
  record?: boolean;
  dot?: CpqTone;
}) {
  const identity = useIdentity();
  return (
    <header className={`cpq-header${record ? " cpq-header-record" : ""}`}>
      <div>
        <h1>{title}</h1>
        <div className="cpq-context">
          {context}
          <span aria-hidden="true">·</span>
          <span className="cpq-avatar" aria-hidden="true">
            {identity.display_name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span>
            {identity.display_name}
            {record && " (you)"}
          </span>
          {status && (
            <>
              <span aria-hidden="true">·</span>
              <span className="cpq-context-status">
                {dot && <span className="cpq-dot" data-tone={dot} />}
                <span role="status">{status}</span>
              </span>
            </>
          )}
        </div>
      </div>
      <div className="cpq-actions">{children}</div>
    </header>
  );
}
export type CpqTab =
  | string
  | { key: string; label: string; count?: number; description?: string };
// Record / View tab 312:16: an optional neutral count beside the label. The count is drawn for
// sight only; its description ("4 saved scenarios") is what assistive technology reads.
export function CpqTabs({
  tabs,
  current,
  onChange,
  record = false,
}: {
  tabs: CpqTab[];
  current: string;
  onChange: (tab: string) => void;
  record?: boolean;
}) {
  const id = useId();
  return (
    <nav
      className={`cpq-tabs${record ? " cpq-tabs-record" : ""}`}
      aria-label="Workspace views"
    >
      {tabs.map((tab, i) => {
        const t = typeof tab === "string" ? { key: tab, label: tab } : tab;
        return (
          <button
            key={t.key}
            type="button"
            aria-current={current === t.key ? "page" : undefined}
            aria-describedby={t.description ? `${id}-${i}` : undefined}
            onClick={() => onChange(t.key)}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="cpq-tab-count" aria-hidden="true">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
      {/* Outside the buttons, so a description never joins a tab's name. */}
      {tabs.map((tab, i) =>
        typeof tab !== "string" && tab.description ? (
          <span key={i} id={`${id}-${i}`} className="sr-only">
            {tab.description}
          </span>
        ) : null,
      )}
    </nav>
  );
}
export type CpqTone = "neutral" | "good" | "warning" | "bad" | "link" | "muted";
// CPQ / State 466:56: status as an icon and text, never colour alone. Plain inline; Pill in
// panel heads. Each independent dimension (save, validation, tests, publication) has its own.
export function CpqState({
  icon,
  tone = "neutral",
  pill = false,
  children,
}: {
  icon: ProductIconName;
  tone?: CpqTone;
  pill?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`cpq-state${pill ? " cpq-state-pill" : ""}`} data-tone={tone}>
      <ProductIcon name={icon} />
      {children}
    </span>
  );
}
export function CpqPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warning" | "bad" | "info";
}) {
  return <span className={`cpq-pill cpq-pill-${tone}`}>{children}</span>;
}
export function CpqNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "good" | "warning" | "bad" | "info";
}) {
  return (
    <div className={`cpq-notice cpq-notice-${tone}`}>
      <ProductIcon
        name={tone === "good" ? "check" : tone === "info" ? "info" : "warning"}
      />
      <div>{children}</div>
    </div>
  );
}
export function CpqField({
  label,
  help,
  children,
}: {
  label: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  const id = useId(), labelId = `${id}-label`, helpId = `${id}-help`;
  return (
    <label className="cpq-field">
      <span id={labelId}>{label}</span>
      {Children.map(children, (child) =>
        isValidElement<{ "aria-labelledby"?: string; "aria-describedby"?: string }>(child) &&
        typeof child.type === "string" && ["input", "select", "textarea"].includes(child.type)
          ? cloneElement(child, {
              "aria-labelledby": child.props["aria-labelledby"] ?? labelId,
              "aria-describedby": [child.props["aria-describedby"], help ? helpId : null].filter(Boolean).join(" ") || undefined,
            })
          : child,
      )}
      {help && <small id={helpId}>{help}</small>}
    </label>
  );
}
export function CpqDialog({
  title,
  children,
  onClose,
  footer,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      className={`cpq-dialog ${drawer ? "cpq-drawer" : ""}`}
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <Button variant="quiet" aria-label={`Close ${title}`} onClick={onClose}>
          <ProductIcon name="close" />
        </Button>
      </header>
      <div className="cpq-dialog-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </dialog>
  );
}
export function CpqEmpty({ children }: { children: ReactNode }) {
  return <div className="cpq-empty">{children}</div>;
}
