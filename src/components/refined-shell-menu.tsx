"use client";
import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useShell } from "./shell-provider";
import { ShellIcon } from "./shell-icon";
import { destination, canOpen } from "../shell/navigation";
import { personColour } from "../shell/refined";
import { accountInitials } from "./shell-account-profile";
import { RefinedPreference } from "./refined-preference";
import { layerControls } from "../shell/layer-keyboard";

export function RefinedAccountMenu({
  name,
  company,
  hosted,
  details,
  openDetails,
  switchTenant,
  close,
  signOut,
}: {
  name?: string;
  company?: string;
  hosted: boolean;
  details: boolean;
  openDetails: () => void;
  switchTenant: () => void;
  close: () => void;
  signOut: () => void;
}) {
  const shell = useShell();
  const updates = destination("work");
  return (
    <div className="ppo-refined-account-menu">
      <div className="ppo-refined-account-profile">
        <span
          className="account-avatar"
          data-person-colour={personColour(
            shell.context?.preference_scope ?? name ?? "",
          )}
        >
          {accountInitials(name)}
        </span>
        <div>
          <strong>{name ?? "Choose an identity"}</strong>
          <small>
            {hosted ? "Demo identity" : "Local synthetic identity"}
            {company ? ` · ${company}` : ""}
          </small>
        </div>
      </div>
      <nav aria-label="Account actions">
        <button onClick={openDetails} aria-expanded={details}>
          <ShellIcon name="person" />
          My account
        </button>
        <details className="ppo-refined-preferences">
          <summary>Preferences</summary>
          <RefinedPreference />
        </details>
        {canOpen(updates, shell.context?.navigation ?? [], shell.hosted) && (
          <Link href="/work/updates" onClick={close}>
            <ShellIcon name="bell" />
            Notification settings
          </Link>
        )}
        <button
          onClick={() => {
            close();
            window.dispatchEvent(
              new CustomEvent("ppo-shell-utility", { detail: "help" }),
            );
          }}
        >
          <ShellIcon name="help" />
          Keyboard shortcuts<kbd>?</kbd>
        </button>
        <button
          onClick={() => {
            close();
            window.dispatchEvent(
              new CustomEvent("ppo-shell-utility", { detail: "guide" }),
            );
          }}
        >
          <ShellIcon name="info" />
          Help and page guide
        </button>
        <hr />
        <button onClick={switchTenant}>
          <ShellIcon name="customers" />
          Switch tenant
        </button>
        <button onClick={signOut}>
          <ShellIcon name="chevron-right" />
          Sign out
        </button>
      </nav>
      <footer>
        <span>Last sign-in details unavailable</span>
        <span>Powerplants One · {shell.buildLabel}</span>
      </footer>
    </div>
  );
}

export function RefinedUtilityGroup({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node || !enabled) return;
    const original = new Map<HTMLElement, string | null>();
    const update = () => {
      const controls = layerControls(node);
      const selected =
        controls.find((n) => n === document.activeElement) ??
        controls.find((n) => n.tabIndex === 0) ??
        controls[0];
      controls.forEach((n) => {
        if (!original.has(n)) original.set(n, n.getAttribute("tabindex"));
        n.tabIndex = n === selected ? 0 : -1;
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
      original.forEach((value, n) => {
        if (value === null) n.removeAttribute("tabindex");
        else n.setAttribute("tabindex", value);
      });
    };
  }, [enabled]);
  return (
    <div
      ref={root}
      className="ppo-header-utilities"
      role={enabled ? "toolbar" : undefined}
      aria-label={enabled ? "Shell utilities" : undefined}
      data-shell-header-control
      onKeyDown={(event) => {
        if (!enabled) return;
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
          return;
        const controls = layerControls(event.currentTarget),
          index = controls.indexOf(document.activeElement as HTMLElement);
        if (!controls.length) return;
        event.preventDefault();
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? controls.length - 1
              : (index +
                  (event.key === "ArrowRight" ? 1 : -1) +
                  controls.length) %
                controls.length;
        controls.forEach((node, i) => {
          node.tabIndex = i === next ? 0 : -1;
        });
        controls[next].focus();
      }}
    >
      {children}
    </div>
  );
}
