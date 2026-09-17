"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ProductIcon } from "./product-icons";
import { ShellControls } from "./shell-controls";
import { useShell } from "./shell-provider";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import {
  canOpen,
  destination,
  menuGroups,
  pageForPath,
  workspaces,
  type ShellDestination,
} from "../shell/navigation";

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
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);
  const link = (item: ShellDestination, mobile = false) => {
    const root = workspaces.find((w) => w.primary === item.id);
    const label = mobile
      ? item.id === "tickets"
        ? "Service"
        : item.label
      : (root?.label ?? item.label);
    const contents = (
      <>
        <ProductIcon name={item.icon} />
        <span>{label}</span>
        {!mobile && root && root.label !== item.label && (
          <small>{item.label}</small>
        )}
      </>
    );
    return allowed(item) ? (
      <Link
        key={item.id}
        className={mobile ? undefined : "ppo-more-link"}
        href={item.href!}
        aria-label={item.label}
        aria-current={current?.id === item.id ? "page" : undefined}
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
          ) : (
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
        <button
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
          <span>Quick Help</span>
        </button>
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
          Powerplants One · r17<small>Synthetic data only</small>
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
      <nav className="mobile-navigation" aria-label="Mobile navigation">
        {[
          destination("work"),
          destination(workspace.primary),
          destination(workspace.secondary),
        ].map((item) => link(item, true))}
        {!wide && (
          <button
            ref={toggle}
            id="navigation-toggle"
            aria-label="Menu"
            aria-haspopup="dialog"
            aria-expanded={more}
            onClick={() => {
              openShellPanel("navigation");
              setMore(true);
            }}
          >
            <ProductIcon name="more" />
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
        <div className="product-heading">
          <span className="ppo-product-name">Powerplants One</span>
          {label && (
            <>
              <span className="ppo-heading-divider" aria-hidden="true" />
              <strong title={label}>{label}</strong>
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
      {!!tabs.length && (
        <nav
          className="module-navigation"
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
