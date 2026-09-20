"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ShellIcon as ProductIcon } from "./shell-icon";
import { ShellControls } from "./shell-controls";
import { useShell } from "./shell-provider";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import { moduleWorkspaceForPath } from "../shell/module-workspaces";
import {
  canOpen,
  destination,
  menuGroups,
  pageForPath,
  salesPhoneBar,
  workViewForPath,
  materialsPath,
  materialsModuleLabel,
  workspaces,
  type ShellDestination,
} from "../shell/navigation";
import { localDay } from "../activities/work-view";

const subscribe = (changed: () => void) => {
  const media = window.matchMedia("(min-width: 781px)");
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
export function ProductNavigation() {
  const path = usePathname();
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 781px)").matches,
    () => true,
  );
  return (
    <ProductNavigationView key={`${path}:${wide}`} path={path} wide={wide} />
  );
}
function ProductNavigationView({
  path,
  wide,
}: {
  path: string;
  wide: boolean;
}) {
  const shell = useShell(),
    current = pageForPath(path);
  const workspace = workspaces.find(
    (w) => w.id === (current?.workspace ?? shell.preview),
  )!;
  const [more, setMore] = useState(false),
    [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null),
    toggle = useRef<HTMLButtonElement>(null);
  const permitted = shell.context?.navigation ?? [];
  const allowed = (item: ShellDestination) =>
    canOpen(item, permitted, shell.hosted);
  const close = () => {
    setMore(false);
    toggle.current?.focus();
  };
  useEffect(() => {
    if (!wide && more) dialog.current?.showModal();
    else dialog.current?.close();
    if (more) search.current?.focus();
  }, [more, wide]);
  useEffect(() => {
    const outside = (event: Event) => {
      if (
        wide &&
        !(event.target as Element | null)?.closest("[data-shell-navigation]")
      )
        setMore(false);
    };
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== "navigation") setMore(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && more) {
        setMore(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    window.addEventListener(shellPanelEvent, other);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      window.removeEventListener(shellPanelEvent, other);
      document.removeEventListener("keydown", key);
    };
  }, [more, wide]);
  const groups = menuGroups(query)
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !item.localOnly || !shell.hosted),
    }))
    .filter((g) => g.items.length);
  const showHelp = !query.trim() || "help quick help administration support".includes(query.trim().toLowerCase());
  const count = groups.reduce((sum, group) => sum + group.items.length, 0) + Number(showHelp);
  const link = (item: ShellDestination, mobile = false) => {
    const root = workspaces.find((w) => w.primary === item.id);
    const label = mobile
      ? item.id === "tickets"
        ? "Service"
        : item.label
      : (root?.label ?? item.menuLabel ?? item.label);
    const contents = (
      <>
        <ProductIcon name={root ? (root.id === "estimate" ? "estimate" : root.id) : item.id === "equipment" ? "equipment" : item.id === "reports" ? "reports" : item.icon} />
        <span>{label}</span>
      </>
    );
    return allowed(item) ? (
      <Link
        key={item.id}
        className={mobile ? undefined : "ppo-more-link"}
        href={item.href!}
        aria-label={label}
        aria-current={current?.id === item.id || (!mobile && !!root && current?.workspace === root.id) ? "page" : undefined}
        onClick={() => setMore(false)}
      >
        {contents}
      </Link>
    ) : (
      <span
        key={item.id}
        className={mobile ? "ppo-planned-tab" : "ppo-more-link"}
        aria-disabled="true"
        title={`${label} — ${item.href ? "Unavailable for this identity" : "Planned"}`}
      >
        {contents}
        {!mobile && (
          <small>
            {item.href ? (shell.context ? "No access" : "Sign in") : "Planned"}
          </small>
        )}
      </span>
    );
  };
  // Mobile r07, Sales: icon-only cells. The name stays in the link for assistive technology and
  // as a tooltip; the calendar opens on the reader's current local day, as My Work links to it.
  const phoneCell = (entry: (typeof salesPhoneBar)[number]) => {
    const item = destination(entry.id);
    const contents = (
      <>
        <ProductIcon name={entry.icon} />
        <span>{entry.label}</span>
      </>
    );
    return allowed(item) ? (
      <Link
        key={entry.id}
        href={entry.id === "calendar" ? `${item.href}?day=${localDay(new Date().toISOString())}` : item.href!}
        aria-label={entry.label}
        title={entry.label}
        aria-current={current?.id === item.id ? "page" : undefined}
        onClick={() => setMore(false)}
        suppressHydrationWarning
      >
        {contents}
      </Link>
    ) : (
      <span key={entry.id} className="ppo-planned-tab" aria-disabled="true" title={`${entry.label} — Unavailable for this identity`}>
        {contents}
      </span>
    );
  };
  const menu = (
    <>
      <header>
        <h2 id="desktop-more-title">More</h2>
        <button
          className="ppo-top-action"
          aria-label={wide ? "Close More menu" : "Close menu"}
          onClick={close}
        >
          <ProductIcon name="close" />
        </button>
      </header>
      <div className="ppo-more-body">
        <label className="ppo-menu-search">
          <ProductIcon name="search" />
          <input
            ref={search}
            type="search"
            aria-label="Find a menu item"
            placeholder="Find a menu item"
            maxLength={100}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {shell.error && (
          <p className="ppo-menu-notice" role="status">
            {shell.error} <button onClick={shell.reload}>Try again</button>
          </p>
        )}
        <nav aria-label={wide ? "More navigation" : "All modules"}>
          {groups.length ? (
            groups.map((group) => (
              <section className="ppo-menu-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.items.map((item) => link(item))}
              </section>
            ))
          ) : showHelp ? null : (
            <p className="ppo-panel-status">
              No matching pages.{" "}
              <button
                onClick={() => {
                  setQuery("");
                  search.current?.focus();
                }}
              >
                Clear search
              </button>
            </p>
          )}
        </nav>
        {showHelp && <button
          className="ppo-more-link ppo-help-link"
          onClick={() => {
            dialog.current?.close();
            setMore(false);
            window.dispatchEvent(
              new CustomEvent("ppo-shell-utility", { detail: "help" }),
            );
          }}
        >
          <ProductIcon name="help" />
          <span>Help</span>
        </button>}
        {!wide && (
          <div className="ppo-mobile-tools">
            {(["quick", "notifications"] as const).map((kind) => (
              <button
                key={kind}
                onClick={() => {
                  dialog.current?.close();
                  setMore(false);
                  window.dispatchEvent(
                    new CustomEvent("ppo-shell-utility", { detail: kind }),
                  );
                }}
              >
                <ProductIcon name={kind === "quick" ? "plus" : "bell"} />
                {kind === "quick" ? "Quick add" : "Notifications"}
              </button>
            ))}
          </div>
        )}
      </div>
      <footer>
        <span>
          Powerplants One · r17
        </span>
        <span>{count} destinations</span>
      </footer>
    </>
  );
  return (
    <>
      <aside
        className="sidebar ppo-rail"
        aria-label="Application navigation"
        data-shell-navigation
      >
        <Link
          href="/"
          className="brand"
          aria-label="Powerplants One home"
          title="Home"
        >
          <Image
            src="/brand/powerplants-logo-green-white.png"
            alt="Powerplants Australia"
            width={54}
            height={54}
            unoptimized
            loading="eager"
            className="brand-logo"
          />
        </Link>
        <div className="ppo-rail-bottom">
          {wide && (
            <button
              ref={toggle}
              id="desktop-more-toggle"
              className="ppo-rail-item"
              aria-label="More"
              title="More"
              aria-expanded={more}
              aria-controls="desktop-more-panel"
              onClick={() => {
                openShellPanel("navigation");
                setMore(!more);
              }}
            >
              <ProductIcon name="more" />
            </button>
          )}
        </div>
      </aside>
      {wide ? (
        <section
          id="desktop-more-panel"
          className="ppo-more-panel"
          aria-labelledby="desktop-more-title"
          hidden={!more}
          data-shell-navigation
        >
          {menu}
        </section>
      ) : (
        <dialog
          ref={dialog}
          className="ppo-more-panel ppo-mobile-menu"
          aria-labelledby="desktop-more-title"
          data-shell-navigation
          onCancel={() => setMore(false)}
          onClose={() => setMore(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          {menu}
        </dialog>
      )}
      <nav
        className={`mobile-navigation${workspace.id === "sales" ? " ppo-phone-bar-r07" : ""}`}
        aria-label="Mobile navigation"
      >
        {workspace.id === "sales"
          ? salesPhoneBar.map(phoneCell)
          : [
              destination("work"),
              destination(workspace.primary),
              destination(workspace.secondary),
            ].map((item) => link(item, true))}
        {!wide && (
          <button
            ref={toggle}
            id="navigation-toggle"
            aria-label="More"
            title="More"
            aria-haspopup="dialog"
            aria-expanded={more}
            onClick={() => {
              openShellPanel("navigation");
              setMore(true);
            }}
          >
            <ProductIcon name={workspace.id === "sales" ? "bar-more" : "more"} />
            <span>More</span>
          </button>
        )}
      </nav>
    </>
  );
}
export function ProductHeader() {
  const path = usePathname(),
    page = pageForPath(path),
    shell = useShell();
  const label = path === "/" ? "" : (page?.label ?? "Page unavailable");
  // My Work names its current view beside the module, as its secondary menu does. EN-06 names its module
  // there, and its destination after it for as long as its own menu is hidden (engineering-materials.css).
  const materials = page?.id === "engineering" ? materialsPath(path) : undefined;
  const view = page?.id === "work" ? workViewForPath(path)?.label : materials ? materialsModuleLabel : undefined;
  const subview = materials?.view?.label;
  const currentModule =
    page?.workspace === "estimate"
      ? "Estimating"
      : page?.workspace === "service"
        ? "Service"
        : (page?.label ?? "Home");
  const tabIds =
    page?.workspace === "service"
      ? [
          "planner",
          "technicians",
          "tickets",
          "orders",
          "packs",
          "reports",
          "jobs",
        ]
      : page?.workspace === "sales"
        ? ["deals", "leads"]
        : page?.workspace === "estimate"
          ? ["estimates", "intake"]
          : page?.id === "mail" || page?.id === "calendar"
            ? ["mail", "calendar"]
      : ["customers", "sites", "equipment"].includes(page?.id ?? "")
        ? ["customers", "sites", "equipment"]
        : [];
  const tabs = tabIds
    .map(destination)
    .filter((item) =>
      canOpen(item, shell.context?.navigation ?? [], shell.hosted),
    );
  return (
    <>
      <header className="topbar ppo-shell-header">
        <Link
          className="mobile-brand"
          href="/"
          aria-label="Powerplants One home"
        >
          <Image
            src="/brand/powerplants-logo-green-white.png"
            alt="Powerplants Australia"
            width={34}
            height={34}
            unoptimized
            className="brand-logo"
          />
        </Link>
        {/* A workspace with a secondary menu mounts its Show/Hide trigger here. Empty otherwise. */}
        <div id="header-menu" className="ppo-header-menu-slot" />
        <div className="product-heading" data-module-crumb={materials ? "" : undefined}>
          <span className="ppo-product-name">Powerplants One</span>
          {label && (
            <>
              <span className="ppo-heading-divider" aria-hidden="true" />
              <strong title={[label, view, subview].filter(Boolean).join(" / ")}>
                {label}
                {view && <span className="ppo-heading-view"> / {view}</span>}
                {subview && <span className="ppo-heading-subview"> / {subview}</span>}
              </strong>
            </>
          )}
        </div>
        <ShellControls
          key={path}
          module={currentModule}
          page={label || "Application shell"}
        />
        <div className="header-tools">
          <div id="header-search" />
          <div id="header-account" className="header-account" />
        </div>
      </header>
      {!!tabs.length && moduleWorkspaceForPath(path)?.navigation !== "workspace" && (
        <nav
          className={`module-navigation${page?.workspace === "sales" ? " ppo-sales-navigation" : ""}`}
          aria-label={`${currentModule} navigation`}
        >
          {tabs.map((item) => (
            <Link
              key={item.id}
              href={item.href!}
              aria-current={page?.id === item.id ? "page" : undefined}
            >
              {item.tabLabel ?? item.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
