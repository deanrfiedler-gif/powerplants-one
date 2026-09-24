"use client";
import { controlModules, controlPath } from "../engineering/control/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ShellIcon as ProductIcon } from "./shell-icon";
import { ShellControls } from "./shell-controls";
import { useShell } from "./shell-provider";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import { InstallationActions, InstallationHelp } from "./app-installation";
import { moduleWorkspaceForPath } from "../shell/module-workspaces";
import {
  canOpen,
  departmentHref,
  railDestinations,
  railDestinationForLocation,
  workspaceForLocation,
  workspaceIcons,
  destination,
  menuGroups,
  pageForPath,
  salesPhoneBar,
  workViewForPath,
  materialsPath,
  materialsModuleLabel,
  changesPath,
  changesModuleLabel,
  commissioningPath,
  commissioningModuleLabel,
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
  return <Suspense><NavigationWithLocation /></Suspense>;
}
function NavigationWithLocation() {
  const path = usePathname(), query = useSearchParams().toString();
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 781px)").matches,
    () => true,
  );
  return (
    <>
      <ProductNavigationView key={`${path}:${wide}`} path={path} wide={wide} locationQuery={query} />
      {/* Outside the keyed view so the panel survives route changes. */}
      <InstallationHelp />
    </>
  );
}
function ProductNavigationView({
  path,
  wide,
  locationQuery,
}: {
  path: string;
  wide: boolean;
  locationQuery: string;
}) {
  const shell = useShell(),
    current = pageForPath(path);
  const permitted = shell.context?.navigation ?? [];
  const workspaceId = workspaceForLocation(path, new URLSearchParams(locationQuery), shell.preview, permitted);
  const workspace = workspaces.find(w => w.id === workspaceId)!;
  const rail = railDestinations(workspaceId, permitted, shell.hosted);
  const activeId = railDestinationForLocation(path, new URLSearchParams(locationQuery), workspaceId);
  const scroller = useRef<HTMLElement>(null);
  const [tooltip, setTooltip] = useState<{label: string; top: number} | null>(null);
  function reveal(element: HTMLElement) {
    const parent = scroller.current;
    if (!parent) return;
    const item = element.getBoundingClientRect(), bounds = parent.getBoundingClientRect();
    if (item.top < bounds.top + 6) parent.scrollTop -= bounds.top + 6 - item.top;
    else if (item.bottom > bounds.bottom - 6) parent.scrollTop += item.bottom - bounds.bottom + 6;
  }
  function tip(element: HTMLElement, label: string) {
    setTooltip({ label, top: Math.max(8, Math.min(innerHeight - 40, element.getBoundingClientRect().top + 8)) });
  }
  const permittedKey = permitted.join(",");
  useEffect(() => {
    const active = scroller.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) reveal(active);
  }, [activeId, workspaceId, permittedKey]);
  useEffect(() => {
    if (shell.context && workspaceId !== shell.preview) shell.selectPreview(workspaceId);
  }, [workspaceId, shell]);
  const [more, setMore] = useState(false),
    [query, setQuery] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    search = useRef<HTMLInputElement>(null),
    toggle = useRef<HTMLButtonElement>(null);
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
  const groups = menuGroups(query, workspaceId)
    .map((g) => ({
      ...g,
      items: g.items.filter(allowed),
    }))
    .filter((g) => g.items.length);
  const showHelp = !query.trim() || "help quick help administration support".includes(query.trim().toLowerCase());
  const count = groups.reduce((sum, group) => sum + group.items.length, 0) + Number(showHelp);
  const link = (item: ShellDestination, mobile = false, workspaceEntry = false) => {
    const root = workspaceEntry ? workspaces.find((w) => w.primary === item.id) : undefined;
    const label = mobile
      ? item.id === "tickets"
        ? "Service"
        : item.id === "engineering" ? "Engineering"
        : item.label
      : (root?.label ?? item.menuLabel ?? item.label);
    const contents = (
      <>
        <ProductIcon name={root ? workspaceIcons[root.id] : item.icon} />
        <span>{label}</span>
      </>
    );
    return allowed(item) ? (
      <Link
        key={item.id}
        className={mobile ? undefined : "ppo-more-link"}
        href={departmentHref(item.href!, root?.id ?? workspaceId)}
        aria-label={label}
        aria-current={current?.id === item.id || (!mobile && !!root && current?.workspace === root.id) ? "page" : undefined}
        onClick={() => { if (root) shell.selectPreview(root.id); setMore(false); }}
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
                {group.items.map((item) => link(item, false, group.title === "Workspaces"))}
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
        {!query.trim() && (
          <InstallationActions
            onNavigate={() => {
              dialog.current?.close();
              close();
            }}
          />
        )}
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
        {wide && <nav className="ppo-primary-nav" aria-label={`${workspace.label} shortcuts`} ref={scroller} onScroll={() => {
          const focused = document.activeElement;
          if (focused instanceof HTMLElement && scroller.current?.contains(focused)) tip(focused, focused.getAttribute("aria-label") ?? "");
          else setTooltip(null);
        }}>
          {rail.map(item => <Link key={item.id} href={departmentHref(item.href!, workspaceId)}
            className="ppo-rail-item" aria-label={item.label} aria-current={activeId === item.id ? "page" : undefined}
            onMouseEnter={e => tip(e.currentTarget, item.label)} onMouseLeave={() => setTooltip(null)}
            onFocus={e => { reveal(e.currentTarget); tip(e.currentTarget, item.label); }} onBlur={() => setTooltip(null)}>
            <ProductIcon name={item.icon} active={activeId === item.id} />
          </Link>)}
        </nav>}
        {wide && tooltip && <span className="ppo-rail-tooltip" role="tooltip" style={{top: tooltip.top}}>{tooltip.label}</span>}
        <div className="ppo-rail-bottom">
          {wide && (
            <button
              ref={toggle}
              id="desktop-more-toggle"
              className="ppo-rail-item"
              aria-label="More"
              onMouseEnter={e => tip(e.currentTarget, "More")}
              onMouseLeave={() => setTooltip(null)}
              onFocus={e => tip(e.currentTarget, "More")}
              onBlur={() => setTooltip(null)}
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
  const label = path === "/" ? "" : path === "/development/page-register" ? "Design & build" : path === "/development/design-system" ? "Component catalogue" : path.startsWith("/estimating/configurations") ? "Specialist configurations" : /^\/estimating\/discovery\/[^/]+$/.test(path) && !path.endsWith("/new") ? "Estimation Wizard" : (page?.id === "engineering" ? "Engineering" : page?.label ?? "Page unavailable");
  // My Work names its current view beside the module, as its secondary menu does. EN-06 names its module
  // there, and its destination after it for as long as its own menu is hidden (desktop-shell.css).
  const materials = page?.workspace === "engineering" ? materialsPath(path) : undefined;
  // EN-07 does the same: "Engineering / Engineering Change-Impact Review", then its destination while its menu is hidden.
  const changes = page?.workspace === "engineering" ? changesPath(path) : undefined;
  // EN-08 likewise: "Engineering / Commissioning Basis & As-Built Release", then its destination while its menu is hidden.
  const commissioning = page?.workspace === "engineering" ? commissioningPath(path) : undefined;
  const control = controlPath(path);
  const acceptance = path.startsWith("/projects/acceptance");
  const crumb = materials ?? changes ?? commissioning ?? (control ? {view:{label:controlModules[control.module].views.find(([key])=>key===control.view)?.[1]}} : undefined) ?? (acceptance ? { view: undefined } : undefined);
  const view = page?.id === "work" ? workViewForPath(path)?.label : materials ? materialsModuleLabel : changes ? changesModuleLabel : commissioning ? commissioningModuleLabel : control ? control.title : acceptance ? "Staged Acceptance & Closeout" : undefined;
  const subview = crumb?.view?.label;
  const workspaceRoot = page?.workspace ? workspaces.find((w) => w.id === page.workspace) : undefined;
  const currentModule =
    page?.workspace === "estimate"
      ? "Estimating"
      : page?.workspace === "service"
        ? "Service"
        : (page?.id === "engineering" ? "Engineering" : page?.label ?? "Home");
  // The breadcrumb is built from route metadata, never from URL slugs: the workspace this destination
  // belongs to, the destination itself, and the view that a workspace's own secondary menu names. The
  // rail carries the product identity, so "Powerplants One" is no longer repeated beside every page.
  const rootDestination = workspaceRoot ? destination(workspaceRoot.primary) : undefined;
  // The workspace under the name its own people use for it; Estimating and Service are already
  // shortened for the page guide, and the breadcrumb uses the same two names.
  const rootLabel =
    page?.workspace === "estimate" ? "Estimating" : page?.workspace === "service" ? "Service" : workspaceRoot?.label;
  const crumbs: { key: string; label: string; href?: string; kind: "root" | "page" | "view" }[] = [];
  if (label) {
    if (rootLabel && rootLabel !== label && !crumb)
      crumbs.push({
        key: "root",
        label: rootLabel,
        href: rootDestination && canOpen(rootDestination, shell.context?.navigation ?? [], shell.hosted) ? rootDestination.href : undefined,
        kind: "root",
      });
    crumbs.push({ key: "page", label, kind: crumb ? "root" : "page", href: crumb && page && canOpen(page, shell.context?.navigation ?? [], shell.hosted) ? page.href : undefined });
    // Each bounded module keeps its identity between the domain and the destination its menu names.
    if (view) crumbs.push({ key: "view", label: view, kind: crumb ? "page" : "view" });
    if (subview) crumbs.push({ key: "subview", label: subview, kind: "view" });
  }
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
          ? ["estimates", "wizard", ...(page.id === "pricing" ? ["pricing"] : [])]
          : page?.id === "mail" || page?.id === "calendar"
            ? ["mail", "calendar"]
      : ["customers", "sites", "facilities", "equipment"].includes(page?.id ?? "")
        ? ["customers", "sites", "facilities", "equipment"]
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
        {/* A workspace with a secondary menu mounts its icon-only trigger here. Empty otherwise, and
            the empty slot reserves no width (desktop-shell.css). */}
        <div id="header-menu" className="ppo-header-menu-slot" />
        {crumbs.length ? (
          <nav className="product-heading" aria-label="Breadcrumb">
            <ol className="ppo-crumbs" title={crumbs.map((c) => c.label).join(" / ")}>
              {crumbs.map((crumb, index) => (
                <li key={crumb.key} data-crumb={crumb.kind}>
                  {crumb.href ? (
                    <Link className="ppo-crumb" href={crumb.href}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={index === crumbs.length - 1 ? "ppo-crumb ppo-crumb-current" : "ppo-crumb"}
                      aria-current={index === crumbs.length - 1 ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <div className="product-heading">
            <span className="ppo-product-name">Powerplants One</span>
          </div>
        )}
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
