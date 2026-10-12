"use client";
import { Component, useEffect, useId, useRef, type ReactNode } from "react";
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
export function CpqHeader({
  title,
  context,
  status,
  children,
}: {
  title: string;
  context: ReactNode;
  status?: string;
  children?: ReactNode;
}) {
  const identity = useIdentity();
  return (
    <header className="cpq-header">
      <div>
        <h1>{title}</h1>
        <div className="cpq-context">
          {context}
          <span>·</span>
          <span className="cpq-avatar">
            {identity.display_name
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span>{identity.display_name}</span>
          {status && (
            <>
              <span>·</span>
              <span role="status">{status}</span>
            </>
          )}
        </div>
      </div>
      <div className="cpq-actions">{children}</div>
    </header>
  );
}
export function CpqTabs({
  tabs,
  current,
  onChange,
}: {
  tabs: string[];
  current: string;
  onChange: (tab: string) => void;
}) {
  return (
    <nav className="cpq-tabs" aria-label="Workspace views">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          aria-current={current === tab ? "page" : undefined}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
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
  return (
    <label className="cpq-field">
      <span>{label}</span>
      {children}
      {help && <small>{help}</small>}
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
