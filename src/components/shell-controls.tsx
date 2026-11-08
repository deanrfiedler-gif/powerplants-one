"use client";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { NotificationBell } from "./notification-bell";
import { navigateWithReview } from "./navigation-intent";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useShell } from "./shell-provider";
import { ShellAccountProfile, accountInitials } from "./shell-account-profile";
import { canOpen, destination, departmentHref, menuGroups, workspaceForLocation, workspaces } from "../shell/navigation";
import { ShellPageGuide } from "./shell-page-guide";
import { ShellConversations } from "./shell-conversations";
import { DevelopmentPageGuide } from "../development/page-guide";
import { ShellIcon as ProductIcon } from "./shell-icon";
import { businessViewChannel, sessionLockEvent } from "./session-signal";
import { openShellPanel, shellPanelEvent } from "./shell-events";
import { refinedActionGroups } from "../shell/refined-actions";
import { capShellBadge } from "../shell/refined";
import { layerControls, layerKeyboard } from "../shell/layer-keyboard";
import { RefinedUtilityGroup } from "./refined-shell-menu";
import { usePlatformResource } from "./platform-resource";
import type { notificationInbox } from "../notifications/service";
import { contextualActions, type SearchResults } from "../shell/model";

type Panel =
  "search" | "quick" | "help" | "notifications" | "account" | "guide" | null;
const panelNames = {
  guide: "Page guide",
  search: "Search",
  quick: "Quick add",
  help: "Quick Help",
  notifications: "Notifications",
  account: "Account",
};
const subscribe = (changed: () => void) => {
  const media = window.matchMedia("(min-width: 781px)");
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
function panelPosition(panel: Exclude<Panel, null>, target: HTMLElement) {
  const refined = !!document.querySelector('[data-shell-version="refined"]');
  const mobile = !refined && window.innerWidth <= 780;
  const rect = (panel === "search" ? (target.closest("label") ?? target) : target).getBoundingClientRect();
  if (refined) {
    const width = panel === "search" ? rect.width : panel === "guide" ? Math.min(560,window.innerWidth-32) : panel === "notifications" ? 400 : 280;
    const left = panel === "search" || panel === "quick" ? rect.left : rect.right-width;
    const inset = panel === "quick" && window.innerWidth < 1024 ? 4 : 16;
    return {width,top:panel === "search" ? rect.top : 52,left:Math.max(inset,Math.min(window.innerWidth-width-inset,left)),right:"auto" as const};
  }
  const width = mobile ? window.innerWidth - 24 : panel === "search" ? rect.width : panel === "guide" ? 560 : panel === "quick" ? 320 : 344;
  return {
    width,
    top: mobile ? 64 : panel === "guide" ? 76 : 60,
    left: mobile ? 12 : panel === "search" ? rect.left : panel === "quick" ? Math.max(86, Math.min(window.innerWidth - width - 20, rect.right - width)) : window.innerWidth - width - (panel === "guide" ? 16 : 20),
    right: "auto" as const,
  };
}
async function read<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/v1/shell/${path}`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Choose an identity or sign in to use this control."
        : "Unable to load permitted records. Try again.",
    );
  return response.json();
}
export function ShellControls({
  module,
  page,
  phoneBefore,
  phoneAfter,
  children,
}: {
  module: string;
  page: string;
  // Phone header amendment P2/P3: the compact row's page action (before Conversations), Filter or record controls (after).
  phoneBefore?: ReactNode;
  phoneAfter?: ReactNode;
  // The header's stable mounts, placed after the account fallback in the end zone.
  children?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locationQuery = useSearchParams();
  const { context, error: contextError, reload, hosted, preview, development, refinedDesktop: refined } = useShell();
  const legacyWide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 781px)").matches,
    () => true,
  );
  const wide = refined || legacyWide;
  // Match the phone badge's deferred projection: ten seconds or the first bell opening,
  // without repeating this costly inbox read when the window regains focus.
  const [noticesArmed, setNoticesArmed] = useState(false);
  useEffect(() => {
    if (!refined || !context || noticesArmed) return;
    const timer = setTimeout(() => setNoticesArmed(true), 10000);
    return () => clearTimeout(timer);
  }, [refined, context, noticesArmed]);
  const notifications = usePlatformResource<Awaited<ReturnType<typeof notificationInbox>>>(refined && context && noticesArmed ? "notifications" : null, false);
  const notificationCount = notifications.data?.state !== "unavailable" ? capShellBadge(notifications.data?.unread) : null;
  const [allActions,setAllActions] = useState(false);
  const [position, setPosition] = useState<ReturnType<typeof panelPosition>>();
  const [panel, setPanel] = useState<Panel>(null),
    [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null),
    [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false),
    [selected, setSelected] = useState(-1),
    [retry, setRetry] = useState(0);
  const input = useRef<HTMLInputElement>(null),
    popup = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null),
    searchRequest = useRef<AbortController | null>(null);
  const generation = useRef(0),
    restoringFocus = useRef(false);
  // A new page starts with every panel closed and the search empty, as a fresh mount once did. The
  // controls themselves stay mounted, so the header's zones and mounts are never replaced.
  const [shownPath, setShownPath] = useState(pathname);
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setPosition(undefined);
    setPanel(null);
    setQ("");
    setResults(null);
    setSearchError("");
    setSearching(false);
    setSelected(-1);
    setRetry(0);
  }
  useEffect(() => {
    generation.current++;
    opener.current = null;
    restoringFocus.current = false;
    // The search field once left with the page; focus does not stay in it on the next one.
    if (input.current && document.activeElement === input.current) input.current.blur();
    return () => searchRequest.current?.abort();
  }, [pathname]);
  useEffect(() => {
    const lock = () => {
      generation.current++;
      searchRequest.current?.abort();
      setPanel(null);
      setQ("");
      setResults(null);
      setSearchError("");
      setSearching(false);
      setSelected(-1);
    };
    const channel = businessViewChannel(),
      remoteLock = (event: MessageEvent) => {
        if (event.data === "Lock") lock();
      };
    window.addEventListener(sessionLockEvent, lock);
    channel.addEventListener("message", remoteLock);
    return () => {
      searchRequest.current?.abort();
      window.removeEventListener(sessionLockEvent, lock);
      channel.removeEventListener("message", remoteLock);
    };
  }, []);
  useEffect(() => {
    if (panel !== "search" || !context || q.trim().length < 2) return;
    const controller = new AbortController(),
      stamp = generation.current;
    searchRequest.current = controller;
    const timer = setTimeout(() => {
      setSearching(true);
      void read<SearchResults>(
        `search?q=${encodeURIComponent(q.trim())}`,
        controller.signal,
      ).then(
        (value) => {
          if (!controller.signal.aborted && stamp === generation.current) {
            setResults(value);
            setSearching(false);
          }
        },
        (error) => {
          if (!controller.signal.aborted && stamp === generation.current) {
            setResults(null);
            setSearchError(error.message);
            setSearching(false);
          }
        },
      );
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [context, panel, q, retry]);
  useEffect(() => {
    const resize = () => {
      if (panel && opener.current)
        setPosition(panelPosition(panel, opener.current));
    };
    const media = window.matchMedia("(min-width: 781px)");
    const breakpoint = () => {
      setPanel(null);
      if (document.activeElement?.closest(".ppo-shell-controls [data-shell-header-control]")) document.getElementById("main")?.focus();
    };
    media.addEventListener("change", breakpoint);
    window.addEventListener("resize", resize);
    const utility = (event: Event) => {
      const value = (event as CustomEvent).detail;
      if (!["quick", "help", "notifications", "guide", "search", "account"].includes(value)) return;
      // Phone header amendment P4: on phones the menu opens the account panel the header keeps mounted. A session's own
      // account control opens its panel; without one, the shell's account panel opens.
      if (value === "account") {
        const toggle = document.querySelector<HTMLElement>("#hosted-account-toggle, #identity-toggle");
        if (toggle) {
          toggle.click();
          return;
        }
      }
      // Focus returns to whatever opened the menu: the phone header's Menu button (a record page's row has Back in its
      // place, so the tab bar's More), or the desktop More.
      opener.current =
        (refined && document.activeElement instanceof HTMLElement ? document.activeElement : null) ??
        (window.innerWidth <= 780 ? document.getElementById("shell-phone-menu") : null) ??
        document.getElementById("navigation-toggle") ??
        document.getElementById("desktop-more-toggle");
      if (opener.current) setPosition(panelPosition(value, opener.current));
      openShellPanel("header");
      if (refined && value === "notifications") setNoticesArmed(true);
      setPanel(value);
    };
    window.addEventListener("ppo-shell-utility", utility);
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== "header") setPanel(null);
    };
    const outside = (event: Event) => {
      const target = event.target as Element | null;
      if (target && !target.closest("[data-shell-header-control]"))
        setPanel(null);
    };
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const target =
          input.current ?? document.getElementById("shell-phone-menu") ?? document.getElementById("navigation-toggle");
        if (target) {
          opener.current = target;
          setPosition(panelPosition("search", target));
        }
        input.current?.focus();
        openShellPanel("header");
        setPanel("search");
      }
      const editable = event.target instanceof Element && !!event.target.closest('input,textarea,select,[contenteditable="true"]');
      if (refined && !event.defaultPrevented && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !editable && !(event.target instanceof Element && event.target.closest('[role="dialog"],[role="menu"],[role="menubar"],[role="listbox"],[role="grid"],[role="tree"]')) && !document.querySelector('dialog[open],[role="dialog"][aria-modal="true"],:popover-open')) {
        if (!panel && event.key.toLowerCase() === "n") { event.preventDefault(); document.getElementById("refined-new-toggle")?.click(); }
        if (!panel && event.key === "?") { event.preventDefault(); window.dispatchEvent(new CustomEvent("ppo-shell-utility",{detail:"help"})); }
      }
      if (event.key === "Escape") {
        setPanel(null);
        if (panel) {
          restoringFocus.current = true;
          opener.current?.focus();
          restoringFocus.current = false;
        }
      }
    };
    window.addEventListener(shellPanelEvent, other);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", shortcut);
    return () => {
      window.removeEventListener("ppo-shell-utility", utility);
      media.removeEventListener("change", breakpoint);
      window.removeEventListener("resize", resize);
      window.removeEventListener(shellPanelEvent, other);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", shortcut);
    };
  }, [panel,refined]);
  useEffect(() => {
    if (panel === "search" && !wide) input.current?.focus();
    else if (panel && panel !== "search" && popup.current) {
      if (refined) layerControls(popup.current)[0]?.focus();
      else popup.current.querySelector<HTMLElement>("button")?.focus();
    }
  }, [panel, wide,refined]);
  useEffect(() => {
    if (selected >= 0)
      document
        .getElementById(`shell-result-${selected}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [selected]);
  const show = (value: Exclude<Panel, null>, target: HTMLElement) => {
    setAllActions(false);
    if (refined && value === "notifications") setNoticesArmed(true);
    opener.current = target;
    setPosition(panelPosition(value, target));
    openShellPanel("header");
    setPanel((old) => (old === value ? null : value));
  };
  const close = () => {
    setPanel(null);
    restoringFocus.current = true;
    opener.current?.focus();
    restoringFocus.current = false;
  };
  const actions = contextualActions(context?.actions ?? [], module);
  const query = q.trim();
  const activeWorkspace = workspaceForLocation(pathname, new URLSearchParams(locationQuery), preview, context?.navigation ?? []);
  const groupedActions = refinedActionGroups(context?.actions ?? [],activeWorkspace,context?.navigation ?? [],hosted);
  const suggested = [workspaces.find(w => w.id === activeWorkspace)!.primary, "work", "customers", "equipment"].map(destination);
  const pageMatches = context ? (query.length >= 2 ? menuGroups(query,activeWorkspace).flatMap(group => group.items) : query ? [] : suggested).filter(item => canOpen(item, context.navigation, hosted)) : [];
  const searchItems = [
    ...pageMatches.map(item => ({ id: `page:${item.id}`, label: item.menuLabel ?? item.label, reference: item.workspace ? `${workspaces.find(w => w.id === item.workspace)!.label} pages` : ["home", "work", "mail", "calendar"].includes(item.id) ? "My workspace" : "Shared records", href: departmentHref(item.href!, activeWorkspace, locationQuery.get("day")), kind: "Page", icon: workspaces.find(w => w.primary === item.id)?.id ?? (item.id === "equipment" ? "equipment" : item.icon) })),
    ...(results?.items ?? []).map(item => ({ ...item, icon: "search" as const })),
  ];
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    // Chrome otherwise clears type=search on Escape and fires onChange, reopening
    // the panel after the document-level close handler has restored focus.
    if (event.key === "Escape") event.preventDefault();
    const count = searchItems.length;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openShellPanel("header");
      setPanel("search");
      if (count)
        setSelected((old) =>
          old < 0
            ? event.key === "ArrowDown"
              ? 0
              : count - 1
            : (old + (event.key === "ArrowDown" ? 1 : -1) + count) % count,
        );
    }
    if (
      event.key === "Enter" &&
      panel === "search" &&
      searchItems[selected]
    ) {
      event.preventDefault();
      navigateWithReview(() => { setPanel(null); router.push(searchItems[selected].href); });
    }
  };
  const searchField = (
    <label className="ppo-global-search">
      <ProductIcon name="search" />
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-label="Search Powerplants One"
        aria-autocomplete="list"
        aria-controls="shell-search-list"
        aria-expanded={panel === "search"}
        aria-activedescendant={
          panel === "search" && searchItems[selected]
            ? `shell-result-${selected}`
            : undefined
        }
        placeholder={refined ? "Search records, pages and help" : "Search Powerplants One"}
        autoComplete="off"
        maxLength={200}
        value={q}
        onFocus={(event) => {
          if (restoringFocus.current) return;
          opener.current = wide
            ? event.currentTarget
            : (document.getElementById("shell-phone-menu") ?? document.getElementById("navigation-toggle"));
          setPosition(panelPosition("search", event.currentTarget));
          if (panel !== "search") {
            setResults(null);
            setSelected(-1);
            setSearchError("");
          }
          openShellPanel("header");
          setPanel("search");
        }}
        onClick={() => {
          if (panel !== "search") {
            setResults(null);
            setSelected(-1);
            setSearchError("");
          }
          setPanel("search");
        }}
        onChange={(event) => {
          searchRequest.current?.abort();
          setQ(event.target.value);
          setResults(null);
          setSelected(-1);
          setSearchError("");
          setSearching(false);
          setPanel("search");
        }}
        onKeyDown={onSearchKey}
      />
      <kbd aria-hidden="true">Ctrl K</kbd>
    </label>
  );
  return (
    <div className="ppo-shell-controls">
      {/* R9: the global search alone, at a fixed width in the centre of the top bar. */}
      <div className="ppo-header-centre" data-shell-header-control>
        {wide && searchField}
      </div>
      <div className="ppo-header-end">
        <button
          className="ppo-top-action ppo-quick-add"
          id={refined ? "refined-new-toggle" : undefined}
          aria-label={refined ? "New" : "Quick add"}
          title={refined ? undefined : "Quick add"}
          data-tooltip={refined ? "New · N" : undefined}
          aria-expanded={panel === "quick"}
          aria-controls="shell-utility-panel"
          onClick={(event) => show("quick", event.currentTarget)}
          data-shell-header-control
        >
          <ProductIcon name="plus" />
        </button>
        {refined && <span className="ppo-refined-spacer" aria-hidden="true" />}
        <RefinedUtilityGroup enabled={refined}>
          {development && !refined && <button className="ppo-top-action ppo-studio-link" aria-label="Design and build workspace" title="Design & Development workspace" onClick={()=>navigateWithReview(()=>router.push('/development/page-register'))}><ProductIcon name="engineering" /></button>}
          {phoneBefore}
          {/* D1 and D2: Conversations sits left of the Page guide, on every page and in the phone header. Global search
              is in the phone menu (phone header amendment P4). */}
          {refined && canOpen(destination("calendar"),context?.navigation ?? [],hosted) && <Link className="ppo-top-action ppo-refined-calendar" href={destination("calendar").href!} aria-label="Calendar" data-tooltip="Calendar"><ProductIcon name="calendar" /></Link>}
          <ShellConversations />
          {phoneAfter}
          <button
            className="ppo-top-action ppo-guide-action"
            aria-label="Page guide"
            title={refined ? undefined : "Page guide: what this page is for and how to use it"}
            data-tooltip={refined ? "Page guide" : undefined}
            aria-expanded={panel === "guide"}
            aria-controls="shell-utility-panel"
            onClick={(event) => show("guide", event.currentTarget)}
          >
            <ProductIcon name="info" />
          </button>
          <button
            hidden={refined}
            className="ppo-top-action ppo-desktop-utility"
            aria-label="Quick Help"
            title="Help: keyboard shortcuts and support"
            aria-expanded={panel === "help"}
            aria-controls="shell-utility-panel"
            onClick={(event) => show("help", event.currentTarget)}
          >
            <ProductIcon name="help" />
          </button>
          <button
            className="ppo-top-action ppo-desktop-utility"
            aria-label={refined && notificationCount ? `Notifications, ${notifications.data?.unread} unread` : "Notifications"}
            title={refined ? undefined : "Notifications"}
            data-tooltip={refined ? "Notifications" : undefined}
            aria-expanded={panel === "notifications"}
            aria-controls="shell-utility-panel"
            onClick={(event) => show("notifications", event.currentTarget)}
          >
            <ProductIcon name="bell" />
            {refined && notificationCount && <span className="ppo-top-badge" aria-hidden="true">{notificationCount}</span>}
          </button>
        </RefinedUtilityGroup>
        {refined && <><span className="ppo-refined-spacer" aria-hidden="true" /><span className="ppo-refined-divider" aria-hidden="true" /><span className="ppo-refined-account-gap" aria-hidden="true" /></>}
        <div className="ppo-account-fallback" data-shell-header-control>
          <button
            className="ppo-top-action"
            aria-label="Account"
            title="Account"
            aria-expanded={panel === "account"}
            aria-controls="shell-utility-panel"
            onClick={(event) => show("account", event.currentTarget)}
          >
            <span className="account-avatar" aria-hidden="true">{accountInitials(context?.display_name)}</span>
          </button>
        </div>
        {children}
      </div>
      <section
        id="shell-search-panel"
        className="ppo-header-panel ppo-search-panel"
        style={position}
        role="dialog"
        aria-label="Global search"
        hidden={panel !== "search"}
        onKeyDown={event=>{if(refined) layerKeyboard(event,close,false);}}
        data-shell-header-control
      >
        <div className="ppo-panel-titlebar">
          <h2>Search</h2>
          <button
            className="ppo-top-action"
            aria-label="Close search"
            onClick={close}
          >
            <ProductIcon name="close" />
          </button>
        </div>
        <div className="ppo-panel-body">
          {!wide && (
            <div className="ppo-mobile-search-field">{searchField}</div>
          )}
          <p className="ppo-panel-hint">
            {query ? "Find a page or a record you can access" : "Go to a workspace or shared page"}
          </p>
          <div role="status" className="ppo-panel-status" hidden={!!context && !contextError && !searchError && !query}>
            {contextError ||
              searchError ||
              (!context
                ? "Loading your search access…"
                : q.trim().length < 2
                  ? "Enter at least 2 characters."
                  : searching || !results
                    ? "Searching…"
                    : searchItems.length
                      ? `${searchItems.length} results${results.has_more ? "; more matches available — refine your search" : ""}.`
                      : "No matching pages or records.")}
          </div>
          {(contextError || searchError) && (
            <button
              className="secondary ppo-retry"
              onClick={() => {
                setSearchError("");
                setResults(null);
                setRetry((value) => value + 1);
                if (contextError) reload();
              }}
            >
              Try again
            </button>
          )}
          <div
            id="shell-search-list"
            role="listbox"
            aria-label="Search results"
          >
            {searchItems.map((item, index) => (
              <div
                id={`shell-result-${index}`}
                key={item.id}
                role="option"
                aria-selected={selected === index}
                className="ppo-search-option"
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setSelected(index)}
                onClick={() => {
                  navigateWithReview(() => { setPanel(null); router.push(item.href); });
                }}
              >
                <ProductIcon name={item.icon as Parameters<typeof ProductIcon>[0]["name"]} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.reference}</small>
                </span>
                <small>{item.kind}</small>
              </div>
            ))}
          </div>
        </div>
        {q.trim().length >= 2 && <Link className="ppo-account-link" href={`/search?${new URLSearchParams({q:q.trim()})}`} onClick={() => setPanel(null)}>View all results</Link>}
        {results?.state === "partial" && <p role="alert">Some sources are unavailable. Open all results to retry.</p>}
        <div className="ppo-panel-footer">
          <span className="ppo-preview-label">Powerplants One</span><span>{query ? "Up to 5 per record type" : "Pages & records"}</span>
        </div>
      </section>
      <section
        ref={popup}
        style={position}
        id="shell-utility-panel"
        className={`ppo-header-panel ppo-utility-panel${panel === "quick" ? " ppo-quick-panel" : panel === "guide" ? " ppo-guide-panel" : ""}`}
        role="dialog"
        aria-labelledby="shell-utility-title"
        hidden={!panel || panel === "search"}
        data-shell-header-control
        onKeyDown={(event) => {
          if (refined) {
            if (panel === "quick" && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
              const action=[...groupedActions.current,...groupedActions.shared,...(allActions ? groupedActions.other : [])].find(a=>a.accelerator?.toLowerCase()===event.key.toLowerCase());
              if(action) { event.preventDefault(); event.stopPropagation(); navigateWithReview(()=>{setPanel(null);router.push(action.href);},{href:action.href}); return; }
            }
            layerKeyboard(event,close);
            return;
          }
          if (
            panel !== "quick" ||
            !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
          )
            return;
          const options = [
            ...event.currentTarget.querySelectorAll<HTMLAnchorElement>(
              "a.ppo-quick-option",
            ),
          ];
          if (!options.length) return;
          event.preventDefault();
          const index = options.indexOf(
            document.activeElement as HTMLAnchorElement,
          );
          const next =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? options.length - 1
                : index < 0
                  ? event.key === "ArrowUp"
                    ? options.length - 1
                    : 0
                  : (index +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      options.length) %
                    options.length;
          options[next].focus();
        }}
      >
        <div className="ppo-panel-titlebar">
          <h2 id="shell-utility-title">{panel ? refined && panel === "quick" ? "New" : panelNames[panel] : ""}</h2>
          <button
            className="ppo-top-action"
            aria-label="Close panel"
            onClick={close}
          >
            <ProductIcon name="close" />
          </button>
        </div>
        <div className="ppo-panel-body">
          {panel === "guide" && <>{development && <DevelopmentPageGuide key={pathname} />}<ShellPageGuide key={page} page={page} /></>}
          {panel === "quick" && !refined && (
            <>
              <p className="ppo-panel-hint">
                {module} actions appear first. Choose a record to create.
              </p>
              {!context ? (
                <p className="ppo-panel-status" role="status">
                  {contextError || "Loading your actions…"}
                </p>
              ) : actions.length ? (
                <nav aria-label="Create a record">
                  {actions.map((action) => (
                    <Link
                      className="ppo-quick-option"
                      key={action.id}
                      href={action.href}
                      onClick={() => setPanel(null)}
                    >
                      <ProductIcon name="plus" />
                      <span>{action.label}</span>
                      {action.module === module && (
                        <small>In this module</small>
                      )}
                    </Link>
                  ))}
                </nav>
              ) : (
                <p className="ppo-panel-status">
                  No creation actions are available for this identity.
                </p>
              )}
              {contextError && (
                <button className="secondary ppo-retry" onClick={reload}>
                  Try again
                </button>
              )}
            </>
          )}
          {panel === "quick" && refined && <>
            {!context ? <p role="status">{contextError || "Loading your actions…"}</p> : <nav aria-label="Create a record">{[
              {label:`Create in ${workspaces.find(w=>w.id===activeWorkspace)!.label}`,items:groupedActions.current},
              {label:"Shared records",items:groupedActions.shared},
              ...(allActions ? [{label:"Other record types",items:groupedActions.other}] : []),
            ].filter(group=>group.items.length).map(group=><section key={group.label}><h3>{group.label}</h3>{group.items.map(action=><Link key={action.id} className="ppo-quick-option" href={action.href} onClick={()=>setPanel(null)}><ProductIcon name="plus" /><span>New {action.label.toLowerCase()}</span>{action.accelerator && <kbd>{action.accelerator}</kbd>}</Link>)}</section>)}
            {groupedActions.other.length > 0 && <button className="ppo-refined-all-actions" onClick={()=>setAllActions(!allActions)} aria-expanded={allActions}>{allActions ? "Fewer record types" : "All record types"}<ProductIcon name="chevron-right" /></button>}
            {![...groupedActions.current,...groupedActions.shared,...groupedActions.other].length && <p>No creation actions are available for this identity.</p>}
            </nav>}
          </>}
          {panel === "help" && (
            <div className="ppo-help-content">
              <h3>Quick tips</h3>
              <ul><li>Use More to open a workspace or shared page.</li><li>Open your account to choose a development workspace.</li><li>Search finds pages and permitted records.</li><li>Use the information icon for the detailed page guide.</li></ul>
              <h3>Keyboard shortcuts</h3>
              <p><kbd>Ctrl K</kbd> Search <kbd>Esc</kbd> Close a panel</p>
              <button className="ppo-guide-link" onClick={() => { const target = document.querySelector<HTMLButtonElement>('.ppo-header-utilities button[aria-label="Page guide"]'); if (target) show("guide", target); }}><ProductIcon name="info" /><span>Open page guide</span><ProductIcon name="chevron-right" /></button>
            </div>
          )}
          {panel === "notifications" && (
            <NotificationBell close={() => setPanel(null)} />
          )}
          {panel === "account" && <><ShellAccountProfile name={context?.display_name} /><Link className="ppo-account-link" href="/work" onClick={() => setPanel(null)}>Open My Work and account controls</Link></>}

        </div>
        <div className="ppo-panel-footer">
          {/* S9: the revision label is drafting detail, shown only in the development workspace. */}
          <span className="ppo-preview-label">{development ? "Powerplants One · r17" : "Powerplants One"}</span>
          {panel === "guide" && <span>User guide and journeys</span>}
          {panel === "notifications" && <span>In-app updates</span>}
        </div>
      </section>
    </div>
  );
}
