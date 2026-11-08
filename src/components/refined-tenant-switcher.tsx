"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ShellIcon } from "./shell-icon";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import { sessionLockEvent } from "./session-signal";
import { shortTenantName } from "../shell/refined";
import { layerKeyboard } from "../shell/layer-keyboard";
import { useShell } from "./shell-provider";

export const tenantSwitcherEvent = "ppo-refined-tenant-switcher";
export function RefinedTenantSwitcher({
  busy,
  choose,
}: {
  busy: boolean;
  choose: (id: string | null) => void;
}) {
  const shell = useShell(),
    path = usePathname(),
    root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState<{
    path: string;
    scope: string | undefined;
  } | null>(null);
  const scope = shell.context?.preference_scope;
  const open = opened?.path === path && opened?.scope === scope;
  const companies = shell.context?.companies ?? [],
    selected = shell.context?.working_company_id ?? null;
  const name =
    companies.find((c) => c.id === selected)?.name ??
    (companies.length === 1 ? companies[0].name : "All companies");
  const close = () => {
    setOpened(null);
    trigger.current?.focus();
  };
  useEffect(() => {
    const show = () => {
      openShellPanel("tenant");
      setOpened({ path, scope });
    };
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== "tenant") setOpened(null);
    };
    const outside = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) setOpened(null);
    };
    const lock = () => setOpened(null);
    window.addEventListener(tenantSwitcherEvent, show);
    window.addEventListener(shellPanelEvent, other);
    window.addEventListener(sessionLockEvent, lock);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener(tenantSwitcherEvent, show);
      window.removeEventListener(shellPanelEvent, other);
      window.removeEventListener(sessionLockEvent, lock);
      document.removeEventListener("pointerdown", outside);
    };
  }, [path, scope]);
  useEffect(() => {
    if (open)
      panel.current
        ?.querySelector<HTMLElement>('[aria-checked="true"],button')
        ?.focus();
  }, [open]);
  if (!shell.refinedDesktop || !scope || !companies.length) return null;
  return (
    <div ref={root} className="ppo-refined-tenant">
      <button
        ref={trigger}
        id="refined-tenant-toggle"
        className="ppo-refined-tenant-chip"
        aria-label={`Switch tenant: ${name}`}
        aria-expanded={open}
        aria-controls="refined-tenant-menu"
        data-tooltip={name}
        onClick={() => {
          openShellPanel("tenant");
          setOpened(open ? null : { path, scope });
        }}
      >
        <span className="ppo-tenant-initials" aria-hidden="true">
          {selected ? name.split(" · ")[0].slice(-2) : "All"}
        </span>
        <span className="ppo-tenant-name">{shortTenantName(name)}</span>
        <ShellIcon name="down" />
      </button>
      <div
        ref={panel}
        id="refined-tenant-menu"
        className="ppo-refined-popover"
        role="dialog"
        aria-label="Switch tenant"
        hidden={!open}
        onKeyDown={(event) => layerKeyboard(event, close)}
      >
        <h2>Switch tenant</h2>
        <div role="menu" aria-label="Working company">
          {[
            ...(companies.length > 1
              ? [{ id: null, name: "All companies" }]
              : []),
            ...companies,
          ].map((company) => (
            <button
              key={company.id ?? "all"}
              role="menuitemradio"
              aria-checked={
                selected === company.id || (!selected && companies.length === 1)
              }
              disabled={busy}
              onClick={() => {
                if (company.id === selected) {
                  close();
                  return;
                }
                choose(company.id);
                setOpened(null);
                trigger.current?.focus();
              }}
            >
              <ShellIcon name="customers" />
              <span>
                {company.name}
                <small>Synthetic data only</small>
              </span>
              {(selected === company.id ||
                (!selected && companies.length === 1)) && (
                <ShellIcon name="check" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
